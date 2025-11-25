import os
import json
import asyncio
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List, Dict, Any

import torch
import numpy as np
import faiss  # type: ignore
from transformers import AutoTokenizer, AutoModel, AutoModelForQuestionAnswering


def torch_device_name() -> str:
    if torch.cuda.is_available():
        return f"cuda:{torch.cuda.current_device()}"
    return "cpu"


def st_device_name() -> str:
    # SentenceTransformers accepts 'cuda' or 'cpu'
    return "cuda" if torch.cuda.is_available() else "cpu"


app = FastAPI(title="QLMC Chatbot Service", version="0.4.1")

# CORS Configuration - allow frontend origins configured via env and Vercel subdomains
# Build allowed origins list from environment (remove empty values)
_frontend_url = os.getenv("FRONTEND_URL", "").strip()
allowed_origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]
if _frontend_url:
    allowed_origins.append(_frontend_url)

# Use a regex to allow Vercel preview/app domains (e.g. https://abc.vercel.app)
# If FRONTEND_URL is not provided, still accept vercel subdomains via regex
allow_origin_regex = r"^https:\/\/.*\\.vercel\.app$"

app.add_middleware(
    CORSMiddleware,
    allow_origins=[o for o in allowed_origins if o],
    allow_origin_regex=allow_origin_regex,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ------------------------
# Models and Schemas
# ------------------------
class ParseIn(BaseModel):
    text: str
    user: Optional[Dict[str, Any]] = None


class ParseOut(BaseModel):
    intent: str
    confidence: float
    entities: Dict[str, Any]


class RagIn(BaseModel):
    question: str
    top_k: int = 5


class RagOut(BaseModel):
    answer: str
    sources: List[Dict[str, Any]]
    passages: List[str]
    confidence: float


class EmbedIn(BaseModel):
    docId: str
    chunks: List[str]
    rolesAllowed: Optional[List[str]] = None
    title: Optional[str] = None
    intent: Optional[str] = None
    keywords: Optional[List[str]] = None


class EmbedOut(BaseModel):
    added: int
    total_index: int


class SearchIn(BaseModel):
    query: str
    top_k: int = 5
    role: Optional[str] = None


class SearchHit(BaseModel):
    docId: str
    text: str
    score: float


class SearchOut(BaseModel):
    hits: List[SearchHit]


# ------------------------
# Global State: Embedding + FAISS
# ------------------------
# Use smaller model to fit in 512MB RAM limit
EMBED_MODEL_NAME = os.getenv("EMBED_MODEL", "sentence-transformers/all-MiniLM-L6-v2")
# Disable QA model by default to save memory (can enable via env var)
QA_MODEL_NAME = os.getenv("QA_MODEL_NAME", "")  # Empty = disabled
QA_TOP_CONTEXTS = int(os.getenv("QA_TOP_CONTEXTS", "3"))
AUTOSAVE_SECONDS = int(os.getenv("AUTOSAVE_SECONDS", "300"))  # 0 to disable

_st_device = st_device_name()


class HFEmbedder:
    def __init__(self, model_name: str, device: str = "cpu") -> None:
        self.device = device
        self.tokenizer = AutoTokenizer.from_pretrained(model_name)
        self.model = AutoModel.from_pretrained(model_name)
        self.model.to(device)
        self.model.eval()

    def get_sentence_embedding_dimension(self) -> int:
        return int(getattr(self.model.config, "hidden_size", 768))

    def encode(self, texts: List[str], batch_size: int = 32) -> np.ndarray:
        if not texts:
            dim = self.get_sentence_embedding_dimension()
            return np.zeros((0, dim), dtype=np.float32)
        outs: List[np.ndarray] = []
        with torch.no_grad():
            for i in range(0, len(texts), batch_size):
                batch = texts[i : i + batch_size]
                inputs = self.tokenizer(
                    batch,
                    padding=True,
                    truncation=True,
                    max_length=512,
                    return_tensors="pt",
                )
                inputs = {k: v.to(self.device) for k, v in inputs.items()}
                outputs = self.model(**inputs)
                last_hidden = outputs.last_hidden_state  # (bs, seq, hid)
                attn = inputs["attention_mask"].unsqueeze(-1).type_as(last_hidden)
                masked = last_hidden * attn
                sum_emb = masked.sum(dim=1)
                lengths = attn.sum(dim=1).clamp(min=1)
                mean_pooled = sum_emb / lengths
                emb = mean_pooled.detach().cpu().numpy().astype(np.float32)
                # Normalize per vector for cosine via inner product
                faiss.normalize_L2(emb)
                outs.append(emb)
        return np.vstack(outs) if outs else np.zeros((0, self.get_sentence_embedding_dimension()), dtype=np.float32)


embedder = HFEmbedder(EMBED_MODEL_NAME, device=_st_device)
EMB_DIM = embedder.get_sentence_embedding_dimension()

# Cosine similarity via inner product requires normalized vectors
faiss_index = faiss.IndexFlatIP(EMB_DIM)

# Store mapping from FAISS ids to metadata
store_doc_ids: List[str] = []
store_texts: List[str] = []
store_roles: List[List[str]] = []
store_titles: List[str] = []  # Document titles
store_intents: List[str] = []  # Intent categories
store_keywords: List[List[str]] = []  # Keywords for each document chunk

# Feedback-based learning: track document performance
document_feedback_scores: Dict[str, float] = {}  # docId -> average boost score

# QA pipeline (extractive) - Load only if model name is provided
qa_tokenizer = None
qa_model = None
if QA_MODEL_NAME:  # Only load if explicitly configured
    try:
        _qa_device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        qa_tokenizer = AutoTokenizer.from_pretrained(QA_MODEL_NAME)
        qa_model = AutoModelForQuestionAnswering.from_pretrained(QA_MODEL_NAME)
        qa_model.to(_qa_device)
        qa_model.eval()
    except Exception:
        qa_tokenizer = None
        qa_model = None

# Persistence configuration
BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
DATA_DIR = os.getenv("CHATBOT_DATA_DIR", os.path.join(BASE_DIR, "store"))
INDEX_PATH = os.path.join(DATA_DIR, "faiss.index")
META_PATH = os.path.join(DATA_DIR, "meta.json")
PREBUILT_DIR = os.getenv("PREBUILT_INDEX_DIR", os.path.join(BASE_DIR, "prebuilt"))
PREBUILT_INDEX_PATH = os.path.join(PREBUILT_DIR, "faiss.index")
PREBUILT_META_PATH = os.path.join(PREBUILT_DIR, "meta.json")
KNOWLEDGE_JSON_PATH = os.getenv("KNOWLEDGE_JSON_PATH", os.path.abspath(os.path.join(BASE_DIR, "..", "data", "knowledge.vi.json")))


def _normalize(x: np.ndarray) -> np.ndarray:
    # x: (n, d)
    faiss.normalize_L2(x)
    return x


def _ensure_data_dir() -> None:
    os.makedirs(DATA_DIR, exist_ok=True)


def _save_metadata() -> None:
    _ensure_data_dir()
    metadata = {
        "doc_ids": store_doc_ids,
        "texts": store_texts,
        "roles": store_roles,
        "titles": store_titles,
        "intents": store_intents,
        "keywords": store_keywords
    }
    # Save to store directory (ephemeral on Render)
    with open(META_PATH, "w", encoding="utf-8") as f:
        json.dump(metadata, f, ensure_ascii=False)
    
    # Also save to prebuilt directory (should be committed to Git for persistence)
    try:
        os.makedirs(PREBUILT_DIR, exist_ok=True)
        with open(PREBUILT_META_PATH, "w", encoding="utf-8") as f:
            json.dump(metadata, f, ensure_ascii=False)
        print(f"[persistence] Metadata saved to both store/ and prebuilt/")
    except Exception as e:
        print(f"[persistence] Warning: Could not save to prebuilt/: {e}")


def _load_metadata() -> bool:
    if not os.path.exists(META_PATH):
        return False
    try:
        with open(META_PATH, "r", encoding="utf-8") as f:
            meta = json.load(f)
        # mutate lists in-place to avoid rebinding where possible
        store_doc_ids.clear()
        store_doc_ids.extend(meta.get("doc_ids", []))
        store_texts.clear()
        store_texts.extend(meta.get("texts", []))
        
        # roles may be missing from older metadata; default to all roles
        roles = meta.get("roles", None)
        default_roles = ["teacher", "technician", "admin"]
        if roles is None:
            # fill with defaults matching number of texts
            rl = [default_roles for _ in range(len(store_texts))]
        else:
            rl = roles
        store_roles.clear()
        store_roles.extend(rl)
        
        # Load new metadata fields with backward compatibility
        store_titles.clear()
        store_titles.extend(meta.get("titles", [""] * len(store_texts)))
        store_intents.clear()
        store_intents.extend(meta.get("intents", [""] * len(store_texts)))
        store_keywords.clear()
        store_keywords.extend(meta.get("keywords", [[] for _ in range(len(store_texts))]))
        
        return True
    except Exception:
        return False


def _save_faiss() -> None:
    _ensure_data_dir()
    # Save to store directory
    faiss.write_index(faiss_index, INDEX_PATH)
    
    # Also save to prebuilt directory for Git persistence
    try:
        os.makedirs(PREBUILT_DIR, exist_ok=True)
        faiss.write_index(faiss_index, PREBUILT_INDEX_PATH)
        print(f"[persistence] FAISS index saved to both store/ and prebuilt/")
    except Exception as e:
        print(f"[persistence] Warning: Could not save to prebuilt/: {e}")


def _load_faiss() -> bool:
    global faiss_index
    if not os.path.exists(INDEX_PATH):
        return False
    try:
        idx = faiss.read_index(INDEX_PATH)
        # Validate index dimension matches embedding dimension; if not, we'll rebuild later.
        if idx.d != EMB_DIM:
            return False
        faiss_index = idx
        return True
    except Exception:
        return False


def _rebuild_faiss_from_texts(batch_size: int = 256) -> None:
    global faiss_index
    # Create a new index and re-embed all texts
    new_index = faiss.IndexFlatIP(EMB_DIM)
    if not store_texts:
        faiss_index = new_index
        return
    # Encode in batches to avoid high memory usage
    all_embs: List[np.ndarray] = []
    for i in range(0, len(store_texts), batch_size):
        batch = store_texts[i : i + batch_size]
        embs = embedder.encode(batch)  # Already returns normalized numpy array
        if embs.dtype != np.float32:
            embs = embs.astype(np.float32)
        all_embs.append(embs)
    stacked = np.vstack(all_embs) if all_embs else np.zeros((0, EMB_DIM), dtype=np.float32)
    if stacked.shape[0] > 0:
        new_index.add(stacked)
    faiss_index = new_index


def save_index_and_meta() -> Dict[str, Any]:
    _save_metadata()
    _save_faiss()
    return {
        "ok": True,
        "index_size": len(store_texts),
        "paths": {"index": INDEX_PATH, "meta": META_PATH},
    }


def load_index_and_meta() -> Dict[str, Any]:
    meta_loaded = _load_metadata()
    index_loaded = _load_faiss()
    rebuilt = False
    if meta_loaded and (not index_loaded or faiss_index.d != EMB_DIM or faiss_index.ntotal != len(store_texts)):
        # Try to rebuild index from texts
        _rebuild_faiss_from_texts()
        # Save rebuilt index for next time
        _save_faiss()
        rebuilt = True
    # If metadata didn't load, don't keep any loaded FAISS index to avoid inconsistent state
    if not meta_loaded:
        _rebuild_faiss_from_texts()  # resets to empty if no texts
        index_loaded = False
    return {
        "ok": meta_loaded or index_loaded,
        "meta_loaded": meta_loaded,
        "index_loaded": index_loaded,
        "rebuilt": rebuilt,
        "index_size": len(store_texts),
        "emb_dim": EMB_DIM,
        "paths": {"index": INDEX_PATH, "meta": META_PATH},
    }


# Concurrency primitives
index_lock = asyncio.Lock()


async def async_save_index_and_meta() -> Dict[str, Any]:
    loop = asyncio.get_running_loop()
    return await loop.run_in_executor(None, save_index_and_meta)


async def async_load_index_and_meta() -> Dict[str, Any]:
    loop = asyncio.get_running_loop()
    return await loop.run_in_executor(None, load_index_and_meta)


@app.get("/health")
async def health():
    return {
        "status": "ok",
        "torch_version": torch.__version__,
        "cuda_available": torch.cuda.is_available(),
        "device": torch_device_name(),
        "st_device": _st_device,
        "embed_model": EMBED_MODEL_NAME,
        "qa_model": QA_MODEL_NAME,
        "index_size": len(store_texts),
        "emb_dim": EMB_DIM,
        "data_dir": DATA_DIR,
        "autosave_seconds": AUTOSAVE_SECONDS,
    }


@app.get("/debug/origin")
async def debug_origin(request: Request):
    # Return headers to help debug CORS and origin issues
    try:
        headers = {k: v for k, v in request.headers.items()}
    except Exception:
        headers = {"error": "unable to read headers"}
    return {"ok": True, "headers": headers}


@app.post("/nlp/parse", response_model=ParseOut)
async def parse(inp: ParseIn):
    # TODO: replace with intent classifier + NER
    intent = "faq_general"
    entities: Dict[str, Any] = {}
    return ParseOut(intent=intent, confidence=0.6, entities=entities)


@app.post("/embed", response_model=EmbedOut)
async def embed(inp: EmbedIn):
    if not inp.chunks:
        return EmbedOut(added=0, total_index=len(store_texts))
    # Encode in batches; for simplicity encode all
    embs = embedder.encode(inp.chunks)
    if embs.dtype != np.float32:
        embs = embs.astype(np.float32)
    async with index_lock:
        faiss_index.add(embs)
        # Track metadata
        store_doc_ids.extend([inp.docId] * len(inp.chunks))
        store_texts.extend(inp.chunks)
        roles = inp.rolesAllowed or ["teacher", "technician", "admin"]
        store_roles.extend([roles] * len(inp.chunks))
        # Store new metadata fields
        store_titles.extend([inp.title or ""] * len(inp.chunks))
        store_intents.extend([inp.intent or ""] * len(inp.chunks))
        store_keywords.extend([inp.keywords or []] * len(inp.chunks))
        total = len(store_texts)
    return EmbedOut(added=len(inp.chunks), total_index=total)


@app.post("/search", response_model=SearchOut)
async def search(inp: SearchIn):
    if faiss_index.ntotal == 0:
        return SearchOut(hits=[])
    q = embedder.encode([inp.query]).astype(np.float32)
    over_k = min(max(inp.top_k * 5, inp.top_k), faiss_index.ntotal)
    D, I = faiss_index.search(q, over_k)
    
    # Normalize query for keyword matching
    query_lower = inp.query.lower()
    query_words = set(query_lower.split())
    
    hits_with_boost: List[tuple[int, float]] = []
    for idx, score in zip(I[0], D[0]):
        if idx == -1:
            continue
        # Role-based filter
        if inp.role:
            roles = store_roles[idx] if idx < len(store_roles) else ["teacher", "technician", "admin"]
            if inp.role not in roles:
                continue
        
        # Keyword boosting: check if query words match keywords
        boosted_score = float(score)
        if idx < len(store_keywords) and store_keywords[idx]:
            keywords = [kw.lower() for kw in store_keywords[idx]]
            # Count matching keywords
            matches = sum(1 for kw in keywords if any(kw in word or word in kw for word in query_words))
            # Boost score by 0.1 per matching keyword (max +0.5)
            boost = min(matches * 0.1, 0.5)
            boosted_score += boost
        
        # Feedback-based boosting: use learned feedback scores
        doc_id = store_doc_ids[idx]
        if doc_id in document_feedback_scores:
            feedback_boost = document_feedback_scores[doc_id] * 0.2  # Scale feedback impact
            boosted_score += feedback_boost
        
        hits_with_boost.append((idx, boosted_score))
    
    # Sort by boosted score (descending)
    hits_with_boost.sort(key=lambda x: x[1], reverse=True)
    
    # Return top_k results
    hits: List[SearchHit] = []
    for idx, score in hits_with_boost[:inp.top_k]:
        hits.append(SearchHit(docId=store_doc_ids[idx], text=store_texts[idx], score=score))
    
    return SearchOut(hits=hits)


@app.post("/rag/answer", response_model=RagOut)
async def rag_answer(inp: RagIn, role: Optional[str] = None):
    # Normalize question for consistency (lowercase, strip whitespace)
    normalized_question = inp.question.strip()
    
    # Retrieve
    hits = await search(SearchIn(query=normalized_question, top_k=inp.top_k, role=role))
    if not hits.hits:
        return RagOut(
            answer="Hiện chưa có tài liệu phù hợp để trả lời câu hỏi này.",
            sources=[],
            passages=[],
            confidence=0.2,
        )

    passages = [h.text for h in hits.hits]
    top = hits.hits[0]

    best_answer = top.text
    best_score = float(top.score)
    used_doc = top.docId
    used_snippet = top.text[:120]

    # If top passage is short enough (< 500 chars), use it directly for consistency
    # This avoids extractive QA variability for short documents
    if len(top.text) <= 500:
        sources = [{"docId": used_doc, "title": used_doc, "snippet": used_snippet}]
        confidence = min(0.99, max(0.5, best_score))
        return RagOut(answer=best_answer, sources=sources, passages=passages, confidence=confidence)

    # Try extractive QA on top-k contexts for longer documents
    if qa_model is not None and qa_tokenizer is not None and passages:
        try:
            import torch.nn.functional as F

            def answer_span(question: str, context: str) -> Dict[str, Any]:
                inputs = qa_tokenizer(
                    question,
                    context,
                    return_tensors="pt",
                    truncation=True,
                    max_length=384,
                    stride=64,
                    padding=True,
                )
                inputs = {k: v.to(_qa_device) for k, v in inputs.items()}
                with torch.no_grad():
                    outputs = qa_model(**inputs)
                    start_logits = outputs.start_logits[0]
                    end_logits = outputs.end_logits[0]
                    # Compute probabilities
                    start_probs = F.softmax(start_logits, dim=-1)
                    end_probs = F.softmax(end_logits, dim=-1)
                    max_answer_len = 30
                    best_s = 0
                    best_e = 0
                    best_score_local = -1e9
                    L = start_logits.size(0)
                    for s in range(L):
                        e_max = min(L - 1, s + max_answer_len)
                        # choose best end within window
                        e_candidates = end_logits[s:e_max + 1]
                        e_rel = int(torch.argmax(e_candidates))
                        e = s + e_rel
                        score = float(start_logits[s] + end_logits[e])
                        if e >= s and score > best_score_local:
                            best_score_local = score
                            best_s, best_e = s, e
                    answer_ids = inputs["input_ids"][0][best_s : best_e + 1]
                    answer_text = qa_tokenizer.decode(answer_ids, skip_special_tokens=True)
                    # approximate confidence via product of probs
                    conf = float(start_probs[best_s] * end_probs[best_e])
                    return {"answer": answer_text.strip(), "score": conf}

            k = max(1, min(QA_TOP_CONTEXTS, len(passages)))
            for i in range(k):
                ctx = passages[i]
                res = answer_span(normalized_question, ctx)
                score = float(res.get("score", 0.0))
                ans = str(res.get("answer", "")).strip()
                if ans and score > best_score:
                    best_score = score
                    best_answer = ans
                    used_doc = hits.hits[i].docId
                    used_snippet = ctx[:120]
        except Exception:
            # Fallback to retrieval-only answer if QA fails
            pass

    sources = [{"docId": used_doc, "title": used_doc, "snippet": used_snippet}]
    confidence = min(0.99, max(0.3, best_score))
    return RagOut(answer=best_answer, sources=sources, passages=passages, confidence=confidence)


# ------------------------
# Persistence Endpoints + Startup
# ------------------------

@app.post("/index/save")
async def index_save():
    async with index_lock:
        res = await async_save_index_and_meta()
        return res


@app.post("/index/save-to-mongodb")
async def index_save_to_mongodb():
    """Save current index to MongoDB for persistence"""
    try:
        from app.mongodb_helper import save_index_to_mongodb
        from datetime import datetime
        
        # Read current index binary
        if not os.path.exists(INDEX_PATH):
            return {"error": "No index file found", "success": False}
        
        with open(INDEX_PATH, 'rb') as f:
            index_binary = f.read()
        
        # Prepare metadata
        metadata = {
            "doc_ids": store_doc_ids,
            "texts": store_texts,
            "roles": store_roles,
            "titles": store_titles,
            "intents": store_intents,
            "keywords": store_keywords,
            "emb_dim": EMB_DIM,
        }
        
        # Generate version tag
        version = f"train-{datetime.now().strftime('%Y%m%d-%H%M%S')}"
        
        # Save to MongoDB
        success = save_index_to_mongodb(index_binary, metadata, version)
        
        return {
            "success": success,
            "version": version,
            "index_size": len(store_texts),
            "message": "Index saved to MongoDB" if success else "Failed to save to MongoDB"
        }
        
    except Exception as e:
        return {"error": str(e), "success": False}


@app.post("/index/load")
async def index_load():
    async with index_lock:
        res = await async_load_index_and_meta()
        return res


@app.get("/index/stats")
async def index_stats():
    return {
        "index_size": len(store_texts),
        "emb_dim": EMB_DIM,
        "files": {
            "index_exists": os.path.exists(INDEX_PATH),
            "meta_exists": os.path.exists(META_PATH),
        },
        "paths": {"index": INDEX_PATH, "meta": META_PATH},
    }


# ------------------------
# Feedback Learning Endpoint
# ------------------------
class FeedbackUpdateIn(BaseModel):
    docId: str
    feedbackScore: float  # Positive for like, negative for dislike


@app.post("/feedback/update")
async def update_feedback_score(inp: FeedbackUpdateIn):
    """
    Update document feedback score based on user feedback.
    Positive score for likes, negative for dislikes.
    This affects future search ranking.
    """
    if inp.docId not in document_feedback_scores:
        document_feedback_scores[inp.docId] = 0.0
    
    # Exponential moving average: new = 0.7 * old + 0.3 * new_feedback
    old_score = document_feedback_scores[inp.docId]
    document_feedback_scores[inp.docId] = 0.7 * old_score + 0.3 * inp.feedbackScore
    
    return {
        "ok": True,
        "docId": inp.docId,
        "newScore": document_feedback_scores[inp.docId],
    }


@app.get("/feedback/scores")
async def get_feedback_scores():
    """Get all document feedback scores"""
    return {
        "scores": document_feedback_scores,
        "count": len(document_feedback_scores),
    }


_autosave_task: Optional[asyncio.Task] = None


async def _autosave_loop():
    while True:
        try:
            await asyncio.sleep(max(5, AUTOSAVE_SECONDS))
            async with index_lock:
                await async_save_index_and_meta()
        except asyncio.CancelledError:
            break
        except Exception:
            # Continue loop on errors
            continue


@app.on_event("startup")
async def _startup_load_index():
    global _autosave_task
    
    print("[startup] Initializing QLMC Chatbot Service...")
    
    # Priority 0: Try loading from MongoDB (fastest, always up-to-date)
    try:
        from app.mongodb_helper import load_index_from_mongodb, decode_index_from_base64
        mongo_data = load_index_from_mongodb()
        if mongo_data:
            print(f"[startup] Loading index from MongoDB (version: {mongo_data.get('version')})")
            # Decode base64 index
            index_binary = decode_index_from_base64(mongo_data['indexData'])
            metadata = mongo_data['metadata']
            
            # Write to store directory
            _ensure_data_dir()
            with open(INDEX_PATH, 'wb') as f:
                f.write(index_binary)
            with open(META_PATH, 'w', encoding='utf-8') as f:
                json.dump(metadata, f)
            
            # Load into memory
            result = await async_load_index_and_meta()
            if result.get("index_loaded") and result.get("meta_loaded"):
                print(f"[startup] [OK] Loaded {result.get('index_size')} documents from MongoDB")
                final_stats = {
                    "index_size": len(store_texts),
                    "emb_dim": EMB_DIM,
                    "loaded": faiss_index.ntotal,
                    "source": "mongodb",
                    "version": mongo_data.get('version')
                }
                print(f"[startup] Index status: {final_stats}")
                if AUTOSAVE_SECONDS > 0:
                    _autosave_task = asyncio.create_task(_autosave_loop())
                return
    except Exception as e:
        print(f"[startup] MongoDB load failed (falling back to prebuilt): {e}")
    
    # Priority 1: Load from prebuilt directory (committed to Git)
    # This ensures persistence across Render restarts
    if os.path.exists(PREBUILT_INDEX_PATH) and os.path.exists(PREBUILT_META_PATH):
        print(f"[startup] Found prebuilt index, loading...")
        try:
            _ensure_data_dir()
            import shutil
            shutil.copy2(PREBUILT_INDEX_PATH, INDEX_PATH)
            shutil.copy2(PREBUILT_META_PATH, META_PATH)
            result = await async_load_index_and_meta()
            if result.get("index_loaded") and result.get("meta_loaded"):
                print(f"[startup] [OK] Successfully loaded prebuilt index with {result.get('index_size')} documents")
                final_stats = {
                    "index_size": len(store_texts),
                    "emb_dim": EMB_DIM,
                    "loaded": faiss_index.ntotal,
                    "source": "prebuilt (Git)"
                }
                print(f"[startup] Index status: {final_stats}")
                # Start autosave
                if AUTOSAVE_SECONDS > 0:
                    _autosave_task = asyncio.create_task(_autosave_loop())
                return
        except Exception as e:
            print(f"[startup] Failed to load prebuilt index: {e}")
    
    # Priority 2: Try loading from store directory (ephemeral)
    result = await async_load_index_and_meta()
    if result.get("index_loaded") and result.get("meta_loaded"):
        print(f"[startup] [OK] Loaded index from store/ with {result.get('index_size')} documents")
        final_stats = {
            "index_size": len(store_texts),
            "emb_dim": EMB_DIM,
            "loaded": faiss_index.ntotal,
            "source": "store (ephemeral)"
        }
        print(f"[startup] Index status: {final_stats}")
        if AUTOSAVE_SECONDS > 0:
            _autosave_task = asyncio.create_task(_autosave_loop())
        return

    # Priority 3: Bootstrap from knowledge.json if enabled
    if os.getenv("BOOTSTRAP_KNOWLEDGE", "1") == "1" and os.path.exists(KNOWLEDGE_JSON_PATH):
        try:
            print(f"[startup] No existing index found. Bootstrapping from {KNOWLEDGE_JSON_PATH}...")
            with open(KNOWLEDGE_JSON_PATH, "r", encoding="utf-8") as f:
                docs = json.load(f)
            
            chunks: List[str] = []
            meta_doc_ids: List[str] = []
            roles_list: List[List[str]] = []
            titles_list: List[str] = []
            intents_list: List[str] = []
            keywords_list: List[List[str]] = []
            
            for d in docs:
                content = d.get("content", "").strip()
                if not content:
                    continue
                # Simple split if content very long (>1000 chars)
                if len(content) > 1000:
                    for part_idx in range(0, len(content), 800):
                        part = content[part_idx: part_idx + 800]
                        chunks.append(part)
                        meta_doc_ids.append(d.get("docId", "unknown"))
                        roles_list.append(d.get("role") or ["teacher", "technician", "admin"])
                        titles_list.append(d.get("title", ""))
                        intents_list.append(d.get("intent", ""))
                        keywords_list.append(d.get("keywords") or [])
                else:
                    chunks.append(content)
                    meta_doc_ids.append(d.get("docId", "unknown"))
                    roles_list.append(d.get("role") or ["teacher", "technician", "admin"])
                    titles_list.append(d.get("title", ""))
                    intents_list.append(d.get("intent", ""))
                    keywords_list.append(d.get("keywords") or [])
            
            if chunks:
                print(f"[startup] Encoding {len(chunks)} chunks...")
                embs = embedder.encode(chunks)
                if embs.dtype != np.float32:
                    embs = embs.astype(np.float32)
                
                async with index_lock:
                    faiss_index.add(embs)
                    store_doc_ids.extend(meta_doc_ids)
                    store_texts.extend(chunks)
                    store_roles.extend(roles_list)
                    store_titles.extend(titles_list)
                    store_intents.extend(intents_list)
                    store_keywords.extend(keywords_list)
                    
                    # Save to both store/ and prebuilt/
                    await async_save_index_and_meta()
                
                print(f"[startup] [OK] Bootstrapped {len(chunks)} chunks and saved to prebuilt/")
                print(f"[startup] [!] IMPORTANT: Commit py-chatbot/prebuilt/ to Git for persistence!")
        except Exception as e:
            print(f"[startup] Knowledge bootstrap failed: {e}")

    # Print final stats
    final_stats = {
        "index_size": len(store_texts),
        "emb_dim": EMB_DIM,
        "loaded": faiss_index.ntotal,
        "source": "bootstrap" if len(store_texts) > 0 else "empty"
    }
    print(f"[startup] Index status: {final_stats}")
    
    # Start autosave loop
    if AUTOSAVE_SECONDS > 0:
        _autosave_task = asyncio.create_task(_autosave_loop())


@app.on_event("shutdown")
async def _shutdown_cleanup():
    global _autosave_task
    
    print("[shutdown] Saving index before shutdown...")
    
    # Save index one last time
    try:
        await async_save_index_and_meta()
        print("[shutdown] [OK] Index saved successfully")
    except Exception as e:
        print(f"[shutdown] Failed to save index: {e}")
    
    # Stop autosave task
    if _autosave_task is not None:
        _autosave_task.cancel()
        try:
            await _autosave_task
        except Exception:
            pass

#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Build a static FAISS index + metadata from data/knowledge.vi.json
and write them to py-chatbot/prebuilt/ (committable to Git).

Usage (Windows PowerShell):
  # From repo root or py-chatbot folder
  python py-chatbot/build_static_index.py

Options (env):
  EMBED_MODEL           - huggingface model id (default: sentence-transformers/all-MiniLM-L6-v2)
  KNOWLEDGE_JSON_PATH   - path to knowledge JSON (default: ../data/knowledge.vi.json)
  OUTPUT_DIR            - output dir (default: ./prebuilt)
"""
import os
import json
from typing import List, Dict, Any

import numpy as np
import faiss  # type: ignore
import torch
from transformers import AutoTokenizer, AutoModel


def device_name() -> str:
    return "cuda" if torch.cuda.is_available() else "cpu"


def ensure_dir(p: str) -> None:
    os.makedirs(p, exist_ok=True)


def load_knowledge(path: str) -> List[Dict[str, Any]]:
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)


class HFEmbedder:
    def __init__(self, model_name: str, device: str = "cpu") -> None:
        self.device = device
        self.tokenizer = AutoTokenizer.from_pretrained(model_name)
        self.model = AutoModel.from_pretrained(model_name)
        self.model.to(device)
        self.model.eval()

    def dim(self) -> int:
        return int(getattr(self.model.config, "hidden_size", 768))

    def encode(self, texts: List[str], batch_size: int = 32) -> np.ndarray:
        if not texts:
            return np.zeros((0, self.dim()), dtype=np.float32)
        outs: List[np.ndarray] = []
        with torch.no_grad():
            for i in range(0, len(texts), batch_size):
                batch = texts[i:i+batch_size]
                inputs = self.tokenizer(
                    batch, padding=True, truncation=True, max_length=512, return_tensors="pt"
                )
                inputs = {k: v.to(self.device) for k, v in inputs.items()}
                outputs = self.model(**inputs)
                last_hidden = outputs.last_hidden_state
                attn = inputs["attention_mask"].unsqueeze(-1).type_as(last_hidden)
                masked = last_hidden * attn
                sum_emb = masked.sum(dim=1)
                lengths = attn.sum(dim=1).clamp(min=1)
                mean_pooled = sum_emb / lengths
                emb = mean_pooled.detach().cpu().numpy().astype(np.float32)
                faiss.normalize_L2(emb)
                outs.append(emb)
        return np.vstack(outs)


def build_index(docs: List[Dict[str, Any]], model_name: str, out_dir: str) -> Dict[str, Any]:
    embedder = HFEmbedder(model_name, device=device_name())
    dim = embedder.dim()
    index = faiss.IndexFlatIP(dim)

    chunks: List[str] = []
    doc_ids: List[str] = []
    roles: List[List[str]] = []
    titles: List[str] = []
    intents: List[str] = []
    keywords: List[List[str]] = []

    for d in docs:
        content = (d.get("content") or "").strip()
        if not content:
            continue
        # simple chunk if very long
        if len(content) > 1000:
            for i in range(0, len(content), 800):
                part = content[i:i+800]
                chunks.append(part)
                doc_ids.append(d.get("docId", "unknown"))
                roles.append(d.get("role") or ["teacher", "technician", "admin"])
                titles.append(d.get("title", ""))
                intents.append(d.get("intent", ""))
                keywords.append(d.get("keywords") or [])
        else:
            chunks.append(content)
            doc_ids.append(d.get("docId", "unknown"))
            roles.append(d.get("role") or ["teacher", "technician", "admin"])
            titles.append(d.get("title", ""))
            intents.append(d.get("intent", ""))
            keywords.append(d.get("keywords") or [])

    if chunks:
        embs = embedder.encode(chunks)
        index.add(embs)

    ensure_dir(out_dir)
    faiss.write_index(index, os.path.join(out_dir, "faiss.index"))
    with open(os.path.join(out_dir, "meta.json"), "w", encoding="utf-8") as f:
        json.dump({
            "doc_ids": doc_ids,
            "texts": chunks,
            "roles": roles,
            "titles": titles,
            "intents": intents,
            "keywords": keywords,
        }, f, ensure_ascii=False)

    return {
        "ok": True,
        "count": len(chunks),
        "dim": dim,
        "out": out_dir,
    }


if __name__ == "__main__":
    BASE_DIR = os.path.abspath(os.path.dirname(__file__))
    model_name = os.getenv("EMBED_MODEL", "sentence-transformers/all-MiniLM-L6-v2")
    knowledge_path = os.getenv("KNOWLEDGE_JSON_PATH", os.path.abspath(os.path.join(BASE_DIR, "..", "data", "knowledge.vi.json")))
    out_dir = os.getenv("OUTPUT_DIR", os.path.join(BASE_DIR, "prebuilt"))

    print(f"[build] model={model_name}")
    print(f"[build] knowledge={knowledge_path}")
    print(f"[build] out_dir={out_dir}")

    docs = load_knowledge(knowledge_path)
    res = build_index(docs, model_name, out_dir)
    print(json.dumps(res, ensure_ascii=False, indent=2))

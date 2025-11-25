# QLMC Python AI Backend

🤖 FastAPI backend cho QLMC với FAISS vector search, Google Gemini LLM, và MongoDB persistence.

## 🌟 Tính Năng

- ✅ **FAISS Vector Search** - Semantic search với 384-dim embeddings
- ✅ **Google Gemini Integration** - Advanced LLM cho RAG
- ✅ **MongoDB Persistence** - FAISS index được lưu trữ lâu dài
- ✅ **Feedback Learning** - Exponential Moving Average algorithm
- ✅ **Real-time + Batch Learning** - Cập nhật điểm ngay lập tức + daily analysis
- ✅ **Auto-save** - Tự động lưu index sau khi train
- ✅ **Startup Priority Loading** - MongoDB → prebuilt → store → bootstrap

## 🚀 Tech Stack

- **FastAPI** 0.115.0 - Modern Python web framework
- **FAISS** 1.12.0 - Facebook AI Similarity Search
- **Sentence Transformers** 4.46.1 - paraphrase-multilingual-MiniLM-L12-v2 (384-dim)
- **Google Generative AI** 0.8.3 - Gemini Pro model
- **PyMongo** 4.6.0 - MongoDB driver
- **PyTorch** 2.4.1 - Deep learning framework
- **Uvicorn** 0.30.6 - ASGI server

## 📦 Installation

### 1. Create Virtual Environment

```bash
python -m venv .venv

# Activate
# Windows PowerShell:
.venv\Scripts\Activate.ps1
# Windows CMD:
.venv\Scripts\activate.bat
# macOS/Linux:
source .venv/bin/activate
```

### 2. Install Dependencies

```bash
pip install -r requirements.txt
```

### 3. Environment Variables

Create `.env` file:

```env
# Google Gemini API Key (free at ai.google.dev)
GOOGLE_API_KEY=your_api_key_here

# MongoDB Connection (same as Next.js)
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/qlmc?retryWrites=true&w=majority
MONGODB_DB_NAME=qlmc

# Next.js API URL (for FAISS index persistence)
NEXTJS_API_URL=http://localhost:3000
```

**Get Free API Keys:**
- Google Gemini: https://ai.google.dev/
- MongoDB Atlas: https://www.mongodb.com/cloud/atlas

### 4. Run Server

```bash
# Development with auto-reload
python -m uvicorn app.main:app --reload --port 8001

# Production
python -m uvicorn app.main:app --host 0.0.0.0 --port 8001
```

**API Documentation:** http://127.0.0.1:8001/docs

## 📚 API Endpoints

### Search & RAG

#### `POST /search`
Vector search với FAISS
```json
{
  "query": "Cách đặt máy chiếu",
  "top_k": 5,
  "role": "teacher"
}
```

#### `POST /rag/answer`
RAG với Gemini (Q&A)
```json
{
  "question": "Máy chiếu bị lỗi phải làm sao?",
  "top_k": 3
}
```

#### `POST /embed`
Embed và index documents mới
```json
{
  "docId": "doc_new_001",
  "chunks": ["Text chunk 1", "Text chunk 2"],
  "title": "New Document",
  "rolesAllowed": ["teacher", "admin"]
}
```

### Index Management

#### `GET /index/stats`
Thống kê FAISS index
```json
{
  "total_vectors": 245,
  "dimension": 384,
  "doc_count": 42
}
```

#### `POST /index/load`
Load index từ file

#### `POST /index/save`
Save index to store/ và prebuilt/

#### `POST /index/save-to-mongodb`
Save FAISS index to MongoDB

#### `POST /index/retrain`
Retrain FAISS index từ knowledge base

### Feedback Learning

#### `POST /feedback/update`
Update document feedback score (EMA algorithm)
```json
{
  "docId": "doc_001",
  "feedbackScore": 1.0  // Like=1.0, Dislike=-0.5
}
```

#### `GET /feedback/scores`
Get all document feedback scores
```json
{
  "scores": {
    "doc_001": 0.75,
    "doc_002": -0.3
  },
  "count": 2
}
```

### Health Check

#### `GET /`
API status và version

#### `GET /health`
Health check endpoint

## 🗄️ FAISS Index Persistence

### Priority Loading Strategy (Startup)

```
Priority 0: MongoDB (fastest, cloud-based, production)
     ↓ not found or error
Priority 1: prebuilt/faiss.index (Git-committed, reliable fallback)
     ↓ not found
Priority 2: store/faiss.index (local training, development)
     ↓ not found
Priority 3: Bootstrap (train từ knowledge base, first-time setup)
```

### Save Strategy (After Training)

Sau khi train hoặc update, index được save tới:
1. **MongoDB** (Priority 0) - Cloud persistence, fast startup
2. **store/** (Priority 2) - Local backup
3. **prebuilt/** (Priority 1) - Git-committed fallback

**Lợi ích:**
- ✅ **MongoDB**: Không mất khi Render restart (free tier có ephemeral filesystem)
- ✅ **prebuilt/**: Fallback khi MongoDB down
- ✅ **store/**: Local development

## 🧠 Feedback Learning Algorithm

### Exponential Moving Average (EMA)

```python
new_score = 0.7 * old_score + 0.3 * feedback_score
```

**Lý do dùng EMA:**
- Cân bằng giữa historical data (70%) và feedback mới (30%)
- Tránh score nhảy vọt do outliers
- Documents có thể "recover" từ dislike

### Scoring System

**Feedback Scores:**
- Like: +1.0
- Dislike: -0.5

**Search Re-ranking:**
```python
final_score = vector_similarity + (0.2 * feedback_score)
```

Feedback boost có impact ±20% trên ranking.

**Ví dụ:**
```
Document A: similarity=0.85, feedback=+0.75 → final=0.85+0.15=1.00 ⭐
Document B: similarity=0.90, feedback=-0.30 → final=0.90-0.06=0.84

→ Document A ranks higher despite lower similarity!
```

## 🚀 Deployment (Render)

### 1. Create Web Service

1. Vào [render.com](https://render.com) → New Web Service
2. Connect GitHub repository
3. Settings:
   - **Root Directory**: `py-chatbot`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `python -m uvicorn app.main:app --host 0.0.0.0 --port $PORT`

### 2. Environment Variables

Add these in Render dashboard:

```
GOOGLE_API_KEY=your_gemini_api_key
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/qlmc?retryWrites=true&w=majority
MONGODB_DB_NAME=qlmc
NEXTJS_API_URL=https://your-app.vercel.app
```

### 3. Deploy

Push to GitHub → Render auto-deploys.

**⚠️ Note:** Render free tier có:
- 15 min idle sleep
- Ephemeral filesystem (mất data khi restart)
- 30-60s wake-up time

**Solution:** FAISS index load từ MongoDB (Priority 0) → Fast startup (~10-30s)

## 🛠️ Development Guide

### Add New Documents

```python
import requests

response = requests.post("http://127.0.0.1:8001/embed", json={
    "docId": "doc_new_001",
    "chunks": [
        "Máy chiếu Epson EB-X05 có độ sáng 3300 lumens.",
        "Hỗ trợ độ phân giải XGA (1024x768)."
    ],
    "title": "Máy chiếu Epson EB-X05",
    "rolesAllowed": ["teacher", "admin", "technician"]
})
print(response.json())
# {"added": 2, "total_index": 247}
```

### Update Feedback Scores

```python
# User clicked "Like" on doc_001
requests.post("http://127.0.0.1:8001/feedback/update", json={
    "docId": "doc_001",
    "feedbackScore": 1.0
})

# User clicked "Dislike" on doc_002
requests.post("http://127.0.0.1:8001/feedback/update", json={
    "docId": "doc_002",
    "feedbackScore": -0.5
})
```

### Save to MongoDB

```python
# Manually save current index to MongoDB
requests.post("http://127.0.0.1:8001/index/save-to-mongodb")
```

### Retrain Index

```python
# Retrain from knowledge base (data/knowledge.vi.json)
requests.post("http://127.0.0.1:8001/index/retrain")
```

## 🐛 Troubleshooting

### FAISS Index Not Found

```bash
# Train manually
cd py-chatbot
.venv\Scripts\Activate.ps1  # Windows
python -c "from app.main import bootstrap_index; bootstrap_index()"
```

### MongoDB Connection Error

```bash
# Check connection string format
# Ensure IP whitelist: 0.0.0.0/0
# Encode special characters in password
# Example: password@123 → password%40123
```

### Gemini API Rate Limit

```bash
# Free tier limits: 60 requests/minute
# Upgrade to paid plan or reduce request frequency
# Get API key at: https://ai.google.dev/
```

### Slow Startup on Render

```bash
# Free tier wake-up: 30-60s (normal)
# FAISS loading from MongoDB: 10-30s (normal)
# Total cold start: ~60-90s

# Solution: Keep backend warm với cron ping
# Or upgrade to paid tier (always-on)
```

### Unicode Encoding Errors (Windows)

```bash
# Set environment variable
$env:PYTHONIOENCODING="utf-8"

# Or add to .env
PYTHONIOENCODING=utf-8
```

## 📊 Performance

### Benchmarks (Local)

- **Search latency**: ~50-100ms (FAISS)
- **RAG latency**: ~1-3s (includes Gemini)
- **Index size**: ~1MB (245 vectors, 384-dim)
- **Startup time**: ~5-10s (local), ~30-60s (Render free tier)

### Optimization Tips

1. **Reduce top_k**: Fewer results = faster
2. **Cache embeddings**: Avoid re-encoding same queries
3. **Batch updates**: Update feedback scores in batches
4. **Use CDN**: Cache static responses

## 📝 License

MIT License

## 🤝 Contributing

Contributions welcome! Please:
1. Fork repository
2. Create feature branch
3. Submit pull request

## 📧 Support

- **Issues**: [GitHub Issues](https://github.com/tpd0905/qlmc/issues)
- **Docs**: [Main README](../README.md)

---

**Made with ❤️ by QLMC Team**

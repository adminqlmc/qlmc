import requests
import json

# Load knowledge data
with open('seed-knowledge.json', 'r', encoding='utf-8') as f:
    knowledge_items = json.load(f)

BACKEND_URL = "https://qlmc-python-backend.onrender.com"

print(f"📚 Seeding {len(knowledge_items)} documents to knowledge base...")

# Process each document
total_chunks = 0
for i, item in enumerate(knowledge_items, 1):
    doc_id = item['docId']
    content = item['content']
    
    # Chunk the content (max 400 chars)
    def chunk_text(text, max_len=400):
        sentences = text.replace('\r\n', ' ').split('. ')
        chunks = []
        current_chunk = []
        current_len = 0
        
        for sent in sentences:
            sent = sent.strip()
            if not sent:
                continue
            if current_len + len(sent) + 2 > max_len and current_len > 0:
                chunks.append('. '.join(current_chunk) + '.')
                current_chunk = []
                current_len = 0
            current_chunk.append(sent)
            current_len += len(sent) + 2
        
        if current_chunk:
            chunks.append('. '.join(current_chunk) + '.')
        
        return chunks if chunks else [text]
    
    chunks = chunk_text(content)
    
    # Prepare payload
    payload = {
        "docId": doc_id,
        "chunks": chunks,
        "rolesAllowed": item.get('role', ['teacher', 'admin']),
        "title": item.get('title', ''),
        "intent": item.get('intent', 'faq_general'),
        "keywords": item.get('keywords', [])
    }
    
    # Send to backend
    try:
        response = requests.post(
            f"{BACKEND_URL}/embed",
            json=payload,
            timeout=30
        )
        
        if response.ok:
            total_chunks += len(chunks)
            print(f"✅ {i}/{len(knowledge_items)}: {doc_id} - {len(chunks)} chunks")
        else:
            print(f"❌ {i}/{len(knowledge_items)}: {doc_id} - Error: {response.status_code}")
            print(f"   Response: {response.text[:200]}")
    except Exception as e:
        print(f"❌ {i}/{len(knowledge_items)}: {doc_id} - Exception: {str(e)}")

# Save the index
print("\n💾 Saving FAISS index...")
try:
    save_response = requests.post(f"{BACKEND_URL}/index/save", timeout=30)
    if save_response.ok:
        print("✅ Index saved successfully!")
    else:
        print(f"⚠️ Save failed: {save_response.status_code}")
except Exception as e:
    print(f"❌ Save error: {str(e)}")

# Check stats
print("\n📊 Checking index stats...")
try:
    stats_response = requests.get(f"{BACKEND_URL}/index/stats", timeout=10)
    if stats_response.ok:
        stats = stats_response.json()
        print(f"✅ Index size: {stats['index_size']} vectors")
        print(f"   Embedding dim: {stats['emb_dim']}")
        print(f"   Index file exists: {stats['files']['index_exists']}")
        print(f"   Meta file exists: {stats['files']['meta_exists']}")
    else:
        print(f"⚠️ Stats failed: {stats_response.status_code}")
except Exception as e:
    print(f"❌ Stats error: {str(e)}")

print(f"\n🎉 Seeding completed! Total chunks embedded: {total_chunks}")

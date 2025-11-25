import requests
import json

# Seed both local and cloud backends
BACKENDS = {
    "local": "http://127.0.0.1:8001",
    "cloud": "https://qlmc-python-backend.onrender.com"
}

# Load knowledge data from the proper source
knowledge_file = 'data/knowledge.vi.json'
with open(knowledge_file, 'r', encoding='utf-8') as f:
    knowledge_items = json.load(f)
    
print(f"📖 Loading knowledge from: {knowledge_file}")

def chunk_text(text, max_len=400):
    """Split text into chunks"""
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

def seed_backend(name, base_url, clear_first=True):
    """Seed knowledge to a backend"""
    print(f"\n{'='*60}")
    print(f"🎯 {'CLEARING & ' if clear_first else ''}Seeding {name.upper()} backend: {base_url}")
    print(f"{'='*60}")
    
    # Check if backend is alive
    try:
        health = requests.get(f"{base_url}/health", timeout=5)
        if not health.ok:
            print(f"❌ Backend not responding. Skipping {name}...")
            return False
        print(f"✅ Backend is healthy!")
    except Exception as e:
        print(f"❌ Cannot connect to backend: {str(e)}")
        print(f"   Skipping {name}...")
        return False
    
    # Clear old index first (create fresh index by not loading old one)
    if clear_first:
        print(f"🗑️  Clearing old knowledge base...")
        print(f"   (Will create fresh index - old data will be overwritten)")
    
    # Process each document
    total_chunks = 0
    success_count = 0
    
    for i, item in enumerate(knowledge_items, 1):
        doc_id = item['docId']
        content = item['content']
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
                f"{base_url}/embed",
                json=payload,
                timeout=30
            )
            
            if response.ok:
                total_chunks += len(chunks)
                success_count += 1
                print(f"✅ {i}/{len(knowledge_items)}: {doc_id} - {len(chunks)} chunks")
            else:
                print(f"❌ {i}/{len(knowledge_items)}: {doc_id} - Error {response.status_code}")
        except Exception as e:
            print(f"❌ {i}/{len(knowledge_items)}: {doc_id} - {str(e)[:80]}")
    
    # Save the index
    print(f"\n💾 Saving FAISS index...")
    try:
        save_response = requests.post(f"{base_url}/index/save", timeout=30)
        if save_response.ok:
            print(f"✅ Index saved successfully!")
        else:
            print(f"⚠️ Save failed: {save_response.status_code}")
    except Exception as e:
        print(f"❌ Save error: {str(e)}")
    
    # Check final stats
    print(f"\n📊 Final stats:")
    try:
        stats_response = requests.get(f"{base_url}/index/stats", timeout=10)
        if stats_response.ok:
            stats = stats_response.json()
            print(f"   ✅ Index size: {stats['index_size']} vectors")
            print(f"   ✅ Embedding dim: {stats['emb_dim']}")
            print(f"   ✅ Files exist: index={stats['files']['index_exists']}, meta={stats['files']['meta_exists']}")
        else:
            print(f"   ⚠️ Stats check failed")
    except Exception as e:
        print(f"   ❌ Stats error: {str(e)}")
    
    print(f"\n✨ {name.upper()} Summary: {success_count}/{len(knowledge_items)} docs, {total_chunks} chunks")
    return True

# Main execution
if __name__ == "__main__":
    print("🚀 Starting AI Knowledge Base Seeding...")
    print(f"📚 Total documents to seed: {len(knowledge_items)}")
    
    results = {}
    
    # Seed local first
    if seed_backend("local", BACKENDS["local"]):
        results["local"] = "✅ Success"
    else:
        results["local"] = "❌ Failed"
    
    # Then seed cloud
    if seed_backend("cloud", BACKENDS["cloud"]):
        results["cloud"] = "✅ Success"
    else:
        results["cloud"] = "❌ Failed"
    
    # Final summary
    print(f"\n{'='*60}")
    print(f"🎉 SEEDING COMPLETED!")
    print(f"{'='*60}")
    print(f"Local backend:  {results['local']}")
    print(f"Cloud backend:  {results['cloud']}")
    print(f"\n💡 Tip: Run this script whenever you update knowledge data")
    print(f"   to keep both environments in sync!")

import requests
import json

# Backend URLs
BACKENDS = {
    "local": "http://127.0.0.1:8001",
    "cloud": "https://qlmc-python-backend.onrender.com"
}

def clear_backend(name, base_url):
    """Clear all data from a backend"""
    print(f"\n{'='*60}")
    print(f"🗑️  CLEARING {name.upper()} backend: {base_url}")
    print(f"{'='*60}")
    
    # Check if backend is alive
    try:
        health = requests.get(f"{base_url}/health", timeout=5)
        if not health.ok:
            print(f"❌ Backend not responding. Skipping {name}...")
            return False
        print(f"✅ Backend is healthy!")
    except Exception as e:
        print(f"❌ Cannot connect to backend: {str(e)[:100]}")
        print(f"   Skipping {name}...")
        return False
    
    # Clear the index
    try:
        print(f"🧹 Clearing FAISS index...")
        clear_response = requests.post(f"{base_url}/index/clear", timeout=30)
        if clear_response.ok:
            print(f"✅ Index cleared successfully!")
        else:
            print(f"⚠️ Clear failed: {clear_response.status_code}")
            print(f"   Response: {clear_response.text[:200]}")
    except Exception as e:
        print(f"❌ Clear error: {str(e)}")
        return False
    
    # Verify it's empty
    try:
        stats_response = requests.get(f"{base_url}/index/stats", timeout=10)
        if stats_response.ok:
            stats = stats_response.json()
            print(f"📊 After clear: index_size = {stats['index_size']}")
            return stats['index_size'] == 0
        else:
            print(f"⚠️ Cannot verify clear status")
            return False
    except Exception as e:
        print(f"❌ Stats error: {str(e)}")
        return False

# Main execution
if __name__ == "__main__":
    print("🚀 Starting AI Knowledge Base RESET...")
    print("⚠️  WARNING: This will DELETE all existing AI knowledge!")
    print()
    
    results = {}
    
    # Clear local
    if clear_backend("local", BACKENDS["local"]):
        results["local"] = "✅ Cleared"
    else:
        results["local"] = "❌ Failed"
    
    # Clear cloud
    if clear_backend("cloud", BACKENDS["cloud"]):
        results["cloud"] = "✅ Cleared"
    else:
        results["cloud"] = "❌ Failed"
    
    # Final summary
    print(f"\n{'='*60}")
    print(f"🎉 CLEARING COMPLETED!")
    print(f"{'='*60}")
    print(f"Local backend:  {results['local']}")
    print(f"Cloud backend:  {results['cloud']}")
    print(f"\n💡 Next step: Run 'npm run ai-seed' to load new knowledge")

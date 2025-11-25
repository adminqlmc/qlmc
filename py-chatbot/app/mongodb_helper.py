# MongoDB Helper for FAISS Index Persistence
# This allows loading prebuilt index from MongoDB instead of GitHub
# Usage: Load index from MongoDB on startup if available

import os
import base64
import json
import requests
from typing import Optional, Dict, Any

NEXT_API_URL = os.getenv("NEXT_API_URL", "https://quanlymaychieu.vercel.app")

def load_index_from_mongodb() -> Optional[Dict[str, Any]]:
    """
    Load FAISS index from MongoDB via Next.js API
    Returns: {indexData: base64, metadata: dict} or None if failed
    """
    try:
        response = requests.get(f"{NEXT_API_URL}/api/faiss-index", timeout=30)
        if response.status_code == 200:
            data = response.json()
            print(f"[mongodb] Loaded index version {data.get('version')} with {data.get('indexSize')} documents")
            return data
        elif response.status_code == 404:
            print("[mongodb] No index found in database")
            return None
        else:
            print(f"[mongodb] Failed to load index: {response.status_code}")
            return None
    except Exception as e:
        print(f"[mongodb] Error loading index: {e}")
        return None


def save_index_to_mongodb(index_binary: bytes, metadata: dict, version: str) -> bool:
    """
    Save FAISS index to MongoDB via Next.js API
    
    Args:
        index_binary: FAISS index binary data
        metadata: Metadata dictionary (doc_ids, texts, roles, etc.)
        version: Version tag (e.g., "2024-11-24-train-1")
    
    Returns: True if successful, False otherwise
    """
    try:
        # Encode binary to base64
        index_base64 = base64.b64encode(index_binary).decode('utf-8')
        
        payload = {
            "version": version,
            "indexData": index_base64,
            "metadata": metadata,
            "indexSize": len(metadata.get("doc_ids", [])),
            "embDim": metadata.get("emb_dim", 384),
        }
        
        response = requests.post(
            f"{NEXT_API_URL}/api/faiss-index",
            json=payload,
            timeout=60  # Large index may take time
        )
        
        if response.status_code == 200:
            result = response.json()
            print(f"[mongodb] Saved index version {result.get('version')} successfully")
            return True
        else:
            print(f"[mongodb] Failed to save index: {response.status_code} - {response.text}")
            return False
            
    except Exception as e:
        print(f"[mongodb] Error saving index: {e}")
        return False


def decode_index_from_base64(index_base64: str) -> bytes:
    """Decode base64 index data to binary"""
    return base64.b64decode(index_base64)

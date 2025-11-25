/**
 * FAISS Vector Search - Server-side Only
 * 
 * Load FAISS index from prebuilt/ (committed to GitHub)
 * Perform semantic search without calling external Python backend
 * Only use Render for training new models
 */

import fs from 'fs';
import path from 'path';

interface SearchResult {
  docId: string;
  text: string;
  score: number;
}

interface FAISSMetadata {
  docIds: string[];
  texts: string[];
  roles: string[][];
  titles: string[];
  intents: string[];
  keywords: string[][];
}

/**
 * Load FAISS index metadata from prebuilt/
 */
export function loadFAISSMetadata(): FAISSMetadata | null {
  try {
    const metaPath = path.join(process.cwd(), 'py-chatbot', 'prebuilt', 'meta.json');
    
    if (!fs.existsSync(metaPath)) {
      console.error('[FAISS] meta.json not found at:', metaPath);
      return null;
    }

    const metaContent = fs.readFileSync(metaPath, 'utf-8');
    const metadata = JSON.parse(metaContent) as FAISSMetadata;

    // Normalize metadata arrays to prevent undefined indexes
    const count = metadata.texts?.length || 0;
    if (!Array.isArray(metadata.docIds) || metadata.docIds.length !== count) {
      metadata.docIds = Array.from({ length: count }, (_, idx) => {
        return metadata.docIds?.[idx] ?? `doc_${idx}`;
      });
    }
    if (!Array.isArray(metadata.roles) || metadata.roles.length !== count) {
      metadata.roles = Array.from({ length: count }, () => ['teacher', 'admin', 'technician']);
    }
    if (!Array.isArray(metadata.titles) || metadata.titles.length !== count) {
      metadata.titles = Array.from({ length: count }, (_, idx) => metadata.titles?.[idx] ?? '');
    }
    if (!Array.isArray(metadata.intents) || metadata.intents.length !== count) {
      metadata.intents = Array.from({ length: count }, (_, idx) => metadata.intents?.[idx] ?? '');
    }
    if (!Array.isArray(metadata.keywords) || metadata.keywords.length !== count) {
      metadata.keywords = Array.from({ length: count }, (_, idx) => metadata.keywords?.[idx] ?? []);
    }
    
    console.log(`[FAISS] Loaded metadata: ${metadata.texts?.length || 0} documents`);
    return metadata;
  } catch (error) {
    console.error('[FAISS] Failed to load metadata:', error);
    return null;
  }
}

/**
 * Simple keyword-based search fallback
 * (Used until we have sentence-transformers in Node.js or call Python for embedding only)
 */
export function keywordSearch(
  query: string, 
  metadata: FAISSMetadata, 
  role?: string,
  topK: number = 5
): SearchResult[] {
  const queryLower = query.toLowerCase();
  const queryWords = new Set(queryLower.split(/\s+/).filter(w => w.length > 2));
  
  const results: Array<{ index: number; score: number }> = [];
  
  metadata.texts.forEach((text, index) => {
    // Role filtering
    if (role) {
      const roles = metadata.roles[index] || ['teacher', 'admin', 'technician'];
      if (!roles.includes(role)) {
        return;
      }
    }
    
    const textLower = text.toLowerCase();
    let score = 0;
    
    // Keyword matching
    for (const word of queryWords) {
      if (textLower.includes(word)) {
        score += 1.0;
      }
    }
    
    // Title boost
    if (metadata.titles[index]) {
      const titleLower = metadata.titles[index].toLowerCase();
      for (const word of queryWords) {
        if (titleLower.includes(word)) {
          score += 0.5;
        }
      }
    }
    
    // Keyword array boost
    if (metadata.keywords[index]) {
      const keywords = metadata.keywords[index].map(k => k.toLowerCase());
      for (const word of queryWords) {
        for (const kw of keywords) {
          if (kw.includes(word) || word.includes(kw)) {
            score += 0.3;
          }
        }
      }
    }
    
    if (score > 0) {
      results.push({ index, score });
    }
  });
  
  // Sort by score and return top K
  results.sort((a, b) => b.score - a.score);
  
  return results
    .slice(0, topK)
    .map((r) => {
      const docId = metadata.docIds?.[r.index];
      const text = metadata.texts?.[r.index];
      if (!docId || !text) {
        return null;
      }
      return {
        docId,
        text,
        score: r.score,
      };
    })
    .filter((item): item is SearchResult => Boolean(item));
}

/**
 * Generate answer using retrieved passages
 * (Simple template-based approach until we integrate LLM)
 */
export function generateAnswer(
  query: string,
  passages: SearchResult[]
): {
  answer: string;
  sources: string[];
  passages: string[];
  confidence: number;
} {
  if (passages.length === 0) {
    return {
      answer: 'Xin lỗi, tôi chưa tìm thấy thông tin phù hợp để trả lời câu hỏi này. Vui lòng thử diễn đạt lại hoặc hỏi câu hỏi khác.',
      sources: [],
      passages: [],
      confidence: 0,
    };
  }
  
  // Use top passage as answer base
  const topPassage = passages[0];
  const answer = topPassage.text;
  
  // Calculate confidence based on score
  const maxScore = Math.max(...passages.map(p => p.score));
  const confidence = Math.min(maxScore / 5.0, 1.0); // Normalize to 0-1
  
  return {
    answer,
    sources: passages.map(p => p.docId),
    passages: passages.map(p => p.text),
    confidence,
  };
}

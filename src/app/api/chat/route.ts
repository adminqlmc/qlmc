import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/utils/auth';
import { loadFAISSMetadata, keywordSearch, generateAnswer } from '@/lib/faiss-search';

/**
 * Chat API - Local FAISS Search (Fast)
 * 
 * Strategy:
 * 1. Load FAISS index from py-chatbot/prebuilt/ (committed to GitHub)
 * 2. Perform keyword-based search locally on Vercel
 * 3. No need to call Render backend → No cold start delay!
 * 
 * For training new models:
 * - Use /api/admin/train endpoint
 * - Calls Render backend to train
 * - Render saves index to py-chatbot/prebuilt/
 * - Commit to GitHub for next deployment
 */

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    const role = user?.role ?? 'teacher';
    const { message } = await req.json();
    
    // Input validation
    if (!message || typeof message !== 'string') {
      return NextResponse.json({ error: 'Invalid message' }, { status: 400 });
    }

    if (message.length > 2000) {
      return NextResponse.json({ 
        error: 'Message too long (max 2000 characters)' 
      }, { status: 400 });
    }

    const sanitizedMessage = message.trim();
    
    if (!sanitizedMessage) {
      return NextResponse.json({ 
        error: 'Empty message' 
      }, { status: 400 });
    }

    try {
      // Load FAISS metadata from prebuilt/ (fast - local filesystem)
      const metadata = loadFAISSMetadata();
      
      if (!metadata) {
        console.error('[Chat] FAISS metadata not found - falling back to error');
        return NextResponse.json({ 
          error: 'AI service not initialized. Please contact admin to train the model.',
          answer: 'Xin lỗi, hệ thống AI chưa được khởi tạo. Vui lòng liên hệ admin để train model.',
          sources: [],
          passages: [],
          confidence: 0,
        }, { status: 503 });
      }

      // Perform keyword-based search (fast - in-memory)
      const searchResults = keywordSearch(sanitizedMessage, metadata, role, 5);
      
      // Generate answer from search results
      const result = generateAnswer(sanitizedMessage, searchResults);
      
      console.log(`[Chat] Query: "${sanitizedMessage.substring(0, 50)}..." → ${searchResults.length} results, confidence: ${result.confidence.toFixed(2)}`);
      
      return NextResponse.json(result);

    } catch (e: any) {
      console.error('[Chat] Search error:', e);
      return NextResponse.json({ 
        error: 'Search failed',
        detail: process.env.NODE_ENV === 'development' ? String(e?.message || e) : undefined,
        answer: 'Xin lỗi, đã có lỗi xảy ra khi tìm kiếm. Vui lòng thử lại.',
        sources: [],
        passages: [],
        confidence: 0,
      }, { status: 500 });
    }

  } catch (err) {
    console.error('[Chat] API error:', err);
    return NextResponse.json({ 
      error: 'Internal Server Error',
      answer: 'Xin lỗi, đã có lỗi hệ thống. Vui lòng thử lại sau.',
      sources: [],
      passages: [],
      confidence: 0,
    }, { status: 500 });
  }
}

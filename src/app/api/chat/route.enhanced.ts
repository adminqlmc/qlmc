/**
 * Enhanced Chat API with semantic search, caching, and retry logic
 * 
 * This is an improved version of the chat endpoint with:
 * - Semantic search via Python backend
 * - Fallback to keyword search
 * - Caching for frequent queries
 * - Retry logic with exponential backoff
 * - Better error handling
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/utils/auth';
import { loadFAISSMetadata, keywordSearch, generateAnswer } from '@/lib/faiss-search';
import { getCachedAnswer, setCachedAnswer, shouldCache } from '@/lib/cache';
import { retryWithBackoff } from '@/lib/retry';

interface ChatRequest {
  message: string;
  context?: Array<{ role: 'user' | 'assistant'; content: string }>;
  useSemantic?: boolean;
}

/**
 * Enhanced chat endpoint with multiple strategies
 */
export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    const role = user?.role ?? 'teacher';
    
    const body: ChatRequest = await req.json();
    const { message, context = [], useSemantic = true } = body;
    
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

    // Check cache first (if query is cacheable)
    if (shouldCache(sanitizedMessage)) {
      const cached = getCachedAnswer(sanitizedMessage, role);
      if (cached) {
        return NextResponse.json({
          ...cached,
          cached: true,
        });
      }
    }

    // Strategy 1: Try semantic search via Python backend (preferred)
    if (useSemantic) {
      try {
        const pythonBackend = process.env.NEXT_PUBLIC_PYTHON_BACKEND_URL || 
                             process.env.PY_CHATBOT_URL || 
                             'http://127.0.0.1:8001';
        
        // Build enhanced query with context
        let enhancedQuery = sanitizedMessage;
        if (context.length > 0) {
          const contextText = context
            .slice(-3) // Last 3 messages for context
            .map(m => `${m.role === 'user' ? 'Người dùng' : 'AI'}: ${m.content}`)
            .join('\n');
          
          enhancedQuery = `Ngữ cảnh cuộc trò chuyện:\n${contextText}\n\nCâu hỏi hiện tại: ${sanitizedMessage}`;
        }

        // Retry with exponential backoff
        const result = await retryWithBackoff(
          async () => {
            const response = await fetch(`${pythonBackend}/rag/answer`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ 
                question: enhancedQuery,
                top_k: 5,
                role: role,
              }),
              signal: AbortSignal.timeout(10000), // 10s timeout
            });

            if (!response.ok) {
              const errorText = await response.text();
              throw new Error(`Backend error: ${response.status} - ${errorText}`);
            }

            return await response.json();
          },
          {
            maxRetries: 3,
            baseDelay: 1000,
            onRetry: (error, attempt) => {
              console.warn(`[Chat] Retry attempt ${attempt} after error:`, error.message);
            },
          }
        );

        // Format response
        const formattedResult = {
          answer: result.answer || 'Xin lỗi, không thể tạo câu trả lời.',
          sources: result.sources?.map((s: any) => s.docId || s) || [],
          passages: result.passages || [],
          confidence: result.confidence || 0.7,
          method: 'semantic' as const,
        };

        // Cache the result
        if (shouldCache(sanitizedMessage)) {
          setCachedAnswer(sanitizedMessage, role, formattedResult);
        }

        console.log(
          `[Chat] Semantic search: "${sanitizedMessage.substring(0, 50)}..." → ` +
          `${formattedResult.sources.length} sources, confidence: ${formattedResult.confidence.toFixed(2)}`
        );

        return NextResponse.json(formattedResult);

      } catch (error: any) {
        console.warn('[Chat] Semantic search failed, falling back to keyword search:', error.message);
        // Fall through to keyword search fallback
      }
    }

    // Strategy 2: Fallback to local keyword search
    try {
      const metadata = loadFAISSMetadata();
      
      if (!metadata) {
        console.error('[Chat] FAISS metadata not found');
        return NextResponse.json({ 
          error: 'AI service not initialized',
          answer: 'Xin lỗi, hệ thống AI chưa được khởi tạo. Vui lòng liên hệ admin để train model.',
          sources: [],
          passages: [],
          confidence: 0,
          method: 'keyword',
        }, { status: 503 });
      }

      // Perform keyword-based search
      const searchResults = keywordSearch(sanitizedMessage, metadata, role, 5);
      
      // Generate answer from search results
      const result = generateAnswer(sanitizedMessage, searchResults);
      
      const formattedResult = {
        ...result,
        method: 'keyword' as const,
      };

      // Cache the result
      if (shouldCache(sanitizedMessage)) {
        setCachedAnswer(sanitizedMessage, role, formattedResult);
      }

      console.log(
        `[Chat] Keyword search: "${sanitizedMessage.substring(0, 50)}..." → ` +
        `${searchResults.length} results, confidence: ${result.confidence.toFixed(2)}`
      );

      return NextResponse.json(formattedResult);

    } catch (e: any) {
      console.error('[Chat] Keyword search error:', e);
      return NextResponse.json({ 
        error: 'Search failed',
        detail: process.env.NODE_ENV === 'development' ? String(e?.message || e) : undefined,
        answer: 'Xin lỗi, đã có lỗi xảy ra khi tìm kiếm. Vui lòng thử lại sau.',
        sources: [],
        passages: [],
        confidence: 0,
        method: 'error',
      }, { status: 500 });
    }

  } catch (err: any) {
    console.error('[Chat] API error:', err);
    return NextResponse.json({ 
      error: 'Internal Server Error',
      answer: 'Xin lỗi, đã có lỗi hệ thống. Vui lòng thử lại sau.',
      sources: [],
      passages: [],
      confidence: 0,
      method: 'error',
    }, { status: 500 });
  }
}


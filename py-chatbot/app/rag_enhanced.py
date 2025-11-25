"""
Enhanced RAG implementation with Google Gemini LLM
This file contains improved RAG functions for better answer generation
"""

import os
import google.generativeai as genai
from typing import List, Dict, Optional, Any
from pydantic import BaseModel

# Configure Gemini
GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")
if GOOGLE_API_KEY:
    genai.configure(api_key=GOOGLE_API_KEY)
    gemini_model = genai.GenerativeModel('gemini-pro')
else:
    gemini_model = None
    print("[RAG] Warning: GOOGLE_API_KEY not set, Gemini generation disabled")


class SearchHit(BaseModel):
    docId: str
    text: str
    score: float


def calculate_confidence(hits: List[SearchHit]) -> float:
    """Calculate confidence score based on search results"""
    if not hits:
        return 0.0
    
    # Use top hit score as base confidence
    top_score = hits[0].score
    
    # Boost confidence if multiple high-quality results
    if len(hits) >= 3:
        avg_score = sum(h.score for h in hits[:3]) / 3
        if avg_score > 0.7:
            top_score += 0.1
    
    # Normalize to 0-1 range
    return min(0.95, max(0.3, top_score))


def build_rag_prompt(question: str, passages: List[str], context: Optional[List[Dict]] = None) -> str:
    """Build RAG prompt for Gemini"""
    
    # Format passages
    context_text = "\n\n".join([
        f"[Tài liệu {i+1}]\n{p}" 
        for i, p in enumerate(passages[:5])  # Max 5 passages
    ])
    
    # Add conversation context if available
    context_section = ""
    if context:
        context_messages = context[-3:]  # Last 3 messages
        context_text_messages = "\n".join([
            f"- {msg.get('role', 'user')}: {msg.get('content', '')}"
            for msg in context_messages
        ])
        context_section = f"""
Ngữ cảnh cuộc trò chuyện trước đó:
{context_text_messages}

"""
    
    prompt = f"""Bạn là trợ lý AI thông minh của hệ thống quản lý máy chiếu QLMC.

Nhiệm vụ của bạn là trả lời câu hỏi của người dùng dựa trên các tài liệu tham khảo được cung cấp.

{context_section}Tài liệu tham khảo:
{context_text}

Câu hỏi của người dùng: {question}

Hướng dẫn trả lời:
1. Trả lời bằng tiếng Việt, tự nhiên và dễ hiểu
2. Chỉ sử dụng thông tin từ tài liệu tham khảo, KHÔNG bịa đặt thông tin
3. Nếu không có thông tin phù hợp trong tài liệu, hãy nói rõ: "Tôi không tìm thấy thông tin về vấn đề này trong tài liệu. Vui lòng liên hệ admin để được hỗ trợ."
4. Giữ câu trả lời ngắn gọn, súc tích (tối đa 200 từ)
5. Nếu có nhiều thông tin, hãy tổ chức thành các điểm chính
6. Sử dụng ngôn ngữ thân thiện, chuyên nghiệp

Trả lời:"""
    
    return prompt


def generate_with_gemini(question: str, passages: List[str], context: Optional[List[Dict]] = None) -> Dict[str, Any]:
    """Generate answer using Google Gemini"""
    
    if not gemini_model:
        # Fallback to top passage if Gemini not available
        return {
            "answer": passages[0] if passages else "Không tìm thấy thông tin phù hợp.",
            "confidence": 0.6,
            "method": "fallback"
        }
    
    try:
        # Build prompt
        prompt = build_rag_prompt(question, passages, context)
        
        # Generate with Gemini
        response = gemini_model.generate_content(
            prompt,
            generation_config={
                "temperature": 0.7,
                "top_p": 0.95,
                "top_k": 40,
                "max_output_tokens": 500,
            }
        )
        
        answer = response.text.strip()
        
        # Calculate confidence
        confidence = calculate_confidence([
            SearchHit(docId="", text=p, score=0.8) for p in passages
        ])
        
        return {
            "answer": answer,
            "confidence": confidence,
            "method": "gemini"
        }
        
    except Exception as e:
        print(f"[RAG] Gemini generation failed: {e}")
        # Fallback to top passage
        return {
            "answer": passages[0] if passages else "Không tìm thấy thông tin phù hợp.",
            "confidence": 0.6,
            "method": "fallback",
            "error": str(e)
        }


def generate_with_context(
    question: str,
    hits: List[SearchHit],
    context: Optional[List[Dict]] = None
) -> Dict[str, Any]:
    """Generate answer with conversation context"""
    
    # Extract passages from hits
    passages = [h.text for h in hits]
    
    # Use Gemini if available, otherwise use top passage
    if gemini_model and len(passages) > 0:
        return generate_with_gemini(question, passages, context)
    else:
        # Simple fallback
        return {
            "answer": passages[0] if passages else "Không tìm thấy thông tin phù hợp.",
            "confidence": 0.6,
            "method": "simple"
        }


# Example usage in main.py:
"""
from app.rag_enhanced import generate_with_context

@app.post("/rag/answer", response_model=RagOut)
async def rag_answer(inp: RagIn, context: Optional[List[Dict]] = None):
    # Search for relevant passages
    hits = await search(SearchIn(query=inp.question, top_k=inp.top_k))
    
    if not hits.hits:
        return RagOut(
            answer="Hiện chưa có tài liệu phù hợp để trả lời câu hỏi này.",
            sources=[],
            passages=[],
            confidence=0.2,
        )
    
    # Generate answer with context
    result = generate_with_context(
        question=inp.question,
        hits=[SearchHit(docId=h.docId, text=h.text, score=h.score) for h in hits.hits],
        context=context
    )
    
    sources = [{"docId": h.docId, "title": h.docId} for h in hits.hits[:3]]
    
    return RagOut(
        answer=result["answer"],
        sources=sources,
        passages=[h.text for h in hits.hits],
        confidence=result["confidence"]
    )
"""


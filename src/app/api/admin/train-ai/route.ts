import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/utils/auth';

/**
 * Train AI Model - Admin Only
 * 
 * Calls Render backend to train new FAISS index
 * Render will save index to py-chatbot/prebuilt/
 * Admin must commit changes to GitHub after training
 * 
 * POST /api/admin/train-ai
 */
export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    
    // Admin only
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ 
        error: 'Forbidden - Admin only' 
      }, { status: 403 });
    }

    const renderUrl = process.env.PYTHON_BACKEND_URL || 'https://qlmc-python-backend.onrender.com';
    
    console.log('[Train AI] Calling Render backend to train model...');
    console.log('[Train AI] URL:', renderUrl);

    // Call Render backend to retrain
    const trainRes = await fetch(`${renderUrl}/index/retrain`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
    });

    if (!trainRes.ok) {
      const detail = await trainRes.text();
      console.error('[Train AI] Training failed:', detail);
      return NextResponse.json({ 
        error: 'Training failed', 
        detail 
      }, { status: 502 });
    }

    const result = await trainRes.json();
    
    console.log('[Train AI] Training completed:', result);

    return NextResponse.json({
      success: true,
      message: 'Training completed successfully. Please commit py-chatbot/prebuilt/ to GitHub.',
      result,
      nextSteps: [
        '1. Check py-chatbot/prebuilt/faiss.index and meta.json files',
        '2. Commit changes: git add py-chatbot/prebuilt/',
        '3. Push to GitHub: git push origin main',
        '4. Vercel will auto-deploy with new model',
      ],
    });

  } catch (e: any) {
    console.error('[Train AI] Error:', e);
    
    // Handle timeout or network error
    if (e.name === 'AbortError' || e.code === 'ECONNREFUSED') {
      return NextResponse.json({ 
        error: 'Render backend unavailable',
        detail: 'Backend may be sleeping (cold start takes 30-60s). Please try again in 1 minute.',
      }, { status: 503 });
    }

    return NextResponse.json({ 
      error: 'Training request failed',
      detail: process.env.NODE_ENV === 'development' ? String(e?.message || e) : undefined,
    }, { status: 500 });
  }
}

/**
 * Get training status
 * 
 * GET /api/admin/train-ai
 */
export async function GET() {
  try {
    const user = await getCurrentUser();
    
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ 
        error: 'Forbidden - Admin only' 
      }, { status: 403 });
    }

    const renderUrl = process.env.PYTHON_BACKEND_URL || 'https://qlmc-python-backend.onrender.com';

    // Check Render backend status
    const statusRes = await fetch(`${renderUrl}/index/stats`, {
      method: 'GET',
    });

    if (!statusRes.ok) {
      return NextResponse.json({
        status: 'offline',
        message: 'Render backend is offline or sleeping',
      });
    }

    const stats = await statusRes.json();

    return NextResponse.json({
      status: 'online',
      backend: renderUrl,
      stats,
    });

  } catch (e) {
    return NextResponse.json({
      status: 'offline',
      error: 'Cannot connect to Render backend',
    });
  }
}

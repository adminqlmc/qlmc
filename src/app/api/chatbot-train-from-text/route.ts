import { NextRequest, NextResponse } from 'next/server';
import { requireAnyRole } from '@/utils/auth';
import { KnowledgeItem } from '@/types/knowledge';

// Set max duration to 5 minutes (Vercel limit)
export const maxDuration = 300;

export async function POST(req: NextRequest) {
  try {
    try {
      await requireAnyRole(['admin', 'technician']);
    } catch (e) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { jsonText } = await req.json();
    if (!jsonText || typeof jsonText !== 'string') {
      return NextResponse.json({ error: 'Invalid jsonText' }, { status: 400 });
    }
    let items: KnowledgeItem[];
    try {
      items = JSON.parse(jsonText);
    } catch (e) {
      return NextResponse.json({ error: 'Invalid JSON format' }, { status: 400 });
    }

    const baseUrl = process.env.NEXT_PUBLIC_PYTHON_BACKEND_URL || process.env.PY_CHATBOT_URL || 'http://127.0.0.1:8001';

    console.log(`[train] Sending ${items.length} docs to Python backend for batch training...`);
    
    // Call Python backend's /train-batch endpoint
    const trainRes = await fetch(`${baseUrl}/train-batch`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ items }),
    });

    if (!trainRes.ok) {
      const errText = await trainRes.text();
      console.error('[train] Backend training failed:', errText);
      return NextResponse.json({ 
        error: 'Training failed', 
        detail: errText 
      }, { status: 500 });
    }

    const trainResult = await trainRes.json();
    console.log('[train] Backend training result:', trainResult);

    // If training succeeded, trigger auto-sync to Git
    if (trainResult.success) {
      console.log('[train] Triggering auto-sync to Git...');
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
      
      // Fire-and-forget auto-sync
      fetch(`${appUrl}/api/auto-sync-index`, {
        method: 'POST',
      }).catch(err => {
        console.error('[train] Auto-sync trigger failed (non-blocking):', err);
      });
      
      console.log('[train] Auto-sync triggered in background');
    }

    return NextResponse.json({ 
      ok: trainResult.success,
      docs: trainResult.docs_processed,
      totalChunks: trainResult.chunks_added,
      totalIndex: trainResult.total_index,
      version: trainResult.version,
      message: trainResult.message,
      note: 'Index will be auto-synced to Git in background.'
    });
    
  } catch (error: any) {
    console.error('[train] Error:', error);
    return NextResponse.json({ error: 'Training failed', detail: error.message }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { requireAnyRole } from '@/utils/auth';
import { KnowledgeItem } from '@/types/knowledge';

// Set max duration to 5 minutes (Vercel limit)
export const maxDuration = 300;

// Background training function
async function trainInBackground(items: KnowledgeItem[], baseUrl: string) {
  try {
    let totalChunks = 0;
    
    for (const item of items) {
      const chunks = chunkText(item.content, 400);
      totalChunks += chunks.length;
      
      const rolesAllowed = item.role || ['teacher', 'technician', 'admin'];
      
      // Manual timeout with Promise.race (compatible with all Node.js versions)
      const fetchPromise = fetch(`${baseUrl}/embed`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ 
          docId: item.docId, 
          chunks, 
          rolesAllowed,
          title: item.title,
          intent: item.intent,
          keywords: item.keywords
        }),
      });
      
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error(`Timeout after 30s for ${item.docId}`)), 30000)
      );
      
      const res = await Promise.race([fetchPromise, timeoutPromise]) as Response;
      
      if (!res.ok) {
        const errText = await res.text();
        console.error(`[train-bg] Embed failed for ${item.docId}:`, errText);
        throw new Error(`Embed failed: ${errText}`);
      }
    }
    
    // Save to local store
    await fetch(`${baseUrl}/index/save`, { method: 'POST' }).catch(() => undefined);
    
    // Save to MongoDB
    const mongoSaveRes = await fetch(`${baseUrl}/index/save-to-mongodb`, { method: 'POST' });
    const mongoResult = await mongoSaveRes.json();
    console.log('[train-bg] MongoDB save result:', mongoResult);
    
    // Trigger auto-sync to Git
    if (mongoResult?.success) {
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
      await fetch(`${appUrl}/api/auto-sync-index`, {
        method: 'POST',
      }).catch(err => {
        console.error('[train-bg] Auto-sync failed:', err);
      });
      console.log('[train-bg] Auto-sync completed');
    }
    
    console.log('[train-bg] Training completed successfully');
    return { success: true, totalChunks };
    
  } catch (error: any) {
    console.error('[train-bg] Training failed:', error);
    return { success: false, error: error.message };
  }
}

function chunkText(text: string, maxLen = 300): string[] {
  const parts = text
    .replace(/\r\n/g, ' ')
    .split(/(?<=[\.!?。！？])\s+/)
    .map((s) => s.trim())
    .filter(Boolean);
  const chunks: string[] = [];
  let buf: string[] = [];
  let bufLen = 0;
  for (const s of parts) {
    if (bufLen + s.length + 1 > maxLen && bufLen > 0) {
      chunks.push(buf.join(' '));
      buf = [];
      bufLen = 0;
    }
    buf.push(s);
    bufLen += s.length + 1;
  }
  if (bufLen > 0) chunks.push(buf.join(' '));
  return chunks.length ? chunks : [text];
}

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

    // Calculate estimated chunks
    let estimatedChunks = 0;
    for (const item of items) {
      const chunks = chunkText(item.content, 400);
      estimatedChunks += chunks.length;
    }
    
    // Start training in background (don't await)
    trainInBackground(items, baseUrl).catch(err => {
      console.error('[train] Background training error:', err);
    });

    // Return immediately
    return NextResponse.json({ 
      ok: true, 
      message: 'Training started in background. This will take 5-10 minutes.',
      docs: items.length, 
      estimatedChunks,
      status: 'processing',
      note: 'Index will be automatically synced to Git when training completes.'
    });
    
  } catch (error: any) {
    console.error('[train] Error:', error);
    return NextResponse.json({ error: 'Training failed', detail: error.message }, { status: 500 });
  }
}

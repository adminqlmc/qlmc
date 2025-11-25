import { NextResponse } from 'next/server';
import { withRenderServer } from '@/lib/render-utils';

export const dynamic = 'force-dynamic';

/**
 * Load index from Render server and save to local/MongoDB
 * This is used by admin/technician to refresh the local index
 */
export async function POST() {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_PYTHON_BACKEND_URL || 
                   process.env.PY_CHATBOT_URL || 
                   'http://127.0.0.1:8001';
    
    // Wake up Render server and load index
    const result = await withRenderServer(
      baseUrl,
      async () => {
        const res = await fetch(`${baseUrl}/index/load`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          signal: AbortSignal.timeout(60000), // 60s timeout for wake-up + load
        });

        if (!res.ok) {
          const errorText = await res.text();
          throw new Error(`Failed to load index: ${res.status} - ${errorText}`);
        }

        return await res.json();
      },
      {
        wakeUpFirst: true,
        maxWakeUpRetries: 5,
        wakeUpDelay: 10000, // 10s between retries
      }
    );

    // After loading, save to MongoDB for persistence
    console.log('[Load] Saving loaded index to MongoDB...');
    try {
      const saveResponse = await fetch(`${baseUrl}/index/save-to-mongodb`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: AbortSignal.timeout(30000),
      });
      
      if (saveResponse.ok) {
        const saveData = await saveResponse.json();
        console.log('[Load] Index saved to MongoDB:', saveData);
      } else {
        console.warn('[Load] Failed to save to MongoDB:', await saveResponse.text());
      }
    } catch (e) {
      console.error('[Load] Error saving to MongoDB:', e);
    }

    return NextResponse.json({
      ...result,
      message: 'Index loaded from Render and saved to MongoDB. Will be available in prebuilt/ on next deployment.',
    });

  } catch (error: any) {
    console.error('Error loading index from Render:', error);
    return NextResponse.json(
      { 
        error: 'Failed to load index from Render server',
        detail: error.message,
        hint: 'Render server may be sleeping. Please try again in a few moments.',
      },
      { status: 503 }
    );
  }
}

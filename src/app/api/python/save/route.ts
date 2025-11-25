import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST() {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_PYTHON_BACKEND_URL || process.env.PY_CHATBOT_URL || 'http://127.0.0.1:8001';
    
    const res = await fetch(`${baseUrl}/index/save`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });

    if (!res.ok) {
      const errorText = await res.text();
      return NextResponse.json(
        { error: 'Failed to save index', detail: errorText },
        { status: res.status }
      );
    }

    const data = await res.json();
    return NextResponse.json(data);

  } catch (error: any) {
    console.error('Error saving Python backend index:', error);
    return NextResponse.json(
      { error: 'Python backend unavailable', detail: error.message },
      { status: 503 }
    );
  }
}

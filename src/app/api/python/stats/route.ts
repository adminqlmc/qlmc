import { NextResponse } from 'next/server';
import { loadFAISSMetadata } from '@/lib/faiss-search';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

/**
 * Get stats from local metadata (not from Render server)
 * This avoids cold start delays for user-facing features
 */
export async function GET() {
  try {
    // Load metadata from local/git/vercel (prebuilt directory)
    const metadata = loadFAISSMetadata();
    
    if (!metadata) {
      // Try to load from MongoDB as fallback
      try {
        const { prisma } = await import('@/lib/prisma');
        const activeIndex = await prisma.fAISSIndex.findFirst({
          where: { isActive: true },
          orderBy: { createdAt: 'desc' },
        });

        if (activeIndex) {
          const meta = JSON.parse(activeIndex.metadata);
          return NextResponse.json({
            index_size: activeIndex.indexSize || meta.texts?.length || 0,
            emb_dim: activeIndex.embDim || 384,
            files: {
              index_exists: true,
              meta_exists: true,
            },
            source: 'mongodb',
          });
        }
      } catch (e) {
        console.warn('[Stats] MongoDB fallback failed:', e);
      }

      return NextResponse.json(
        { 
          error: 'No index found',
          index_size: 0,
          emb_dim: 384,
          files: {
            index_exists: false,
            meta_exists: false,
          },
        },
        { status: 404 }
      );
    }

    // Calculate stats from metadata
    const indexSize = metadata.texts?.length || 0;
    const embDim = 384; // Default embedding dimension

    // Check if index file exists
    const indexPath = path.join(process.cwd(), 'py-chatbot', 'prebuilt', 'faiss.index');
    const indexExists = fs.existsSync(indexPath);

    return NextResponse.json({
      index_size: indexSize,
      emb_dim: embDim,
      files: {
        index_exists: indexExists,
        meta_exists: true,
      },
      source: 'local',
      paths: {
        index: indexPath,
        meta: path.join(process.cwd(), 'py-chatbot', 'prebuilt', 'meta.json'),
      },
    });

  } catch (error: any) {
    console.error('Error fetching stats from local:', error);
    return NextResponse.json(
      { 
        error: 'Failed to load stats',
        detail: error.message,
        index_size: 0,
        emb_dim: 384,
        files: {
          index_exists: false,
          meta_exists: false,
        },
      },
      { status: 500 }
    );
  }
}

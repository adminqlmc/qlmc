import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const dynamic = 'force-dynamic';

// Load FAISS index from MongoDB
export async function GET() {
  try {
    // Get active version
    const activeIndex = await prisma.fAISSIndex.findFirst({
      where: { isActive: true },
      orderBy: { createdAt: 'desc' },
    });

    if (!activeIndex) {
      return NextResponse.json(
        { error: 'No active index found in database' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      version: activeIndex.version,
      indexSize: activeIndex.indexSize,
      embDim: activeIndex.embDim,
      createdAt: activeIndex.createdAt,
      updatedAt: activeIndex.updatedAt,
      // Return index data for Python backend to load
      indexData: activeIndex.indexData,
      metadata: JSON.parse(activeIndex.metadata),
    });

  } catch (error: any) {
    console.error('Error loading index from MongoDB:', error);
    return NextResponse.json(
      { error: 'Failed to load index', detail: error.message },
      { status: 500 }
    );
  }
}

// Save FAISS index to MongoDB
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { version, indexData, metadata, indexSize, embDim } = body;

    if (!version || !indexData || !metadata) {
      return NextResponse.json(
        { error: 'Missing required fields: version, indexData, metadata' },
        { status: 400 }
      );
    }

    // Deactivate old versions
    await prisma.fAISSIndex.updateMany({
      where: { isActive: true },
      data: { isActive: false },
    });

    // Create new active version
    const newIndex = await prisma.fAISSIndex.create({
      data: {
        version,
        indexData,
        metadata: JSON.stringify(metadata),
        indexSize,
        embDim,
        isActive: true,
      },
    });

    return NextResponse.json({
      success: true,
      version: newIndex.version,
      indexSize: newIndex.indexSize,
      id: newIndex.id,
    });

  } catch (error: any) {
    console.error('Error saving index to MongoDB:', error);
    return NextResponse.json(
      { error: 'Failed to save index', detail: error.message },
      { status: 500 }
    );
  }
}

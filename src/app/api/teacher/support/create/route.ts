import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getJwtPayload } from '@/lib/jwt';

export async function POST(req: NextRequest) {
  try {
    // Verify authentication
    const token = req.cookies.get('token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await getJwtPayload(token);
    if (!user || user.role !== 'teacher') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get request body
    const { title, description, priority, category, projectorId } = await req.json();

    // Validate required fields
    if (!title || !description || !priority || !category || !projectorId) {
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      );
    }

    // Validate priority
    const validPriorities = ['low', 'medium', 'high', 'urgent'];
    if (priority && !validPriorities.includes(priority)) {
      return NextResponse.json(
        { error: 'Invalid priority value' },
        { status: 400 }
      );
    }

    // Validate category
    const validCategories = ['repair', 'maintenance'];
    if (!validCategories.includes(category)) {
      return NextResponse.json(
        { error: 'Invalid category value' },
        { status: 400 }
      );
    }

    // Check if projector exists
    const projector = await prisma.projector.findUnique({
      where: { id: projectorId },
    });

    if (!projector) {
      return NextResponse.json(
        { error: 'Projector not found' },
        { status: 404 }
      );
    }

    // Create support request
    const supportRequest = await prisma.supportRequest.create({
      data: {
        userId: user.userId,
        title,
        description,
        priority,
        category,
        projectorId,
      },
      include: {
        projector: true,
        user: {
          select: {
            id: true,
            userID: true,
            fullName: true,
            email: true,
            avatar: true,
          },
        },
      },
    });

    return NextResponse.json(
      { message: 'Support request created successfully', supportRequest },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating support request:', error);
    return NextResponse.json(
      { error: 'Failed to create support request' },
      { status: 500 }
    );
  }
}

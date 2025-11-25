import { NextRequest, NextResponse } from 'next/server';
import { generateUserID } from '@/utils/generateUserID';

/**
 * Test endpoint to generate a sample userID
 * GET /api/user/generate-id
 */
export async function GET(req: NextRequest) {
  try {
    const userID = await generateUserID();
    return NextResponse.json({ 
      userID,
      format: 'QNUxxxxxxx',
      description: 'QNU prefix + 7 random digits'
    });
  } catch (error) {
    console.error('Error generating userID:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

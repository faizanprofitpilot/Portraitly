import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// Simple in-memory storage for mobile uploads
// In production, you'd want to use Redis or a database
const uploadStatus = new Map<string, any[]>();

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { sessionId, filename, originalName, timestamp } = body;

    if (!sessionId || !filename) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Store upload info
    if (!uploadStatus.has(sessionId)) {
      uploadStatus.set(sessionId, []);
    }

    uploadStatus.get(sessionId)!.push({
      filename,
      originalName,
      timestamp: timestamp || Date.now()
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error storing mobile upload:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');

    if (!sessionId) {
      return NextResponse.json({ error: 'Session ID required' }, { status: 400 });
    }

    const uploads = uploadStatus.get(sessionId) || [];
    
    // Clear the uploads after retrieving (one-time use)
    uploadStatus.delete(sessionId);

    return NextResponse.json({ uploads });
  } catch (error) {
    console.error('Error retrieving mobile uploads:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
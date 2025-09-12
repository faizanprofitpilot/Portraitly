import { NextRequest, NextResponse } from 'next/server';

// Simple in-memory storage for mobile uploads
// In production, you'd want to use Redis or a database
const uploadStatus = new Map<string, any[]>();

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('📱 Received mobile upload status request:', body);
    
    const { sessionId, filename, originalName, timestamp } = body;

    if (!sessionId || !filename) {
      console.error('📱 Missing required fields:', { sessionId, filename });
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Store upload info
    if (!uploadStatus.has(sessionId)) {
      uploadStatus.set(sessionId, []);
    }

    const uploadData = {
      filename,
      originalName,
      timestamp: timestamp || Date.now()
    };
    
    uploadStatus.get(sessionId)!.push(uploadData);

    console.log('📱 Mobile upload stored:', { sessionId, filename, originalName });
    console.log('📱 Current uploads for session:', uploadStatus.get(sessionId));

    return NextResponse.json({ success: true, stored: uploadData });
  } catch (error) {
    console.error('Error storing mobile upload:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');

    console.log('📱 GET request for session:', sessionId);

    if (!sessionId) {
      console.error('📱 No session ID provided');
      return NextResponse.json({ error: 'Session ID required' }, { status: 400 });
    }

    const uploads = uploadStatus.get(sessionId) || [];
    console.log('📱 Retrieved uploads for session:', sessionId, uploads);
    
    // Clear the uploads after retrieving (one-time use)
    if (uploads.length > 0) {
      uploadStatus.delete(sessionId);
      console.log('📱 Cleared uploads for session:', sessionId);
    }

    return NextResponse.json({ uploads });
  } catch (error) {
    console.error('Error retrieving mobile uploads:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

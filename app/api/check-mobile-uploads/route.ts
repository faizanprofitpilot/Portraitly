import { NextRequest, NextResponse } from 'next/server';
import { readdir } from 'fs/promises';
import { join } from 'path';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');

    if (!sessionId) {
      return NextResponse.json({ error: 'Session ID required' }, { status: 400 });
    }

    // Read the uploads directory
    const uploadsDir = join(process.cwd(), 'public', 'uploads');
    
    try {
      const files = await readdir(uploadsDir);
      
      // Filter files that match our session ID
      const sessionFiles = files.filter(file => 
        file.startsWith(`mobile_${sessionId}_`)
      );

      return NextResponse.json({ files: sessionFiles });
    } catch (dirError) {
      // Directory doesn't exist, return empty array
      return NextResponse.json({ files: [] });
    }
  } catch (error) {
    console.error('Error checking mobile uploads:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

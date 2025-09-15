import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { sessionId, filename, originalName, fileSize, fileType } = body;

    if (!sessionId || !filename) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Store upload info in database
    const { error } = await supabase
      .from('mobile_uploads')
      .insert({
        session_id: sessionId,
        filename,
        original_name: originalName || filename,
        file_size: fileSize || 0,
        file_type: fileType || 'image/jpeg'
      });

    if (error) {
      console.error('Database error storing mobile upload:', error);
      return NextResponse.json({ error: 'Failed to store upload' }, { status: 500 });
    }

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

    // Get uploads from database
    const { data: uploads, error } = await supabase
      .from('mobile_uploads')
      .select('filename, original_name, file_size, file_type, created_at')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Database error retrieving mobile uploads:', error);
      return NextResponse.json({ error: 'Failed to retrieve uploads' }, { status: 500 });
    }

    // Delete the uploads after retrieving (one-time use)
    await supabase
      .from('mobile_uploads')
      .delete()
      .eq('session_id', sessionId);

    return NextResponse.json({ uploads: uploads || [] });
  } catch (error) {
    console.error('Error retrieving mobile uploads:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
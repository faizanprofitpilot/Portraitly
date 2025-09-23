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
    console.log('💾 Storing mobile upload:', { sessionId, filename, originalName, fileSize, fileType });
    
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
      console.error('❌ Database error storing mobile upload:', error);
      console.error('❌ Error details:', JSON.stringify(error, null, 2));
      return NextResponse.json({ 
        error: 'Failed to store upload', 
        details: error.message 
      }, { status: 500 });
    }

    console.log('✅ Mobile upload stored successfully');

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
    console.log('🔍 Querying mobile_uploads table for sessionId:', sessionId);
    
    const { data: uploads, error } = await supabase
      .from('mobile_uploads')
      .select('*')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('❌ Database error retrieving mobile uploads:', error);
      console.error('❌ Error details:', JSON.stringify(error, null, 2));
      return NextResponse.json({ 
        error: 'Failed to retrieve uploads', 
        details: error.message 
      }, { status: 500 });
    }

    console.log('✅ Found uploads:', uploads);

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
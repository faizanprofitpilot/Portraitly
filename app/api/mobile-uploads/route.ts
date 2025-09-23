import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

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
      .select('*')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Database query error:', error);
      return NextResponse.json({ error: 'Failed to retrieve uploads' }, { status: 500 });
    }

    // Delete the uploads after retrieving (one-time use)
    if (uploads && uploads.length > 0) {
      const uploadIds = uploads.map(upload => upload.id);
      await supabase
        .from('mobile_uploads')
        .delete()
        .in('id', uploadIds);
    }

    return NextResponse.json({ uploads: uploads || [] });
  } catch (error) {
    console.error('Error retrieving mobile uploads:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

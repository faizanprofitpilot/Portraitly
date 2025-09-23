import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
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

    // Generate signed URLs for each upload
    const uploadsWithUrls = await Promise.all(
      (uploads || []).map(async (upload) => {
        const { data: signedUrlData, error: urlError } = await supabase.storage
          .from('mobile-uploads')
          .createSignedUrl(upload.filename, 3600); // 1 hour expiry

        if (urlError) {
          console.error('Error creating signed URL:', urlError);
          return { ...upload, file_url: null };
        }

        return {
          ...upload,
          file_url: signedUrlData.signedUrl
        };
      })
    );

    // Delete the uploads after retrieving (one-time use)
    if (uploads && uploads.length > 0) {
      const uploadIds = uploads.map(upload => upload.id);
      await supabase
        .from('mobile_uploads')
        .delete()
        .in('id', uploadIds);
    }

    return NextResponse.json({ uploads: uploadsWithUrls });
  } catch (error) {
    console.error('Error retrieving mobile uploads:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

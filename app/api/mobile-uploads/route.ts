import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');

    if (!sessionId) {
      return NextResponse.json({ error: 'Session ID required' }, { status: 400 });
    }

    // Initialize Supabase client
    const cookieStore = cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) { return cookieStore.get(name)?.value; },
          set(name: string, value: string, options: any) { cookieStore.set({ name, value, ...options }); },
          remove(name: string, options: any) { cookieStore.set({ name, value: '', ...options }); },
        },
      }
    );

    // Get all uploads for this session
    const { data: uploads, error } = await supabase
      .from('mobile_uploads')
      .select('id, file_url, original_name, file_size, file_type, created_at')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Database query error:', error);
      return NextResponse.json({ error: 'Failed to fetch uploads' }, { status: 500 });
    }

    // Generate signed URLs for secure access
    const uploadsWithUrls = await Promise.all(
      (uploads || []).map(async (upload) => {
        const { data: signedUrl } = await supabase.storage
          .from('mobile-uploads')
          .createSignedUrl(upload.file_url, 3600); // 1 hour expiry

        return {
          ...upload,
          file_url: signedUrl?.signedUrl || upload.file_url
        };
      })
    );

    return NextResponse.json({
      success: true,
      uploads: uploadsWithUrls
    });

  } catch (error) {
    console.error('Mobile uploads fetch error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');

    if (!sessionId) {
      return NextResponse.json({ error: 'Session ID required' }, { status: 400 });
    }

    // Initialize Supabase client
    const cookieStore = cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) { return cookieStore.get(name)?.value; },
          set(name: string, value: string, options: any) { cookieStore.set({ name, value, ...options }); },
          remove(name: string, options: any) { cookieStore.set({ name, value: '', ...options }); },
        },
      }
    );

    // Get uploads to delete (for cleanup)
    const { data: uploads, error: fetchError } = await supabase
      .from('mobile_uploads')
      .select('id, file_url')
      .eq('session_id', sessionId);

    if (fetchError) {
      console.error('Database fetch error:', fetchError);
      return NextResponse.json({ error: 'Failed to fetch uploads for cleanup' }, { status: 500 });
    }

    // Delete from database
    const { error: deleteError } = await supabase
      .from('mobile_uploads')
      .delete()
      .eq('session_id', sessionId);

    if (deleteError) {
      console.error('Database delete error:', deleteError);
      return NextResponse.json({ error: 'Failed to delete uploads' }, { status: 500 });
    }

    // Clean up storage files
    if (uploads && uploads.length > 0) {
      const filenames = uploads.map(upload => {
        const urlParts = upload.file_url.split('/');
        return urlParts[urlParts.length - 1];
      });

      await supabase.storage.from('mobile-uploads').remove(filenames);
    }

    return NextResponse.json({
      success: true,
      message: `Cleaned up ${uploads?.length || 0} uploads for session ${sessionId}`
    });

  } catch (error) {
    console.error('Mobile uploads cleanup error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

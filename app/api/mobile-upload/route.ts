import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file: File | null = formData.get('file') as File;
    const sessionId = formData.get('sessionId') as string;

    // Validation
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    if (!sessionId) {
      return NextResponse.json({ error: 'No session ID provided' }, { status: 400 });
    }

    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ error: 'File must be an image' }, { status: 400 });
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

    // Generate unique filename
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 8);
    const fileExtension = file.name.split('.').pop() || 'jpg';
    const filename = `mobile_${sessionId}_${timestamp}_${randomString}.${fileExtension}`;

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('mobile-uploads')
      .upload(filename, file, {
        contentType: file.type,
        upsert: false
      });

    if (uploadError) {
      console.error('Storage upload error:', uploadError);
      return NextResponse.json({ error: 'Failed to upload file' }, { status: 500 });
    }

    // Store metadata in database with filename (not URL)
    const { data: dbData, error: dbError } = await supabase
      .from('mobile_uploads')
      .insert({
        session_id: sessionId,
        file_url: filename, // Store filename, not public URL
        original_name: file.name,
        file_size: file.size,
        file_type: file.type
      })
      .select()
      .single();

    if (dbError) {
      console.error('Database insert error:', dbError);
      // Clean up uploaded file if database insert fails
      await supabase.storage.from('mobile-uploads').remove([filename]);
      return NextResponse.json({ error: 'Failed to store file metadata' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      id: dbData.id,
      filename: filename,
      originalName: file.name,
      size: file.size,
      type: file.type,
      sessionId: sessionId
    });

  } catch (error) {
    console.error('Mobile upload error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

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

    // Generate unique filename
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 8);
    const fileExtension = file.name.split('.').pop() || 'jpg';
    const filename = `${sessionId}_${timestamp}_${randomString}.${fileExtension}`;

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('mobile-uploads')
      .upload(filename, buffer, {
        contentType: file.type,
        upsert: false
      });

    if (uploadError) {
      console.error('Supabase upload error:', uploadError);
      return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('mobile-uploads')
      .getPublicUrl(filename);

    // Store metadata in database
    const { error: dbError } = await supabase
      .from('mobile_uploads')
      .insert({
        session_id: sessionId,
        file_url: urlData.publicUrl,
        filename: filename,
        original_name: file.name,
        file_size: file.size,
        file_type: file.type
      });

    if (dbError) {
      console.error('Database insert error:', dbError);
      // Try to clean up the uploaded file
      await supabase.storage.from('mobile-uploads').remove([filename]);
      return NextResponse.json({ error: 'Failed to store metadata' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      filename: filename,
      fileUrl: urlData.publicUrl,
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
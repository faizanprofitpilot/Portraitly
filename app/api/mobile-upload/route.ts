import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    console.log('📱 Mobile upload API called');
    const formData = await request.formData();
    const file: File | null = formData.get('file') as File;
    const sessionId = formData.get('sessionId') as string;
    
    console.log('📱 File received:', {
      name: file?.name,
      size: file?.size,
      type: file?.type,
      sessionId
    });

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

    // Create uploads directory if it doesn't exist
    const uploadsDir = join(process.cwd(), 'public', 'uploads');
    if (!existsSync(uploadsDir)) {
      await mkdir(uploadsDir, { recursive: true });
    }

    // Generate unique filename
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 8);
    const fileExtension = file.name.split('.').pop() || 'jpg';
    const filename = `mobile_${sessionId}_${timestamp}_${randomString}.${fileExtension}`;

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Save file
    const filepath = join(uploadsDir, filename);
    await writeFile(filepath, buffer);
    
    console.log('✅ File saved successfully:', {
      filename,
      filepath,
      size: buffer.length
    });

    return NextResponse.json({
      success: true,
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
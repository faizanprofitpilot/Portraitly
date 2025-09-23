import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = 'force-dynamic';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // IMPORTANT: service role, not anon
);

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;
    const sessionId = formData.get("sessionId") as string;

    console.log('📱 Mobile upload request:', { 
      hasFile: !!file, 
      fileName: file?.name, 
      fileSize: file?.size,
      sessionId 
    });

    if (!file || !sessionId) {
      console.error('❌ Missing required fields:', { hasFile: !!file, hasSessionId: !!sessionId });
      return NextResponse.json(
        { error: "Missing file or sessionId" },
        { status: 400 }
      );
    }

    if (!file.type.startsWith('image/')) {
      console.error('❌ Invalid file type:', file.type);
      return NextResponse.json({ error: 'File must be an image' }, { status: 400 });
    }

    // Generate unique file name
    const fileExt = file.name.split(".").pop();
    const fileName = `${sessionId}_${Date.now()}.${fileExt}`;
    const filePath = `${sessionId}/${fileName}`;

    console.log('📤 Uploading to storage:', filePath);

    // Upload to Supabase Storage
    const { error: storageError } = await supabaseAdmin.storage
      .from("mobile-uploads")
      .upload(filePath, file, {
        cacheControl: "3600",
        upsert: false,
      });

    if (storageError) {
      console.error("❌ Storage upload failed:", storageError.message);
      return NextResponse.json(
        { error: storageError.message },
        { status: 500 }
      );
    }

    console.log('✅ Storage upload successful');

    // Get public URL
    const { data: publicUrl } = supabaseAdmin.storage
      .from("mobile-uploads")
      .getPublicUrl(filePath);

    console.log('📝 Inserting metadata into database');

    // Insert metadata into DB
    const { error: dbError } = await supabaseAdmin
      .from("mobile_uploads")
      .insert([{ 
        session_id: sessionId, 
        filename: fileName,
        original_name: file.name,
        file_size: file.size,
        file_type: file.type
      }]);

    if (dbError) {
      console.error("❌ DB insert failed:", dbError.message);
      return NextResponse.json({ error: dbError.message }, { status: 500 });
    }

    console.log('✅ Database insert successful');

    return NextResponse.json({
      success: true,
      filename: fileName,
      fileUrl: publicUrl.publicUrl,
      originalName: file.name,
      size: file.size,
      type: file.type,
      sessionId,
    });
  } catch (err: any) {
    console.error("❌ Unexpected error:", err.message);
    return NextResponse.json(
      { error: err.message || "Unexpected server error" },
      { status: 500 }
    );
  }
}
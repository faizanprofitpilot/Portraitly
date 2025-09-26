import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { validateFileUpload, sanitizeString } from "@/lib/api-security";

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

    // Validate required fields
    if (!file || !sessionId) {
      return NextResponse.json(
        { error: "Missing file or sessionId" },
        { status: 400 }
      );
    }

    // Sanitize session ID
    const sanitizedSessionId = sanitizeString(sessionId);
    if (!sanitizedSessionId || sanitizedSessionId.length < 10) {
      return NextResponse.json(
        { error: "Invalid session ID" },
        { status: 400 }
      );
    }

    // Validate file upload
    const fileValidation = validateFileUpload(file);
    if (!fileValidation.valid) {
      return NextResponse.json(
        { error: fileValidation.error },
        { status: 400 }
      );
    }

    // Generate unique file name with sanitized session ID
    const fileExt = file.name.split(".").pop()?.toLowerCase();
    const fileName = `${sanitizedSessionId}_${Date.now()}.${fileExt}`;
    const filePath = `${sanitizedSessionId}/${fileName}`;

    // Upload to Supabase Storage
    const { error: storageError } = await supabaseAdmin.storage
      .from("mobile-uploads")
      .upload(filePath, file, {
        cacheControl: "3600",
        upsert: false,
      });

    if (storageError) {
      return NextResponse.json(
        { error: "Upload failed. Please try again." },
        { status: 500 }
      );
    }

    // Get public URL
    const { data: publicUrl } = supabaseAdmin.storage
      .from("mobile-uploads")
      .getPublicUrl(filePath);

    // Insert metadata into DB with sanitized data
    const { error: dbError } = await supabaseAdmin
      .from("mobile_uploads")
      .insert([{ 
        session_id: sanitizedSessionId, 
        filename: fileName,
        original_name: sanitizeString(file.name),
        file_size: file.size,
        file_type: file.type
      }]);

    if (dbError) {
      return NextResponse.json(
        { error: "Database error. Please try again." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      filename: fileName,
      fileUrl: publicUrl.publicUrl,
      originalName: sanitizeString(file.name),
      size: file.size,
      type: file.type,
      sessionId: sanitizedSessionId,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: "Upload failed. Please try again." },
      { status: 500 }
    );
  }
}
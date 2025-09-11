import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getServerSupabase } from "@/lib/supabase/auth";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // service key needed for server-side upload
);

export async function POST(req: Request) {
  try {
    const { imageBase64, style, isDemo } = await req.json();

    if (!imageBase64) {
      return NextResponse.json(
        { error: "No input image provided" },
        { status: 400 }
      );
    }

    // Handle authentication and credit enforcement
    let userId: string | null = null;
    let isProUser = false;

    if (!isDemo) {
      const serverSupabase = getServerSupabase();
      const { data: { user } } = await serverSupabase.auth.getUser();

      if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }

      // Get user data
      const { data: userData } = await serverSupabase
        .from("users")
        .select("*")
        .eq("auth_user_id", user.id)
        .single();

      if (!userData) {
        return NextResponse.json({ error: "User not found" }, { status: 404 });
      }

      userId = userData.id;
      isProUser = userData.plan === "pro";

      // Enforce credits for free users
      if (!isProUser) {
        try {
          const { data: creditResult } = await serverSupabase
            .rpc("consume_credit", { p_auth_user_id: user.id });

          if (!creditResult || creditResult.length === 0) {
            return NextResponse.json(
              { error: "NO_CREDITS", requiresUpgrade: true },
              { status: 402 }
            );
          }
        } catch (error: any) {
          if (error.message === "No credits remaining") {
            return NextResponse.json(
              { error: "NO_CREDITS", requiresUpgrade: true },
              { status: 402 }
            );
          }
          throw error;
        }
      }
    }

    // Build prompt dynamically
    const prompt = `Transform this casual selfie into a professional headshot while preserving the person's exact facial identity. 

CRITICAL REQUIREMENTS:
- Keep the exact same face shape, bone structure, and facial features
- Preserve the person's unique facial characteristics (eyes, nose, mouth, jawline)
- Maintain the same skin tone, hair color, and natural appearance
- Only change clothing, background, and lighting to professional standards
- Do not alter facial structure, age, or physical appearance

Apply ${style} styling with:
- Professional attire appropriate for the industry
- Clean, neutral background
- Professional lighting that enhances the subject
- Natural, confident expression
- High-quality headshot composition

Ensure the result looks like the same person in professional attire, not a different person.`;

    // Build Gemini request
    const payload = {
      contents: [
        {
          role: "user",
          parts: [
            { text: prompt },
            {
              inline_data: {
                mimeType: "image/png",
                data: imageBase64, // already base64 encoded from client
              },
            },
          ],
        },
      ],
    };

    const resp = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image-preview:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }
    );

    if (!resp.ok) {
      const err = await resp.text();
      console.error("Gemini API error:", err);
      return NextResponse.json(
        { error: "Gemini API error", details: err },
        { status: 500 }
      );
    }

    const data = await resp.json();
    console.log("🔍 Full Gemini response:", JSON.stringify(data, null, 2));

    // ✅ Parse inlineData (the image output)
    const inlineData =
      data?.candidates?.[0]?.content?.parts?.find(
        (p: any) => p.inlineData
      )?.inlineData;

    if (!inlineData?.data) {
      console.error("No image in Gemini response:", JSON.stringify(data));
      console.error("Available parts:", data?.candidates?.[0]?.content?.parts);
      return NextResponse.json(
        { error: "No image returned by Gemini" },
        { status: 500 }
      );
    }

    // Return the base64 image data directly
    const dataUrl = `data:${inlineData.mimeType || "image/png"};base64,${inlineData.data}`;
    
    // For authenticated users, save the photo record
    if (userId && !isDemo) {
      await supabase.from("photos").insert({
        user_id: userId,
        original_url: "demo-original", // We don't store original in this flow
        generated_url: dataUrl
      });
    }
    
    return NextResponse.json({ 
      url: dataUrl,
      isDemo: !!isDemo,
      isProUser: isProUser
    });
  } catch (err: any) {
    console.error("Server error:", err);
    return NextResponse.json(
      { error: "Internal server error", details: err.message },
      { status: 500 }
    );
  }
}
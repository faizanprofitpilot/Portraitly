import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getServerSupabase } from "@/lib/supabase/auth";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // service key needed for server-side upload
);

export async function POST(req: Request) {
  try {
    console.log("🔍 Generate headshot API called - DEPLOYMENT TEST");
    
    const { imageBase64, style, isDemo } = await req.json();
    console.log("📝 Received data:", { style, isDemo, hasImage: !!imageBase64 });

    if (!imageBase64) {
      console.log("❌ No image provided");
      return NextResponse.json(
        { error: "No input image provided" },
        { status: 400 }
      );
    }

    // Handle authentication and credit enforcement
    let userId: string | null = null;
    let isProUser = false;

    if (!isDemo) {
      console.log("🔐 Checking authentication...");
      const serverSupabase = getServerSupabase();
      const { data: { user }, error: authError } = await serverSupabase.auth.getUser();

      if (authError) {
        console.error("❌ Auth error:", authError);
        return NextResponse.json({ error: "Authentication error" }, { status: 401 });
      }

      if (!user) {
        console.log("❌ No authenticated user");
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }

      console.log("✅ User authenticated:", user.id);

      // Get user data
      const { data: userData, error: userError } = await serverSupabase
        .from("users")
        .select("*")
        .eq("auth_user_id", user.id)
        .single();

      if (userError || !userData) {
        console.error("❌ User not found in database:", userError);
        return NextResponse.json({ error: "User not found" }, { status: 404 });
      }

      userId = userData.id;
      isProUser = userData.plan === "pro";
      console.log("📊 User data:", { userId, isProUser, credits: userData.credits_remaining });

      // Enforce credits for free users
      if (!isProUser) {
        console.log("💳 Checking credits for free user...");
        try {
          const { data: creditResult, error: creditError } = await serverSupabase
            .rpc("consume_credit", { p_auth_user_id: user.id });

          if (creditError) {
            console.error("❌ Credit consumption error:", creditError);
            return NextResponse.json(
              { error: "NO_CREDITS", requiresUpgrade: true },
              { status: 402 }
            );
          }

          if (!creditResult || creditResult.length === 0) {
            console.log("❌ No credits remaining");
            return NextResponse.json(
              { error: "NO_CREDITS", requiresUpgrade: true },
              { status: 402 }
            );
          }

          console.log("✅ Credit consumed successfully");
        } catch (error: any) {
          console.error("❌ Credit error:", error);
          if (error.message === "No credits remaining") {
            return NextResponse.json(
              { error: "NO_CREDITS", requiresUpgrade: true },
              { status: 402 }
            );
          }
          throw error;
        }
      } else {
        console.log("👑 Pro user - unlimited credits");
      }
    } else {
      console.log("🎮 Demo mode - no credits required");
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

    console.log("🤖 Calling Gemini API...");

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
      console.error("❌ Gemini API error:", err);
      return NextResponse.json(
        { error: "Gemini API error", details: err },
        { status: 500 }
      );
    }

    const data = await resp.json();
    console.log("🔍 Gemini API response received");

    // Parse inlineData (the image output)
    const inlineData =
      data?.candidates?.[0]?.content?.parts?.find(
        (p: any) => p.inlineData
      )?.inlineData;

    if (!inlineData?.data) {
      console.error("❌ No image in Gemini response");
      console.error("Available parts:", data?.candidates?.[0]?.content?.parts);
      return NextResponse.json(
        { error: "No image returned by Gemini" },
        { status: 500 }
      );
    }

    // Return the base64 image data directly
    const dataUrl = `data:${inlineData.mimeType || "image/png"};base64,${inlineData.data}`;
    console.log("✅ Image generated successfully");
    
    // For authenticated users, save the photo record
    if (userId && !isDemo) {
      console.log("💾 Saving photo record...");
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
    console.error("❌ Server error:", err);
    return NextResponse.json(
      { error: "Internal server error", details: err.message },
      { status: 500 }
    );
  }
}
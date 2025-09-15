import { NextResponse } from "next/server"
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export const dynamic = 'force-dynamic'

export async function POST(req: Request) {
  try {
    const { imageBase64, style } = await req.json()

    if (!imageBase64) {
      return NextResponse.json(
        { error: "No input image provided" },
        { status: 400 }
      )
    }

    // Get authenticated user
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get: (name: string) => cookies().get(name)?.value,
          set: (name: string, value: string, options: any) => {
            cookies().set({ name, value, ...options })
          },
          remove: (name: string, options: any) => {
            cookies().set({ name, value: '', ...options })
          }
        }
      }
    )

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    // Check and consume credits
    const { data: creditResult, error: creditError } = await supabase
      .rpc('consume_credit', { user_email_param: user.email })

    if (creditError) {
      if (creditError.message.includes('No credits remaining')) {
        return NextResponse.json(
          { error: 'No credits remaining', requiresUpgrade: true },
          { status: 402 }
        )
      }
      return NextResponse.json(
        { error: 'Credit check failed', details: creditError.message },
        { status: 500 }
      )
    }

    // Build AI prompt (keeping your existing logic)
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

Ensure the result looks like the same person in professional attire, not a different person.`

    // Call Gemini API
    const payload = {
      contents: [
        {
          role: "user",
          parts: [
            { text: prompt },
            {
              inline_data: {
                mimeType: "image/png",
                data: imageBase64,
              },
            },
          ],
        },
      ],
    }

    const resp = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image-preview:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }
    )

    if (!resp.ok) {
      const err = await resp.text()
      return NextResponse.json(
        { error: "AI generation failed", details: err },
        { status: 500 }
      )
    }

    const data = await resp.json()
    
    // Extract image data
    const inlineData = data?.candidates?.[0]?.content?.parts?.find(
      (p: any) => p.inlineData
    )?.inlineData

    if (!inlineData?.data) {
      return NextResponse.json(
        { error: "No image returned by AI" },
        { status: 500 }
      )
    }

    const dataUrl = `data:${inlineData.mimeType || "image/png"};base64,${inlineData.data}`
    
    // Save photo record
    const { error: photoError } = await supabase
      .from('photos')
      .insert({
        user_email: user.email,
        generated_url: dataUrl,
        style: style
      })

    if (photoError) {
      console.error('Failed to save photo:', photoError)
    }
    
    return NextResponse.json({ 
      url: dataUrl,
      creditsRemaining: creditResult
    })
    
  } catch (error) {
    console.error('Generation error:', error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

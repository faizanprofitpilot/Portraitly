import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    console.log("Generate headshot API called with:", body);
    
    // Simple test response
    return NextResponse.json({ 
      success: true, 
      message: "API route is working",
      receivedData: body 
    });
  } catch (err: any) {
    console.error("Server error:", err);
    return NextResponse.json(
      { error: "Internal server error", details: err.message },
      { status: 500 }
    );
  }
}
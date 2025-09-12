import { NextRequest, NextResponse } from "next/server";

// Force dynamic rendering
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  // Get the origin from the request
  const origin = request.nextUrl.origin;
  
  // Simply redirect to demo page - let the client handle user creation
  return NextResponse.redirect(new URL("/demo", origin));
}

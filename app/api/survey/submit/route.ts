import { NextResponse } from "next/server"

// This endpoint has been replaced by the enhanced gambling survey system
// Redirect to the new endpoint for compatibility

export async function GET() {
  return NextResponse.json({ 
    message: "This endpoint has been deprecated. Please use /api/gambling-survey/submit instead",
    newEndpoint: "/api/gambling-survey/submit",
    method: "GET" 
  })
}

export async function POST(req: Request) {
  // For backward compatibility, forward to the new endpoint
  console.log("=== LEGACY SURVEY ENDPOINT CALLED - REDIRECTING ===")
  
  return NextResponse.json(
    { 
      error: "This endpoint has been deprecated", 
      message: "Please use the new gambling survey system at /gambling-survey",
      newEndpoint: "/api/gambling-survey/submit"
    },
    { status: 301 }
  )
}
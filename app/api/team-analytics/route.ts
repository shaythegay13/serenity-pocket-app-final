import { NextResponse } from "next/server"

export async function GET() {
  return NextResponse.json(
    {
      success: false,
      error: "Team analytics endpoint is disabled. No external stats provider is configured.",
    },
    { status: 200 },
  )
}

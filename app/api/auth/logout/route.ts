import { NextRequest, NextResponse } from "next/server"
import { invalidateSession } from "@/app/actions/auth-actions"

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get("authToken")?.value
    if (token) {
      await invalidateSession(token)
    }

    const response = NextResponse.json({ success: true })
    response.cookies.set("authToken", "", {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      secure: process.env.NODE_ENV === "production",
      maxAge: 0,
    })
    return response
  } catch (error) {
    console.error("Auth logout error:", error)
    return NextResponse.json({ success: false, error: "Gagal logout" }, { status: 500 })
  }
}

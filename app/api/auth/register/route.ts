import { NextRequest, NextResponse } from "next/server"
import { registerResellerUser, createSession } from "@/app/actions/auth-actions"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, username, password } = body

    if (!email || !username || !password) {
      return NextResponse.json({ success: false, error: "Email, username, dan password wajib diisi" }, { status: 400 })
    }

    const registerResult = await registerResellerUser(email, username, password)
    if (!registerResult.success) {
      return NextResponse.json({ success: false, error: registerResult.error }, { status: 400 })
    }

    const sessionResult = await createSession(registerResult.userId)
    if (!sessionResult.success) {
      return NextResponse.json({ success: false, error: sessionResult.error }, { status: 500 })
    }

    const response = NextResponse.json({ success: true, userId: registerResult.userId })
    response.cookies.set("authToken", sessionResult.token, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 7,
    })
    return response
  } catch (error) {
    console.error("Auth register error:", error)
    return NextResponse.json({ success: false, error: "Gagal mendaftar" }, { status: 500 })
  }
}

import { NextRequest, NextResponse } from "next/server"
import { authenticateResellerUser, createSession } from "@/app/actions/auth-actions"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password } = body

    if (!email || !password) {
      return NextResponse.json({ success: false, error: "Email dan password wajib diisi" }, { status: 400 })
    }

    const authResult = await authenticateResellerUser(email, password)
    if (!authResult.success) {
      return NextResponse.json({ success: false, error: authResult.error }, { status: 401 })
    }

    const sessionResult = await createSession(authResult.user.userId)
    if (!sessionResult.success) {
      return NextResponse.json({ success: false, error: sessionResult.error }, { status: 500 })
    }

    const response = NextResponse.json({ success: true, user: authResult.user })
    response.cookies.set("authToken", sessionResult.token, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 7,
    })
    return response
  } catch (error) {
    console.error("Auth login error:", error)
    return NextResponse.json({ success: false, error: "Gagal login" }, { status: 500 })
  }
}

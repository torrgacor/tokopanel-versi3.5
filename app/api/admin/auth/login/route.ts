import { NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password } = body

    const adminEmail = process.env.ADMIN_EMAIL || ""
    const adminSecret = process.env.ADMIN_SECRET || ""
    if (!adminEmail || !adminSecret) {
      return NextResponse.json({ success: false, error: "Admin not configured" }, { status: 500 })
    }

    if (email?.trim().toLowerCase() !== adminEmail.toLowerCase() || password !== adminSecret) {
      return NextResponse.json({ success: false, error: "Invalid credentials" }, { status: 401 })
    }

    const response = NextResponse.json({ success: true })
    response.cookies.set("adminAuth", adminSecret, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24, // 1 day
    })

    return response
  } catch (error) {
    console.error("Admin login error:", error)
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 })
  }
}

import { NextRequest, NextResponse } from "next/server"
import { getUserBySessionToken } from "@/app/actions/auth-actions"

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get("authToken")?.value
    if (!token) {
      return NextResponse.json({ success: false, error: "Tidak terautentikasi" }, { status: 401 })
    }

    const user = await getUserBySessionToken(token)
    if (!user) {
      return NextResponse.json({ success: false, error: "Sesi tidak valid" }, { status: 401 })
    }

    return NextResponse.json({ success: true, user })
  } catch (error) {
    console.error("Auth me error:", error)
    return NextResponse.json({ success: false, error: "Gagal mengambil sesi pengguna" }, { status: 500 })
  }
}

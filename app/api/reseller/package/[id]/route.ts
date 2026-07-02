import { NextRequest, NextResponse } from "next/server"
import { getResellerPackageById } from "@/app/actions/reseller-actions"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const pkg = await getResellerPackageById(params.id)
    if (!pkg) {
      return NextResponse.json({ success: false, error: "Package tidak ditemukan" }, { status: 404 })
    }

    return NextResponse.json({ success: true, data: pkg })
  } catch (error) {
    console.error("Get reseller package error:", error)
    return NextResponse.json({ success: false, error: "Gagal mengambil data package" }, { status: 500 })
  }
}

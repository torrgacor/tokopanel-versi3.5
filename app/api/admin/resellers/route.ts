import { NextRequest, NextResponse } from "next/server"
import mongoClient from "@/lib/mongodb"
import { appConfig } from "@/data/config"

/**
 * GET /api/admin/resellers
 * Ambil daftar semua reseller
 */
export async function GET(request: NextRequest) {
  try {
    const client = await mongoClient
    const db = client.db(appConfig.mongodb.dbName)

    const resellers = await db
      .collection("resellers")
      .find({})
      .sort({ createdAt: -1 })
      .toArray()

    return NextResponse.json({
      success: true,
      data: resellers,
      count: resellers.length,
    })
  } catch (error) {
    console.error("GET resellers error:", error)
    return NextResponse.json({ success: false, error: "Gagal mengambil data reseller" }, { status: 500 })
  }
}

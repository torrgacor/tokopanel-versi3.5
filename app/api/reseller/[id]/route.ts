import { NextRequest, NextResponse } from "next/server"
import mongoClient from "@/lib/mongodb"
import { ObjectId } from "mongodb"
import { appConfig } from "@/data/config"

/**
 * GET /api/reseller/:id
 * Ambil informasi publik reseller
 */
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params
    const client = await mongoClient
    const db = client.db(appConfig.mongodb.dbName)

    const reseller = await db.collection("resellers").findOne({
      _id: new ObjectId(id),
    })

    if (!reseller) {
      return NextResponse.json({ success: false, error: "Reseller tidak ditemukan" }, { status: 404 })
    }

    // Return publik data only
    const publicData = {
      _id: reseller._id,
      username: reseller.username,
      businessName: reseller.businessName,
      businessDescription: reseller.businessDescription,
      totalSales: reseller.totalSales,
      totalCustomers: reseller.totalCustomers,
      status: reseller.status,
      createdAt: reseller.createdAt,
    }

    return NextResponse.json({
      success: true,
      data: publicData,
    })
  } catch (error) {
    console.error("GET reseller error:", error)
    return NextResponse.json({ success: false, error: "Gagal mengambil data reseller" }, { status: 500 })
  }
}

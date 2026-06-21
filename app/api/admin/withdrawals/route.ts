import { NextRequest, NextResponse } from "next/server"
import mongoClient from "@/lib/mongodb"
import { ObjectId } from "mongodb"
import { appConfig } from "@/data/config"

function isAdminAuthorized(request: NextRequest) {
  const adminCookie = request.cookies.get("adminAuth")?.value
  const headerToken = request.headers.get("x-admin-token")
  const adminSecret = process.env.ADMIN_SECRET || ""

  if (!adminSecret) return false
  return adminCookie === adminSecret || headerToken === adminSecret
}

/**
 * GET /api/admin/withdrawals
 * Ambil daftar semua withdrawal
 */
export async function GET(request: NextRequest) {
  if (!isAdminAuthorized(request)) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
  }
  try {
    const client = await mongoClient
    const db = client.db(appConfig.mongodb.dbName)

    const status = request.nextUrl.searchParams.get("status")
    const query = status ? { status } : {}

    const withdrawals = await db
      .collection("reseller_withdrawals")
      .find(query)
      .sort({ requestedAt: -1 })
      .toArray()

    return NextResponse.json({
      success: true,
      data: withdrawals,
      count: withdrawals.length,
    })
  } catch (error) {
    console.error("GET withdrawals error:", error)
    return NextResponse.json({ success: false, error: "Gagal mengambil data withdrawal" }, { status: 500 })
  }
}

/**
 * PUT /api/admin/withdrawals/:id
 * Update status withdrawal
 */
export async function PUT(request: NextRequest) {
  if (!isAdminAuthorized(request)) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
  }
  try {
    const client = await mongoClient
    const db = client.db(appConfig.mongodb.dbName)

    const body = await request.json()
    const { withdrawalId, status, rejectionReason, proofUrl } = body

    if (!withdrawalId || !status) {
      return NextResponse.json({ success: false, error: "Parameter tidak lengkap" }, { status: 400 })
    }

    const updateData: any = {
      status,
      processedAt: new Date(),
    }

    if (rejectionReason) {
      updateData.rejectionReason = rejectionReason
    }

    if (proofUrl) {
      updateData.proofUrl = proofUrl
    }

    const result = await db.collection("reseller_withdrawals").updateOne(
      { _id: new ObjectId(withdrawalId) },
      { $set: updateData }
    )

    if (result.modifiedCount === 0) {
      return NextResponse.json({ success: false, error: "Withdrawal tidak ditemukan" }, { status: 404 })
    }

    // Jika ditolak, kembalikan saldo
    if (status === "rejected") {
      const withdrawal = await db.collection("reseller_withdrawals").findOne({
        _id: new ObjectId(withdrawalId),
      })

      if (withdrawal) {
        await db.collection("resellers").updateOne(
          { _id: new ObjectId(withdrawal.resellerId) },
          {
            $inc: { walletBalance: withdrawal.amount },
            $set: { updatedAt: new Date() },
          }
        )
      }
    }

    return NextResponse.json({ success: true, message: "Withdrawal berhasil diupdate" })
  } catch (error) {
    console.error("PUT withdrawal error:", error)
    return NextResponse.json({ success: false, error: "Gagal update withdrawal" }, { status: 500 })
  }
}

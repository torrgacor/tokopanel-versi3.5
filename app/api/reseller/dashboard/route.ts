import { NextRequest, NextResponse } from "next/server"
import { getUserBySessionToken } from "@/app/actions/auth-actions"
import {
  getResellerProfile,
  getResellerStatistics,
  getResellerSales,
  getResellerPackages,
  getWithdrawalHistory,
  getCommissionHistory,
  getResellerReferralLink,
} from "@/app/actions/reseller-actions"

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

    const [profile, stats, sales, packages, withdrawals, commissions, referralLink] = await Promise.all([
      getResellerProfile(user.userId),
      getResellerStatistics(user.userId),
      getResellerSales(user.userId),
      getResellerPackages(user.userId),
      getWithdrawalHistory(user.userId),
      getCommissionHistory(user.userId),
      getResellerReferralLink(user.userId),
    ])

    return NextResponse.json({
      success: true,
      data: {
        profile,
        stats,
        sales,
        packages,
        withdrawals,
        commissions,
        referralLink,
      },
    })
  } catch (error) {
    console.error("Reseller dashboard error:", error)
    return NextResponse.json({ success: false, error: "Gagal memuat dashboard reseller" }, { status: 500 })
  }
}

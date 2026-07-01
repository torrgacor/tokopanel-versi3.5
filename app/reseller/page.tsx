"use client"

import React, { useEffect, useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { useAuth } from "@/hooks/useAuth"
import { ResellerStatsGrid } from "@/components/reseller-stats-card"
import { ResellerSalesTable } from "@/components/reseller-sales-table"
import { ResellerWalletCard } from "@/components/reseller-wallet-card"
import { ResellerPackagesCard } from "@/components/reseller-packages-card"
import { ResellerWithdrawalHistory } from "@/components/reseller-withdrawal-history"
import { ResellerReferralCard } from "@/components/reseller-referral-card"
import {
  getResellerProfile,
  getResellerStatistics,
  getResellerSales,
  getResellerPackages,
  getWithdrawalHistory,
  getCommissionHistory,
  getResellerReferralLink,
} from "@/app/actions/reseller-actions"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { format } from "date-fns"
import { id } from "date-fns/locale"
import { ArrowUpRight, TrendingUp } from "lucide-react"

export default function ResellerDashboard() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const [profile, setProfile] = useState<any>(null)
  const [stats, setStats] = useState<any>(null)
  const [sales, setSales] = useState<any[]>([])
  const [packages, setPackages] = useState<any[]>([])
  const [withdrawals, setWithdrawals] = useState<any[]>([])
  const [commissions, setCommissions] = useState<any[]>([])
  const [referralLink, setReferralLink] = useState<string>("")
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/reseller/login")
    }
  }, [authLoading, user, router])

  useEffect(() => {
    const loadData = async () => {
      if (!user) return

      try {
        const [profileData, statsData, salesData, packagesData, withdrawalsData, commissionsData, referralData] =
          await Promise.all([
            getResellerProfile(user.userId),
            getResellerStatistics(user.userId),
            getResellerSales(user.userId),
            getResellerPackages(user.userId),
            getWithdrawalHistory(user.userId),
            getCommissionHistory(user.userId),
            getResellerReferralLink(user.userId),
          ])

        setProfile(profileData)
        setStats(statsData)
        setSales(salesData)
        setPackages(packagesData)
        setWithdrawals(withdrawalsData)
        setCommissions(commissionsData)
        setReferralLink(referralData || "")
      } catch (error) {
        console.error("Error loading data:", error)
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [user])

  if (authLoading || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Memuat data...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  if (profile && profile.verificationStatus !== "verified") {
    return (
      <div className="container py-10 space-y-8">
        <div className="flex flex-col gap-2">
          <h1 className="text-4xl font-bold">Dashboard Reseller</h1>
          <p className="text-muted-foreground">Status akun reseller Anda</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Status Verifikasi</CardTitle>
            <CardDescription>
              Akun reseller Anda harus diverifikasi oleh admin sebelum dapat melakukan penjualan atau menerima komisi.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-xl border border-muted p-6 bg-muted/10">
              <p className="text-sm text-muted-foreground">Status saat ini:</p>
              <p className="text-xl font-semibold capitalize">
                {profile.verificationStatus === "pending" ? "Menunggu Verifikasi" : "Ditolak"}
              </p>
              {profile.verificationStatus === "rejected" && profile.rejectionReason ? (
                <p className="mt-2 text-sm text-destructive">Alasan penolakan: {profile.rejectionReason}</p>
              ) : (
                <p className="mt-2 text-sm text-muted-foreground">
                  Silakan tunggu admin untuk memverifikasi profil reseller Anda.
                </p>
              )}
            </div>

            <div className="rounded-xl border border-muted p-6 bg-muted/10">
              <h2 className="text-lg font-semibold">Informasi Akun</h2>
              <div className="grid grid-cols-2 gap-4 mt-4">
                <div>
                  <p className="text-sm text-muted-foreground">Nama Bisnis</p>
                  <p className="font-medium">{profile.businessName || "-"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Username</p>
                  <p className="font-medium">{profile.username}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Email</p>
                  <p className="font-medium text-sm">{profile.email}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">No Telepon</p>
                  <p className="font-medium">{profile.phoneNumber || "-"}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container py-10 space-y-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-4xl font-bold">Dashboard Reseller</h1>
        <p className="text-muted-foreground">Kelola penjualan dan komisi Anda</p>
      </div>

      {stats && <ResellerStatsGrid stats={stats} />}

      {!profile ? (
        <div className="rounded-xl border border-muted p-8 bg-muted/10">
          <h2 className="text-2xl font-semibold">Akun reseller belum terdaftar</h2>
          <p className="mt-2 text-muted-foreground">
            Anda telah login, tetapi profil reseller belum dibuat. Silakan isi data reseller terlebih dahulu.
          </p>
          <div className="mt-6">
            <Button onClick={() => router.push("/reseller/setup")}>Lengkapi Profil Reseller</Button>
          </div>
        </div>
      ) : (
        <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Ringkasan</TabsTrigger>
          <TabsTrigger value="sales">Penjualan</TabsTrigger>
          <TabsTrigger value="packages">Package</TabsTrigger>
          <TabsTrigger value="wallet">Dompet</TabsTrigger>
          <TabsTrigger value="settings">Pengaturan</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-8">
          <div className="grid gap-4 md:grid-cols-2">
            {profile && user && (
              <ResellerWalletCard
                userId={user.userId}
                balance={profile.walletBalance || 0}
                earnings={profile.totalEarnings || 0}
              />
            )}

            {referralLink && (
              <ResellerReferralCard
                referralLink={referralLink}
                referralCode={profile?._id || ""}
              />
            )}
          </div>

          {sales && sales.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Penjualan Terbaru</CardTitle>
                <CardDescription>5 penjualan terakhir</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {sales.slice(0, 5).map((sale: any) => (
                    <div key={sale._id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <p className="font-medium">{sale.planName}</p>
                        <p className="text-sm text-muted-foreground">{sale.customerUsername}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">
                          +Rp {sale.commission.toLocaleString("id-ID")}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(sale.createdAt), "dd MMM yyyy", { locale: id })}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {commissions && commissions.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Riwayat Komisi</CardTitle>
                <CardDescription>Semua komisi dan bonus</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {commissions.slice(0, 10).map((commission: any) => (
                    <div key={commission._id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <p className="font-medium">{commission.description}</p>
                        <p className="text-xs text-muted-foreground capitalize">{commission.type}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-green-600">
                          +Rp {commission.amount.toLocaleString("id-ID")}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(commission.createdAt), "dd MMM yyyy", { locale: id })}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="sales">
          <ResellerSalesTable sales={sales} />
        </TabsContent>

        <TabsContent value="packages">
          {user && <ResellerPackagesCard userId={user.userId} packages={packages} />}
        </TabsContent>

        <TabsContent value="wallet" className="space-y-8">
          {profile && user && (
            <ResellerWalletCard
              userId={user.userId}
              balance={profile.walletBalance || 0}
              earnings={profile.totalEarnings || 0}
            />
          )}
          <ResellerWithdrawalHistory withdrawals={withdrawals} />
        </TabsContent>

        <TabsContent value="settings" className="space-y-8">
          {profile && (
            <Card>
              <CardHeader>
                <CardTitle>Profil Bisnis</CardTitle>
                <CardDescription>Informasi bisnis reseller Anda</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Nama Bisnis</p>
                    <p className="font-medium">{profile.businessName || "-"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Username</p>
                    <p className="font-medium">{profile.username}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Email</p>
                    <p className="font-medium text-sm">{profile.email}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">No Telepon</p>
                    <p className="font-medium">{profile.phoneNumber || "-"}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-sm text-muted-foreground">Deskripsi Bisnis</p>
                    <p className="font-medium">{profile.businessDescription || "-"}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {profile && profile.bankAccount && (
            <Card>
              <CardHeader>
                <CardTitle>Data Bank</CardTitle>
                <CardDescription>Informasi rekening untuk penarikan</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Nama Bank</p>
                    <p className="font-medium">{profile.bankAccount.bankName}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Nomor Rekening</p>
                    <p className="font-medium">{profile.bankAccount.accountNumber}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-sm text-muted-foreground">Nama Pemilik</p>
                    <p className="font-medium">{profile.bankAccount.accountHolder}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Status Reseller</CardTitle>
              <CardDescription>Status dan verifikasi akun</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Status Akun</p>
                  <p className="font-medium capitalize">{profile.status}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Status Verifikasi</p>
                  <p className="font-medium capitalize">{profile.verificationStatus}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Komisi Rate</p>
                  <p className="font-medium">{(profile.commissionRate * 100).toFixed(1)}%</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      )}
    </div>
  )
}

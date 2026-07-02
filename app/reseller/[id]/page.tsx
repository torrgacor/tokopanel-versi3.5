import { getResellerProfileById, getResellerPackagesByResellerId } from "@/app/actions/reseller-actions"
import { appConfig } from "@/data/config"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { formatRupiah } from "@/lib/utils"
import { Package } from "lucide-react"
import { ResellerOrderSection } from "@/components/reseller-order-section"

interface ResellerPageProps {
  params: {
    id: string
  }
}

export default async function ResellerStorefrontPage({ params }: ResellerPageProps) {
  const reseller = await getResellerProfileById(params.id)
  const packages = await getResellerPackagesByResellerId(params.id)

  if (!reseller) {
    return (
      <div className="container py-20">
        <div className="rounded-3xl border border-red-500/20 bg-red-500/5 p-10 text-center">
          <h1 className="text-3xl font-bold">Reseller tidak ditemukan</h1>
          <p className="mt-3 text-muted-foreground">Link reseller tidak valid atau sudah tidak aktif.</p>
        </div>
      </div>
    )
  }

  const referralUrl = `${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"}/?ref=${reseller._id!.toString()}`

  return (
    <div className="container py-12">
      <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <Card className="rounded-3xl">
          <CardHeader>
            <CardTitle>{reseller.businessName}</CardTitle>
            <CardDescription>{reseller.businessDescription}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="rounded-3xl border border-muted p-6 bg-muted/50">
              <p className="text-sm text-muted-foreground">Total Penjualan</p>
              <p className="text-2xl font-semibold">{reseller.totalSales}</p>
              <p className="text-sm text-muted-foreground mt-1">Saldo komisi: Rp {reseller.walletBalance.toLocaleString("id-ID")}</p>
            </div>

            <ResellerOrderSection
              resellerId={reseller._id!.toString()}
              resellerBusinessName={reseller.businessName}
              packages={packages.map((pkg: any) => ({
                _id: pkg._id,
                planId: pkg.planId,
                planName: pkg.planName,
                basePrice: pkg.basePrice,
                resellPrice: pkg.resellPrice,
              }))}
            />
          </CardContent>
        </Card>

        <Card className="rounded-3xl">
          <CardHeader>
            <CardTitle>Info Reseller</CardTitle>
            <CardDescription>Gunakan link ini untuk membagikan toko reseller</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">Nama bisnis</p>
            <p className="font-medium">{reseller.businessName}</p>
            <p className="text-sm text-muted-foreground">Deskripsi</p>
            <p className="font-medium">{reseller.businessDescription}</p>
            <div className="rounded-xl border border-muted p-4 bg-muted/50">
              <p className="text-sm text-muted-foreground">Link referral</p>
              <p className="break-all text-sm font-medium">{referralUrl}</p>
            </div>
            <Button asChild className="w-full">
              <a href={referralUrl}>Salin Link Toko</a>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

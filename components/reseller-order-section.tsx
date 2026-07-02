"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import PanelForm from "./panel-form"
import { Package } from "lucide-react"

interface ResellerPackageOption {
  _id: string
  planId: string
  planName: string
  basePrice: number
  resellPrice: number
}

interface ResellerOrderSectionProps {
  resellerId: string
  resellerBusinessName: string
  packages: ResellerPackageOption[]
}

export function ResellerOrderSection({ resellerId, resellerBusinessName, packages }: ResellerOrderSectionProps) {
  const [selectedPackage, setSelectedPackage] = useState<ResellerPackageOption | null>(null)

  return (
    <div className="space-y-8">
      <Card className="rounded-3xl border">
        <CardHeader>
          <CardTitle>Pesan Sekarang</CardTitle>
          <CardDescription>Order langsung di toko reseller tanpa dialihkan.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {packages.length === 0 ? (
            <p className="text-muted-foreground">Belum ada paket reseller yang ditetapkan oleh penjual.</p>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {packages.map((pkg) => (
                <div key={pkg._id} className="rounded-3xl border border-muted p-4 bg-muted/50">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">{pkg.planName}</p>
                      <p className="text-xl font-semibold">Rp {pkg.resellPrice.toLocaleString("id-ID")}</p>
                      <p className="text-sm text-muted-foreground mt-1">Harga dasar: Rp {pkg.basePrice.toLocaleString("id-ID")}</p>
                    </div>
                    <Package className="h-6 w-6 text-red-500" />
                  </div>
                  <div className="mt-4">
                    <Button
                      className="w-full"
                      onClick={() => setSelectedPackage(pkg)}
                    >
                      Beli Paket Ini
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {selectedPackage ? (
        <div className="rounded-3xl border border-muted bg-muted/30 p-6">
          <div className="mb-6">
            <h2 className="text-2xl font-semibold">Checkout Paket Reseller</h2>
            <p className="text-sm text-muted-foreground mt-2">
              Anda sedang memesan paket dari <span className="font-semibold">{resellerBusinessName}</span>.
            </p>
          </div>
          <PanelForm
            initialReferrerId={resellerId}
            initialResellerPackage={selectedPackage}
          />
        </div>
      ) : (
        <Card className="rounded-3xl border border-muted p-6 bg-muted/50">
          <CardHeader>
            <CardTitle>Pilih Paket</CardTitle>
            <CardDescription>Pilih paket yang ingin Anda beli untuk menampilkan formulir pemesanan.</CardDescription>
          </CardHeader>
        </Card>
      )}
    </div>
  )
}

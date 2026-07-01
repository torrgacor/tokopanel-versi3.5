"use client"

import React, { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { CopyButton } from "@/components/copy-button"
import { QRCodeSVG } from "qrcode.react"
import { Share2, QrCode } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

interface ResellerReferralProps {
  referralLink: string
  referralCode: string
}

export function ResellerReferralCard({ referralLink, referralCode }: ResellerReferralProps) {
  const [isQROpen, setIsQROpen] = useState(false)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Share2 className="h-5 w-5" />
          Program Referral
        </CardTitle>
        <CardDescription>Ajak teman dan dapatkan bonus Rp 10.000 setiap referral</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg">
            <p className="text-sm font-medium mb-2">Link Referral Anda</p>
            <div className="flex gap-2">
              <Input value={referralLink} readOnly className="font-mono text-sm" />
              <CopyButton text={referralLink} />
            </div>
          </div>

          <div className="bg-purple-50 dark:bg-purple-950 p-4 rounded-lg">
            <p className="text-sm font-medium mb-2">Kode Referral</p>
            <div className="flex gap-2">
              <Input value={referralCode} readOnly className="font-mono text-sm" />
              <CopyButton text={referralCode} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 pt-4">
            <Button
              variant="outline"
              className="w-full"
              onClick={() => {
                if (navigator.share) {
                  navigator.share({
                    title: "Dapatkan Panel Hosting",
                    text: "Bergabung sebagai reseller dan dapatkan bonus referral!",
                    url: referralLink,
                  })
                }
              }}
            >
              <Share2 className="mr-2 h-4 w-4" />
              Bagikan
            </Button>

            <Dialog open={isQROpen} onOpenChange={setIsQROpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="w-full">
                  <QrCode className="mr-2 h-4 w-4" />
                  QR Code
                </Button>
              </DialogTrigger>
              <DialogContent className="flex flex-col items-center">
                <DialogHeader>
                  <DialogTitle>QR Code Referral</DialogTitle>
                  <DialogDescription>Scan untuk bagikan link referral</DialogDescription>
                </DialogHeader>
                <div className="bg-white p-4 rounded-lg">
                  <QRCodeSVG value={referralLink} size={256} />
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

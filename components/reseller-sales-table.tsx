"use client"

import React, { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { format } from "date-fns"
import { id } from "date-fns/locale"
import { Eye } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

interface Sale {
  _id: string
  customerId: string
  customerUsername: string
  customerEmail: string
  planName: string
  salePrice: number
  commission: number
  status: string
  transactionId: string
  createdAt: Date
  panelDetails?: {
    username: string
    password: string
    domain: string
  }
}

interface ResellerSalesTableProps {
  sales: Sale[]
}

export function ResellerSalesTable({ sales }: ResellerSalesTableProps) {
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null)

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(value)
  }

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; variant: any }> = {
      pending: { label: "Tertunda", variant: "secondary" },
      completed: { label: "Selesai", variant: "default" },
      cancelled: { label: "Batal", variant: "destructive" },
    }
    return statusMap[status] || { label: status, variant: "default" }
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Riwayat Penjualan</CardTitle>
          <CardDescription>Daftar semua penjualan Anda</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Pelanggan</TableHead>
                  <TableHead>Paket</TableHead>
                  <TableHead className="text-right">Harga Jual</TableHead>
                  <TableHead className="text-right">Komisi</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Tanggal</TableHead>
                  <TableHead className="text-center">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sales && sales.length > 0 ? (
                  sales.map((sale: any) => (
                    <TableRow key={sale._id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{sale.customerUsername}</p>
                          <p className="text-sm text-muted-foreground">{sale.customerEmail}</p>
                        </div>
                      </TableCell>
                      <TableCell>{sale.planName}</TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(sale.salePrice)}
                      </TableCell>
                      <TableCell className="text-right font-medium text-green-600">
                        {formatCurrency(sale.commission)}
                      </TableCell>
                      <TableCell>
                        <Badge variant={getStatusBadge(sale.status).variant}>
                          {getStatusBadge(sale.status).label}
                        </Badge>
                      </TableCell>
                      <TableCell>{format(new Date(sale.createdAt), "dd MMM yyyy", { locale: id })}</TableCell>
                      <TableCell className="text-center">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedSale(sale)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      Belum ada penjualan
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={!!selectedSale} onOpenChange={() => setSelectedSale(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Detail Penjualan</DialogTitle>
            <DialogDescription>Informasi lengkap transaksi penjualan</DialogDescription>
          </DialogHeader>
          {selectedSale && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Username Pelanggan</p>
                  <p className="font-medium">{selectedSale.customerUsername}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Email</p>
                  <p className="font-medium text-sm">{selectedSale.customerEmail}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Paket</p>
                  <p className="font-medium">{selectedSale.planName}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Harga Jual</p>
                  <p className="font-medium">{formatCurrency(selectedSale.salePrice)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Komisi</p>
                  <p className="font-medium text-green-600">{formatCurrency(selectedSale.commission)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  <Badge>{getStatusBadge(selectedSale.status).label}</Badge>
                </div>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">ID Transaksi</p>
                <p className="font-mono text-sm">{selectedSale.transactionId}</p>
              </div>
              {selectedSale.panelDetails && (
                <div className="bg-muted p-4 rounded-lg">
                  <p className="text-sm font-semibold mb-2">Detail Panel</p>
                  <div className="space-y-2 text-sm">
                    <p>
                      <span className="text-muted-foreground">Domain:</span> {selectedSale.panelDetails.domain}
                    </p>
                    <p>
                      <span className="text-muted-foreground">Username:</span> {selectedSale.panelDetails.username}
                    </p>
                    <p>
                      <span className="text-muted-foreground">Password:</span> {selectedSale.panelDetails.password}
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}

"use client"

import React from "react"
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

interface Withdrawal {
  _id: string
  amount: number
  bankAccount: {
    bankName: string
    accountNumber: string
    accountHolder: string
  }
  status: string
  requestedAt: Date
  processedAt?: Date
  rejectionReason?: string
}

interface ResellerWithdrawalHistoryProps {
  withdrawals: Withdrawal[]
}

export function ResellerWithdrawalHistory({ withdrawals }: ResellerWithdrawalHistoryProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(value)
  }

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; variant: any }> = {
      pending: { label: "Menunggu", variant: "secondary" },
      processing: { label: "Diproses", variant: "outline" },
      completed: { label: "Selesai", variant: "default" },
      rejected: { label: "Ditolak", variant: "destructive" },
    }
    return statusMap[status] || { label: status, variant: "default" }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Riwayat Penarikan</CardTitle>
        <CardDescription>Daftar semua penarikan saldo Anda</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Jumlah</TableHead>
                <TableHead>Bank</TableHead>
                <TableHead>Rekening</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Tanggal Request</TableHead>
                <TableHead>Tanggal Proses</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {withdrawals && withdrawals.length > 0 ? (
                withdrawals.map((withdrawal: any) => (
                  <TableRow key={withdrawal._id}>
                    <TableCell className="font-semibold">{formatCurrency(withdrawal.amount)}</TableCell>
                    <TableCell>{withdrawal.bankAccount.bankName}</TableCell>
                    <TableCell>
                      <div>
                        <p className="font-mono text-sm">{withdrawal.bankAccount.accountNumber}</p>
                        <p className="text-xs text-muted-foreground">{withdrawal.bankAccount.accountHolder}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getStatusBadge(withdrawal.status).variant}>
                        {getStatusBadge(withdrawal.status).label}
                      </Badge>
                      {withdrawal.status === "rejected" && withdrawal.rejectionReason && (
                        <p className="text-xs text-red-600 mt-1">{withdrawal.rejectionReason}</p>
                      )}
                    </TableCell>
                    <TableCell>
                      {format(new Date(withdrawal.requestedAt), "dd MMM yyyy HH:mm", {
                        locale: id,
                      })}
                    </TableCell>
                    <TableCell>
                      {withdrawal.processedAt
                        ? format(new Date(withdrawal.processedAt), "dd MMM yyyy HH:mm", {
                            locale: id,
                          })
                        : "-"}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    Belum ada penarikan
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}

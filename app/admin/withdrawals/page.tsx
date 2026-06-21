"use client"

import React, { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { toast } from "@/components/ui/use-toast"
import { format } from "date-fns"
import { id } from "date-fns/locale"
import { Check, X, Clock } from "lucide-react"

const approveSchema = z.object({
  proofUrl: z.string().url("URL harus valid").optional().or(z.literal("")),
})

const rejectSchema = z.object({
  reason: z.string().min(10, "Alasan minimal 10 karakter"),
})

type ApproveFormValues = z.infer<typeof approveSchema>
type RejectFormValues = z.infer<typeof rejectSchema>

export default function AdminWithdrawalsPage() {
  const [withdrawals, setWithdrawals] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedWithdrawal, setSelectedWithdrawal] = useState<any>(null)
  const [isActionOpen, setIsActionOpen] = useState(false)
  const [actionType, setActionType] = useState<"approve" | "reject" | null>(null)
  const [isActionLoading, setIsActionLoading] = useState(false)

  const approveForm = useForm<ApproveFormValues>({
    resolver: zodResolver(approveSchema),
    defaultValues: { proofUrl: "" },
  })

  const rejectForm = useForm<RejectFormValues>({
    resolver: zodResolver(rejectSchema),
    defaultValues: { reason: "" },
  })

  useEffect(() => {
    loadWithdrawals()
  }, [])

  const loadWithdrawals = async () => {
    try {
      const response = await fetch("/api/admin/withdrawals")
      const data = await response.json()
      if (data.success) {
        setWithdrawals(data.data)
      }
    } catch (error) {
      console.error("Error loading withdrawals:", error)
      toast({ title: "Error", description: "Gagal memuat data withdrawal", variant: "destructive" })
    } finally {
      setIsLoading(false)
    }
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(value)
  }

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; variant: any; icon: any }> = {
      pending: { label: "Menunggu", variant: "secondary", icon: <Clock className="h-3 w-3" /> },
      processing: { label: "Diproses", variant: "outline", icon: <Clock className="h-3 w-3" /> },
      completed: { label: "Selesai", variant: "default", icon: <Check className="h-3 w-3" /> },
      rejected: { label: "Ditolak", variant: "destructive", icon: <X className="h-3 w-3" /> },
    }
    return statusMap[status] || { label: status, variant: "default", icon: null }
  }

  const handleApprove = async (values: ApproveFormValues) => {
    if (!selectedWithdrawal) return
    setIsActionLoading(true)
    try {
      const response = await fetch("/api/admin/withdrawals", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          withdrawalId: selectedWithdrawal._id,
          status: "completed",
          proofUrl: values.proofUrl,
        }),
      })

      const data = await response.json()
      if (data.success) {
        toast({ title: "Berhasil", description: "Withdrawal berhasil disetujui" })
        setWithdrawals(withdrawals.map((w) =>
          w._id === selectedWithdrawal._id
            ? { ...w, status: "completed", proofUrl: values.proofUrl }
            : w
        ))
        approveForm.reset()
        setIsActionOpen(false)
      } else {
        toast({ title: "Gagal", description: data.error, variant: "destructive" })
      }
    } catch (error) {
      toast({ title: "Error", description: "Gagal approve withdrawal", variant: "destructive" })
    } finally {
      setIsActionLoading(false)
    }
  }

  const handleReject = async (values: RejectFormValues) => {
    if (!selectedWithdrawal) return
    setIsActionLoading(true)
    try {
      const response = await fetch("/api/admin/withdrawals", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          withdrawalId: selectedWithdrawal._id,
          status: "rejected",
          rejectionReason: values.reason,
        }),
      })

      const data = await response.json()
      if (data.success) {
        toast({ title: "Berhasil", description: "Withdrawal berhasil ditolak dan saldo dikembalikan" })
        setWithdrawals(withdrawals.map((w) =>
          w._id === selectedWithdrawal._id
            ? { ...w, status: "rejected", rejectionReason: values.reason }
            : w
        ))
        rejectForm.reset()
        setIsActionOpen(false)
      } else {
        toast({ title: "Gagal", description: data.error, variant: "destructive" })
      }
    } catch (error) {
      toast({ title: "Error", description: "Gagal reject withdrawal", variant: "destructive" })
    } finally {
      setIsActionLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Memuat data withdrawal...</p>
        </div>
      </div>
    )
  }

  const pendingWithdrawals = withdrawals.filter((w) => w.status === "pending")
  const processingWithdrawals = withdrawals.filter((w) => w.status === "processing")
  const completedWithdrawals = withdrawals.filter((w) => w.status === "completed")
  const rejectedWithdrawals = withdrawals.filter((w) => w.status === "rejected")

  const totalPending = pendingWithdrawals.reduce((sum, w) => sum + w.amount, 0)

  return (
    <div className="container py-10 space-y-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-4xl font-bold">Manajemen Withdrawal</h1>
        <p className="text-muted-foreground">Kelola request penarikan saldo reseller</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Pending</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalPending)}</div>
            <p className="text-xs text-muted-foreground">{pendingWithdrawals.length} request</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Diproses</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{processingWithdrawals.length}</div>
            <p className="text-xs text-muted-foreground">sedang diproses</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Selesai</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completedWithdrawals.length}</div>
            <p className="text-xs text-muted-foreground">berhasil diproses</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Ditolak</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{rejectedWithdrawals.length}</div>
            <p className="text-xs text-muted-foreground">ditolak</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="pending" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="pending">Pending ({pendingWithdrawals.length})</TabsTrigger>
          <TabsTrigger value="processing">Diproses ({processingWithdrawals.length})</TabsTrigger>
          <TabsTrigger value="completed">Selesai ({completedWithdrawals.length})</TabsTrigger>
          <TabsTrigger value="rejected">Ditolak ({rejectedWithdrawals.length})</TabsTrigger>
        </TabsList>

        <WithdrawalTable
          withdrawals={pendingWithdrawals}
          formatCurrency={formatCurrency}
          getStatusBadge={getStatusBadge}
          onAction={(withdrawal, type) => {
            setSelectedWithdrawal(withdrawal)
            setActionType(type)
            setIsActionOpen(true)
          }}
        />

        <WithdrawalTable
          withdrawals={processingWithdrawals}
          formatCurrency={formatCurrency}
          getStatusBadge={getStatusBadge}
          onAction={(withdrawal, type) => {
            setSelectedWithdrawal(withdrawal)
            setActionType(type)
            setIsActionOpen(true)
          }}
        />

        <WithdrawalTable
          withdrawals={completedWithdrawals}
          formatCurrency={formatCurrency}
          getStatusBadge={getStatusBadge}
        />

        <WithdrawalTable
          withdrawals={rejectedWithdrawals}
          formatCurrency={formatCurrency}
          getStatusBadge={getStatusBadge}
        />
      </Tabs>

      {/* Action Dialog */}
      <Dialog open={isActionOpen} onOpenChange={setIsActionOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {actionType === "approve" ? "Setujui Withdrawal" : "Tolak Withdrawal"}
            </DialogTitle>
            <DialogDescription>
              Jumlah: {formatCurrency(selectedWithdrawal?.amount || 0)}
            </DialogDescription>
          </DialogHeader>

          {actionType === "approve" ? (
            <Form {...approveForm}>
              <form onSubmit={approveForm.handleSubmit(handleApprove)} className="space-y-4">
                <FormField
                  control={approveForm.control}
                  name="proofUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>URL Bukti Transfer (Opsional)</FormLabel>
                      <FormControl>
                        <Input placeholder="URL bukti transfer" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full" disabled={isActionLoading}>
                  {isActionLoading ? "Memproses..." : "Setujui"}
                </Button>
              </form>
            </Form>
          ) : (
            <Form {...rejectForm}>
              <form onSubmit={rejectForm.handleSubmit(handleReject)} className="space-y-4">
                <FormField
                  control={rejectForm.control}
                  name="reason"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Alasan Penolakan</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Jelaskan alasan penolakan..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" variant="destructive" className="w-full" disabled={isActionLoading}>
                  {isActionLoading ? "Memproses..." : "Tolak"}
                </Button>
              </form>
            </Form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

function WithdrawalTable({
  withdrawals,
  formatCurrency,
  getStatusBadge,
  onAction,
}: {
  withdrawals: any[]
  formatCurrency: (v: number) => string
  getStatusBadge: (s: string) => any
  onAction?: (w: any, t: "approve" | "reject") => void
}) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Reseller</TableHead>
                <TableHead>Jumlah</TableHead>
                <TableHead>Bank</TableHead>
                <TableHead>Rekening</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Tanggal Request</TableHead>
                <TableHead className="text-center">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {withdrawals.length > 0 ? (
                withdrawals.map((withdrawal: any) => (
                  <TableRow key={withdrawal._id}>
                    <TableCell className="font-medium">Reseller ID: {withdrawal.resellerId.substring(0, 8)}...</TableCell>
                    <TableCell className="font-bold">{formatCurrency(withdrawal.amount)}</TableCell>
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
                    </TableCell>
                    <TableCell>
                      {format(new Date(withdrawal.requestedAt), "dd MMM yyyy HH:mm", { locale: id })}
                    </TableCell>
                    <TableCell className="text-center">
                      {withdrawal.status === "pending" && onAction && (
                        <div className="flex gap-2 justify-center">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => onAction(withdrawal, "approve")}
                          >
                            <Check className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => onAction(withdrawal, "reject")}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    Tidak ada data
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

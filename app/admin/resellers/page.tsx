"use client"

import React, { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
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
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { toast } from "@/components/ui/use-toast"
import {
  verifyReseller,
  rejectResellerVerification,
  updateResellerCommissionRate,
  suspendReseller,
  reactivateReseller,
} from "@/app/actions/reseller-admin-actions"
import { format } from "date-fns"
import { id } from "date-fns/locale"
import { Eye, Check, X, Lock, Unlock } from "lucide-react"

const commissionSchema = z.object({
  commissionRate: z.string().refine((val) => {
    const num = parseFloat(val)
    return !isNaN(num) && num >= 0 && num <= 1
  }, "Rate harus antara 0-1 (0-100%)"),
})

const rejectSchema = z.object({
  reason: z.string().min(10, "Alasan minimal 10 karakter"),
})

type CommissionFormValues = z.infer<typeof commissionSchema>
type RejectFormValues = z.infer<typeof rejectSchema>

export default function AdminResellerPage() {
  const router = useRouter()
  const [resellers, setResellers] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isCheckingAuth, setIsCheckingAuth] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [selectedReseller, setSelectedReseller] = useState<any>(null)
  const [isDetailOpen, setIsDetailOpen] = useState(false)
  const [isActionLoading, setIsActionLoading] = useState(false)

  const commissionForm = useForm<CommissionFormValues>({
    resolver: zodResolver(commissionSchema),
    defaultValues: { commissionRate: "" },
  })

  const rejectForm = useForm<RejectFormValues>({
    resolver: zodResolver(rejectSchema),
    defaultValues: { reason: "" },
  })

  useEffect(() => {
    const init = async () => {
      try {
        const authResponse = await fetch("/api/admin/resellers")
        if (authResponse.status === 401) {
          router.replace("/admin")
          return
        }

        const data = await authResponse.json()
        if (data.success) {
          setResellers(data.data)
          setIsAuthenticated(true)
        }
      } catch (error) {
        console.error("Error loading resellers:", error)
      } finally {
        setIsLoading(false)
        setIsCheckingAuth(false)
      }
    }

    init()
  }, [router])

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(value)
  }

  const handleVerify = async (resellerId: string) => {
    setIsActionLoading(true)
    try {
      const result = await verifyReseller(resellerId)
      if (result.success) {
        toast({ title: "Berhasil", description: "Reseller berhasil diverifikasi" })
        setResellers(resellers.map((r) =>
          r._id === resellerId ? { ...r, verificationStatus: "verified" } : r
        ))
      }
    } catch (error) {
      toast({ title: "Error", description: "Gagal verifikasi reseller", variant: "destructive" })
    } finally {
      setIsActionLoading(false)
    }
  }

  const handleReject = async (values: RejectFormValues) => {
    if (!selectedReseller) return
    setIsActionLoading(true)
    try {
      const result = await rejectResellerVerification(selectedReseller._id, values.reason)
      if (result.success) {
        toast({ title: "Berhasil", description: "Verifikasi reseller ditolak" })
        setResellers(resellers.map((r) =>
          r._id === selectedReseller._id
            ? { ...r, verificationStatus: "rejected", rejectionReason: values.reason }
            : r
        ))
        rejectForm.reset()
        setIsDetailOpen(false)
      }
    } catch (error) {
      toast({ title: "Error", description: "Gagal tolak verifikasi", variant: "destructive" })
    } finally {
      setIsActionLoading(false)
    }
  }

  const handleUpdateCommission = async (values: CommissionFormValues) => {
    if (!selectedReseller) return
    setIsActionLoading(true)
    try {
      const result = await updateResellerCommissionRate(selectedReseller._id, parseFloat(values.commissionRate))
      if (result.success) {
        toast({ title: "Berhasil", description: "Commission rate berhasil diupdate" })
        setResellers(resellers.map((r) =>
          r._id === selectedReseller._id
            ? { ...r, commissionRate: parseFloat(values.commissionRate) }
            : r
        ))
        commissionForm.reset()
      }
    } catch (error) {
      toast({ title: "Error", description: "Gagal update commission", variant: "destructive" })
    } finally {
      setIsActionLoading(false)
    }
  }

  const handleSuspend = async (resellerId: string) => {
    if (!confirm("Yakin suspend reseller ini?")) return
    setIsActionLoading(true)
    try {
      const result = await suspendReseller(resellerId, "Suspended by admin")
      if (result.success) {
        toast({ title: "Berhasil", description: "Reseller berhasil disuspend" })
        setResellers(resellers.map((r) =>
          r._id === resellerId ? { ...r, status: "suspended" } : r
        ))
      }
    } catch (error) {
      toast({ title: "Error", description: "Gagal suspend reseller", variant: "destructive" })
    } finally {
      setIsActionLoading(false)
    }
  }

  const handleReactivate = async (resellerId: string) => {
    setIsActionLoading(true)
    try {
      const result = await reactivateReseller(resellerId)
      if (result.success) {
        toast({ title: "Berhasil", description: "Reseller berhasil diaktifkan kembali" })
        setResellers(resellers.map((r) =>
          r._id === resellerId ? { ...r, status: "active" } : r
        ))
      }
    } catch (error) {
      toast({ title: "Error", description: "Gagal aktifkan reseller", variant: "destructive" })
    } finally {
      setIsActionLoading(false)
    }
  }

  if (isCheckingAuth) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Memeriksa autentikasi...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return null
  }

  return (
    <div className="container py-10 space-y-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-4xl font-bold">Manajemen Reseller</h1>
        <p className="text-muted-foreground">Kelola semua reseller dan verifikasi</p>
      </div>

      <AdminNavigation />

      <Card>
        <CardHeader>
          <CardTitle>Daftar Reseller</CardTitle>
          <CardDescription>Total: {resellers.length} reseller</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nama Bisnis</TableHead>
                  <TableHead>Username</TableHead>
                  <TableHead className="text-right">Total Sales</TableHead>
                  <TableHead className="text-right">Earnings</TableHead>
                  <TableHead>Verifikasi</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-center">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {resellers.map((reseller: any) => (
                  <TableRow key={reseller._id}>
                    <TableCell className="font-medium">{reseller.businessName}</TableCell>
                    <TableCell>{reseller.username}</TableCell>
                    <TableCell className="text-right">{reseller.totalSales}</TableCell>
                    <TableCell className="text-right">{formatCurrency(reseller.totalEarnings)}</TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          reseller.verificationStatus === "verified"
                            ? "default"
                            : reseller.verificationStatus === "pending"
                              ? "secondary"
                              : "destructive"
                        }
                      >
                        {reseller.verificationStatus === "pending" ? "Menunggu" : "Terverifikasi"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={reseller.status === "active" ? "default" : "destructive"}>
                        {reseller.status === "active" ? "Aktif" : "Suspended"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <Dialog open={isDetailOpen && selectedReseller?._id === reseller._id} onOpenChange={setIsDetailOpen}>
                        <DialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedReseller(reseller)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                          <DialogHeader>
                            <DialogTitle>{selectedReseller?.businessName}</DialogTitle>
                            <DialogDescription>
                              Lihat dan kelola detail reseller
                            </DialogDescription>
                          </DialogHeader>

                          {selectedReseller && (
                            <div className="space-y-6">
                              {/* Info Dasar */}
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <p className="text-sm text-muted-foreground">Username</p>
                                  <p className="font-medium">{selectedReseller.username}</p>
                                </div>
                                <div>
                                  <p className="text-sm text-muted-foreground">Email</p>
                                  <p className="font-medium text-sm">{selectedReseller.email}</p>
                                </div>
                                <div>
                                  <p className="text-sm text-muted-foreground">Nama Bisnis</p>
                                  <p className="font-medium">{selectedReseller.businessName}</p>
                                </div>
                                <div>
                                  <p className="text-sm text-muted-foreground">Telepon</p>
                                  <p className="font-medium">{selectedReseller.phoneNumber}</p>
                                </div>
                              </div>

                              {/* Statistik */}
                              <div className="grid grid-cols-2 gap-4 p-4 bg-slate-50 dark:bg-slate-900 rounded-lg">
                                <div>
                                  <p className="text-sm text-muted-foreground">Total Penjualan</p>
                                  <p className="text-2xl font-bold">{selectedReseller.totalSales}</p>
                                </div>
                                <div>
                                  <p className="text-sm text-muted-foreground">Total Earnings</p>
                                  <p className="text-2xl font-bold">{formatCurrency(selectedReseller.totalEarnings)}</p>
                                </div>
                                <div>
                                  <p className="text-sm text-muted-foreground">Total Customers</p>
                                  <p className="text-2xl font-bold">{selectedReseller.totalCustomers}</p>
                                </div>
                                <div>
                                  <p className="text-sm text-muted-foreground">Commission Rate</p>
                                  <p className="text-2xl font-bold">{(selectedReseller.commissionRate * 100).toFixed(1)}%</p>
                                </div>
                              </div>

                              {/* Update Commission */}
                              <Form {...commissionForm}>
                                <form onSubmit={commissionForm.handleSubmit(handleUpdateCommission)} className="space-y-4">
                                  <FormField
                                    control={commissionForm.control}
                                    name="commissionRate"
                                    render={({ field }) => (
                                      <FormItem>
                                        <FormLabel>Update Commission Rate</FormLabel>
                                        <FormControl>
                                          <Input
                                            type="number"
                                            placeholder="0.15"
                                            step="0.01"
                                            min="0"
                                            max="1"
                                            {...field}
                                          />
                                        </FormControl>
                                        <FormMessage />
                                      </FormItem>
                                    )}
                                  />
                                  <Button type="submit" size="sm" disabled={isActionLoading}>
                                    Update Rate
                                  </Button>
                                </form>
                              </Form>

                              {/* Verifikasi */}
                              {selectedReseller.verificationStatus !== "verified" && (
                                <div className="space-y-4 p-4 bg-yellow-50 dark:bg-yellow-950 rounded-lg">
                                  <p className="font-medium">Verifikasi Akun</p>
                                  <div className="flex gap-2">
                                    <Button
                                      size="sm"
                                      onClick={() => handleVerify(selectedReseller._id)}
                                      disabled={isActionLoading}
                                      className="flex-1"
                                    >
                                      <Check className="mr-2 h-4 w-4" />
                                      Verifikasi
                                    </Button>
                                  </div>

                                  {selectedReseller.verificationStatus === "pending" && (
                                    <Form {...rejectForm}>
                                      <form onSubmit={rejectForm.handleSubmit(handleReject)} className="space-y-4">
                                        <FormField
                                          control={rejectForm.control}
                                          name="reason"
                                          render={({ field }) => (
                                            <FormItem>
                                              <FormLabel>Alasan Penolakan</FormLabel>
                                              <FormControl>
                                                <Textarea {...field} />
                                              </FormControl>
                                              <FormMessage />
                                            </FormItem>
                                          )}
                                        />
                                        <Button type="submit" size="sm" variant="destructive" disabled={isActionLoading}>
                                          <X className="mr-2 h-4 w-4" />
                                          Tolak
                                        </Button>
                                      </form>
                                    </Form>
                                  )}
                                </div>
                              )}

                              {/* Suspend/Reactivate */}
                              <div className="flex gap-2 pt-4 border-t">
                                {selectedReseller.status === "active" ? (
                                  <Button
                                    size="sm"
                                    variant="destructive"
                                    onClick={() => handleSuspend(selectedReseller._id)}
                                    disabled={isActionLoading}
                                  >
                                    <Lock className="mr-2 h-4 w-4" />
                                    Suspend
                                  </Button>
                                ) : (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleReactivate(selectedReseller._id)}
                                    disabled={isActionLoading}
                                  >
                                    <Unlock className="mr-2 h-4 w-4" />
                                    Aktifkan Kembali
                                  </Button>
                                )}
                              </div>
                            </div>
                          )}
                        </DialogContent>
                      </Dialog>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

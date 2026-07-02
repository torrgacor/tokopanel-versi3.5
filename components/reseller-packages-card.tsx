"use client"

import React, { useState, useEffect } from "react"
import { plans } from "@/data/plans"
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
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { toast } from "@/components/ui/use-toast"
import { addResellerPackage, updatePackageStock } from "@/app/actions/reseller-actions"
import { Plus, Edit2 } from "lucide-react"

const packageSchema = z.object({
  planId: z.string().min(1, "Plan harus dipilih"),
  planName: z.string().min(1, "Nama plan harus diisi"),
  basePrice: z.string().refine((val) => !isNaN(parseFloat(val)), "Harga dasar harus berupa angka"),
  resellPrice: z.string().refine((val) => !isNaN(parseFloat(val)), "Harga jual harus berupa angka").refine((val, ctx) => {
    const basePrice = parseFloat(ctx.parent.basePrice)
    const resellPrice = parseFloat(val)
    return !isNaN(basePrice) && !isNaN(resellPrice) && resellPrice >= basePrice
  }, "Harga jual harus sama atau lebih besar dari harga dasar"),
  stock: z.string().refine(
    (val) => {
      const num = parseInt(val)
      return !isNaN(num) && num > 0
    },
    "Stok harus berupa angka positif"
  ),
})

const stockSchema = z.object({
  stock: z.string().refine(
    (val) => {
      const num = parseInt(val)
      return !isNaN(num) && num >= 0
    },
    "Stok harus berupa angka"
  ),
})

type PackageFormValues = z.infer<typeof packageSchema>
type StockFormValues = z.infer<typeof stockSchema>

interface Package {
  _id: string
  planName: string
  basePrice: number
  resellPrice: number
  markup: number
  stock: number
  sold: number
  status: string
}

interface ResellerPackagesProps {
  userId: string
  packages: Package[]
}

export function ResellerPackagesCard({ userId, packages }: ResellerPackagesProps) {
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [selectedPackage, setSelectedPackage] = useState<Package | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const resellerPlans = plans.filter((plan) => plan.type === "private" && plan.access === "regular")

  const addForm = useForm<PackageFormValues>({
    resolver: zodResolver(packageSchema),
    defaultValues: {
      planId: "",
      planName: "",
      basePrice: "",
      resellPrice: "",
      stock: "",
    },
  })

  const selectedPlanId = addForm.watch("planId")

  useEffect(() => {
    const selectedPlan = resellerPlans.find((plan) => plan.id === selectedPlanId)
    if (selectedPlan) {
      addForm.setValue("planName", selectedPlan.name)
      addForm.setValue("basePrice", selectedPlan.price.toString())
    }
  }, [selectedPlanId, addForm, resellerPlans])

  const editForm = useForm<StockFormValues>({
    resolver: zodResolver(stockSchema),
    defaultValues: {
      stock: "",
    },
  })

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(value)
  }

  const onAddSubmit = async (values: PackageFormValues) => {
    setIsLoading(true)
    try {
      const result = await addResellerPackage(
        userId,
        {
          planId: values.planId,
          planName: values.planName,
          basePrice: parseFloat(values.basePrice),
          resellPrice: parseFloat(values.resellPrice),
          stock: parseInt(values.stock),
        }
      )

      if (result.success) {
        toast({
          title: "Berhasil",
          description: "Package berhasil ditambahkan",
        })
        addForm.reset()
        setIsAddOpen(false)
        // Refresh halaman atau update state
        window.location.reload()
      } else {
        toast({
          title: "Gagal",
          description: result.error || "Gagal menambah package",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Terjadi kesalahan",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const onEditSubmit = async (values: StockFormValues) => {
    if (!selectedPackage) return

    setIsLoading(true)
    try {
      const result = await updatePackageStock(selectedPackage._id, parseInt(values.stock))

      if (result.success) {
        toast({
          title: "Berhasil",
          description: "Stok berhasil diupdate",
        })
        editForm.reset()
        setIsEditOpen(false)
        window.location.reload()
      } else {
        toast({
          title: "Gagal",
          description: "Gagal update stok",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Terjadi kesalahan",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Package Saya</CardTitle>
          <CardDescription>Kelola paket penjualan Anda</CardDescription>
        </div>
        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="mr-2 h-4 w-4" />
              Tambah Package
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Tambah Package Baru</DialogTitle>
              <DialogDescription>Tambahkan paket penjualan baru</DialogDescription>
            </DialogHeader>

            <Form {...addForm}>
              <form onSubmit={addForm.handleSubmit(onAddSubmit)} className="space-y-4">
                <FormField
                  control={addForm.control}
                  name="planId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Pilih Paket</FormLabel>
                      <FormControl>
                        <select
                          className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900"
                          {...field}
                        >
                          <option value="">Pilih paket reseller</option>
                          {resellerPlans.map((plan) => (
                            <option key={plan.id} value={plan.id}>
                              {plan.name} - {new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(plan.price)}
                            </option>
                          ))}
                        </select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={addForm.control}
                  name="planName"
                  render={({ field }) => (
                    <input type="hidden" {...field} />
                  )}
                />

                <FormField
                  control={addForm.control}
                  name="basePrice"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Harga Dasar (Rp)</FormLabel>
                      <FormControl>
                        <Input type="number" value={field.value} readOnly />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={addForm.control}
                  name="resellPrice"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Harga Jual (Rp)</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="Harga untuk dijual" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={addForm.control}
                  name="stock"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Stok Awal</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="Jumlah stok" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? "Menambahkan..." : "Tambah Package"}
                </Button>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </CardHeader>

      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nama Package</TableHead>
                <TableHead className="text-right">Harga Dasar</TableHead>
                <TableHead className="text-right">Harga Jual</TableHead>
                <TableHead className="text-right">Markup</TableHead>
                <TableHead className="text-center">Stok</TableHead>
                <TableHead className="text-center">Terjual</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-center">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {packages && packages.length > 0 ? (
                packages.map((pkg: any) => (
                  <TableRow key={pkg._id}>
                    <TableCell className="font-medium">{pkg.planName}</TableCell>
                    <TableCell className="text-right">{formatCurrency(pkg.basePrice)}</TableCell>
                    <TableCell className="text-right text-green-600 font-semibold">
                      {formatCurrency(pkg.resellPrice)}
                    </TableCell>
                    <TableCell className="text-right">
                      <Badge variant="outline">{pkg.markup?.toFixed(1)}%</Badge>
                    </TableCell>
                    <TableCell className="text-center font-semibold">{pkg.stock}</TableCell>
                    <TableCell className="text-center">{pkg.sold}</TableCell>
                    <TableCell>
                      <Badge variant={pkg.status === "active" ? "default" : "secondary"}>
                        {pkg.status === "active" ? "Aktif" : "Nonaktif"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <Dialog open={isEditOpen && selectedPackage?._id === pkg._id} onOpenChange={setIsEditOpen}>
                        <DialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedPackage(pkg)
                              editForm.setValue("stock", pkg.stock.toString())
                            }}
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Update Stok</DialogTitle>
                            <DialogDescription>Ubah stok untuk {pkg.planName}</DialogDescription>
                          </DialogHeader>

                          <Form {...editForm}>
                            <form onSubmit={editForm.handleSubmit(onEditSubmit)} className="space-y-4">
                              <FormField
                                control={editForm.control}
                                name="stock"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Stok Baru</FormLabel>
                                    <FormControl>
                                      <Input type="number" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />

                              <Button type="submit" className="w-full" disabled={isLoading}>
                                {isLoading ? "Menyimpan..." : "Simpan"}
                              </Button>
                            </form>
                          </Form>
                        </DialogContent>
                      </Dialog>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                    Belum ada package
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

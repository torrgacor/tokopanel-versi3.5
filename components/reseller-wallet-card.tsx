"use client"

import React, { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
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
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { toast } from "@/components/ui/use-toast"
import { requestWithdrawal } from "@/app/actions/reseller-actions"
import { Wallet, ArrowRight } from "lucide-react"

const withdrawalSchema = z.object({
  amount: z.string().refine((val) => {
    const num = parseFloat(val)
    return num >= 50000
  }, "Minimum penarikan Rp 50.000"),
  bankName: z.string().min(1, "Nama bank harus diisi"),
  accountNumber: z.string().min(1, "Nomor rekening harus diisi"),
  accountHolder: z.string().min(1, "Nama pemilik harus diisi"),
})

type WithdrawalFormValues = z.infer<typeof withdrawalSchema>

interface WalletCardProps {
  userId: string
  balance: number
  earnings: number
}

export function ResellerWalletCard({ userId, balance, earnings }: WalletCardProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const form = useForm<WithdrawalFormValues>({
    resolver: zodResolver(withdrawalSchema),
    defaultValues: {
      amount: "",
      bankName: "",
      accountNumber: "",
      accountHolder: "",
    },
  })

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(value)
  }

  const onSubmit = async (values: WithdrawalFormValues) => {
    setIsLoading(true)
    try {
      const result = await requestWithdrawal(userId, {
          amount: parseFloat(values.amount),
          bankAccount: {
            bankName: values.bankName,
            accountNumber: values.accountNumber,
            accountHolder: values.accountHolder,
          },
        }
      )

      if (result.success) {
        toast({
          title: "Berhasil",
          description: "Request penarikan Anda telah dibuat",
        })
        form.reset()
        setIsOpen(false)
      } else {
        toast({
          title: "Gagal",
          description: result.error || "Gagal membuat request penarikan",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Terjadi kesalahan saat membuat request",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Wallet className="h-5 w-5" />
          Dompet Saya
        </CardTitle>
        <CardDescription>Kelola saldo komisi Anda</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-6 rounded-lg">
            <p className="text-sm font-medium opacity-90">Saldo Tersedia</p>
            <p className="text-4xl font-bold mt-2">{formatCurrency(balance)}</p>
            <p className="text-sm opacity-75 mt-2">Total Earnings: {formatCurrency(earnings)}</p>
          </div>

          <div className="flex gap-3">
            <Dialog open={isOpen} onOpenChange={setIsOpen}>
              <DialogTrigger asChild>
                <Button className="flex-1" size="lg">
                  <ArrowRight className="mr-2 h-4 w-4" />
                  Tarik Saldo
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Tarik Saldo</DialogTitle>
                  <DialogDescription>
                    Isi formulir di bawah untuk melakukan penarikan saldo
                  </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <FormField
                      control={form.control}
                      name="amount"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Jumlah Penarikan (Rp)</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Minimum Rp 50.000"
                              type="number"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="bankName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nama Bank</FormLabel>
                          <FormControl>
                            <Input placeholder="Contoh: BCA, Mandiri, BNI" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="accountNumber"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nomor Rekening</FormLabel>
                          <FormControl>
                            <Input placeholder="1234567890" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="accountHolder"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nama Pemilik Rekening</FormLabel>
                          <FormControl>
                            <Input placeholder="Nama lengkap" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <Button type="submit" className="w-full" disabled={isLoading}>
                      {isLoading ? "Memproses..." : "Ajukan Penarikan"}
                    </Button>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

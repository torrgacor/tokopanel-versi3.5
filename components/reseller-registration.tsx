"use client"

import React, { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
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
import { initializeReseller } from "@/app/actions/reseller-actions"
import { ArrowRight, CheckCircle } from "lucide-react"

const resellerRegistrationSchema = z.object({
  phoneNumber: z.string().min(10, "Nomor telepon minimal 10 digit"),
  businessName: z.string().min(3, "Nama bisnis minimal 3 karakter"),
  businessDescription: z.string().min(20, "Deskripsi bisnis minimal 20 karakter"),
})

type RegistrationFormValues = z.infer<typeof resellerRegistrationSchema>

interface ResellerRegistrationProps {
  userId: string
  username: string
  email: string
}

export function ResellerRegistration({ userId, username, email }: ResellerRegistrationProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  const form = useForm<RegistrationFormValues>({
    resolver: zodResolver(resellerRegistrationSchema),
    defaultValues: {
      phoneNumber: "",
      businessName: "",
      businessDescription: "",
    },
  })

  const onSubmit = async (values: RegistrationFormValues) => {
    setIsLoading(true)
    try {
      const result = await initializeReseller(userId, {
        username,
        email,
        phoneNumber: values.phoneNumber,
        businessName: values.businessName,
        businessDescription: values.businessDescription,
      })

      if (result.success) {
        setSuccess(true)
        toast({
          title: "Selamat!",
          description: "Anda berhasil mendaftar sebagai reseller",
        })

        setTimeout(() => {
          router.push("/reseller")
        }, 2000)
      } else {
        toast({
          title: "Gagal",
          description: result.error || "Gagal mendaftar sebagai reseller",
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

  if (success) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-full max-w-md">
          <CardContent className="pt-12 pb-12 text-center space-y-4">
            <CheckCircle className="h-16 w-16 text-green-600 mx-auto" />
            <h2 className="text-2xl font-bold">Registrasi Berhasil!</h2>
            <p className="text-muted-foreground">
              Anda sekarang terdaftar sebagai reseller. Segera menuju dashboard untuk memulai berjualan.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container py-10">
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Daftar Sebagai Reseller</CardTitle>
          <CardDescription>
            Lengkapi data bisnis Anda untuk mulai berjualan sebagai reseller
          </CardDescription>
        </CardHeader>

        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Info Pengguna */}
              <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg space-y-2">
                <div>
                  <p className="text-sm text-muted-foreground">Username</p>
                  <p className="font-medium">{username}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Email</p>
                  <p className="font-medium text-sm">{email}</p>
                </div>
              </div>

              {/* Nomor Telepon */}
              <FormField
                control={form.control}
                name="phoneNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nomor Telepon</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Contoh: 08123456789"
                        type="tel"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Nomor yang bisa dihubungi untuk komunikasi bisnis
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Nama Bisnis */}
              <FormField
                control={form.control}
                name="businessName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nama Bisnis</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Contoh: Toko Panel Jaya"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Nama toko atau bisnis reseller Anda
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Deskripsi Bisnis */}
              <FormField
                control={form.control}
                name="businessDescription"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Deskripsi Bisnis</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Jelaskan tentang bisnis Anda, target pasar, dan mengapa Anda ingin menjadi reseller..."
                        className="resize-none h-32"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Deskripsi akan membantu kami memahami bisnis Anda lebih baik
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Info Tambahan */}
              <div className="bg-yellow-50 dark:bg-yellow-950 p-4 rounded-lg space-y-2 text-sm">
                <p className="font-medium">Informasi Penting:</p>
                <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                  <li>Komisi default 15% dari setiap penjualan</li>
                  <li>Bisa diubah sesuai dengan agreement bisnis</li>
                  <li>Minimum penarikan Rp 50.000</li>
                  <li>Proses verifikasi akun dalam 24 jam</li>
                </ul>
              </div>

              <Button type="submit" size="lg" className="w-full" disabled={isLoading}>
                {isLoading ? "Mendaftar..." : (
                  <>
                    Daftar Sekarang
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  )
}

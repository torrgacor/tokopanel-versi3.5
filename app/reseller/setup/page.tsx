"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { toast } from "@/components/ui/use-toast"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { useAuth } from "@/hooks/useAuth"
import { initializeReseller } from "@/app/actions/reseller-actions"
import { ArrowRight } from "lucide-react"

const setupSchema = z.object({
  phoneNumber: z.string().min(10, "Nomor telepon minimal 10 digit"),
  businessName: z.string().min(3, "Nama bisnis minimal 3 karakter"),
  businessDescription: z.string().min(20, "Deskripsi bisnis minimal 20 karakter"),
})

type SetupFormValues = z.infer<typeof setupSchema>

export default function ResellerSetupPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  const form = useForm<SetupFormValues>({
    resolver: zodResolver(setupSchema),
    defaultValues: {
      phoneNumber: "",
      businessName: "",
      businessDescription: "",
    },
  })

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/reseller/login")
    }
  }, [authLoading, user, router])

  const onSubmit = async (values: SetupFormValues) => {
    if (!user) return

    setIsLoading(true)
    try {
      const result = await initializeReseller(user.userId, {
        username: user.username,
        email: user.email,
        phoneNumber: values.phoneNumber,
        businessName: values.businessName,
        businessDescription: values.businessDescription,
      })

      if (result.success) {
        toast({ title: "Berhasil", description: "Profil reseller berhasil dibuat" })
        setSuccess(true)
        setTimeout(() => {
          router.push("/reseller")
        }, 1500)
      } else {
        toast({ title: "Gagal", description: result.error || "Gagal membuat profil reseller", variant: "destructive" })
      }
    } catch (error) {
      console.error("Setup error:", error)
      toast({ title: "Error", description: "Terjadi kesalahan", variant: "destructive" })
    } finally {
      setIsLoading(false)
    }
  }

  if (authLoading || !user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Memuat...</p>
        </div>
      </div>
    )
  }

  if (success) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-full max-w-md">
          <CardContent className="pt-12 pb-12 text-center space-y-4">
            <h2 className="text-2xl font-bold">Profil berhasil dibuat!</h2>
            <p className="text-muted-foreground">Anda akan diarahkan ke dashboard reseller dalam beberapa detik.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container py-10">
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Lengkapi Profil Reseller</CardTitle>
          <CardDescription>Isi informasi bisnis untuk mulai menjual sebagai reseller.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="bg-slate-50 rounded-lg p-4 space-y-2">
              <p className="text-sm text-muted-foreground">Username</p>
              <p className="font-medium">{user.username}</p>
              <p className="text-sm text-muted-foreground">Email</p>
              <p className="font-medium">{user.email}</p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Nomor Telepon</label>
              <input
                type="tel"
                className="w-full rounded-md border border-input px-3 py-2"
                {...form.register("phoneNumber")}
                placeholder="Contoh: 08123456789"
              />
              <p className="text-sm text-destructive mt-1">{form.formState.errors.phoneNumber?.message}</p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Nama Bisnis</label>
              <input
                type="text"
                className="w-full rounded-md border border-input px-3 py-2"
                {...form.register("businessName")}
                placeholder="Contoh: Toko Panel Jaya"
              />
              <p className="text-sm text-destructive mt-1">{form.formState.errors.businessName?.message}</p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Deskripsi Bisnis</label>
              <textarea
                className="w-full rounded-md border border-input px-3 py-2 min-h-[140px]"
                {...form.register("businessDescription")}
                placeholder="Jelaskan tentang bisnis Anda, target pasar, dan mengapa Anda ingin menjadi reseller..."
              />
              <p className="text-sm text-destructive mt-1">{form.formState.errors.businessDescription?.message}</p>
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Menyimpan..." : "Simpan Profil"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

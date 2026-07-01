"use client"

import { type FormEvent, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function AdminLoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError("")
    setIsSubmitting(true)

    try {
      const response = await fetch("/api/admin/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      })
      const data = await response.json()

      if (!data.success) {
        setError(data.error || "Email atau password salah")
        setIsSubmitting(false)
        return
      }

      router.push("/admin/vouchermts")
    } catch (error) {
      console.error(error)
      setError("Gagal login admin")
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-dark-900 via-dark-800 to-dark-950 p-4">
      <Card className="w-full max-w-md bg-dark-400 border-dark-300 shadow-xl">
        <CardHeader>
          <CardTitle className="text-3xl text-white">Login Admin</CardTitle>
          <CardDescription className="text-gray-400">
            Masukkan email dan password admin untuk mengakses halaman manajemen.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-white">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="Masukkan Email"
                required
                className="bg-dark-500 border-dark-200 text-white"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-white">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Masukkan Password"
                required
                className="bg-dark-500 border-dark-200 text-white"
              />
            </div>
            {error ? <p className="text-sm text-red-400">{error}</p> : null}
            <Button type="submit" className="w-full bg-red-600 hover:bg-red-700 text-white" disabled={isSubmitting}>
              {isSubmitting ? "Memeriksa..." : "Login"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

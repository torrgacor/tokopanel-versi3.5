"use client"

import { useEffect, useState } from "react"

interface AuthUser {
  userId: string
  email: string
  username: string
}

interface UseAuthResult {
  user: AuthUser | null
  loading: boolean
  error: string | null
  refresh: () => Promise<void>
}

export function useAuth(): UseAuthResult {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchSession = async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch("/api/auth/me", {
        method: "GET",
        credentials: "include",
      })
      const data = await response.json()

      if (data.success && data.user) {
        setUser(data.user)
      } else {
        setUser(null)
        if (data.error) {
          setError(data.error)
        }
      }
    } catch (err) {
      console.error("Fetch auth session error:", err)
      setUser(null)
      setError("Gagal memeriksa sesi")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSession()
  }, [])

  return {
    user,
    loading,
    error,
    refresh: fetchSession,
  }
}

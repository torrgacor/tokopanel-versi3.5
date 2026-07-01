import { NextRequest } from "next/server"

export function getAdminSecret() {
  return process.env.ADMIN_SECRET || ""
}

export function isAdminAuthorized(request: NextRequest) {
  const adminCookie = request.cookies.get("adminAuth")?.value
  const headerToken = request.headers.get("x-admin-token")
  const adminSecret = getAdminSecret()

  if (!adminSecret) return false
  return adminCookie === adminSecret || headerToken === adminSecret
}

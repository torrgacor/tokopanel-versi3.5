"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"

const links = [
  { href: "/admin/resellers", label: "Reseller" },
  { href: "/admin/vouchermts", label: "Voucher" },
  { href: "/admin/withdrawals", label: "Withdrawals" },
]

export function AdminNavigation() {
  const pathname = usePathname()

  return (
    <div className="mb-6 flex flex-wrap gap-3">
      {links.map((link) => (
        <Link key={link.href} href={link.href} passHref>
          <Button
            variant={pathname === link.href ? "secondary" : "outline"}
            className="h-11"
          >
            {link.label}
          </Button>
        </Link>
      ))}
    </div>
  )
}

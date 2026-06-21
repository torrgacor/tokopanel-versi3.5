import React from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowUpRight, DollarSign, Users, TrendingUp, Package } from "lucide-react"

interface StatsCardProps {
  title: string
  value: string | number
  description?: string
  icon?: React.ReactNode
  trend?: number
}

export function StatsCard({ title, value, description, icon, trend }: StatsCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <div className="text-right">{icon || <TrendingUp className="h-4 w-4 text-muted-foreground" />}</div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {description && <p className="text-xs text-muted-foreground">{description}</p>}
        {trend !== undefined && (
          <div className="flex items-center gap-1 mt-2 text-xs text-green-600">
            <ArrowUpRight className="h-3 w-3" />
            {trend}% dari bulan lalu
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export function ResellerStatsGrid({ stats }: { stats: any }) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(value)
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <StatsCard
        title="Total Earnings"
        value={formatCurrency(stats?.totalEarnings || 0)}
        description="Komisi yang didapat"
        icon={<DollarSign className="h-4 w-4 text-green-600" />}
      />
      <StatsCard
        title="Total Penjualan"
        value={stats?.totalSales || 0}
        description="Jumlah transaksi selesai"
        icon={<Package className="h-4 w-4 text-blue-600" />}
      />
      <StatsCard
        title="Total Revenue"
        value={formatCurrency(stats?.totalRevenue || 0)}
        description="Penjualan kotor"
        icon={<TrendingUp className="h-4 w-4 text-purple-600" />}
      />
      <StatsCard
        title="Total Customers"
        value={stats?.totalCustomers || 0}
        description="Pelanggan unik"
        icon={<Users className="h-4 w-4 text-orange-600" />}
      />
    </div>
  )
}

// Types untuk Reseller Panel
import { ObjectId } from "mongodb"

export interface ResellerProfile {
  _id?: ObjectId
  userId: string
  username: string
  email: string
  phoneNumber: string
  businessName: string
  businessDescription: string
  commissionRate: number // Persentase komisi (0-100)
  walletBalance: number // Saldo wallet reseller
  totalEarnings: number // Total earnings seumur hidup
  totalSales: number // Total penjualan
  totalCustomers: number // Total customer
  status: "active" | "inactive" | "suspended"
  verificationStatus: "pending" | "verified" | "rejected"
  bankAccount?: {
    bankName: string
    accountNumber: string
    accountHolder: string
  }
  createdAt: Date
  updatedAt: Date
}

export interface ResellerPackage {
  _id?: ObjectId
  resellerId: string
  planId: string
  planName: string
  basePrice: number // Harga dasar dari admin
  resellPrice: number // Harga jual reseller
  markup: number // Markup dalam persen
  stock: number // Stok tersisa
  sold: number // Sudah terjual
  status: "active" | "inactive"
  createdAt: Date
  updatedAt: Date
}

export interface ResellerSale {
  _id?: ObjectId
  resellerId: string
  customerId: string
  customerEmail: string
  customerUsername: string
  planId: string
  planName: string
  salePrice: number
  basePrice: number
  resellerPackageId?: string
  commission: number // Komisi yang didapat
  commissionRate: number // Rate komisi saat itu
  status: "pending" | "completed" | "cancelled"
  transactionId: string
  panelDetails?: {
    username: string
    password: string
    domain: string
  }
  createdAt: Date
  completedAt?: Date
}

export interface ResellerWithdrawal {
  _id?: ObjectId
  resellerId: string
  amount: number
  bankAccount: {
    bankName: string
    accountNumber: string
    accountHolder: string
  }
  status: "pending" | "processing" | "completed" | "rejected"
  notes?: string
  proofUrl?: string
  rejectionReason?: string
  requestedAt: Date
  processedAt?: Date
}

export interface ResellerStatistics {
  totalSales: number
  totalRevenue: number
  totalEarnings: number
  totalCustomers: number
  totalPackagesSold: number
  averageOrderValue: number
  conversionRate: number
  lastSaleDate?: Date
}

export interface ResellerCommissionHistory {
  _id?: ObjectId
  resellerId: string
  saleId: ObjectId
  amount: number
  type: "sale" | "bonus" | "adjustment"
  description: string
  createdAt: Date
}

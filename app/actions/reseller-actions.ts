"use server"

import mongoClient from "@/lib/mongodb"
import {
  ResellerProfile,
  ResellerPackage,
  ResellerSale,
  ResellerWithdrawal,
  ResellerStatistics,
} from "@/types/reseller"
import { ObjectId } from "mongodb"
import { appConfig } from "@/data/config"

const RESELLER_COMMISSION_RATE = 0.15 // 15% default commission

/**
 * Initialize reseller profile untuk user baru
 */
export async function initializeReseller(
  userId: string,
  userData: {
    username: string
    email: string
    phoneNumber: string
    businessName: string
    businessDescription: string
  }
) {
  try {
    const client = await mongoClient
    const db = client.db(appConfig.mongodb.dbName)
    const resellers = db.collection("resellers")

    // Check if reseller already exists
    const existing = await resellers.findOne({ userId })
    if (existing) {
      return { success: false, error: "Reseller profile sudah ada" }
    }

    const reseller: ResellerProfile = {
      userId,
      username: userData.username,
      email: userData.email.toLowerCase(),
      phoneNumber: userData.phoneNumber,
      businessName: userData.businessName,
      businessDescription: userData.businessDescription,
      commissionRate: RESELLER_COMMISSION_RATE,
      walletBalance: 0,
      totalEarnings: 0,
      totalSales: 0,
      totalCustomers: 0,
      status: "active",
      verificationStatus: "pending",
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    const existingProfile = await resellers.findOne({
      $or: [
        { userId },
        { email: userData.email.toLowerCase() },
        { username: userData.username },
      ],
    })

    if (existingProfile) {
      return { success: false, error: "Email, username, atau akun reseller sudah terdaftar" }
    }

    const result = await resellers.insertOne(reseller)
    return { success: true, resellerId: result.insertedId.toString() }
  } catch (error) {
    console.error("Initialize reseller error:", error)
    return { success: false, error: "Gagal membuat profil reseller" }
  }
}

/**
 * Find reseller by email dan username
 */
export async function findResellerByEmailAndUsername(email: string, username: string) {
  try {
    const client = await mongoClient
    const db = client.db(appConfig.mongodb.dbName)
    const reseller = await db.collection("resellers").findOne({
      email: email.toLowerCase(),
      username,
    })
    return reseller || null
  } catch (error) {
    console.error("Find reseller error:", error)
    return null
  }
}

/**
 * Get reseller profile
 */
export async function getResellerProfile(userId: string) {
  try {
    const client = await mongoClient
    const db = client.db(appConfig.mongodb.dbName)
    const reseller = await db.collection("resellers").findOne({ userId })
    return reseller || null
  } catch (error) {
    console.error("Get reseller profile error:", error)
    return null
  }
}

export async function getResellerProfileById(resellerId: string) {
  try {
    const client = await mongoClient
    const db = client.db(appConfig.mongodb.dbName)
    const reseller = await db.collection("resellers").findOne({ _id: new ObjectId(resellerId) })
    return reseller || null
  } catch (error) {
    console.error("Get reseller profile by ID error:", error)
    return null
  }
}

/**
 * Update reseller profile
 */
export async function updateResellerProfile(
  userId: string,
  updates: Partial<ResellerProfile>
) {
  try {
    const client = await mongoClient
    const db = client.db(appConfig.mongodb.dbName)

    const result = await db.collection("resellers").updateOne(
      { userId },
      {
        $set: {
          ...updates,
          updatedAt: new Date(),
        },
      }
    )

    return { success: result.modifiedCount > 0 }
  } catch (error) {
    console.error("Update reseller profile error:", error)
    return { success: false, error: "Gagal update profil" }
  }
}

/**
 * Create/Add reseller package
 */
export async function addResellerPackage(
  userId: string,
  packageData: {
    planId: string
    planName: string
    basePrice: number
    resellPrice: number
    stock: number
  }
) {
  try {
    const client = await mongoClient
    const db = client.db(appConfig.mongodb.dbName)

    const reseller = await db.collection("resellers").findOne({ userId })
    if (!reseller) {
      return { success: false, error: "Reseller tidak ditemukan" }
    }

    if (packageData.resellPrice < packageData.basePrice) {
      return { success: false, error: "Harga jual harus sama atau lebih besar dari harga dasar" }
    }

    const markup = ((packageData.resellPrice - packageData.basePrice) / packageData.basePrice) * 100

    const package_: ResellerPackage = {
      resellerId: reseller._id!.toString(),
      planId: packageData.planId,
      planName: packageData.planName,
      basePrice: packageData.basePrice,
      resellPrice: packageData.resellPrice,
      markup,
      stock: packageData.stock,
      sold: 0,
      status: "active",
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    const result = await db.collection("reseller_packages").insertOne(package_)
    return { success: true, packageId: result.insertedId.toString() }
  } catch (error) {
    console.error("Add reseller package error:", error)
    return { success: false, error: "Gagal menambah paket" }
  }
}

/**
 * Get reseller packages
 */
export async function getResellerPackages(userId: string) {
  try {
    const client = await mongoClient
    const db = client.db(appConfig.mongodb.dbName)

    const reseller = await db.collection("resellers").findOne({ userId })
    if (!reseller) return []

    const packages = await db
      .collection("reseller_packages")
      .find({ resellerId: reseller._id!.toString() })
      .toArray()

    return packages
  } catch (error) {
    console.error("Get reseller packages error:", error)
    return []
  }
}

export async function getResellerPackagesByResellerId(resellerId: string) {
  try {
    const client = await mongoClient
    const db = client.db(appConfig.mongodb.dbName)

    const packages = await db
      .collection("reseller_packages")
      .find({ resellerId })
      .toArray()

    return packages
  } catch (error) {
    console.error("Get reseller packages by reseller ID error:", error)
    return []
  }
}

export async function getResellerPackageById(packageId: string) {
  try {
    const client = await mongoClient
    const db = client.db(appConfig.mongodb.dbName)

    const packageData = await db
      .collection("reseller_packages")
      .findOne({ _id: new ObjectId(packageId) })

    return packageData
  } catch (error) {
    console.error("Get reseller package by ID error:", error)
    return null
  }
}

/**
 * Update package stock
 */
export async function updatePackageStock(packageId: string, newStock: number) {
  try {
    const client = await mongoClient
    const db = client.db(appConfig.mongodb.dbName)

    const result = await db.collection("reseller_packages").updateOne(
      { _id: new ObjectId(packageId) },
      {
        $set: { stock: newStock, updatedAt: new Date() },
      }
    )

    return { success: result.modifiedCount > 0 }
  } catch (error) {
    console.error("Update package stock error:", error)
    return { success: false }
  }
}


export async function updateResellerPackagePrice(packageId: string, newPrice: number) {
  try {
    const client = await mongoClient
    const db = client.db(appConfig.mongodb.dbName)

    const existingPackage = await db.collection("reseller_packages").findOne({ _id: new ObjectId(packageId) })
    if (!existingPackage) {
      return { success: false, error: "Package tidak ditemukan" }
    }

    const markup = ((newPrice - existingPackage.basePrice) / existingPackage.basePrice) * 100

    const result = await db.collection("reseller_packages").updateOne(
      { _id: new ObjectId(packageId) },
      {
        $set: {
          resellPrice: newPrice,
          markup,
          updatedAt: new Date(),
        },
      }
    )

    return { success: result.modifiedCount > 0 }
  } catch (error) {
    console.error("Update reseller package price error:", error)
    return { success: false, error: "Gagal update harga package" }
  }
}

/**
 * Record sale untuk reseller
 */
export async function recordResellerSale(
  userId: string,
  saleData: {
    customerId: string
    customerEmail: string
    customerUsername: string
    planId: string
    planName: string
    salePrice: number
    basePrice: number
    transactionId: string
    resellerPackageId?: string
    panelDetails?: {
      username: string
      password: string
      domain: string
    }
  }
) {
  try {
    const client = await mongoClient
    const db = client.db(appConfig.mongodb.dbName)

    const query: any = { userId }
    if (ObjectId.isValid(userId)) {
      query.$or = [{ userId }, { _id: new ObjectId(userId) }]
    }

    const reseller = await db.collection("resellers").findOne(query)
    if (!reseller) {
      return { success: false, error: "Reseller tidak ditemukan" }
    }

    if (reseller.verificationStatus !== "verified") {
      return { success: false, error: "Reseller belum terverifikasi" }
    }

    const commission = Math.max(0, Math.round(saleData.salePrice - saleData.basePrice))

    const sale: ResellerSale = {
      resellerId: reseller._id!.toString(),
      customerId: saleData.customerId,
      customerEmail: saleData.customerEmail,
      customerUsername: saleData.customerUsername,
      planId: saleData.planId,
      planName: saleData.planName,
      salePrice: saleData.salePrice,
      basePrice: saleData.basePrice,
      resellerPackageId: saleData.resellerPackageId,
      commission,
      commissionRate: reseller.commissionRate,
      status: "completed",
      transactionId: saleData.transactionId,
      panelDetails: saleData.panelDetails,
      createdAt: new Date(),
      completedAt: new Date(),
    }

    const saleResult = await db.collection("reseller_sales").insertOne(sale)

    // Update reseller statistics
    await db.collection("resellers").updateOne(
      { _id: reseller._id },
      {
        $inc: {
          walletBalance: commission,
          totalEarnings: commission,
          totalSales: 1,
        },
        $set: { updatedAt: new Date() },
      }
    )

    // Record commission history
    await db.collection("commission_history").insertOne({
      resellerId: reseller._id!.toString(),
      saleId: saleResult.insertedId,
      amount: commission,
      type: "sale",
      description: `Komisi dari penjualan ${saleData.planName}`,
      createdAt: new Date(),
    })

    return { success: true, saleId: saleResult.insertedId.toString() }
  } catch (error) {
    console.error("Record reseller sale error:", error)
    return { success: false, error: "Gagal mencatat penjualan" }
  }
}

/**
 * Get reseller sales
 */
export async function getResellerSales(userId: string, limit: number = 50) {
  try {
    const client = await mongoClient
    const db = client.db(appConfig.mongodb.dbName)

    const reseller = await db.collection("resellers").findOne({ userId })
    if (!reseller) return []

    const sales = await db
      .collection("reseller_sales")
      .find({ resellerId: reseller._id!.toString() })
      .sort({ createdAt: -1 })
      .limit(limit)
      .toArray()

    return sales
  } catch (error) {
    console.error("Get reseller sales error:", error)
    return []
  }
}

/**
 * Get reseller statistics
 */
export async function getResellerStatistics(userId: string): Promise<ResellerStatistics | null> {
  try {
    const client = await mongoClient
    const db = client.db(appConfig.mongodb.dbName)

    const reseller = await db.collection("resellers").findOne({ userId })
    if (!reseller) return null

    const sales = await db
      .collection("reseller_sales")
      .find({
        resellerId: reseller._id!.toString(),
        status: "completed",
      })
      .toArray()

    const totalSales = sales.length
    const totalRevenue = sales.reduce((sum, sale) => sum + sale.salePrice, 0)
    const totalEarnings = sales.reduce((sum, sale) => sum + sale.commission, 0)

    // Get unique customers count
    const uniqueCustomers = new Set(sales.map((s) => s.customerId)).size

    const stats: ResellerStatistics = {
      totalSales: reseller.totalSales,
      totalRevenue,
      totalEarnings: reseller.totalEarnings,
      totalCustomers: uniqueCustomers,
      totalPackagesSold: totalSales,
      averageOrderValue: totalSales > 0 ? totalRevenue / totalSales : 0,
      conversionRate: 0,
      lastSaleDate: sales[0]?.createdAt,
    }

    return stats
  } catch (error) {
    console.error("Get reseller statistics error:", error)
    return null
  }
}

/**
 * Request withdrawal
 */
export async function requestWithdrawal(
  userId: string,
  withdrawalData: {
    amount: number
    bankAccount: {
      bankName: string
      accountNumber: string
      accountHolder: string
    }
  }
) {
  try {
    const client = await mongoClient
    const db = client.db(appConfig.mongodb.dbName)

    const reseller = await db.collection("resellers").findOne({ userId })
    if (!reseller) {
      return { success: false, error: "Reseller tidak ditemukan" }
    }

    if (reseller.walletBalance < withdrawalData.amount) {
      return { success: false, error: "Saldo tidak cukup" }
    }

    // Minimum withdrawal
    if (withdrawalData.amount < 50000) {
      return { success: false, error: "Minimum penarikan Rp 50.000" }
    }

    const withdrawal: ResellerWithdrawal = {
      resellerId: reseller._id!.toString(),
      amount: withdrawalData.amount,
      bankAccount: withdrawalData.bankAccount,
      status: "pending",
      requestedAt: new Date(),
    }

    const result = await db.collection("reseller_withdrawals").insertOne(withdrawal)

    // Deduct from wallet
    await db.collection("resellers").updateOne(
      { _id: reseller._id },
      {
        $inc: { walletBalance: -withdrawalData.amount },
        $set: { updatedAt: new Date() },
      }
    )

    return { success: true, withdrawalId: result.insertedId.toString() }
  } catch (error) {
    console.error("Request withdrawal error:", error)
    return { success: false, error: "Gagal membuat request penarikan" }
  }
}

/**
 * Get withdrawal history
 */
export async function getWithdrawalHistory(userId: string) {
  try {
    const client = await mongoClient
    const db = client.db(appConfig.mongodb.dbName)

    const reseller = await db.collection("resellers").findOne({ userId })
    if (!reseller) return []

    const withdrawals = await db
      .collection("reseller_withdrawals")
      .find({ resellerId: reseller._id!.toString() })
      .sort({ requestedAt: -1 })
      .toArray()

    return withdrawals
  } catch (error) {
    console.error("Get withdrawal history error:", error)
    return []
  }
}

/**
 * Get commission history
 */
export async function getCommissionHistory(userId: string, limit: number = 30) {
  try {
    const client = await mongoClient
    const db = client.db(appConfig.mongodb.dbName)

    const reseller = await db.collection("resellers").findOne({ userId })
    if (!reseller) return []

    const history = await db
      .collection("commission_history")
      .find({ resellerId: reseller._id!.toString() })
      .sort({ createdAt: -1 })
      .limit(limit)
      .toArray()

    return history
  } catch (error) {
    console.error("Get commission history error:", error)
    return []
  }
}

/**
 * Get referral link untuk reseller
 */
export async function getResellerReferralLink(userId: string) {
  try {
    const client = await mongoClient
    const db = client.db(appConfig.mongodb.dbName)

    const reseller = await db.collection("resellers").findOne({ userId })
    if (!reseller) return null

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"
    const referralLink = `${baseUrl}/reseller/${reseller._id!.toString()}`

    return referralLink
  } catch (error) {
    console.error("Get referral link error:", error)
    return null
  }
}

/**
 * Apply referral code ke reseller
 */
export async function applyResellerReferralCode(referrerId: string, customerUsername: string, customerEmail?: string) {
  try {
    const client = await mongoClient
    const db = client.db(appConfig.mongodb.dbName)

    const query: any = {}
    if (ObjectId.isValid(referrerId)) {
      query._id = new ObjectId(referrerId)
    } else {
      query.userId = referrerId
    }

    const referrer = await db.collection("resellers").findOne(query)

    if (!referrer) {
      return { success: false, error: "Referral code tidak valid" }
    }

    const bonusAmount = 10000 // Rp 10.000
    await db.collection("resellers").updateOne(
      { _id: referrer._id },
      {
        $inc: { walletBalance: bonusAmount, totalEarnings: bonusAmount },
        $set: { updatedAt: new Date() },
      }
    )

    await db.collection("commission_history").insertOne({
      resellerId: referrer._id!.toString(),
      amount: bonusAmount,
      type: "bonus",
      description: `Bonus referral dari ${customerUsername}`,
      createdAt: new Date(),
    })

    return { success: true }
  } catch (error) {
    console.error("Apply referral code error:", error)
    return { success: false, error: "Gagal apply referral code" }
  }
}

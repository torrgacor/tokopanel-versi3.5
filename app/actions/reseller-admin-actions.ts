"use server"

import mongoClient from "@/lib/mongodb"
import { appConfig } from "@/data/config"
import { ObjectId } from "mongodb"

/**
 * Create base collections dan indexes untuk reseller
 */
export async function initializeResellerCollections() {
  try {
    const client = await mongoClient
    const db = client.db(appConfig.mongodb.dbName)

    // Create collections if not exist
    const collections = await db.listCollections().toArray()
    const collectionNames = collections.map((c) => c.name)

    if (!collectionNames.includes("resellers")) {
      await db.createCollection("resellers")
      await db.collection("resellers").createIndex({ userId: 1 }, { unique: true })
      await db.collection("resellers").createIndex({ status: 1 })
      await db.collection("resellers").createIndex({ createdAt: -1 })
    }

    if (!collectionNames.includes("reseller_packages")) {
      await db.createCollection("reseller_packages")
      await db.collection("reseller_packages").createIndex({ resellerId: 1 })
      await db.collection("reseller_packages").createIndex({ planId: 1 })
      await db.collection("reseller_packages").createIndex({ status: 1 })
    }

    if (!collectionNames.includes("reseller_sales")) {
      await db.createCollection("reseller_sales")
      await db.collection("reseller_sales").createIndex({ resellerId: 1 })
      await db.collection("reseller_sales").createIndex({ status: 1 })
      await db.collection("reseller_sales").createIndex({ createdAt: -1 })
    }

    if (!collectionNames.includes("reseller_withdrawals")) {
      await db.createCollection("reseller_withdrawals")
      await db.collection("reseller_withdrawals").createIndex({ resellerId: 1 })
      await db.collection("reseller_withdrawals").createIndex({ status: 1 })
      await db.collection("reseller_withdrawals").createIndex({ requestedAt: -1 })
    }

    if (!collectionNames.includes("commission_history")) {
      await db.createCollection("commission_history")
      await db.collection("commission_history").createIndex({ resellerId: 1 })
      await db.collection("commission_history").createIndex({ type: 1 })
      await db.collection("commission_history").createIndex({ createdAt: -1 })
    }

    return { success: true, message: "Collections initialized" }
  } catch (error) {
    console.error("Initialize collections error:", error)
    return { success: false, error: "Gagal inisialisasi collections" }
  }
}

/**
 * Check if user is registered as reseller
 */
export async function isUserReseller(userId: string): Promise<boolean> {
  try {
    const client = await mongoClient
    const db = client.db(appConfig.mongodb.dbName)

    const reseller = await db.collection("resellers").findOne({ userId })
    return !!reseller
  } catch (error) {
    console.error("Check reseller error:", error)
    return false
  }
}

/**
 * Get total sales dari semua reseller (untuk admin)
 */
export async function getTotalResellerStats() {
  try {
    const client = await mongoClient
    const db = client.db(appConfig.mongodb.dbName)

    const resellers = await db
      .collection("resellers")
      .aggregate([
        {
          $group: {
            _id: null,
            totalResellers: { $sum: 1 },
            totalEarnings: { $sum: "$totalEarnings" },
            totalSales: { $sum: "$totalSales" },
            totalCustomers: { $sum: "$totalCustomers" },
          },
        },
      ])
      .toArray()

    return resellers[0] || { totalResellers: 0, totalEarnings: 0, totalSales: 0, totalCustomers: 0 }
  } catch (error) {
    console.error("Get total reseller stats error:", error)
    return null
  }
}

/**
 * Get top resellers
 */
export async function getTopResellers(limit: number = 10) {
  try {
    const client = await mongoClient
    const db = client.db(appConfig.mongodb.dbName)

    const topResellers = await db
      .collection("resellers")
      .find({ status: "active" })
      .sort({ totalEarnings: -1 })
      .limit(limit)
      .toArray()

    return topResellers
  } catch (error) {
    console.error("Get top resellers error:", error)
    return []
  }
}

/**
 * Admin: Verify reseller
 */
export async function verifyReseller(resellerId: string) {
  try {
    const client = await mongoClient
    const db = client.db(appConfig.mongodb.dbName)

    const result = await db.collection("resellers").updateOne(
      { _id: new ObjectId(resellerId) },
      {
        $set: {
          verificationStatus: "verified",
          updatedAt: new Date(),
        },
      }
    )

    return { success: result.modifiedCount > 0 }
  } catch (error) {
    console.error("Verify reseller error:", error)
    return { success: false }
  }
}

/**
 * Admin: Reject reseller verification
 */
export async function rejectResellerVerification(resellerId: string, reason: string) {
  try {
    const client = await mongoClient
    const db = client.db(appConfig.mongodb.dbName)

    const result = await db.collection("resellers").updateOne(
      { _id: new ObjectId(resellerId) },
      {
        $set: {
          verificationStatus: "rejected",
          rejectionReason: reason,
          updatedAt: new Date(),
        },
      }
    )

    return { success: result.modifiedCount > 0 }
  } catch (error) {
    console.error("Reject reseller error:", error)
    return { success: false }
  }
}

/**
 * Admin: Update reseller commission rate
 */
export async function updateResellerCommissionRate(resellerId: string, rate: number) {
  try {
    if (rate < 0 || rate > 1) {
      return { success: false, error: "Rate harus antara 0-1 (0-100%)" }
    }

    const client = await mongoClient
    const db = client.db(appConfig.mongodb.dbName)

    const result = await db.collection("resellers").updateOne(
      { _id: new ObjectId(resellerId) },
      {
        $set: {
          commissionRate: rate,
          updatedAt: new Date(),
        },
      }
    )

    return { success: result.modifiedCount > 0 }
  } catch (error) {
    console.error("Update commission rate error:", error)
    return { success: false }
  }
}

/**
 * Admin: Suspend reseller
 */
export async function suspendReseller(resellerId: string, reason: string) {
  try {
    const client = await mongoClient
    const db = client.db(appConfig.mongodb.dbName)

    const result = await db.collection("resellers").updateOne(
      { _id: new ObjectId(resellerId) },
      {
        $set: {
          status: "suspended",
          suspensionReason: reason,
          updatedAt: new Date(),
        },
      }
    )

    return { success: result.modifiedCount > 0 }
  } catch (error) {
    console.error("Suspend reseller error:", error)
    return { success: false }
  }
}

/**
 * Admin: Reactivate reseller
 */
export async function reactivateReseller(resellerId: string) {
  try {
    const client = await mongoClient
    const db = client.db(appConfig.mongodb.dbName)

    const result = await db.collection("resellers").updateOne(
      { _id: new ObjectId(resellerId) },
      {
        $set: {
          status: "active",
          updatedAt: new Date(),
        },
        $unset: { suspensionReason: "" },
      }
    )

    return { success: result.modifiedCount > 0 }
  } catch (error) {
    console.error("Reactivate reseller error:", error)
    return { success: false }
  }
}

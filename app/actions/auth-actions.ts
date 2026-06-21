"use server"

import { randomBytes, pbkdf2Sync } from "crypto"
import { ObjectId } from "mongodb"
import mongoClient from "@/lib/mongodb"
import { appConfig } from "@/data/config"

const SESSION_DURATION_MS = 1000 * 60 * 60 * 24 * 7 // 7 hari
const SALT_LENGTH = 16
const ITERATIONS = 310000
const KEYLEN = 32
const DIGEST = "sha256"

function hashPassword(password: string, salt: string) {
  return pbkdf2Sync(password, salt, ITERATIONS, KEYLEN, DIGEST).toString("hex")
}

function createSalt() {
  return randomBytes(SALT_LENGTH).toString("hex")
}

function createSessionToken() {
  return randomBytes(32).toString("hex")
}

async function ensureAuthIndexes(db: any) {
  const collections = await db.listCollections().toArray()
  const collectionNames = collections.map((c: any) => c.name)

  if (!collectionNames.includes("reseller_users")) {
    await db.createCollection("reseller_users")
  }
  await db.collection("reseller_users").createIndex({ email: 1 }, { unique: true })
  await db.collection("reseller_users").createIndex({ username: 1 }, { unique: true })

  if (!collectionNames.includes("auth_sessions")) {
    await db.createCollection("auth_sessions")
  }
  await db.collection("auth_sessions").createIndex({ token: 1 }, { unique: true })
  await db.collection("auth_sessions").createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 })
}

export async function registerResellerUser(
  email: string,
  username: string,
  password: string
) {
  try {
    const client = await mongoClient
    const db = client.db(appConfig.mongodb.dbName)
    await ensureAuthIndexes(db)

    const normalizedEmail = email.trim().toLowerCase()
    const normalizedUsername = username.trim()
    const salt = createSalt()
    const passwordHash = hashPassword(password, salt)

    const result = await db.collection("reseller_users").insertOne({
      email: normalizedEmail,
      username: normalizedUsername,
      passwordHash,
      passwordSalt: salt,
      createdAt: new Date(),
      updatedAt: new Date(),
    })

    return { success: true, userId: result.insertedId.toString() }
  } catch (error: any) {
    console.error("Register reseller user error:", error)
    if (error?.code === 11000) {
      return { success: false, error: "Email atau username sudah terdaftar" }
    }
    return { success: false, error: "Gagal membuat akun" }
  }
}

export async function authenticateResellerUser(email: string, password: string) {
  try {
    const client = await mongoClient
    const db = client.db(appConfig.mongodb.dbName)

    const normalizedEmail = email.trim().toLowerCase()
    const user = await db.collection("reseller_users").findOne({ email: normalizedEmail })
    if (!user) {
      return { success: false, error: "Email atau password salah" }
    }

    const passwordHash = hashPassword(password, user.passwordSalt)
    if (passwordHash !== user.passwordHash) {
      return { success: false, error: "Email atau password salah" }
    }

    return {
      success: true,
      user: {
        userId: user._id.toString(),
        email: user.email,
        username: user.username,
      },
    }
  } catch (error) {
    console.error("Authenticate reseller user error:", error)
    return { success: false, error: "Gagal melakukan login" }
  }
}

export async function createSession(userId: string) {
  try {
    const client = await mongoClient
    const db = client.db(appConfig.mongodb.dbName)
    await ensureAuthIndexes(db)

    const token = createSessionToken()
    const expiresAt = new Date(Date.now() + SESSION_DURATION_MS)

    await db.collection("auth_sessions").insertOne({
      token,
      userId: new ObjectId(userId),
      createdAt: new Date(),
      expiresAt,
    })

    return { success: true, token, expiresAt }
  } catch (error) {
    console.error("Create session error:", error)
    return { success: false, error: "Gagal membuat sesi login" }
  }
}

export async function getSessionByToken(token: string) {
  try {
    const client = await mongoClient
    const db = client.db(appConfig.mongodb.dbName)

    const session = await db.collection("auth_sessions").findOne({ token })
    if (!session) {
      return null
    }

    if (session.expiresAt && session.expiresAt < new Date()) {
      await db.collection("auth_sessions").deleteOne({ token })
      return null
    }

    return session
  } catch (error) {
    console.error("Get session by token error:", error)
    return null
  }
}

export async function getUserBySessionToken(token: string) {
  try {
    const session = await getSessionByToken(token)
    if (!session) return null

    const client = await mongoClient
    const db = client.db(appConfig.mongodb.dbName)
    const user = await db.collection("reseller_users").findOne({ _id: new ObjectId(session.userId) })
    if (!user) return null

    return {
      userId: user._id.toString(),
      email: user.email,
      username: user.username,
    }
  } catch (error) {
    console.error("Get user by session token error:", error)
    return null
  }
}

export async function invalidateSession(token: string) {
  try {
    const client = await mongoClient
    const db = client.db(appConfig.mongodb.dbName)
    await db.collection("auth_sessions").deleteOne({ token })
    return { success: true }
  } catch (error) {
    console.error("Invalidate session error:", error)
    return { success: false, error: "Gagal logout" }
  }
}

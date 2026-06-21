# Dokumentasi Lengkap Fitur Reseller Panel Pterodactyl

## 📋 Daftar Isi
1. [Overview](#overview)
2. [Struktur Database](#struktur-database)
3. [Fitur-Fitur](#fitur-fitur)
4. [Setup & Integrasi](#setup--integrasi)
5. [API Routes](#api-routes)
6. [Server Actions](#server-actions)
7. [Components](#components)

---

## Overview

Sistem reseller panel Pterodactyl memungkinkan user untuk menjadi reseller dan menjual paket hosting dengan komisi otomatis. Fitur lengkap mencakup:

- ✅ Registrasi & Verifikasi Reseller
- ✅ Management Package dengan Harga Custom
- ✅ Tracking Penjualan & Komisi Real-time
- ✅ Sistem Wallet & Withdrawal
- ✅ Program Referral
- ✅ Admin Panel untuk Management

---

## Struktur Database

### Collections MongoDB

#### 1. **resellers**
```typescript
{
  _id: ObjectId
  userId: string (unique)
  username: string
  email: string
  phoneNumber: string
  businessName: string
  businessDescription: string
  commissionRate: number (0-1)
  walletBalance: number
  totalEarnings: number
  totalSales: number
  totalCustomers: number
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
```

#### 2. **reseller_packages**
```typescript
{
  _id: ObjectId
  resellerId: string (ref to resellers._id)
  planId: string
  planName: string
  basePrice: number
  resellPrice: number
  markup: number
  stock: number
  sold: number
  status: "active" | "inactive"
  createdAt: Date
  updatedAt: Date
}
```

#### 3. **reseller_sales**
```typescript
{
  _id: ObjectId
  resellerId: string
  customerId: string
  customerEmail: string
  customerUsername: string
  planId: string
  planName: string
  salePrice: number
  commission: number
  commissionRate: number
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
```

#### 4. **reseller_withdrawals**
```typescript
{
  _id: ObjectId
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
```

#### 5. **commission_history**
```typescript
{
  _id: ObjectId
  resellerId: string
  saleId: ObjectId
  amount: number
  type: "sale" | "bonus" | "adjustment"
  description: string
  createdAt: Date
}
```

---

## Fitur-Fitur

### 1. Registrasi Reseller
**File:** `components/reseller-registration.tsx`

- User dapat mendaftar sebagai reseller
- Mengisi data bisnis (nama, deskripsi, nomor telepon)
- Auto-create profil reseller dengan commission rate default 15%
- Status verifikasi awal: pending

### 2. Dashboard Reseller
**File:** `app/reseller/page.tsx`

Menampilkan:
- **Tab Ringkasan:** Stats, recent sales, commission history
- **Tab Penjualan:** Tabel riwayat penjualan dengan detail
- **Tab Package:** Management paket dengan stock
- **Tab Dompet:** Balance, history withdrawal, referral
- **Tab Pengaturan:** Profil, data bank, status

### 3. Management Package
**File:** `components/reseller-packages-card.tsx`

Fitur:
- Tambah package baru (plan ID, harga dasar, harga jual, stock)
- Edit stock package
- Lihat detail (basePrice, resellPrice, markup%)
- Status active/inactive

### 4. Sistem Penjualan & Komisi
**File:** `app/actions/reseller-actions.ts`

Fitur:
- Record penjualan otomatis dari purchase
- Hitung komisi berdasarkan commission rate
- Update wallet balance real-time
- Track total earnings & sales

### 5. Wallet & Withdrawal
**File:** `components/reseller-wallet-card.tsx`

Fitur:
- Lihat saldo wallet
- Request withdrawal (minimum Rp 50.000)
- Pilih metode bank
- Riwayat withdrawal
- Auto-deduct saldo saat request

### 6. Program Referral
**File:** `components/reseller-referral-card.tsx`

Fitur:
- Generate unique referral link
- Generate referral code
- Share via WhatsApp/Social
- Generate QR Code
- Bonus Rp 10.000 per referral

### 7. Admin Management
**File:** `app/admin/resellers/page.tsx` & `app/admin/withdrawals/page.tsx`

Fitur untuk Admin:
- Lihat semua reseller & statistik
- Verifikasi/reject reseller
- Update commission rate per reseller
- Suspend/reactivate reseller
- Approve/reject withdrawal requests
- Tambah bukti transfer

---

## Setup & Integrasi

### Step 1: Initialize Collections
Jalankan saat first-time setup:

```typescript
import { initializeResellerCollections } from "@/app/actions/reseller-admin-actions"

// Di startup atau admin page
await initializeResellerCollections()
```

### Step 2: Register User sebagai Reseller
```typescript
import { initializeReseller } from "@/app/actions/reseller-actions"

const result = await initializeReseller(userId, {
  username: "user123",
  email: "user@example.com",
  phoneNumber: "08123456789",
  businessName: "Toko Panel",
  businessDescription: "Jual panel hosting..."
})
```

### Step 3: Record Penjualan dari Reseller
Saat payment completed, tambahkan:

```typescript
import { recordResellerSale } from "@/app/actions/reseller-actions"

// Check apakah customer punya referrer (ref param)
const referralCode = searchParams.ref

if (referralCode) {
  await recordResellerSale(referralCode, {
    customerId: userId,
    customerEmail: email,
    customerUsername: username,
    planId: planId,
    planName: planName,
    salePrice: salePrice,
    transactionId: transactionId,
    panelDetails: { username, password, domain }
  })
}
```

### Step 4: Update Create-Panel Action
Integrasi dengan `app/actions/create-panel.ts`:

```typescript
// Di dalam createPanel function
if (data.resellerId) {
  await recordResellerSale(data.resellerId, {
    customerId: userResponse.attributes?.id.toString() || "",
    customerEmail: email,
    customerUsername: username,
    planId: planId,
    planName: planName,
    salePrice: data.salePrice,
    transactionId: data.idtransaksi,
    panelDetails: {
      username: username,
      password: password,
      domain: pterodactyl.domain
    }
  })
}
```

---

## API Routes

### 1. GET /api/admin/resellers
Ambil semua reseller

```typescript
// Response
{
  success: true,
  data: [{ reseller object }, ...],
  count: number
}
```

### 2. GET /api/admin/withdrawals
Ambil withdrawal requests

```typescript
// Query params
?status=pending | processing | completed | rejected

// Response
{
  success: true,
  data: [{ withdrawal object }, ...],
  count: number
}
```

### 3. PUT /api/admin/withdrawals
Update withdrawal status

```typescript
// Request body
{
  withdrawalId: string,
  status: "completed" | "rejected",
  rejectionReason?: string,
  proofUrl?: string
}
```

### 4. GET /api/reseller/[id]
Ambil info publik reseller

```typescript
// Response
{
  success: true,
  data: {
    _id, username, businessName, 
    businessDescription, totalSales, 
    totalCustomers, status, createdAt
  }
}
```

---

## Server Actions

### Reseller Actions
- `initializeReseller()` - Buat profil reseller baru
- `getResellerProfile()` - Ambil profil reseller
- `updateResellerProfile()` - Update profil
- `addResellerPackage()` - Tambah package
- `getResellerPackages()` - Ambil packages
- `updatePackageStock()` - Update stock
- `recordResellerSale()` - Record penjualan
- `getResellerSales()` - Ambil riwayat sales
- `getResellerStatistics()` - Ambil statistics
- `requestWithdrawal()` - Request withdrawal
- `getWithdrawalHistory()` - Ambil withdrawal history
- `getCommissionHistory()` - Ambil commission history
- `getResellerReferralLink()` - Ambil referral link
- `applyResellerReferralCode()` - Apply referral code

### Admin Actions
- `initializeResellerCollections()` - Setup collections
- `isUserReseller()` - Check if user adalah reseller
- `getTotalResellerStats()` - Total stats semua reseller
- `getTopResellers()` - Top 10 resellers
- `verifyReseller()` - Verifikasi reseller
- `rejectResellerVerification()` - Reject verification
- `updateResellerCommissionRate()` - Update commission rate
- `suspendReseller()` - Suspend reseller
- `reactivateReseller()` - Reactivate reseller

---

## Components

### Reseller Components
- `ResellerStatsGrid` - Menampilkan stats (earnings, sales, customers)
- `ResellerSalesTable` - Tabel riwayat penjualan dengan detail
- `ResellerWalletCard` - Wallet & withdrawal
- `ResellerPackagesCard` - Management package
- `ResellerWithdrawalHistory` - Riwayat withdrawal
- `ResellerReferralCard` - Program referral
- `ResellerRegistration` - Form registrasi reseller

---

## Important Notes

1. **Commission Rate** Default 15% (0.15), bisa di-update per reseller
2. **Minimum Withdrawal** Rp 50.000
3. **Referral Bonus** Rp 10.000 per referral
4. **Indexing** Sudah ada di initialize collections
5. **Email Integration** Tambahkan notifikasi email untuk withdrawal approval
6. **Session** Ganti "current-user-id" dengan actual user ID dari session

---

## Todo untuk Implementasi

- [ ] Integrasi session/auth untuk get current user ID
- [ ] Tambah email notification untuk withdrawal approval
- [ ] Tambah SMS notification untuk penjualan
- [ ] Implementasi Telegram bot notification
- [ ] Add pagination untuk tables
- [ ] Add export CSV untuk admin
- [ ] Add analytics chart
- [ ] Add tier system untuk reseller (Bronze, Silver, Gold)
- [ ] Add bonus system untuk reach targets

---

**Created:** 2024
**Version:** 1.0.0
**Status:** Ready for Implementation

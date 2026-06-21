# Setup & Implementasi Fitur Reseller

## 🚀 Quick Start

### 1. Install Dependencies
Pastikan semua dependencies sudah ter-install:

```bash
npm install qrcode.react
```

### 2. Initialize Collections
Jalankan ini saat pertama kali atau di startup:

```typescript
// pages/api/setup.ts atau di route handler
import { initializeResellerCollections } from "@/app/actions/reseller-admin-actions"

export async function GET() {
  const result = await initializeResellerCollections()
  return Response.json(result)
}

// Atau manual call di admin page
```

### 3. Configure Session/Auth

Ganti `userId` placeholder dengan session user ID. Contoh dengan NextAuth:

```typescript
// app/reseller/page.tsx
"use client"

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect } from "react"

export default function ResellerDashboard() {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login")
    }
  }, [status])

  if (status === "loading") return <LoadingScreen />

  const userId = session?.user?.id // Ganti userId dengan ini

  // ... rest of component
}
```

### 4. Update Create-Panel Action

Integrasi recording reseller sale di `app/actions/create-panel.ts`:

```typescript
"use server"

import { recordResellerSale } from "@/app/actions/reseller-actions"

export async function createPanel(data: PanelData) {
  try {
    // ... existing code ...

    const panelDetails = {
      username: username,
      password: password,
      domain: pterodactyl.domain
    }

    // Check if customer came from reseller referral
    const referrerId = data.referrerId // Add this to PanelData type

    if (referrerId) {
      // Record sale ke reseller
      await recordResellerSale(referrerId, {
        customerId: userId,
        customerEmail: email,
        customerUsername: username,
        planId: planId,
        planName: planName,
        salePrice: totalPrice,
        transactionId: data.idtransaksi,
        panelDetails: panelDetails
      })
    }

    // ... send email, telegram, etc ...
  } catch (error) {
    // error handling
  }
}
```

### 5. Update Payment Check

Di `app/actions/check-payment.ts`, tambahkan reseller tracking:

```typescript
export async function checkPaymentStatus(transactionId: string) {
  try {
    // ... existing payment check ...

    if (payment.status === "completed") {
      // If reseller sale, update status
      if (payment.resellerId) {
        await recordResellerSale(payment.resellerId, {
          // ... sale data
          status: "completed"
        })
      }

      // ... existing logic ...
    }
  } catch (error) {
    // error handling
  }
}
```

---

## 📱 Integrasi di Page Existing

### Update Main Page (app/page.tsx)

Tambahkan button untuk reseller di navbar/landing:

```typescript
// In navbar atau landing page
import Link from "next/link"
import { Button } from "@/components/ui/button"

export function ResellerCTA() {
  return (
    <div className="flex gap-2">
      <Link href="/reseller/register">
        <Button variant="outline">Menjadi Reseller</Button>
      </Link>
      <Link href="/reseller">
        <Button>Dashboard Reseller</Button>
      </Link>
    </div>
  )
}
```

### Update Checkout Page

Tambahkan referral tracking:

```typescript
// app/page.tsx atau checkout component

import { useSearchParams } from "next/navigation"

export function CheckoutPage() {
  const searchParams = useSearchParams()
  const referrerId = searchParams.get("ref") // Get referral code

  // Pass ke createPanel action
  await createPanel({
    ...data,
    referrerId: referrerId // Add ini
  })
}
```

---

## 🔧 Environment Variables

Tambahkan ke `.env.local`:

```env
# Reseller settings
NEXT_PUBLIC_RESELLER_COMMISSION_RATE=0.15
NEXT_PUBLIC_MIN_WITHDRAWAL=50000

# Optional: Email notification
RESELLER_EMAIL_SENDER=noreply@yourdomain.com
```

---

## 📊 Admin Dashboard Links

Tambahkan ke admin sidebar/menu:

```typescript
// components/admin-sidebar.tsx

export const adminMenus = [
  {
    label: "Reseller Management",
    href: "/admin/resellers",
    icon: "Users"
  },
  {
    label: "Withdrawal Requests",
    href: "/admin/withdrawals",
    icon: "Wallet"
  },
  {
    label: "Reseller Analytics",
    href: "/admin/reseller-analytics",
    icon: "BarChart"
  }
]
```

---

## 📧 Email Templates (Optional)

### Reseller Registration Confirmation

```typescript
// lib/email-service.ts

export async function sendResellerRegistrationEmail(reseller: ResellerProfile) {
  const html = `
    <h2>Selamat datang sebagai Reseller!</h2>
    <p>Bisnis Anda: ${reseller.businessName}</p>
    <p>Commission Rate: ${(reseller.commissionRate * 100).toFixed(1)}%</p>
    <p>
      <a href="${process.env.NEXT_PUBLIC_BASE_URL}/reseller">
        Masuk Dashboard Reseller
      </a>
    </p>
  `

  await sendEmail({
    to: reseller.email,
    subject: "Welcome - Reseller Panel",
    html
  })
}
```

### Withdrawal Approved

```typescript
export async function sendWithdrawalApprovedEmail(
  reseller: ResellerProfile,
  withdrawal: ResellerWithdrawal
) {
  const html = `
    <h2>Withdrawal Approved!</h2>
    <p>Jumlah: Rp ${withdrawal.amount.toLocaleString('id-ID')}</p>
    <p>Bank: ${withdrawal.bankAccount.bankName}</p>
    <p>Rekening: ${withdrawal.bankAccount.accountNumber}</p>
    <p>Transfer akan dilakukan dalam 1-2 jam kerja</p>
  `

  await sendEmail({
    to: reseller.email,
    subject: "Withdrawal Approved",
    html
  })
}
```

---

## 🧪 Testing

### Test Reseller Registration

```typescript
// Test di console atau Postman

const userId = "test-user-123"
const result = await initializeReseller(userId, {
  username: "testreseller",
  email: "test@example.com",
  phoneNumber: "08123456789",
  businessName: "Test Shop",
  businessDescription: "Test description"
})

console.log(result)
// Expected: { success: true, resellerId: "..." }
```

### Test Record Sale

```typescript
const result = await recordResellerSale(resellerId, {
  customerId: "customer-123",
  customerEmail: "customer@example.com",
  customerUsername: "customer",
  planId: "2gb",
  planName: "PANEL BOT 2GB",
  salePrice: 4000,
  transactionId: "TRX123456",
  panelDetails: {
    username: "panel_user",
    password: "pass123",
    domain: "panel.example.com"
  }
})

console.log(result)
// Expected: { success: true, saleId: "..." }
```

### Test Withdrawal

```typescript
const result = await requestWithdrawal(resellerId, {
  amount: 100000,
  bankAccount: {
    bankName: "BCA",
    accountNumber: "1234567890",
    accountHolder: "John Doe"
  }
})

console.log(result)
// Expected: { success: true, withdrawalId: "..." }
```

---

## 🐛 Common Issues & Solutions

### Issue 1: "Reseller tidak ditemukan"
**Solusi:** Pastikan `userId` sudah ter-initialize sebagai reseller terlebih dahulu

### Issue 2: "Saldo tidak cukup untuk withdrawal"
**Solusi:** Pastikan reseller punya earnings dari penjualan terlebih dahulu

### Issue 3: Collections tidak ada
**Solusi:** Jalankan `initializeResellerCollections()` di startup atau manual access API

### Issue 4: Commission tidak ter-record
**Solusi:** Pastikan `recordResellerSale()` dipanggil di payment success handler

---

## ✅ Checklist Before Production

- [ ] Setup semua collections di MongoDB
- [ ] Configure session/auth integration
- [ ] Update create-panel action dengan reseller recording
- [ ] Add reseller routes ke navbar/menu
- [ ] Setup email notifications
- [ ] Test reseller registration flow
- [ ] Test penjualan & komisi recording
- [ ] Test withdrawal request & approval
- [ ] Test referral system
- [ ] Setup admin access ke management pages
- [ ] Configure commission rates per reseller
- [ ] Setup backup & monitoring

---

## 📞 Support & Customization

Jika perlu customization:

1. **Custom Commission Rate** - Edit di `RESELLER_COMMISSION_RATE` atau per reseller
2. **Min Withdrawal Amount** - Edit di `requestWithdrawal()` function
3. **Referral Bonus** - Edit di `applyResellerReferralCode()` function
4. **Email Notifications** - Implement di email-service.ts
5. **Additional Fields** - Extend type di types/reseller.ts

---

**Last Updated:** 2024
**Version:** 1.0.0

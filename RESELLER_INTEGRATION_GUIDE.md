# Panduan Integrasi Fitur Reseller ke System Existing

## 🎯 Overview Integrasi

Sistem reseller akan terintegrasi dengan flow purchasing yang sudah ada:
1. User beli paket → Panel Pterodactyl ter-create → **Komisi ke Reseller** (jika dari referral)
2. Reseller dapat management package dan withdraw komisi
3. Admin dapat manage reseller dan verify withdrawal

---

## 📋 Step-by-Step Integration

### Step 1: Setup Collections MongoDB

Jalankan initialization di startup atau setup page:

```typescript
// app/api/setup/reseller/route.ts (create baru)
import { initializeResellerCollections } from "@/app/actions/reseller-admin-actions"

export async function GET(request: NextRequest) {
  // Protect dengan auth check
  const result = await initializeResellerCollections()
  return NextResponse.json(result)
}

// Atau manual di console:
// await initializeResellerCollections()
```

### Step 2: Update Types

Add referrerId ke `PanelData` type di `app/actions/create-panel.ts`:

```typescript
type PanelData = {
  idtransaksi: string
  username: string
  email: string
  memory: number
  disk: number
  cpu: number
  planId: string
  serverType: ServerType
  accessType: AccessType
  createdAt: string
  selectedEggId?: number
  quantity: number
  
  // ADD THESE LINES
  referrerId?: string  // Reseller ID if customer datang dari referral
  salePrice?: number   // Final price yang dibayar customer
}
```

### Step 3: Capture Referral Code dari URL

Update page.tsx atau checkout component:

```typescript
"use client"

import { useSearchParams } from "next/navigation"
import { useEffect, useState } from "react"

export function CheckoutSection() {
  const searchParams = useSearchParams()
  const [referrerId, setReferrerId] = useState<string | null>(null)

  useEffect(() => {
    // Capture referral code dari URL parameter "ref"
    const ref = searchParams.get("ref")
    if (ref) {
      setReferrerId(ref)
      // Bisa juga store ke localStorage untuk tracking
      localStorage.setItem("referrerId", ref)
    }
  }, [searchParams])

  // Pass referrerId ke payment/createPanel function
  const handleCheckout = async () => {
    const result = await createPayment({
      ...data,
      referrerId: referrerId || undefined
    })
  }

  return (
    <div>
      {referrerId && (
        <div className="p-4 bg-blue-50 rounded-lg mb-4">
          <p className="text-sm">Anda membeli melalui referral</p>
        </div>
      )}
      {/* ... rest of checkout ... */}
    </div>
  )
}
```

### Step 4: Update createPayment Action

Modify `app/actions/create-payment.ts` untuk store referrerId:

```typescript
"use server"

import { savePayment, PaymentData } from "@/lib/payment-db"

type CreatePaymentData = {
  // ... existing fields ...
  referrerId?: string
  salePrice?: number
}

export async function createPayment(data: CreatePaymentData) {
  try {
    // ... existing payment logic ...

    const paymentData: PaymentData = {
      // ... existing fields ...
      
      // ADD THESE
      referrerId: data.referrerId,
      salePrice: data.salePrice,
      
      // ... rest of data ...
    }

    const result = await savePayment(paymentData)
    return result
  } catch (error) {
    // error handling
  }
}
```

### Step 5: Update createPanel Action

Integrate reseller sale recording di `app/actions/create-panel.ts`:

```typescript
"use server"

import { createPanel as originalCreatePanel } from "@/lib/pterodactyl"
import { recordResellerSale } from "@/app/actions/reseller-actions"
import { Pterodactyl } from "@/lib/pterodactyl"
import { generatePassword } from "@/lib/utils"
import { sendPanelDetailsEmail } from "@/lib/email-service"

export async function createPanel(data: PanelData) {
  try {
    const {
      idtransaksi,
      username,
      email,
      memory,
      disk,
      cpu,
      planId,
      serverType,
      accessType,
      createdAt,
      selectedEggId,
      quantity,
      referrerId,    // ADD THIS
      salePrice,     // ADD THIS
    } = data

    const password = generatePassword(10)
    const pterodactyl = new Pterodactyl(serverType, accessType)

    console.log(`[${serverType.toUpperCase()}] Creating user ${username}`)

    // Create user di Pterodactyl
    const userResponse = await pterodactyl.createUser(
      username,
      // ... rest params
    )

    if (!userResponse.attributes?.id) {
      throw new Error("Failed to create Pterodactyl user")
    }

    const userId = userResponse.attributes.id.toString()

    // Create server
    const serverResponse = await pterodactyl.createServer(
      userId,
      username,
      memory,
      disk,
      cpu,
      selectedEggId || pterodactyl.defaultEggId,
      // ... rest params
    )

    // TAMBAHKAN BLOCK INI - Record reseller sale
    if (referrerId && salePrice) {
      const saleResult = await recordResellerSale(referrerId, {
        customerId: userId,
        customerEmail: email,
        customerUsername: username,
        planId: planId,
        planName: plans.find(p => p.id === planId)?.name || planId,
        salePrice: salePrice,
        transactionId: idtransaksi,
        panelDetails: {
          username: username,
          password: password,
          domain: pterodactyl.domain
        }
      })

      console.log(`[RESELLER] Sale recorded for reseller ${referrerId}:`, saleResult)
    }

    // Send email dengan panel details
    await sendPanelDetailsEmail(
      email,
      username,
      password,
      pterodactyl.domain,
      username
    )

    return {
      success: true,
      message: "Panel berhasil dibuat",
      panelDetails: {
        username,
        password,
        domain: pterodactyl.domain,
        serverId: serverResponse.attributes?.id,
      },
    }
  } catch (error) {
    console.error("Create panel error:", error)
    return { success: false, error: "Gagal membuat panel" }
  }
}
```

### Step 6: Update checkPaymentStatus Action

Ensure referral tracking di `app/actions/check-payment.ts`:

```typescript
"use server"

import { getPayment, updatePaymentStatus } from "./create-payment"
import { recordResellerSale } from "./reseller-actions"
import { createPanel } from "./create-panel"

export async function checkPaymentStatus(transactionId: string) {
  try {
    const payment = await getPayment(transactionId)
    if (!payment) {
      return { success: false, error: "Pembayaran tidak ditemukan" }
    }

    if (payment.status === "completed") {
      // Check if sudah ada referrer tracking
      if (payment.referrerId && !payment.resellSaleRecorded) {
        // Record penjualan ke reseller jika belum
        await recordResellerSale(payment.referrerId, {
          customerId: payment.userId,
          customerEmail: payment.email,
          customerUsername: payment.username,
          planId: payment.planId,
          planName: payment.planName,
          salePrice: payment.salePrice || payment.totalAmount,
          transactionId: transactionId,
        })

        // Update payment record
        await updatePaymentStatus(transactionId, "completed", {
          resellSaleRecorded: true,
        })
      }

      return {
        success: true,
        status: "completed",
        panelDetails: payment.panelDetails,
      }
    }

    // ... rest of payment check logic ...
  } catch (error) {
    // error handling
  }
}
```

### Step 7: Update Navbar/Navigation

Add reseller links ke navbar:

```typescript
// components/navbar.tsx atau layout

import Link from "next/link"
import { useSession } from "next-auth/react"

export function Navbar() {
  const { data: session } = useSession()

  return (
    <nav>
      {/* ... existing nav items ... */}

      {session?.user && (
        <div className="flex gap-2">
          <Link href="/reseller">
            <Button variant="outline" size="sm">
              Dashboard Reseller
            </Button>
          </Link>
          <Link href="/reseller/register">
            <Button size="sm">
              Menjadi Reseller
            </Button>
          </Link>
        </div>
      )}
    </nav>
  )
}
```

### Step 8: Update Admin Sidebar

Add admin reseller management links:

```typescript
// components/admin-sidebar.tsx

export const adminRoutes = [
  {
    label: "Dashboard",
    href: "/admin",
    icon: "LayoutDashboard"
  },
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
    label: "Transactions",
    href: "/admin/transactions",
    icon: "CreditCard"
  },
  // ... rest of admin routes ...
]
```

---

## 🔄 Data Flow Diagram

```
┌─────────────────────────────────────────────────────────┐
│ 1. User Visit dengan Referral Link                       │
│    URL: /checkout?ref=RESELLER_ID                       │
└────────────┬────────────────────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────────────────────┐
│ 2. Checkout & Payment                                   │
│    - Store referrerId in payment data                   │
│    - Store finalPrice as salePrice                      │
└────────────┬────────────────────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────────────────────┐
│ 3. Payment Success                                       │
│    - checkPaymentStatus() triggered                      │
│    - createPanel() executed                             │
└────────────┬────────────────────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────────────────────┐
│ 4. Record Reseller Sale                                 │
│    - Calculate commission                               │
│    - Update reseller wallet                             │
│    - Log transaction                                    │
└────────────┬────────────────────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────────────────────┐
│ 5. Reseller Dashboard                                   │
│    - New earnings visible                               │
│    - Can withdraw saldo                                 │
│    - Can share referral link                            │
└─────────────────────────────────────────────────────────┘
```

---

## 🧪 Testing Flow

### Test 1: Referral Purchase

```bash
# 1. Get reseller ID
https://yoursite.com/admin/resellers
# Copy reseller ID: abc123...

# 2. Visit checkout dengan referral
https://yoursite.com/checkout?ref=abc123

# 3. Complete payment
# Check reseller dashboard, earnings should increase

# 4. Verify di database
db.reseller_sales.find({ resellerId: "abc123" })
```

### Test 2: Withdrawal Request

```bash
# 1. Login as reseller
# 2. Go to /reseller
# 3. Tab "Dompet" → "Tarik Saldo"
# 4. Fill form & submit
# 5. Check admin panel /admin/withdrawals
# 6. Approve request
# 7. Check payment received
```

### Test 3: Referral Bonus

```bash
# 1. Get referral code: abc123
# 2. User B apply code
await applyResellerReferralCode("user_b_id", "abc123")

# 3. Check Reseller A earnings +10000
db.commission_history.find({ type: "bonus" })
```

---

## ⚡ Performance Optimization

### Indexes (Already Created)
```javascript
// Resellers
db.resellers.createIndex({ userId: 1 }, { unique: true })
db.resellers.createIndex({ status: 1 })
db.resellers.createIndex({ createdAt: -1 })

// Sales
db.reseller_sales.createIndex({ resellerId: 1 })
db.reseller_sales.createIndex({ status: 1 })
db.reseller_sales.createIndex({ createdAt: -1 })

// Withdrawals
db.reseller_withdrawals.createIndex({ resellerId: 1 })
db.reseller_withdrawals.createIndex({ status: 1 })
db.reseller_withdrawals.createIndex({ requestedAt: -1 })
```

### Query Optimization
```typescript
// BAD - Multiple queries
const reseller = await getResellerProfile(userId)
const sales = await getResellerSales(userId)
const stats = await getResellerStatistics(userId)

// GOOD - Parallel queries
const [reseller, sales, stats] = await Promise.all([
  getResellerProfile(userId),
  getResellerSales(userId),
  getResellerStatistics(userId)
])
```

---

## 🔐 Security Considerations

1. **Validate referrerId** - Check if reseller exists & verified
2. **Validate amounts** - Commission calculation must be correct
3. **Rate limiting** - Prevent abuse on withdrawal requests
4. **Authorization** - Only own reseller can see own data
5. **Audit logs** - Track admin actions
6. **Bank details** - Store securely (consider encryption)

---

## 📞 Troubleshooting

### Issue: Komisi tidak ter-record
**Check:**
- Referrer ID valid?
- recordResellerSale called?
- Payment status = completed?
- Database reseller exists?

### Issue: Withdrawal stuck pending
**Check:**
- Admin can see withdrawal?
- Amount valid?
- Bank account filled?
- Admin approval button works?

### Issue: Referral link not working
**Check:**
- URL parameter `ref` present?
- ReferrerId valid?
- URL encoded properly?

---

## ✅ Integration Checklist

- [ ] MongoDB collections initialized
- [ ] PanelData type updated dengan referrerId
- [ ] searchParams captured di checkout page
- [ ] createPayment stores referrerId
- [ ] createPanel calls recordResellerSale
- [ ] checkPaymentStatus handles referrer
- [ ] Navbar updated dengan reseller links
- [ ] Admin sidebar updated
- [ ] Session/auth integrated
- [ ] Tested referral purchase flow
- [ ] Tested withdrawal approval
- [ ] Admin can verify reseller
- [ ] Emails configured (optional)
- [ ] Ready for production

---

**Integration Guide Version:** 1.0.0
**Last Updated:** 2024

# Full-Stack Authentication & E-Commerce Core Services

A complete full-stack system featuring secure authentication workflows, robust e-commerce order exceptions (cancellations, returns, refunds), automated currency synchronization, and promo-code engines.

---

## 🚀 Key Modules & Capabilities

### 1. 🔐 Secure Authentication & Password Reset
- **Anti-Enumeration Protection**: Generic responses on user lookup to prevent user email harvesting.
- **Cryptographic Token Hashing**: Reset tokens are generated using `crypto.randomBytes` and stored as SHA-256 hashes in MongoDB.
- **Strict Expiry & Single-Use Enforcement**: Tokens expire in 15 minutes and are automatically invalidated upon first successful reset.
- **Automated Email Dispatch**: Integrated email service via Nodemailer for delivering verification & reset links.

### 2. 📦 Order Lifecycle & Exception Handling
- **Order Flow**: `createOrder` ➡️ `acceptOrder` ➡️ `assignDeliveryPartner` ➡️ `updateOrderStatus` (Shipped ➡️ Delivered).
- **Cancellation & Rejection**: Order rejection by admin (out of stock/unserviceable area) and user-initiated pre-dispatch cancellation with automated refund queuing.
- **Returns & Replacements**: Multi-step return verification (`requestReturn` ➡️ `reviewReturnRequest` ➡️ `processRefund` / `initiateReplacement`).

### 3. 💱 Multi-Currency Architecture
- **Automated Live Exchange Rates**: Cron/sync integration fetching real-time rates from external exchange APIs (`open.er-api.com`).
- **Exchange Rate Audit History**: Stores historical rate fluctuations in `CurrencyHistory` to ensure accurate accounting during returns and refunds.
- **Bulk Price Conversion & Fallbacks**: High-performance batch conversion with graceful fallback to default currency (USD).

### 4. 🎟️ Coupon & Promotional Engine
- Multi-tier validation: eligibility checks (new users, minimum order value, category-specific scopes).
- Usage limits per user with rollback support (`revertCouponUsage`) on order cancellation or transaction failure.

---

## 🛠️ Project Structure

```text
forgotPassword/
├── backend/
│   ├── controllers/      # Auth, Admin, Order, Product, Coupon, Currency controllers
│   ├── middlewares/      # JWT auth verification, schema validators
│   ├── models/           # Mongoose schemas (User, Order, Product, Cart, Coupon, Currency)
│   ├── routes/           # REST API routes
│   ├── utils/            # Email dispatch utilities
│   ├── workers/          # Background Excel generation workers
│   └── .env.example      # Sample environment variables
└── frontend/
    └── src/
        ├── app/          # Next.js App Router (Login, Signup, Reset Password, Admin, Checkout)
        ├── components/   # Reusable UI components
        └── services/     # Axios client & typed API services
```

---

## ⚙️ Getting Started

### Backend Setup:
```bash
cd backend
npm install
cp .env.example .env
# Fill in your local MongoDB URI and credentials
npm run dev # or node server.js
```

### Frontend Setup:
```bash
cd ../frontend
npm install
npm run dev
```

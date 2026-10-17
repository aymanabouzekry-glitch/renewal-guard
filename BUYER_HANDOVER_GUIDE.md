# 🚀 RenewalGuard — Enterprise Contract & Risk Management SaaS
## Official Buyer & Developer Handover Guide

Welcome to the **RenewalGuard** enterprise platform acquisition. This document outlines the architecture, setup, and deployment instructions for the new owner.

---

### 📋 1. Project Overview & Tech Stack
* **Framework:** Next.js (App Router, React 19)
* **Styling & UI:** Tailwind CSS v4, Framer Motion, Lucide Icons, Shadcn UI primitives
* **Authentication:** NextAuth.js (JWT session strategy, SHA-256 secure vault)
* **Multi-Tenant Isolation:** Client-side & Server-side workspace tenant vault segregation
* **Billing Gateway:** Multi-gateway checkout simulation (Stripe, InstaPay, Bank Wire, PayPal) with anti-fraud Luhn verification and admin approval desk.

---

### ⚙️ 2. Environment Variables Setup (`.env`)
Create a `.env` file in the root directory based on the following required keys:

```env
# Database Connection (PostgreSQL / Neon / Prisma)
DATABASE_URL="postgresql://user:password@host:port/dbname?sslmode=require"

# NextAuth Configuration
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secure-random-secret-key-here"

# Platform Owner Administration
NEXT_PUBLIC_OWNER_EMAIL="admin@yourcompany.com"

# Live Payment Gateway Webhooks (Optional for production)
NEXT_PUBLIC_STRIPE_PAYMENT_LINK=""
NEXT_PUBLIC_PAYPAL_CHECKOUT_URL=""
# Production Deployment & Self-Hosting Guide — RenewalGuard

## 1. Prerequisites
- Node.js 20+ or 22 LTS
- PostgreSQL 15+ (Neon Serverless PostgreSQL or self-hosted Docker PostgreSQL)

## 2. Environment Variables (`.env`)
Copy `.env.example` to `.env` and configure:
```env
DATABASE_URL="postgresql://user:password@host:5432/renewalguard?sslmode=require"
NEXTAUTH_SECRET="generate-via-openssl-rand-base64-32"
NEXTAUTH_URL="https://your-production-domain.com"
```

## 3. Installation & Database Migration
```bash
npm ci
npx drizzle-kit push
npm run build
npm run start
```

## 4. Docker Self-Hosting
```bash
docker compose up -d
```

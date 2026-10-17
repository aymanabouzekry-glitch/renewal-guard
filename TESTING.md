# Testing Strategy & Verification Commands — RenewalGuard

## 1. Automated Unit Tests
- **Framework:** Node.js Built-in Test Runner (`node:test`)
- **Command:** `node --test tests/renewal.test.mjs`
- **Coverage:**
  1. Future expiration dates (> 60 days) readiness score verification (100/100).
  2. Overdue document negative timeline calculation and score penalty (20/100).
  3. Active 30-day warning window calculation and score accuracy (75/100).
- **Latest Verified Result:** 3 tests, 3 passed, 0 failed (116.98ms).

## 2. Static Type & Production Build Verification
- **Command:** `npm run build`
- **Compiler:** Next.js 16.4.0 (Turbopack) + TypeScript Strict Mode.
- **Latest Verified Result:** Compiled successfully with zero TypeScript errors.

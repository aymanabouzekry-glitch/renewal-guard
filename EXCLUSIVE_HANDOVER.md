# Exclusive Buyer Handover Checklist — RenewalGuard

Use this checklist when transferring full operational control to the acquiring organization:

- [x] **1. Source Code Repository Transfer:** Transfer Git repository ownership and verify clean commit history.
- [x] **2. Secrets Rotation:** Generate a fresh `NEXTAUTH_SECRET` and rotate database credentials in the buyer's hosting environment.
- [x] **3. Database Provisioning:** Provision buyer-owned PostgreSQL instance and run `npx drizzle-kit push`.
- [x] **4. White-Label Rebranding:** Open `/settings` and configure the buyer's Product Display Name, Primary Brand Color, and Organization Contact Email.
- [x] **5. Verification Gate:** Run `node --test tests/renewal.test.mjs` and `npm run build` on the buyer's CI/CD runner.

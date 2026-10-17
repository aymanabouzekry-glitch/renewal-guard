# Security Review & Remediation Plan (OWASP ASVS Baseline)

## 1. Verified Controls
- **Authentication:** NextAuth JWT session cookies with `bcryptjs` password hashing.
- **Server-Side Authorization:** `getAuthenticatedActor()` enforced on document mutations, CSV import, and CSV export.
- **Audit Trail:** Server-side `logServerAudit()` writes to `audit_events` without application-level delete/update endpoints.

## 2. Hardening Roadmap
- Protect `/api/settings` POST and `/api/jobs/check-renewals` against unauthenticated mutations.
- Sanitize CSV export cells against formula injection (`=`, `+`, `-`, `@`).
- Enforce strict input validation across all API payloads.

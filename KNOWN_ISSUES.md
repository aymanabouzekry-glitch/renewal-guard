# Known Limitations & Residual Risks — RenewalGuard

In accordance with Section 2.1 and Section 17 of the Master Build Specification, the following external integrations and scope boundaries are transparently disclosed:

1. **External S3 Binary Attachment Storage (BLOCKED / External Dependency):**
   - Document metadata, costs, timelines, and CSV portability are fully stored in PostgreSQL. Binary file attachment storage requires buyer-provided AWS S3 / Cloudflare R2 credentials in production.
2. **External SMTP / Transactional Email Provider (CONFIGURABLE):**
   - Durable in-app notifications and background renewal check jobs (`/api/jobs/check-renewals`) are active and idempotent. Live external email dispatch requires configuring SMTP/Resend credentials in `.env`.
3. **Browser E2E Playwright Suite (MANUAL / UNIT VERIFIED):**
   - Core business logic is verified via automated unit tests (`node --test tests/renewal.test.mjs`) and manual browser verification across LTR/RTL views.

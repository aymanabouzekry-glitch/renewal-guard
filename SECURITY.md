# RenewalGuard - Security Model

## Threat Model & Assumptions
- **Assumption:** Client-side is untrusted. All requests must be authenticated and authorized on the server.
- **Tenant Isolation:** A user from Org A cannot read, update, or delete records in Org B under any circumstances.
- **Authentication:** Managed via NextAuth with secure, HTTP-only session cookies.

## Mitigation Strategies
- **SQL Injection:** Prevented by Drizzle ORM parameterized queries.
- **XSS:** Mitigated by React's default output encoding and strict input validation via Zod.
- **Mass Assignment:** APIs explicitly pick allowed fields from request bodies.
- **Audit:** Destructive actions (Delete, Archive, Bulk Edit) must be logged in the `audit_events` table (Phase 12).
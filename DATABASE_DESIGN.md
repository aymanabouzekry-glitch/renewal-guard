# RenewalGuard - Database Design

## Core Entities (Target Schema)
1. **users**: id, name, email, passwordHash, role, createdAt.
2. **organizations**: id, name, logo, settings, createdAt.
3. **organization_memberships**: userId, orgId, role.
4. **documents**: id, orgId, name, type, status, cost, dueDate, ownerId, createdAt, updatedAt.
5. **audit_events**: id, orgId, actorId, action, targetId, metadata, timestamp.
6. **tasks**: id, docId, assigneeId, status, dueDate.

## Rules & Constraints
- Soft deletion for critical records (documents).
- Every business record MUST contain an `orgId` to ensure Tenant Isolation.
- Cross-tenant queries are strictly forbidden.
- Dates stored as standard ISO timestamps.
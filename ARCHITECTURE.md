# RenewalGuard - Architecture & Stack

## Tech Stack (Oct 2026)
- **Framework:** Next.js 16.x (App Router)
- **Language:** TypeScript (Strict Mode)
- **Styling:** Tailwind CSS 4.x, shadcn/ui
- **Database:** PostgreSQL (Neon Serverless)
- **ORM:** Drizzle ORM
- **Auth:** NextAuth.js
- **Validation:** Zod
- **Forms:** React Hook Form

## System Boundaries
- **Client (Browser):** Presentation, layout, client-side validation, animation (Motion for React). No direct DB access.
- **Server (API Routes / Server Actions):** Business logic, NextAuth verification, database transactions.
- **Persistence:** Neon PostgreSQL.
- **Storage:** S3-Compatible object storage (To be implemented).

## Directory Structure Strategy
- `/src/app`: Routing and layout boundaries.
- `/src/components/ui`: Shared UI primitives (shadcn).
- `/src/components/layout`: Global shell components (Sidebar, Navbar).
- `/src/server`: Backend exclusive logic (`db`, `auth`).
# Database Backup & Restore Procedures — RenewalGuard

## 1. Full PostgreSQL Database Backup
Run `pg_dump` using your production `DATABASE_URL`:
```bash
pg_dump "$DATABASE_URL" --format=custom --file=renewalguard_backup_$(date +%F).dump
```

## 2. Application-Level Portable CSV Backup
Authenticated administrators can export all document records at any time via the Dashboard **Export CSV** button (`GET /api/documents/export`).

## 3. Restoration Procedure
To restore a PostgreSQL dump into a clean database instance:
```bash
pg_restore --clean --if-exists --no-owner --dbname="$DATABASE_URL" renewalguard_backup_YYYY-MM-DD.dump
```

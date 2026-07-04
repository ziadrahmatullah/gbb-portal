# GBB Portal — Beswan

Scholarship recipient self-service portal. Root `README.md` (two levels up) has the full monorepo picture — read that first.

- Spec: `docs/wireframes-beswan.md` (repo root `docs/`).
- Auth: own email/password login (separate `beswan` table in the ERD, not `users`) — see `src/domains/auth`. Login posts to `/api/beswan/auth/login`; confirm/adjust this path against the actual backend route once it exists.
- **Scaffolded, not fully built**: `src/domains/{beranda,library,mentor,refleksi,profile}` each contain a placeholder page (`PagePlaceholder`) pointing at its wireframe section. Replace each with the real UI as features are implemented — don't add new top-level domains without checking `docs/wireframes-beswan.md` first.
- Uses `@gbb/ui` for all shared components/styling — don't recreate Button/Input/etc. locally.

Run: `npm run dev -w apps/beswan` from repo root (port 5174), or `npm run dev` from inside this folder.

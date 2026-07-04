# GBB Portal — Donatur

Donor-facing portal. Root `README.md` (two levels up) has the full monorepo picture — read that first.

- Spec: `docs/wireframes-donatur.md` (repo root `docs/`).
- Auth: **Google OAuth only, no password** (donors are matched by Gmail address against the `donatur` table in the ERD). Uses `@react-oauth/google`'s `GoogleLogin`; on success the credential is POSTed to `/api/donatur/auth/google` — confirm/adjust this path against the actual backend route once it exists. Needs `VITE_GOOGLE_CLIENT_ID` in `.env.local`.
- **Scaffolded, not fully built**: `src/domains/{beranda,mentor,dashboard,beswan,laporan}` each contain a placeholder page (`PagePlaceholder`) pointing at its wireframe section. Replace each with the real UI as features are implemented.
- Uses `@gbb/ui` for all shared components/styling — don't recreate Button/Input/etc. locally.
- Lightest of the three apps — avoid pulling in heavy admin-only deps (TipTap, Recharts, TanStack Query) unless a feature genuinely needs them.

Run: `npm run dev -w apps/donatur` from repo root (port 5175), or `npm run dev` from inside this folder.

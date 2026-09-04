# GBB Portal (monorepo)

Frontend monorepo for **Baik Berdampak (GBB)**, a scholarship/beasiswa and donor-management platform. Three separate web apps share one design system and one backend API.

```
gbb-portal/
├── apps/
│   ├── internal/   — Portal Internal: staff admin CMS (heaviest app)
│   ├── beswan/      — Portal Beswan: scholarship recipient self-service
│   └── donatur/     — Portal Donatur: donor-facing, Google-OAuth-only login
├── packages/
│   └── ui/          — @gbb/ui: shared design tokens + shadcn-style components
├── docs/            — product specs (wireframes, ERD, design tokens, seeds)
└── package.json     — npm workspaces root
```

The **backend** is a separate repository (`dmi-dashboard-be` in this environment) — one API/DB shared by all three apps. This repo is frontend-only.

## Why 3 apps + 1 shared package, not 1 app or 3 fully separate repos

- **Auth models differ per portal** and shouldn't share a bundle/deployment: Internal uses email+password with roles (`admin/pcm/finance/anc/viewer`), Beswan uses its own password login (separate `beswan` table), Donatur is **Google OAuth only, no password**.
- **UI weight differs wildly**: Internal is a full CMS (TipTap editor, charts, cash reconciliation wizards — ~1.2MB bundle). Beswan/Donatur are light self-service portals (~300-475KB bundles). Shipping Internal's weight to an external donor's browser would be wasteful.
- **npm workspaces monorepo** (not 3 separate repos) so the design system — colors, typography, shadcn components — is defined **once** in `packages/ui` and consumed by all three, instead of drifting via copy-paste. Each app still builds/deploys independently.
- See `docs/wireframes-internal.md`, `docs/wireframes-beswan.md`, `docs/wireframes-donatur.md`, and `docs/erd.dbml` for why: all three read/write the same core tables (`periode`, `event`, `refleksi`, `penugasan`, `cashflow`, …) but present radically different UIs to radically different users.

## Specs — read `docs/` before building features

- `docs/wireframes-internal.md` — Portal Internal: periode, database beswan, kurikulum & library, database mentor, event talkshow, penugasan, keuangan (rekonsiliasi/overview/donatur/monitoring), laporan, settings
- `docs/wireframes-beswan.md` — Portal Beswan: beranda, library, mentor, refleksi bulanan, profile
- `docs/wireframes-donatur.md` — Portal Donatur: beranda, daftar mentor, dashboard, data beswan, laporan
- `docs/erd.dbml` — full database schema — **the source of truth for what data exists and which app owns writing to it**
- `docs/email-templates.md` — transactional/broadcast email specs (Resend + React Email)
- `docs/colorpalette.md` — design tokens source (already implemented in `packages/ui`, see below)
- `docs/seeds/` — seed data, e.g. `refleksi_pertanyaan.seed.json`
- `docs/Logo GBB/` — original brand logo files (already copied into `packages/ui/src/assets/logo`)

## Running the apps

```bash
npm install                # once, at repo root — installs & links all workspaces

npm run dev:internal       # http://localhost:5173
npm run dev:beswan         # http://localhost:5174
npm run dev:donatur        # http://localhost:5175

npm run build:internal     # or build:beswan / build:donatur / build (all three)
```

Each app reads `VITE_API_URL` from its own `.env.local` (gitignored) to point at the backend, e.g. `VITE_API_URL=http://0.0.0.0:6099`. `apps/donatur` additionally needs `VITE_GOOGLE_CLIENT_ID` for the Google login button, and accepts two optional flags:

- `VITE_GATING_ENABLED=true` — turns on menu gating for donors who haven't donated this month (needs `GET /donatur/status` on the backend, see `gbb-backend/promt/FEpromt25.txt` §1). Default off; on API error the portal fails open.
- `VITE_WA_ADMIN` — WhatsApp number for the floating "Hubungi Admin GBB" button (default `6281991710763`).

`apps/internal` accepts `VITE_ROLE_MENU_ENABLED=true` — reads the role × menu matrix from `GET /internal/account/menu` (Settings › Hak Akses Menu becomes editable; see `gbb-backend/promt/FEpromt27.txt`). Default off: menus follow the built-in defaults in `src/shared/constants/menu.ts`, identical to the previous hardcoded rules.

## `packages/ui` (`@gbb/ui`) — the shared design system

Ships **raw JSX source**, no build step — Vite in each app transforms it directly (this is why `dedupe: ["react","react-dom"]` is set in every app's `vite.config.js`, to prevent duplicate React copies from a workspace symlink).

- `src/styles/theme.css` — Tailwind v4 `@theme inline` + CSS variables for the full Baik Berdampak palette (primary `#F56A1F`, secondary `#0675EE`, surface/on-surface/outline/tertiary/error scales, Plus Jakarta Sans font, radius scale). Source: `docs/colorpalette.md`.
- `src/styles/animations.css` — keyframes + `.dialog-overlay`/`.dialog-content`/`.select-content` animation classes needed by the Dialog/Select components.
- `src/components/*.jsx` — shadcn-style components on Radix primitives: button, card, dialog, dropdown-menu, input, label, popover, searchable-select, select, switch, table, textarea, ImageUpload.
- `src/assets/logo/*.png` — canonical GBB logo files (mark/horizontal/stacked × color/white/black).
- `src/index.js` — barrel export; import components as `import { Button, Input, cn } from "@gbb/ui"`.

**Every app's `src/index.css` must start with:**
```css
@import url("https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap");
@import "@gbb/ui/theme.css";
@import "@gbb/ui/animations.css";
@import "tailwindcss";
@source "../../../packages/ui/src";
```
The `@source` line is required so Tailwind v4's class scanner picks up utility classes used inside `packages/ui`'s JSX (it lives outside the app's own `src/`).

**To add a new shared component**: put it in `packages/ui/src/components/`, add its export to `packages/ui/src/index.js`, then import it from `@gbb/ui` in any app. Don't duplicate a component per-app — if two apps need the same UI element, it belongs in `packages/ui`.

**Logo/asset changes**: edit the source PNGs in `packages/ui/src/assets/logo/`, then re-copy into each app's `public/assets/logo/` and `public/icon.png` (favicons are plain `<link>` tags, not JS imports, so they can't reference the workspace package directly — this manual copy is the one exception to "single source of truth").

## `apps/internal` — Portal Internal

Originated from an older Qurban/event admin app (SMI Event Dashboard) that has been repurposed. Domain-driven structure: `src/domains/<feature>/{components,hooks,services}` (categories, districts, mosques, animal-types, qurbans, transactions, events, galleries, articles, activity-logs, auth, settings — being extended toward `docs/wireframes-internal.md`'s modules: periode, kurikulum, mentor, penugasan, keuangan).

- Auth: email/password, JWT, role-based (`src/domains/auth`, `ProtectedRoute` checks a plain token in `localStorage`).
- `src/shared/components/ui/*.jsx` are now thin re-export shims (`export * from "@gbb/ui"`) — kept so existing domain code's `@/shared/components/ui/button` imports don't need touching. New code should just `import { Button } from "@gbb/ui"` directly.
- TanStack Query for server state, Zustand for `useAuthStore`/`useUIStore`.

## `apps/beswan` — Portal Beswan (scaffolded, not fully built)

Routes/pages exist as placeholders (`src/domains/{beranda,library,mentor,refleksi,profile}`) matching `docs/wireframes-beswan.md`'s sidebar. Auth is its own email/password flow hitting `/api/beswan/auth/login` (adjust the endpoint once the backend confirms the real route). Replace each `PagePlaceholder` with the real UI per its wireframe section as features are built.

## `apps/donatur` — Portal Donatur (scaffolded, not fully built)

Routes/pages exist as placeholders (`src/domains/{beranda,mentor,dashboard,beswan,laporan}`) matching `docs/wireframes-donatur.md`. Auth is **Google OAuth only** via `@react-oauth/google`'s `GoogleLogin` — on success it POSTs the Google credential to `/api/donatur/auth/google` (adjust once the backend confirms the real route) to exchange for this app's own JWT. Requires `VITE_GOOGLE_CLIENT_ID` in `.env.local`.

## Stack (all apps)

- Vite + React 19, React Router 7
- Tailwind CSS v4 (`@theme inline`, no `tailwind.config.js`)
- Radix UI primitives + shadcn-style components, via `@gbb/ui`
- Zustand for client state, Axios for API calls
- `apps/internal` additionally uses TanStack Query, TipTap, Recharts, framer-motion (heavier, admin-only dependencies — don't add these to Beswan/Donatur unless a feature genuinely needs them)

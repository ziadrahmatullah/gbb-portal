# GBB Portal — Internal

Staff admin CMS. Root `README.md` (two levels up) has the full monorepo picture, auth-model comparison across the 3 apps, and `@gbb/ui` usage — read that first.

- Spec: `docs/wireframes-internal.md` (repo root `docs/`).
- Auth: email/password, JWT, roles (`admin/pcm/finance/anc/viewer`) — `src/domains/auth`.
- `src/shared/components/ui/*.jsx` are re-export shims over `@gbb/ui` (`export * from "@gbb/ui"`), kept so this app's many existing `@/shared/components/ui/button`-style imports didn't need a mass rewrite when the design system moved into the shared package. New code should import from `@gbb/ui` directly instead of adding to these shims.
- Domain-driven structure: `src/domains/<feature>/{components,hooks,services}`.
- Heaviest of the three apps (TipTap editor, Recharts, framer-motion, TanStack Query) — don't pull these deps into `apps/beswan` or `apps/donatur`.

Run: `npm run dev -w apps/internal` from repo root, or `npm run dev` from inside this folder.

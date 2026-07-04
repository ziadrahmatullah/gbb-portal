# @gbb/ui

Shared design system for all three GBB Portal apps (`apps/internal`, `apps/beswan`, `apps/donatur`). See the repo root `README.md` for the full monorepo picture — this file only covers this package.

- No build step: ships raw `.jsx`/`.css` source, consumed directly by each app's Vite/esbuild.
- `src/index.js` — barrel export. Import via `import { Button, Input, Dialog, cn } from "@gbb/ui"`.
- `src/styles/theme.css` — Tailwind v4 tokens (colors, font, radius) from `docs/colorpalette.md`. Import once per app, before `@import "tailwindcss"`.
- `src/styles/animations.css` — keyframes the Dialog/Select components need.
- `src/assets/logo/*.png` — canonical logo files. Each app keeps its own copy in `public/assets/logo/` (favicons/`<img>` `src` paths can't reach into a workspace package) — if you edit a logo here, re-copy it into every app's `public/`.

**Adding a component**: create it in `src/components/`, re-export it from `src/index.js`. Keep it generic — no imports of any app's `apiClient`, domain hooks, or app-specific business logic. If a component needs backend data, that fetching belongs in the consuming app, passed in as props.

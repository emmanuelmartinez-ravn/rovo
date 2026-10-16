# Components

**Framework**: React 19 (function components, `useState`), no meta-framework — plain Vite.
**Component library**: none (no shadcn/ui, MUI, Chakra, Radix, etc.).
**CSS approach**: Tailwind v4 (wired via `@tailwindcss/vite`, `@import "tailwindcss"` in `src/index.css`), now with a real `@theme` token block matching the "Rovo MVP — Now scope" mockup — see [theme.md](theme.md). No Tailwind utility classes are used in markup yet (the placeholder `App.tsx` still uses hand-written CSS classes), but the tokens (`bg-accent`, `font-mono`, `rounded-lg`, `shadow-menu`, etc.) are ready for the real scenario-editor UI to build with.

## Shared UI primitives

There is no shared/reusable component directory (no `src/components/`, `src/components/ui/`, etc.). All markup lives inline in the single page component, `src/App.tsx` — see [pages.md](pages.md) for its full source and dependency tree.

No `Button`, `Input`, `Dialog`, `Card`, etc. exist as extracted components. Two inline patterns repeat within `App.tsx` and are candidates for future extraction — see [extractable-components.md](extractable-components.md):

- the `.counter` button
- the nav-link `<li><a>…</a></li>` pattern, repeated for both the docs links and the social links

Both are current template/placeholder UI (see [extractable-components.md](extractable-components.md) for why that matters) — don't treat them as the product's real component vocabulary.

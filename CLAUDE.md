# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

Rovo is a Chrome extension (Manifest V3) for QA engineers that automates form filling for exploratory testing. It is currently a fresh Vite + React + TypeScript scaffold — `src/core/app/App.tsx` is an empty placeholder (the default Vite template has been removed), not the product itself. The product requirements live in `MVP.md` and should be treated as the authoritative spec for what to build next.

### Product shape (from MVP.md)

The core unit of work is a **scenario**: a config of `label → value` entries, ordered to match the path through a form (branch choices are entries too, e.g. `Account type: Business`). Running a scenario means filling the open form field-by-field, in order, waiting for conditional fields to appear as earlier answers reveal them, and locating each field by its visible label rather than by selector. The build order per MVP.md is:

1. **Branch scenario replay** — the load-bearing feature; everything else depends on it.
2. **Edge-case swap** — run a scenario with one field's value replaced.
3. **Run log** — record the exact path/data used per run.
4. **Session coverage view** — derived from the run log.
5. **Unique values per run** — e.g. timestamp-based placeholders for fields that reject reused values (signup emails, etc).

When implementing a feature, check MVP.md's acceptance criteria for it rather than inferring behavior from the stub UI.

## Commands

- `pnpm dev` — start the Vite dev server (HMR). This project uses pnpm (see `pnpm-lock.yaml`), not npm/yarn.
- `pnpm build` — type-check (`tsc -b`) then production-build via Vite. Building is how you type-check this project; there is no separate typecheck script.
- `pnpm lint` — run Oxlint (`.oxlintrc.json`) in type-aware mode (requires the `oxlint-tsgolint` devDependency, already installed).
- `pnpm preview` — preview the production build.
- There is no test runner configured yet.

## Type safety

`.oxlintrc.json` runs Oxlint with `"options": { "typeAware": true }` and enforces no unsafe typing — these fail lint (not just warn):

- `typescript/no-explicit-any` — no `any`. Use `unknown` and narrow it, or a precise type.
- `typescript/no-non-null-assertion` — no `!` non-null assertions. Narrow with an `if`/guard instead (see `src/main.tsx`'s `getElementById` check for the pattern).
- `typescript/no-unsafe-type-assertion` — no `as` casts to a type the value isn't provably compatible with.
- `typescript/no-unsafe-assignment`, `no-unsafe-call`, `no-unsafe-member-access`, `no-unsafe-return`, `no-unsafe-argument`, `no-unsafe-enum-comparison`, `no-unsafe-unary-minus`, `no-unsafe-declaration-merging`, `no-unsafe-function-type` — block `any` (explicit or inferred, e.g. from untyped JSON or `JSON.parse`) from silently flowing through the rest of the code.

Because these rules are type-aware, `pnpm lint` type-checks via the project's `tsconfig`s — a bad cast or an untyped value reaching one of these call sites fails lint even if `tsc -b` would otherwise pass it off as `any`-shaped.

### Loading the extension

`vite.config.ts` uses `@crxjs/vite-plugin` with `manifest.json` to produce a Chrome-extension-ready build in `dist/`. Load `dist/` as an unpacked extension in `chrome://extensions` to run it for real; `pnpm dev` alone (browser tab) won't exercise `chrome.*` APIs like the background service worker or side panel.

## Source layout

Everything in `src/` lives in one of three folders. Layering runs one way — `shared` ← `core` ← `features` — and `.oxlintrc.json` enforces it with `no-restricted-imports` overrides, so a wrong-direction import fails `pnpm lint`.

- **`src/shared/`** — generic building blocks with no Rovo knowledge: UI primitives, hooks, utilities. Could be copied into another project unchanged. Imports nothing from `core/` or `features/`.
- **`src/core/`** — Rovo's domain and platform layer: the extension entry points, the scenario model, Chrome API wrappers (messaging, storage), the content-script form engine. May import `shared/`. Must not import `features/` — except **`src/core/app/`**, the composition root, which wires features into the side panel.
- **`src/features/<feature-name>/`** — one kebab-case folder per MVP.md feature (`branch-scenario-replay`, `edge-case-swap`, `run-log`, …), holding that feature's UI, state and logic. May import `core/` and `shared/`. **Features never import each other**: code two features need moves down to `core/` (Rovo-specific) or `shared/` (generic).

Imports: use relative paths inside a folder and the `@/` alias (`@/core/…`, `@/shared/…`, mapped to `src/` in `tsconfig.app.json` and `vite.config.ts`) to reach another top-level folder. Lint catches cross-feature imports only through `@/features/…`; a relative `../other-feature/…` slips past it, so don't write one.

## Mockup

`ROVO-MOCKUP.html` is the design reference. Open it at **http://127.0.0.1:5500/ROVO-MOCKUP.html**, served by the VS Code Live Server extension, never as a `file://` path or by parsing the file. It's a bundled page whose screens render in JavaScript inside `blob:` iframes, so only the served page shows them as designed. If that URL doesn't respond, ask the user to start Live Server rather than working around it. The Rovo panel header is the same on every screen, so one screen is enough for it.

## Architecture

- **`manifest.json`** declares this as a side-panel extension: the `sidePanel` permission is granted, and `action` + `side_panel.default_path: index.html` mean clicking the toolbar icon opens the extension UI in Chrome's side panel, not a popup. Moving an entry point means updating its path here (and in `index.html` for the side panel).
- **`src/core/background/background.ts`** is the MV3 service worker. Today it only sets `openPanelOnActionClick: true`. Logic that needs to run independent of the side panel's lifetime (e.g. coordinating with content scripts, persisting state across side-panel open/close) belongs here.
- **`src/core/app/`** is the side panel UI: `main.tsx` (loaded by `index.html`) renders `App.tsx`; `index.css` holds Tailwind and the design tokens. This is where features get composed into the scenario editor/runner UI described in MVP.md.
- **Form interaction** (finding fields by label, filling them, waiting for conditional fields to appear) will need a content script injected into the tested page — none exists yet. It belongs in `src/core/` (e.g. `src/core/content/`), and it needs its own entry in `manifest.json` (`content_scripts`) and `permissions`/`host_permissions` as needed, and `vite.config.ts`'s crx plugin picks it up from the manifest automatically.
- TypeScript is split into two project references (`tsconfig.app.json` for `src/`, targeting ES2023/DOM with `chrome` types; `tsconfig.node.json` for `vite.config.ts`) under the root `tsconfig.json` — this is why `tsc -b` (build mode) is used rather than a plain `tsc`.

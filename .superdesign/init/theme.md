# Theme

## Source

These tokens are reverse-engineered from the **"Rovo MVP — Now scope"** mockup (a 11-artboard Claude canvas artifact), not invented. The mockup is a hardcoded set of screens, not a token system — each of the 10 "Rovo —" artboards was decoded, scoped to just the `<aside aria-label="Rovo side panel">` markup (excluding the staged Chrome-browser frame and the "Northpass" sample form shown next to it, which are scene-dressing, not Rovo's own design), and the resulting colors/radii/type sizes/shadows were counted for the dominant, consistent values below. The 11th artboard ("Northpass — Open an account") is the sample page, not part of Rovo's system.

**No dark mode is defined** — the mockup has no dark variant, so none is invented here (`color-scheme: light` only). Add one only once an actual dark mockup exists.

Implemented as a Tailwind v4 `@theme` block in `src/index.css` — these **are** the CSS custom properties (Tailwind v4's `@theme` generates both the variable and the matching utility class, e.g. `--color-accent` → `bg-accent`/`text-accent`/`border-accent`). There is still no `tailwind.config.*` file; v4 is CSS-first.

## Part 1 — Compact token summary

**Fonts**: `--font-sans: 'IBM Plex Sans', system-ui, 'Segoe UI', Roboto, sans-serif` (UI text), `--font-mono: 'IBM Plex Mono', ui-monospace, Consolas, monospace` (inline code, data values, URLs — the mockup uses mono specifically for the `Label: value` scenario syntax and for meta text like the current page's hostname). Loaded via Google Fonts `@import` in `src/index.css`.

**Type scale** (no formal named scale — these are the sizes actually used, most → least common): `13px` (dense UI rows, mono values), `12px` (meta text), `14px` (base body / header title), `16px` (section heading, `h2`), `15px` (card subheading, `h3`), `18px` (rare — top-level heading).

**Colors**:

| Token | Value | Used for |
|---|---|---|
| `--color-bg` | `#ffffff` | panel surface |
| `--color-bg-subtle` | `#f7f8fa` | empty-state / card background |
| `--color-text` | `#4a505a` | body copy |
| `--color-text-strong` | `#16181d` | headings, code text, emphasis |
| `--color-text-meta` | `#5a606b` | secondary/meta text (hostnames, timestamps) |
| `--color-border` | `#e3e5e9` | default dividers (header bottom, section rules) |
| `--color-border-strong` | `#d5d8dd` | panel edge |
| `--color-border-dashed` | `#c4c8cf` | dashed empty-state border |
| `--color-accent` | `#2453d6` | primary action, brand mark, links |
| `--color-accent-hover` | `#1a3fa8` | accent hover/pressed |
| `--color-accent-subtle` | `#e8eeff` | accent tint background (icon chips) |
| `--color-code-bg` | `#e9ecf1` | inline `<code>` chip background |
| `--color-danger` / `--color-danger-bg` | `#b42318` / `#fdeeec` | destructive actions, errors |
| `--color-success` / `--color-success-bg` | `#17803d` / `#e9f7ee` | run-complete / success states |
| `--color-warning` / `--color-warning-bg` | `#b4500c` / `#fff4eb` | run-stopped / edge-case warnings |

**Radius**: `--radius-sm: 3px` (inline code chip), `--radius-md: 6px` (code block, nav pill), `--radius-lg: 8px` (buttons, brand mark — most common), `--radius-xl: 10px` (cards, dashed empty-state box).

**Shadow**: `--shadow-menu: 0 8px 24px rgba(22,24,29,.14)` (dropdowns/menus), `--shadow-modal: 0 16px 40px rgba(22,24,29,.24)` (dialogs).

**Panel dimensions** (observed, not tokenized as fixed widths in CSS): the mockup draws the side panel at `400px` wide with a `52px` header and `44px`-tall primary buttons. `#root` is kept at `width: 100%` rather than hardcoded to `400px` — Chrome's side panel is user-resizable, so the real width is whatever Chrome gives it, not a CSS constant.

## Part 2 — Raw source

### `src/index.css`

See the file directly — it now **is** the `@theme` block plus the base reset, rather than being duplicated here. Check it for the current source of truth; this document explains the tokens' provenance and intent, not their literal values (which can drift from this doc if edited without updating it — always prefer `src/index.css` over this table if the two disagree).

### Tailwind config

Still no `tailwind.config.*` file — v4 is CSS-first, and the `@theme` block in `src/index.css` is the entire configuration.

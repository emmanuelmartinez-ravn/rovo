# Extractable components

**This file is nearly empty on purpose.** `src/App.tsx` is still the unmodified Vite + React template scaffold (hero logos, HMR counter, Vite/React doc links, Vite community links) — placeholder content `MVP.md` describes replacing with the actual product UI (a scenario editor/runner for QA form testing). Cataloging today's template markup as the project's reusable component vocabulary would be documenting throwaway code. **Regenerate this file once the real feature UI exists.**

The two patterns below are structural repeats worth knowing about if reusing or refactoring the scaffold before it's replaced — not confirmed product components.

#### Basic Components (used across pages)

## Counter Button
- Source: inline in `src/App.tsx` (`<button className="counter">`), styled in `src/App.css`
- Category: basic
- Description: the HMR demo counter button; purple-accent outline button style
- Extractable props: none meaningful (no variants exist yet — only one instance)
- Hardcoded: label text ("Count is {count}"), click handler, all CSS

## Link List Item
- Source: inline in `src/App.tsx`, repeated 2× in `#docs` and 4× in `#social`, styled via `#next-steps ul` in `src/App.css`
- Category: basic
- Description: an icon/logo + label pill link, used identically for both doc links and social links
- Extractable props: `href` (string), `label` (string), `icon` (image src or inline SVG use-href)
- Hardcoded: pill background/hover-shadow styling, flex layout

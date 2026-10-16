---
name: build-component
description: Build a new UI component from a design reference, through a token-mapped spec that every value, state and gap must close against. Use when the user asks to create, build or implement a component, or to turn a mockup or design into UI.
---

# Build component

The **reference** is the design you're matching: a mockup screen, a Figma frame, a screenshot. The **spec** is a table you write before any code, one row per visual value in the reference. The component is done when every spec row has ended in exactly one of three outcomes:

- **exact**: the reference value is a token step.
- **rounded**: the value fell between steps and was moved to the nearest one, written as `15px → 16px (--space-lg)`.
- **gap**: unresolved, with a question for the designer attached.

The spec lives in your reply (and the PR body), not in the repo.

## Tokens

The token tiers and their rules are in `CLAUDE.md`, "Design tokens": read that section before writing the spec. A **step** is a semantic token in `src/shared/styles/semantic.css`, so the space steps are `--space-2xs` … `--space-xl` (2, 4, 8, 12, 16, 24px). Primitives are never a step: the component reads them only through a semantic token. The component's own tokens go on its root class in its `.module.css`.

## 1. Read the brief and the reference

Collect the brief (PRD in `prds/`, issue, or the user's message) and the reference. When the reference is the mockup, open it the way `CLAUDE.md`'s "Mockup" section says. Write down every **assumption** you're making: anything the component depends on that neither of them states (data shape, copy, where it's mounted, how it behaves at narrow widths). Check each against the brief and mark it **confirmed** (cite where) or **unconfirmed**.

Done when every assumption is listed with its mark. Unconfirmed assumptions go to the designer in step 5 with the gaps.

## 2. Write the spec

One row per visual value in the reference: color, spacing, size, radius, border, shadow, font family, size, weight and line height.

| Element | Property | Reference | Token | Outcome |
|---|---|---|---|---|
| Card | padding | 14px | — | gap: 12px (`--space-md`) or 16px (`--space-lg`)? |
| Card | gap | 7px | `--space-sm` | rounded: 7px → 8px |
| Title | color | #17181c | `--color-text-strong` | rounded: #17181c → #16181d |

- **Rounding:** a value between two steps moves to the nearer one, and the row records `from → to`. When it's exactly halfway (14px between 12px and 16px), the row is a gap, and the designer chooses.
- **No token for it:** a value with no semantic token for its role (a color in no role, a one-off shadow, a radius no semantic token names) is a gap. Ask whether to add a semantic token (and over which primitive) or reuse an existing one, and say which existing one is nearest.

Done when every visual value in the reference has a row and every row has an outcome.

## 3. Map the states

List every state the component can reach, with at least **loading**, **empty**, **error** and **success** wherever data is involved. Each row gives what triggers it (the API status, or the Chrome API result) and what the UI shows.

| State | Trigger | UI |
|---|---|---|
| Loading | request pending | `Spinner`, label "Loading scenarios" |
| Empty | 200, `[]` | "No scenarios for this form yet" + Create button |
| Error | non-2xx / rejected | "Couldn't load scenarios" + Retry |
| Success | 200, ≥1 item | the list |

A state the reference doesn't draw is a gap: describe what you'd show and ask.

Done when every state the flow can reach has a trigger and a UI.

## 4. Inventory the parts

For each part of the component, find the existing component it uses. Reusable ones live in `src/shared/ui/` (follow the layering in `CLAUDE.md`).

- **Missing:** a part the system doesn't have yet is flagged as missing. Build it as a new `shared/ui` component using the tokens of its nearest existing sibling (a new badge takes the existing pill's radius, padding and type), and list it in the reply.
- **Vendored gap:** a vendored (third-party or copied-in) component that hard-codes a value the spec disagrees with (e.g. BottomNav's hard-coded badge color) is named as a gap. Fix it from outside the component with a scoped `className` override, if the component accepts one. If it doesn't, the gap stays open and goes to the designer. The vendored file stays exactly as shipped.

Done when every part is mapped to an existing, new or vendored component, and every vendored gap is named.

## 5. Resolve before building

Send the designer (the user, unless they named someone) every gap row, every tie, and every unconfirmed assumption, as one batch of questions, then wait.

Done when every row has an answer and the spec is updated with it: a gap becomes **exact** or **rounded**, or stays a **gap** the designer accepted as open. Building starts only then.

## 6. Build it

Write the component to the spec and the token rules above, meeting the **accessibility floor**:

- Each self-contained unit is its semantic element: `<button>`, `<a>`, `<nav>`, `<ul>`/`<li>`, `<form>`, `<dialog>`, `<section>` with a heading. A `<div>` is for layout only.
- Every input has a real `<label>` tied to it (`htmlFor`/`id`, or wrapping). A placeholder doesn't count as a label.
- Anything that looks tappable is a `<button>` or `<a>`, so it gets focus, Enter/Space and a visible focus ring for free.
- Text and meaningful icons meet WCAG AA contrast against their background (4.5:1 for body text, 3:1 for large text and UI parts). Check each foreground/background token pair you used and record the ratio in the reply.
- ARIA is added only where native semantics fall short, e.g. `role="status"` on a live loading region, or `aria-label` on an icon-only button.

Done when `pnpm lint` and `pnpm build` pass and every accessibility rule above holds for every unit.

## 7. Compare side by side

Render the component in every state from step 3, in the side panel (`dist/` loaded as an unpacked extension) or the dev server. Screenshot each state and put it next to the reference. Walk the spec row by row against the render.

Done when every spec row is confirmed in the render as **exact**, **rounded** (with its `from → to`) or **gap** (with its question), and the reply ends with that table, the states table, the accessibility contrast ratios, and the list of missing or vendored components.

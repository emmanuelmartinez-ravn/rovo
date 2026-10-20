# Rovo

A Chrome extension for QA engineers that fills forms for exploratory testing. You write a **scenario**, the path through a form as `Label: value` lines, and Rovo replays it on the open page, one field at a time, waiting for conditional fields to appear. Swap one value for an **edge case** and run again, without retyping the rest.

Rovo lives in Chrome's side panel and finds every field by the label shown on the form, not by CSS selector.

## What it does today

- **Scenarios per site.** Scenarios are saved locally for the site in the active tab (e.g. `app.example.com`), and you can create, edit and delete them. The editor starts with the labels Rovo detects on the page, and flags lines that aren't `Label: value`.
- **Edge cases.** Each scenario keeps its own edge cases. An edge case is the same run with one entry's value replaced: an empty value, special characters, an impossible date. You can create, edit and delete them.
- **Runs.** **Run** fills the form entry by entry, in order:
  - Branch choices like `Account type: Business` pick the matching radio option, so the fields that choice reveals are filled next.
  - Each label is retried for up to 10 seconds while the page catches up.
  - If a label never appears, the run stops and says which entry and label it couldn't find.
  - A run with an edge case shows which value was swapped in.

Next, per [MVP.md](MVP.md): a run log, a session coverage view, and unique values per run (e.g. `juan+{timestamp}@test.com`).

## Install

Rovo isn't on the Chrome Web Store; you build it and load it unpacked.

```sh
pnpm install
pnpm build
```

Then:
1. Open `chrome://extensions` and turn on **Developer mode**.
2. Click **Load unpacked** and pick the `dist/` folder.

Click Rovo's toolbar icon to open its side panel.

**Permissions.** At install, Chrome warns that Rovo can "read and change all your data on all websites", and read your browsing history.

| Permission | Why Rovo needs it |
|---|---|
| `sidePanel` | Its UI is a side panel |
| `tabs` | Reading the active tab's URL, to know which site's scenarios to show |
| `scripting` and access to `http(s)://*/*` | Reading the page's field labels, and filling them during a run |
| `storage` | Keeping your scenarios on this machine |

Scenarios never leave your browser.

**Updating.** After pulling changes, run `pnpm build` and click **Reload** on Rovo's card in `chrome://extensions`. If an update adds a permission, an already-loaded copy keeps its old ones: remove Rovo and **Load unpacked** again.

## Using it

1. Open the form you're testing, then Rovo's side panel. The header shows the site, and the empty state shows an example built from the page's own labels.
2. **New scenario**: name it, then write one `Label: value` per line in the order you'd fill the form:
   ```
   Account type: Business
   Company name: Northwind Supply Co
   Business type: LLC
   ```
3. **Run** fills the form. Reload the page first to start from a fresh form.
4. **Add edge case** on a scenario: pick the entry to replace, type the value, name it, then run it with its ▶ button.

### How fields are found and filled

- **Finding the field:**
  - A field's label is its `<label>`, else its `aria-labelledby` or `aria-label`.
  - A radio or checkbox group's label is its `<fieldset>`'s `<legend>`, or its ARIA group's name.
  - Labels match ignoring case, extra whitespace and a trailing required marker (`*`, `(required)`).
  - If two fields share a label, each entry takes the next one not yet filled in that run.
- **Filling it:**
  - Text fields and textareas get the value plus input and change events, so React and Angular forms see it.
  - Selects pick the option whose text or value matches.
  - Radio and checkbox groups click the option whose label matches.
  - A single checkbox takes yes/true/on or no/false/off.
- **Waiting:** each entry is retried until its field appears and is enabled, for up to 10 seconds, then the run stops with the reason.
- **Leaving the panel:** a run keeps going if you close the panel. It stops if the page reloads or navigates.

Fields inside iframes aren't filled yet.

## Development

| Command | What it does |
|---|---|
| `pnpm build` | Type-checks (`tsc -b`) and builds the extension into `dist/` |
| `pnpm lint` | Oxlint (type-aware, with no unsafe typing allowed), then Stylelint for the design-token rules |
| `pnpm dev` | Vite dev server. It can't use `chrome.*` APIs, so test in the loaded extension |

There is no test runner yet.

- **Code layout:** `src/` is split into `shared/` (generic UI and styles), `core/` (Rovo's domain, Chrome APIs, and the code injected into tested pages) and `features/` (one folder per MVP feature). Lint enforces which layer may import which.
- **Styling:** CSS Modules on three token tiers: primitive, semantic, component. Literal values live only in `src/shared/styles/primitives.css`.
- **Design reference:** `ROVO-MOCKUP.html`, served by the VS Code Live Server extension at `http://127.0.0.1:5500/ROVO-MOCKUP.html`.
- **Commits and PRs:** one PR per feature, made of small commits that each pass lint and build on their own. See `.claude/skills/SLICING.md`.

[`CLAUDE.md`](CLAUDE.md) has the full conventions: layering, the token rules, how page code is injected, and the architecture. [`MVP.md`](MVP.md) is the product spec.

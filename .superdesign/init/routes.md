# Routes

No client-side router (no React Router, Vue Router, etc.) and no meta-framework file-based routing. This is a Chrome Manifest V3 extension, not a multi-page web app:

- `manifest.json` → `side_panel.default_path: "index.html"` — clicking the toolbar icon opens `index.html` in Chrome's side panel (not a popup, per `action` + `sidePanel` permission).
- `index.html` → `#root` → `src/main.tsx` → `src/App.tsx` — one single view, no navigation between views.
- `src/background.ts` is the MV3 service worker (`chrome.sidePanel.setPanelBehavior`), not a page/route.

There is one "page": the side panel view rendered by `App.tsx`. Any future multi-view UI (e.g. a scenario list vs. a scenario editor, per `MVP.md`) will need a router or hand-rolled view-switching to be introduced — neither exists today.

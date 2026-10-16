# Layouts

No separate layout components exist (no app shell, nav bar, sidebar, header, footer, or layout wrapper files). The entire page structure is inline in `src/App.tsx` — full source is in [pages.md](pages.md), not duplicated here.

## Structural shape (inline in `App.tsx`)

```
<> (fragment, rendered into #root)
├── <section id="center">      — hero image stack + heading + counter button
├── <div className="ticks">    — decorative divider
├── <section id="next-steps">  — two-column row
│   ├── <div id="docs">        — doc links list
│   └── <div id="social">      — social links list
├── <div className="ticks">    — decorative divider
└── <section id="spacer">      — bottom spacer
```

`#root` itself (styled in `src/index.css`) is the de facto app shell: a centered, max-width, bordered column (`display: flex; flex-direction: column; min-height: 100svh`). There is no routing, so this single structure is the entire app.

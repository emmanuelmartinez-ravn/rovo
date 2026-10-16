// Enforces the three design-token tiers (see CLAUDE.md, "Design tokens"):
//   primitives.css — the only file with literal values
//   semantic.css   — each token is one var() of a primitive
//   every other    — semantic or component tokens only, never primitives
// Later overrides win, so the two token files are listed after the default.

/** Every primitive name defined in src/shared/styles/primitives.css. */
const PRIMITIVE =
  'color-(white|black|(gray|blue|red|green|orange)-\\d+)|spacing-[\\w-]+|border-\\d+|radius-(sm|md|lg|xl|full)|font-(sans|mono)|text-(xs|sm|base|lg)|font-weight-(normal|medium|semibold)|leading-\\w+|shadow-(lg|xl)|opacity-\\d+|duration-\\d+'

/** Literal colors, lengths and durations belong in primitives.css. */
const noLiterals = {
  'color-no-hex': true,
  'color-named': 'never',
  'function-disallowed-list': ['rgb', 'rgba', 'hsl', 'hsla', 'hwb', 'lab', 'lch', 'oklab', 'oklch', 'color'],
  'unit-disallowed-list': ['px', 'rem', 'em', 'vw', 'vh', 'pt', 's', 'ms'],
}

/** @param {Record<string, unknown>} rules */
const off = (rules) => Object.fromEntries(Object.keys(rules).map((rule) => [rule, null]))

export default {
  rules: {
    ...noLiterals,
    'custom-property-pattern': ['^[a-z0-9]+(-[a-z0-9]+)*$', { message: 'Token names are kebab-case.' }],
    'declaration-property-value-disallowed-list': [
      { '/.*/': [`/var\\(--(${PRIMITIVE})\\)/`] },
      { message: 'Use a semantic or component token; only semantic.css reads primitives.' },
    ],
  },
  overrides: [
    {
      files: ['src/shared/styles/primitives.css', 'src/shared/styles/index.css'],
      rules: { ...off(noLiterals), 'declaration-property-value-disallowed-list': null },
    },
    {
      files: ['src/shared/styles/semantic.css'],
      rules: {
        'declaration-property-value-disallowed-list': null,
        'declaration-property-value-allowed-list': [
          { '/^--/': [`/^var\\(--(${PRIMITIVE})\\)$/`] },
          { message: 'A semantic token is exactly one var() of a primitive.' },
        ],
      },
    },
  ],
}

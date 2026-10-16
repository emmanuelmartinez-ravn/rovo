# The gate

Lint, then tests. Green before anything ships — never on red.

1. **Run it.** `pnpm lint`. Check `package.json`'s `scripts` block for a `test` entry; if one exists, run it too. No `test` script yet is itself a green result, not something skipped — don't invent a test command to run in its place.
2. **Reach green.** A red gate means something real is broken: an actual lint violation, a failing assertion, an unsafe type. Fix that cause, then run the gate again. Repeat until every lint rule and every test reports clean. `--no-verify`, muting a rule inline, or deleting/skipping a failing test all produce a gate that reports green without being green — none of them substitute for the real fix.

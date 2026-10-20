# Slicing

How work is cut into pull requests and commits. A feature ships as **one PR made of many atomic commits**.

## The PR is one feature

A PR carries exactly one feature (one MVP.md feature, or one slice of one), one fix, or one self-contained refactor or docs change. Anything unrelated that was written along the way — research notes, a tooling tweak, a drive-by cleanup elsewhere — goes on its own branch and its own PR. A PR that needs another PR's code is stacked on that branch, still targets `main`, and names the PR it waits on at the top of its body.

The branch is the feature's: `<type>/<kebab-case-feature>`, created once at its first commit. Every later commit for that feature lands on the same branch.

## The commit is one atomic step

An atomic commit has one reason to exist, so a reviewer can read it, and anyone can revert it, on its own. Two checks:

- **One subject, no "and".** Its Conventional Commits subject describes the whole change without joining two things. A body that needs "Also…" marks a second commit hiding inside the first.
- **Green alone.** With only that commit's changes in the tree, the [gate](GATE.md) and `pnpm build` both pass.

Order the commits bottom-up, the way the layers depend on each other, so each one is green when it lands:

1. **Tokens** — new primitives and semantic tokens, with the lint pattern change they need.
2. **Shared components** — one `shared/ui` component (or variant added to one) per commit.
3. **Core** — one `core/` module per commit: a model, a store, a hook, a content-script function.
4. **Feature UI** — the feature's views, smallest self-contained piece first.
5. **Wiring** — mounting it in `core/app`, plus the `manifest.json` permission the feature needs.

A fix or rename of earlier work found along the way (a misnamed token, a missing CSS reset) is its own `fix:` or `refactor:` commit, never folded into the feature commit that exposed it.

---
name: commit
description: Commit changes as atomic, individually green commits on the feature's branch, with Conventional Commits messages, through the gate. Use when the user asks to commit, make a commit, save a commit, or git commit the changes.
---

# Commit

A feature is many commits on one branch. Every commit follows [`../SLICING.md`](../SLICING.md) — read it first — and passes [the gate](../GATE.md) on its own.

## 1. Find the feature's branch

If the current branch is this feature's (`<type>/<kebab-case-feature>`), stay on it. Otherwise — on `main`, or on another feature's branch — create the feature's branch and switch to it: off `main`, or off the branch it depends on when it can't stand without that work (it's then a stacked PR).

Done when you're on a branch named for this feature, and only this feature.

## 2. Plan the slices

Sort every uncommitted change into atomic commits, in SLICING.md's bottom-up order. Write the plan before staging anything: one line per commit, its Conventional Commits subject (`<type>(<scope>): <description>`, `<type>` one of `feat`, `fix`, `refactor`, `perf`, `docs`, `test`, `build`, `ci`, `chore`) and the paths it takes. Changes unrelated to this feature are listed separately, for their own branch.

Done when every changed path belongs to exactly one planned commit or to the unrelated list, and no subject needs an "and".

## 3. Commit each slice, green

For each planned commit, in order:

1. Stage only its paths (`git add <paths>`).
2. Set the rest aside: `git stash push --keep-index --include-untracked`.
3. Run the gate and `pnpm build`. Red means the slice depends on a later one: move the missing piece into this commit, or reorder, and run again.
4. Commit with its planned message, then bring the rest back: `git stash pop`.

Done when `git log` shows every planned commit, each was green with nothing else in the tree, and `git status` shows only the unrelated changes.

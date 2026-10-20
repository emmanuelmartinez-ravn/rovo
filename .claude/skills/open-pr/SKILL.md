---
name: open-pr
description: Open a pull request for one feature from its branch into main, through the gate — open only once it's green. Use when the user asks to open a PR, create a pull request, ship this branch, or raise a PR.
---

# Open PR

Every PR here is one feature, made of atomic commits, per [`../SLICING.md`](../SLICING.md), and targets `main` through [the gate](../GATE.md).

## 1. Check the scope

List the branch's commits against `main` (`git log --oneline main..HEAD`). Every commit belongs to this feature and passes SLICING.md's two checks (one subject with no "and"; green alone). A commit that belongs to another change moves to its own branch before the PR opens; a commit that bundles two steps is split with the `commit` skill.

Done when every commit on the branch is one atomic step of this one feature.

## 2. Run the gate

Follow [`../GATE.md`](../GATE.md) until it's green.

## 3. Open it

Push the branch, then open the PR against `main` — never any other base. The body lists the commits in order, and, for a stacked branch, names the PR it waits on at the top. Follow the standard pull-request workflow otherwise.

---
name: open-pr
description: Open a pull request from the current branch into main, through the gate — open only once it's green. Use when the user asks to open a PR, create a pull request, ship this branch, or raise a PR.
---

# Open PR

Every PR here targets `main`, through [the gate](../GATE.md) — green before anything ships.

## 1. Run the gate

Follow [`../GATE.md`](../GATE.md) until it's green.

## 2. Open it

Push the current branch, then open the PR against `main` — never any other base — following the standard pull-request workflow otherwise.

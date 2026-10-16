---
name: commit
description: Commit changes on a new branch named for the commit, with a Conventional Commits message, through the gate — commit only once it's green. Use when the user asks to commit, make a commit, save a commit, or git commit the changes.
---

# Commit

Every commit here passes through [the gate](../GATE.md), and happens on a fresh branch named for itself — never on the branch you started from.

## 1. Run the gate

Follow [`../GATE.md`](../GATE.md) until it's green.

## 2. Name it

Write the commit message first, in Conventional Commits form: `<type>(<scope>): <description>` (scope is optional; drop the parens without it). `<type>` is whichever of `feat`, `fix`, `refactor`, `perf`, `docs`, `test`, `build`, `ci`, `chore` fits the change.

## 3. Branch, then commit

Create a branch named after that commit — `<type>/<kebab-case-description>`, scope folded into the slug if present — off the current branch, and switch to it. Stage and commit there, with the Conventional Commits message from step 2, following the standard commit workflow otherwise.

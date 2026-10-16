---
name: review
description: Review the uncommitted changes for correctness bugs and simplification opportunities, through a fresh-eyes reviewer agent instead of self-review. Use when the user asks to review the changes, review the diff, review this before committing, or check my work.
---

# Review

The agent that wrote a change is its worst judge — so fresh eyes look at it instead of you.

## 1. Gather the diff

Collect every uncommitted change: `git diff` (unstaged), `git diff --cached` (staged), and `git status` for untracked files — `git diff` alone misses those. Every changed and new file belongs in what gets reviewed; a file left out is a file that didn't get reviewed.

## 2. Hand it to fresh eyes

Dispatch the `reviewer` agent with the diff gathered in step 1 pasted directly into its prompt — don't send it off to re-run `git diff` itself, since that reintroduces the exact gap step 1 just closed. It has no memory of why you wrote the change the way you did, which is the point: it reviews what's on the page, not what you meant.

## 3. Report

Relay the reviewer's findings to the user as-is, most severe first. No findings is itself the finding: say so, don't pad it.

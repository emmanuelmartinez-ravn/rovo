---
name: write-prd
description: Write a single-feature PRD — job, acceptance criteria, scope, and gaps — in this project's MVP.md house style. Use when the user asks to write a PRD or spec out a feature's requirements.
---

# Write PRD

A PRD for one feature, not the whole product. [`MVP.md`](../../../MVP.md) is this project's house style for the shape and vocabulary — job, acceptance criteria as checkboxes, what a feature traces to, a named gaps section. Match it rather than inventing a new shape.

## 1. Pin the job

Name whose job this feature does and what that job is, in one sentence, the way MVP.md's "Job" section does. Cite a source inline if the user gave you one, the way MVP.md cites `ProblemFrame.md`; if they didn't, mark the job as assumed and ask only if the feature can't be built without knowing it for certain.

## 2. Write acceptance criteria

One `- [ ]` line per checkable behavior, same convention as MVP.md's "Acceptance criteria" list. Every line must be falsifiable: a reviewer could run the feature and mark it done or not done from the line alone, no judgment call left over.

## 3. Draw the line

State what's explicitly out of scope, not only what's in. An omission reads as undecided; a stated non-goal reads as decided, with the reason it isn't here.

## 4. Surface the gaps

List what the PRD depends on that isn't actually known yet — an unvalidated assumption, an open question, a missing number — the way MVP.md's "Gaps" section does. An assumption written as a fact is a gap in disguise; name it instead.

## 5. File it

Save every PRD as `prds/<kebab-case-feature-name>.md` in the repo root — never anywhere else. Create `prds/` if it's missing. The folder is git-ignored (`.gitignore`), so PRDs stay local drafts: don't commit them, and don't un-ignore the folder or move a PRD out of it to get it committed.

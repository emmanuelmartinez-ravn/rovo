# MVP: [Product]

## Job
A QA engineer running exploratory sessions on forms with conditional sections wants to run each branch with a known data set and swap in edge cases one at a time, so they can cover every path they care about in one session and always know exactly which data produced each result. (source: ProblemFrame.md, "The job")

## North star
**Branch × edge-case scenarios run per session.** The MVP turns reaching a scenario from many manual steps into one action, so more combinations fit in a session.

## Platform
A browser extension that runs scenarios against the form open in the tester's own browser.

## Load-bearing feature
**Branch scenario replay**: the tester writes a scenario as a config of `label → value` entries, where the order of the entries is the path through the form. The extension replays it, filling each field as it appears. Every other in-feature depends on it: edge-case swaps change a replay, and the run log and coverage view record replays. Without it the tester is back to copy-pasting from a notes file, and nothing separates the product from form fillers that only fill what's on the page.

### Acceptance criteria
- [ ] The tester writes a scenario as a config of `label → value` entries in path order. Branch choices are entries too (e.g. `Account type: Business`).
- [ ] Running it from the extension on a fresh form goes through every entry in order, waiting for conditional fields to appear. Each field is found by its visible label, and no manual input is needed.
- [ ] Two runs of the same scenario produce the same field values.
- [ ] The tester can run at least two scenarios on the same form that take different branches (e.g. personal and business).
- [ ] If the extension can't find a field by its label, it stops and reports the missing label and which entry it was on.

## In (build order)
| # | Feature | Traces to | Why it survives the cut |
|---|---|---|---|
| 1 | **Branch scenario replay**: a config of `label → value` entries in path order, replayed field by field as fields appear | Job "run each branch with a known data set"; pains 1–2 and 5; value proposition "fills fields as they appear" | Without it the tester is back to the manual workaround. This is what moves the north star and what form fillers can't do |
| 2 | **Edge-case swap**: run a scenario with one field's value replaced by an edge case | Job "swap in edge cases one at a time"; north star "× edge-case" | Without it the job is only half done and the north star counts branches only |
| 3 | **Run log**: each run records the exact path and data used | Job "know exactly which data produced each result"; pain 4 | The differentiator promises "exactly which data produced each result" |
| 4 | **Session coverage view**: which branch × edge-case combinations have run this session, built from the run log | Job "cover every path I care about"; pain 3; value proposition "tracks which paths you've covered" | The differentiator promises "which you've tested" |
| 5 | **Unique values per run**: placeholders such as `juan+{timestamp}@test.com` | Context: the app rejects a reused email | Without it, replaying a signup-style form a second time fails |


## Deferred (by RICE score)
| Feature | Traces to | Why it can wait |
|---|---|---|
| Edge-case library (empty, max length, special characters, invalid dates) | Context: the tester's prepared edge-case list | Typing the edge-case value directly still does the job |
| Easy scenario config creation (e.g. generate a config from the form's labels, or record one by filling the form once) | Job "known data set"; pain 1 (re-typing data) | Writing the config by hand still does the job; this only speeds up setup |
| Expectation checks (expected fields or errors) | North star supporting signal | Supporting signal, not the job |
| Automatic branch discovery | Value proposition "knows which branches exist" | For now, the scenarios the tester writes define the known branches |
| Bug report export with the scenario attached | North star supporting signal | The run log already holds the data, and copying it out is enough |
| Team integration: a shared team space where testers publish and reuse each other's scenarios | North star supporting signal "scenarios reused across sessions or shared between testers" | The job is about one tester; scenarios are plain config files that can be passed around by hand until then |

## RICE
Reach 1–10: share of the tester's sessions that use the feature (10 = every session). Impact 1–5 on the north star per use: 5 massive, 4 high, 3 medium, 2 low, 1 minimal. Confidence: 100% the docs state it, 80% the docs imply it, 50% inferred. Effort in person-weeks (pw), estimated. Score = Reach × Impact × Confidence ÷ Effort.

| Feature | Reach | Impact | Confidence | Effort (pw) | Score | Rationale |
|---|---|---|---|---|---|---|
| **In** | | | | | | |
| Branch scenario replay | 10 | 5 | 100% | 4 | 12.5 | Every session runs through it; the hardest piece (waiting for conditional fields, finding fields by label). Load-bearing, so it's built first regardless of score |
| Edge-case swap | 9 | 5 | 100% | 1 | 45 | Doubles as the "× edge-case" half of the north star; small once replay exists. Depends on replay |
| Run log | 10 | 3 | 100% | 1 | 30 | Every run writes to it; it doesn't add scenarios itself but makes results reproducible |
| Session coverage view | 8 | 4 | 100% | 1.5 | 21.3 | Tells the tester which branches are still uncovered, so more get covered. Depends on the run log, so it comes after it |
| Unique values per run | 4 | 3 | 80% | 0.5 | 19.2 | Only matters on forms that reject reused values, such as signups |
| **Deferred** | | | | | | |
| Edge-case library | 8 | 3 | 80% | 1 | 19.2 | Saves retyping the prepared edge-case list each session |
| Easy scenario config creation | 10 | 4 | 50% | 3 | 6.7 | Every scenario starts as a config; requested by the team, not in the docs |
| Expectation checks | 5 | 3 | 80% | 2 | 6.0 | Catches missing fields or errors; a supporting signal |
| Automatic branch discovery | 10 | 4 | 80% | 6 | 5.3 | Large effort: inferring branches from a live form |
| Bug report export | 2 | 2 | 80% | 1 | 3.2 | Only sessions that find bugs; copying from the run log works meanwhile |
| Team integration | 3 | 3 | 80% | 5 | 1.4 | Needs accounts and a shared backend; value grows with team size |

## Roadmap
| Now | Next | Later |
|---|---|---|
| 1. Branch scenario replay | 3. Run log | Automatic branch discovery |
| 2. Edge-case swap | 4. Session coverage view | Bug report export |
| | 5. Unique values per run | Team integration |
| | Edge-case library | |
| | Easy scenario config creation | |
| | Expectation checks | |

## Gaps
- **Product name**: still `[Product]`.
- **Validation**: do testers regularly work on forms with conditional sections? (ProblemFrame.md, "In their words")

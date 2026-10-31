# Day 1 final engineering review — 2026-10-27

This file records the initial 47-test audit below and a later **58-test verification with two presentation sort modes** in the follow-up section at the end. The original audit was documentation-only; the follow-up makes a small UI ordering change. Neither changes the scorer's `rules-v2.0.0` semantics. The original three boundary/opt-out bugs remain open.

## Verdict

The seeded, offline dashboard works and all requested engineering commands passed in this review. This is a functional learning baseline with **three reproduced open bugs**, not a validated opportunity detector or an input boundary ready for arbitrary imports. Passing tests did not expose those bugs. No scoring, schema, fixture, dependency, or application behavior was changed during this review, and no Day 2 work was started.

Reviewed runtime: Node 22.17.1, npm 10.9.2, Next.js 16.4.2, ranking version `rules-v2.0.0`. The fixed fixture reference remains `2026-10-27T12:00:00.000Z`.

## Findings, in priority order

1. **High priority — explicit opt-out contractions are missed.** A separate synthetic probe, `Looking for speech recognition. Please don't contact me.`, returns `recommend`, score 65, with no exclusion or risk flag. The opt-out vocabulary recognizes `do not contact me`, but punctuation normalization turns the contraction into `don t`, which does not match that phrase. This contradicts a broad interpretation of the stated opt-out policy. There is no automatic posting, but a human must not treat Recommend as an invitation. Fix the policy and add regression cases before using real conversations; do not tune against held-out examples.
2. **Medium priority — duplicate detection precedes ID normalization.** Passing two otherwise valid development-derived posts with IDs `review-a` and ` review-a ` to `rankPosts` does not throw; both returned recommendations have ID `review-a`. The duplicate guard compares raw IDs, while the schema trims them during per-post parsing. The feed also joins by raw post IDs, so a whitespace-bearing input can fail to join or produce ambiguous identity. Current seeded IDs are already canonical and are unaffected. A future boundary must normalize/validate before uniqueness checks and joins, or reject noncanonical IDs consistently.
3. **Low priority — empty batches bypass brand/clock validation.** `rankPosts(validBrand, [], "invalid-clock")` returns `[]` because `scorePost` is never called. This is inconsistent with an unconditional claim that the batch API rejects invalid timestamps. The seeded caller uses a valid fixed clock; decide and test the batch contract before expanding ingestion.
4. **Evaluation limitation — no reviewed target data.** All 60 annotations are still `proposed`, with zero `reviewed`. They were generated in the same project context as the rules. Neither their correctness nor their independence has been established. No accuracy, precision, engagement outcome, or calibration has been measured.
5. **Reproducibility limitation — browser checks are external to the repository.** The production browser smoke check passed using temporary Playwright tooling, but `npm test` does not replay browser interactions. It covers pure rules, fixtures, and Node-rendered dashboard/error states. The route retry boundary and a browser-injected empty/error dataset were not fault-tested.
6. **Repository state — current Day 1 work is uncommitted.** Local history has one reachable commit, `b2fff78` (`day 1 started...`). The later domain, fixtures, ranking, UI, and documentation changes include modified and untracked files. This review did not stage, commit, push, or change Git configuration. Calling the new split manifest “committed” was inaccurate; that wording was corrected.

## Ranking audit

| Check | Evidence and result |
| --- | --- |
| Hardcoded answers | No post-ID/brand-ID decision lookup or expected-label lookup in the scorer. The only runtime local dependency of `ranking.ts` is `schemas.ts`. Fixed IDs in tests and the development runner select assertions/printed examples, not scoring outcomes. |
| Held-out label leakage | The scorer, browser dependency graph, and development scoring path import no annotation JSON. The page passes `getPosts("development")`. Fixture tests inspect held-out membership and annotation structure without scoring held-out posts or asserting held-out decisions. No held-out scoring run was performed. |
| Weights | Centralized in `WEIGHTS`, documented in RANKING_RULES.md, including caps, penalties, thresholds, and risk/exclusion precedence. They are hand-chosen assumptions, not learned or empirically justified values. Conceptual rationale was added without claiming validation. |
| Ordering | Descending numeric score, then ascending ID using JavaScript string comparison. For these ASCII IDs this is lexical order; in general it is UTF-16 code-unit order, not locale collation. Filtering preserves the original score rank, so ranks can have gaps. High-scoring Skip items may appear above lower-scoring Recommend items because decision grouping is not the sort rule. |
| Confidence presentation | Output is an integer heuristic score. Cards explicitly say “Heuristic score,” “Rule points, not a probability,” and “Illustrative category · not measured.” No measured popularity, conversion, confidence, or performance metric is fabricated. |
| Determinism | Scorer reads no wall clock, random source, network, labels, or mutable global result state. Reference time is passed explicitly; rules and aliases determine results. Existing tests verify repeatability, ID ties, input order independence, and nonmutation of frozen input arrays. |
| Different brands | The actual development command returned VoiceStack AI/post-01 = Recommend/100 and SecureStack/post-01 = Skip/0 for the same text. |

“No leakage found in these execution paths” is a code-review finding, not proof that humans never inspected held-out content. The held-out files and proposed annotations are visible in the repository. They should remain outside tuning, and independent manual annotation is still needed.

## Fictional data audit

Confirmed exactly two brand profiles, both with `fictional: true` and fictional positioning text; 30 unique post IDs and 30 unique nonempty texts; all posts have `provenance: "synthetic"` and `fictional_` author handles. The only engagement field is the categorical `syntheticEngagement`; there are no follower, like, impression, or conversion counts. Both profiles are explicitly fictional project scenarios, with no affiliation claim.

The dashboard displays the required prototype notice, a Fictional company badge, fictional-author labels, and synthetic/unmeasured engagement labels. The browser check saw only post-01 through post-20. The 10 held-out posts remain outside the rendered feed.

## Commands and actual results

| Executed command | Result in this review |
| --- | --- |
| `node --version` / `npm.cmd --version` | Node 22.17.1 / npm 10.9.2. |
| `npm.cmd run build` | Exit 0; `/`, `/_not-found`, and `/icon.svg` prerendered successfully. |
| `npm.cmd run typecheck` | Exit 0; route type generation and TypeScript checks passed. Run after build to avoid concurrent generated-type writes. |
| `npm.cmd run lint` | Exit 0; no warnings or errors. |
| `npm.cmd test` | Exit 0; 47 tests passed across 4 files. No new tests were added in this review. |
| `npm.cmd run rank:dev` | Exit 0; 40 development brand/post pairs scored, one runner test passed, three complete examples printed. No annotation comparison or quality metric. |
| `npm.cmd audit --json` | Exit 0; npm reported zero known vulnerabilities at review time. This is a dependency advisory result, not a general security guarantee. |
| `npm.cmd start -- --hostname 127.0.0.1` | Production server became ready and served `/` with HTTP 200. Stopped after the browser review. |
| `node C:/Users/visha/AppData/Local/Temp/SignalDesk-ui-qa/verify-dashboard.cjs` | Exit 0 against the production server; all 8 brand/filter combinations, filter retention, explanation mouse/Enter controls, and widths 1440/768/390/320 passed, with no horizontal overflow or browser console/page errors. Existing temporary tooling was reused; no dependency was added. |
| `node C:/Users/visha/AppData/Local/Temp/SignalDesk-final-secrets-review.mjs` | Exit 0; pattern-based scan of the current project files and reachable local history found no candidate secrets or sensitive file paths. Details below. |
| Node inline review probes using installed Vite `ssrLoadModule` | Exit 0; reproduced findings 1–3 without modifying fixtures or scoring held-out posts. |
| Node inline TypeScript-AST import graph and JSON inventory checks | Exit 0; confirmed the runtime import boundaries and fictional-data/annotation counts above. |
| `git -c safe.directory=D:/JavaScript/AI/SignalDesk status --short`, `log --oneline -5`, `diff --name-only`, `ls-files --others --exclude-standard`, and `diff --check` | Read local changes/history and checked patch whitespace. Existing line-ending conversion notices reflect Git configuration, not a lint failure. No global safe-directory change was made. |

These are newly executed results, not copied pass claims from earlier learning-log entries. The historical entries remain dated records of earlier runs.

## Secret-scan scope

The read-only scan inspected one reachable local commit, 20 distinct historical blobs, 37 current tracked/untracked nonignored project files, the commit message, and `.git/config`. It checked common service-token formats, private-key markers, credential assignments, authenticated URLs, and sensitive filenames. No matching candidates were found, and no secret values were printed. No local `.env` files were present in the explicitly checked root variants. `.env` files, dependencies, build output, and common local databases are ignored; an ignore rule would not remove something already tracked, which is why history was inspected separately.

This was a focused pattern scan, not a comprehensive secret detector. It does not cover every possible credential format, arbitrary ignored files, unreachable Git objects, or unseen remote history. The scanner is temporary review tooling rather than a new application command.

## Working features and remaining scope

Working: schema-validated synthetic seeds; stable ID-based development/test assignment; deterministic per-brand ranking; evidence breakdowns and flags; responsive company context/feed; brand switching; decision filters with derived counts; native explanation disclosures; tested empty/malformed-data presentation; keyless offline runtime; npm checks and development runner.

Not implemented: importing real posts, live X/API collection, editable company forms, saved human-review decisions, a reviewed-label evaluation command, automatic duplicate discovery, semantic or multilingual language understanding, authentication, database persistence, generated replies, LLM calls, posting, or hosting. No ranking-quality or business-outcome claims are supported.

## Proposed Day 2 tasks — not started

1. Agree the opt-out/negation policy, add development-only regression cases, then make a versioned rule correction for explicit contraction variants.
2. Fix canonical-ID validation/uniqueness/join order and decide the empty-batch validation contract; cover both with focused tests while preserving seeded outputs where intended.
3. Manually review development annotations, leaving disputed cases proposed. Preserve the held-out manifest and arrange independent held-out annotation before a frozen evaluation experiment.
4. Add a small reviewed-label development evaluation command and reproducible browser smoke checks, keeping quality metrics separate from fixture counts. Do not use held-out results to tune the candidate.

These are recommendations only. No Day 2 feature or scoring change was implemented during final verification.

## Files changed during this review

Added `DAY1_REVIEW.md`. Updated `README.md`, `ARCHITECTURE.md`, `EVAL_PLAN.md`, `RANKING_RULES.md`, and `LEARNING_LOG.md` with actual evidence, weight rationale, boundary limitations, newly reproduced bugs, and remaining work. No application source, tests, package files, schemas, fixtures, labels, or score semantics were changed in this review. Earlier Day 1 changes remain in the working tree and are not attributed to this documentation-only pass.

## Follow-up verification and minimal sorting improvement — 2026-10-27

### Two product-quality concerns

**A: Skip/55 above lower-scoring Review items.** This follows `rankPosts`'s intentional raw-score order; a score measures rule evidence while a decision applies exclusions and risks. It is not an arithmetic error, but it is a poor default ordering for engagement work. Added a single sort control with **Opportunity priority** as default (Recommend → Review → Skip, descending score within each group) and **Raw heuristic score** (descending score across all decisions). Both break ties by ID. The presentation helper sorts a copied array and preserves all scores, decisions, evidence, and original raw score ranks. The card footer now explicitly says “Raw score rank.” There is no scorer-version change or redesign.

**B: shelved speech-synthesis project still Review.** A fresh direct scorer run on development post-18 for VoiceStack AI returned Review/45: synthesis topic +25, help request +20, technical discussion +0, recency +0. Age removes a bonus; it does not mean that a thread is inactive. No rule recognizes the project being shelved. Recorded candidate **D3-01** in EVAL_PLAN.md for Day 3 human-reviewed evaluation. The proposed Skip label is not verified ground truth. No scorer phrase, special-case ID, fixture, label, or threshold was changed to force this example to agree.

### Actual commands and behavior checks

After the final UI correction, these commands were executed sequentially using the Windows npm wrapper:

| Command | Actual result |
| --- | --- |
| `npm.cmd run typecheck` | Exit 0. |
| `npm.cmd run lint` | Exit 0; no warnings or errors. |
| `npm.cmd run test -- --run` | Exit 0; **58 tests passed in 4 files, zero failed**. The script expands to `vitest run --run`; Vitest accepts the redundant run flag. |
| `npm.cmd run build` | Exit 0; production prerendering of `/`, `/_not-found`, and `/icon.svg` passed. |
| `npm.cmd start -- --hostname 127.0.0.1 --port 3100` | Production server ready; HTTP 200 for browser verification; stopped after checks. |
| `node C:/Users/visha/AppData/Local/Temp/SignalDesk-ui-qa/verify-sort-modes.cjs` | Exit 0; all **16** brand × sort × decision-filter combinations passed. Displayed scores, numeric breakdowns, reason details, and decisions matched the scorer outputs produced for all 40 development pairs. Brand switching, sort/filter retention, mouse/Enter disclosures, and widths 1440/768/390/320 passed with no horizontal overflow or browser console/page errors. |
| Inline Node/Vite scorer probe | Exit 0; generated the 40 development expectations for the browser check and reproduced the shelved post's unchanged Review/45 result. |
| Inline Node/TypeScript import audit and split check | Exit 0; scorer runtime graph remains `ranking.ts` → `schemas.ts`; no fixture-ID literals in the scorer, no label import, 20 development IDs and 10 held-out IDs with zero overlap. |

The existing popularity-invariance, fixed-clock/determinism, split/family isolation, and breakdown-sum tests passed. New tests verify presentation ordering in both modes and brands, stable ties, evidence/nonmutation preservation, filters, empty lists, the priority default, raw rank labeling, exclusions overriding both risk flags and a score above the recommendation threshold, and unchanged scoring evidence under renamed brand/post IDs. Hardcoded IDs in regression tests identify observations; no ranking rule looks up a post ID.

There were **no failing unit tests** in either execution of the requested command sequence. The first browser run failed because the sort select's wrapping label included its option text in the accessible name. The label was separated from the select, then all four commands and the browser check were rerun successfully. An initial sandboxed production-server bind to port 3000 failed with `EACCES`; the authorized local verification server on port 3100 succeeded. Those failures were not hidden or counted as passes.

### Follow-up changes and limitations

Changed `src/lib/opportunity-feed.ts`, `src/components/dashboard.tsx`, `src/components/opportunity-card.tsx`, and `src/app/globals.css`; extended `src/lib/opportunity-feed.test.ts` and `src/lib/ranking.test.ts`. Updated README, architecture, product acceptance criteria, evaluation plan, ranking-rule explanation, this report, and the learning log. No package changes, new pages, domain-model changes, LLM calls, Day 2 work, or held-out scoring were introduced.

Still unverified: manually reviewed annotation quality, usefulness on real conversations, measured ranking performance, exhaustive accessibility, route-error retry behavior under an injected failure, and browser-injected empty/error inputs. The earlier opt-out contraction, normalized-ID collision, and empty-batch validation findings remain open. Browser tooling is still external to the repository's npm test command.

## Re-verification — 2026-10-31

Inspected the current application and tests again and reran the requested commands rather than reusing earlier pass claims. `npm.cmd run typecheck`, `npm.cmd run lint`, `npm.cmd run test -- --run`, and `npm.cmd run build` all exited 0. **58 tests passed in 4 files; zero failed.** Lint produced no warnings/errors, and the production build prerendered `/`, `/_not-found`, and `/icon.svg`.

The existing production-browser script was rerun against a newly started local production server on port 3100, using expectations freshly generated from the current scorer. All **16** brand × mode × filter combinations passed; displayed points, reasons, scores, and decisions matched the 40 development outputs. Brand switching, sort/filter state, mouse/Enter explanation controls, four viewport widths, and lack of browser console/page errors were rechecked. The owned server was stopped afterward. No failures occurred in today's requested command sequence or browser run.

The scorer's local runtime graph is still only `ranking.ts` → `schemas.ts`. The direct audit found no fixture-ID literals or clock/random reads in the scorer, zero overlap between 20 development and 10 held-out IDs, identical repeated outputs at the fixed clock, unchanged output when engagement changed from low to viral, and different decisions for the same development post under the two brands. The current page still supplies only development posts. All 60 labels remain proposed.

Both presentation modes were already implemented and tested, so no additional application change was appropriate. Raw mode places Skip/55 (post-10) at position 8 above Review/45 (post-08) at position 10; priority mode puts them at positions 11 and 9. Scores/decisions are unchanged. The shelved development question remains Review/45 (+25 topic, +20 help, +0 discussion, +0 recency) and stays recorded as Day 3 candidate D3-01, without overfitting or label changes.

Only LEARNING_LOG.md, EVAL_PLAN.md, and this report were updated in this pass. Scorer, schemas, fixtures, labels, dependency files, and UI code were preserved. The verification date advanced to October 31; the scoring reference deliberately remains **2026-10-27T12:00:00.000Z**. No redesign, LLM integration, Day 2 implementation, or held-out scoring was introduced. Remaining quality, annotation, accessibility, runtime-error, and boundary-validation limitations described above still apply.

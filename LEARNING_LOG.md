# Learning log

## Day 1 — 2026-10-19

### Starting state

The repository contained only `.git`; `main` had no commits. Node 22.17.1 and npm 10.9.2 were installed. No application files or applicable AGENTS.md files were found. The existing repository was preserved and no nested application folder was created.

PowerShell blocked the npm script wrapper, so commands use `npm.cmd` rather than changing execution policy. The sandbox user differs from the Git owner; inspection uses a command-local `safe.directory` option rather than modifying global Git configuration.

### Engineering decisions

- Start with pure functions: identical inputs produce identical output, which makes failures easier to reproduce and tests inexpensive.
- Supply time as data: a hidden `Date.now()` would change scores and tests over time.
- Keep explanations alongside scoring: users can inspect the actual contributions instead of a separately generated story.
- Use typed local fixtures first: we can learn the ranking pipeline before introducing credentials, ingestion failures, and storage.
- Keep Next.js focused on routing and rendering: the scoring code can be tested without starting a web server.
- Distinguish rule correctness from product quality: passing tests cannot prove that people would welcome a response.
- Prefer compatible package versions to blindly selecting every latest major; preserve the exact installation in npm's lockfile.
- npm warns that ESLint 9 is out of support. It is retained because the React ESLint plugin bundled with the selected Next.js config declares support through ESLint 9. Revisit the lint dependency combination when upstream compatibility changes.

### Reflection prompts

Why does a fresh unrelated question score zero? How would synonyms change recall? Why is the negative-interest example still ranked? What evidence would justify changing weights? Which new failure modes would user-provided data introduce?

### Validation

Actual commands run with `npm.cmd` on Windows:

| Command | Result |
| --- | --- |
| `npm.cmd install` | Exit 0; added 390 packages, audited 391. |
| `npm.cmd test` | Exit 0; 1 test file, 14 tests passed. |
| `npm.cmd run build` | Exit 0; `/` and `/_not-found` prerendered. |
| `npm.cmd run typecheck` | Exit 0; route generation and TypeScript checks passed. |
| `npm.cmd run lint` | Exit 0; no warnings or errors in final run. |
| `npm.cmd run dev -- --hostname 127.0.0.1` | Ready in 7.1 seconds; GET `/` returned HTTP 200 and the expected heading. Stopped intentionally after the smoke check. |
| `npm.cmd audit --json` | Exit 1; five high-severity entries in the ESLint config dependency chain, rooted in a `braces` stack-exhaustion advisory. |
| `npm.cmd audit --omit=dev --json` | Exit 0; zero reported runtime dependency vulnerabilities. |

The audit's proposed fix downgrades `eslint-config-next` to 14.2.35, so it was not applied to this Next.js 16 setup. These development dependency findings remain unresolved. The advisory is [GHSA-vfj7-8cjw-p6xm](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm).

Resolved setup warnings: PostCSS now exports a named config variable to satisfy ESLint, and the package declares ESM so Vitest loads its config without a module-format warning. Both changes were followed by passing checks. The initial restricted npm metadata query failed with EACCES; the authorized network-enabled query and installation succeeded. Next.js reported a slow filesystem during development startup, but compilation and the HTTP check succeeded.

Next.js generated `AGENTS.md` during `next dev`; it was inspected and retained. Generated `.next`, `next-env.d.ts`, and TypeScript build-info files are ignored. No existing files were deleted, no Git initialization was performed, and no commit or deployment was made.

Browser visual and keyboard/accessibility checks were not performed. HTTP, build, lint, type, and unit checks do not verify those aspects.

## Day 1 continuation — 2026-10-27

### Domain and fixture work

Inspected the existing application and installed Next.js Server Component/testing guides before changing code. Replaced the earlier six-post TraceKit baseline with exactly two fictional profiles (VoiceStack AI and SecureStack) and 30 distinct, nonempty fictional X-style posts. Empty-input cases remain separate unit examples. The fixed clock is now 2026-10-27 at 12:00 UTC.

Added strict Zod schemas and inferred TypeScript types for BrandProfile, SocialPost, Recommendation, and HumanLabel. Zod 4.6.7 was already present transitively; it is now an explicit runtime dependency, with the lockfile updated. No other dependency was added. The install command exited 0 and reported zero vulnerabilities in the audit performed at installation time; the older audit report above records the earlier session's result.

### Evaluation boundaries

The split manifest assigns 20 post IDs to development and 10 to held-out test, shared by both brands. Validation rejects overlap, duplicate/unknown/missing membership, and repetitive families crossing splits. The 60 brand/post decisions in `human-labels.json` are **generated proposed annotations requiring manual review**, not verified human ground truth. Contract tests read their structure and coverage; the scorer, fixture loader, page, and development runner never import them.

The versioned scorer `rules-v2.0.0` uses topic aliases, help/discussion phrases, recency, explicit opt-outs, brand exclusions, risk phrases, and marked repetitive metadata. Engagement and scenario tags do not affect scores. The page and development command score only development examples; no held-out quality evaluation or tuning was performed. The files remain visible in the repository, so future developers must preserve this discipline.

`RANKING_RULES.md` documents weights, decision precedence, limitations, and every executable scoring statement in source order. Proposed annotations deliberately retain judgment calls that the lexical rules do not resolve. In particular, manually inspect negated need, vague requests, shelved projects, repeated threads, and controversy before trusting any decision.

### Validation results

| Command | Actual result |
| --- | --- |
| `npm.cmd install zod@4.6.7 --save-exact` | Exit 0; lockfile updated, no additional packages needed, audited 391 packages; npm reported zero vulnerabilities. |
| `npm.cmd test` | Exit 0; 3 files and 33 tests passed. Includes schema contracts, brand-specific scores, exclusions, viral irrelevance, empty text, risk flags, fixed-clock boundaries, deterministic sorting, score accounting, and split isolation. |
| `npm.cmd run rank:dev` | Exit 0; validated all 40 development brand/post outputs and printed the score table plus three full examples. No label comparison or quality metric. |
| `npm.cmd run build` | Exit 0; production compilation and static prerendering of `/` and `/_not-found` passed. |
| `npm.cmd run typecheck` | Exit 0; route type generation and TypeScript checks passed. |
| `npm.cmd run lint` | Exit 0; no warnings or errors. |

The development runner initially passed without displaying its console output because Vitest suppressed passing-test logs. Adding the explicit `--silent=false` CLI option made the requested output visible; the command was rerun successfully. No application logic failure was observed in the tests. Browser checks were not performed in this continuation.

Three actual development results: VoiceStack AI/post-01 → recommend, 100 (topics 50 + help 20 + discussion 10 + recency 20); SecureStack/post-01 → skip, 0 (no topic match); SecureStack/post-09 → review, 90 (topics 50 + help 20 + recency 20, with a security-controversy flag). These are rule outputs, not measured product quality or calibrated probabilities.

## Day 1 interface — 2026-10-27

Built a responsive, single-page dashboard with a compact header, company selector, positioning/audience/priority-topic/exclusion context, decision filters, and readable opportunity cards. The required prototype label is visible. Cards show fictional authors, synthetic engagement categories, heuristic scores, matched topics, risks, exclusions, and the original scorer's point breakdown. No domain schemas, fixture contents, scoring weights, decision semantics, or ranking version changed during this UI update.

The server page passes both brands, only the development posts, and the fixed clock to a Client Component. This keeps held-out data out of browser props. State consists of the selected brand ID and a decision filter. A memo derives scored opportunities from the selected profile through the existing `rankPosts` function. Filtering derives a subset without changing scores or ordering; counts come from the complete result. The active filter survives a brand switch. Brand-specific card keys reset native explanation disclosure state so old explanations do not remain expanded for a different company.

The presentation adapter returns a distinct error when ranking fails. Empty data and empty filtered results have different messages; the latter includes a Show all action. The route error boundary uses this installed Next.js version's `retry` prop. System fonts, local CSS, and a small local SVG icon keep the UI independent of external services and additional application dependencies.

### Verification

- `npm.cmd test`: exit 0; 4 test files and 47 tests passed. New coverage checks brand-specific results, all decision filters and ordering, empty data, no matching decisions, missing profiles, malformed/duplicate posts, and honest rendered score/engagement labels.
- `npm.cmd run build`: exit 0; `/`, `/_not-found`, and the metadata asset `/icon.svg` prerendered successfully.
- `npm.cmd run typecheck`: exit 0; route type generation and TypeScript passed.
- `npm.cmd run lint`: exit 0; no warnings or errors.
- A real headless Chrome run exercised the dashboard through a temporary Playwright installation outside the repository. All eight brand/filter combinations passed. VoiceStack AI showed 20 total / 5 Recommend / 5 Review / 10 Skip; SecureStack showed 20 / 3 / 3 / 14. These are counts of rule outputs, not quality or engagement metrics.
- Browser checks confirmed context/rank changes when selecting a brand, filter retention across brand switching, correct post IDs and score ordering, no held-out posts in the rendered feed, and mouse/Enter activation of explanations. No console errors or page errors remained.
- Layout checks passed at viewport widths 1440, 768, 390, and 320 pixels with no horizontal overflow. Desktop and mobile screenshots were inspected. Empty/error render states are covered by Node-rendered component tests; those states were not injected into the browser dataset.

The initial browser run caught a missing browser icon request; adding the local Next.js app icon resolved it, and the browser checks were rerun successfully. The temporary browser tooling did not modify package.json or the lockfile. The development server was stopped after verification. No hosting publication, additional product pages, or saved feedback was added.

## Day 1 final verification and skeptical review — 2026-10-27

### Decisions

Reviewed the implemented source, tests, import graph, Git history/state, fictional-data metadata, and documentation. Re-executed all required checks instead of treating earlier log entries as evidence for the current review. The seeded application is a working baseline, but passing tests are insufficient evidence of a correct opt-out policy or a robust import boundary.

Kept application code, schemas, fixtures, proposed labels, dependencies, weights, and `rules-v2.0.0` unchanged. This pass records reproduced bugs and follow-up proposals rather than silently changing the frozen baseline. Day 2 implementation has not started. Added `DAY1_REVIEW.md` and corrected/expanded the README, architecture, evaluation plan, and ranking-rule documentation.

### Newly reproduced bugs and corrected claims

1. **Opt-out contraction bypass:** a separate synthetic development-derived input, `Looking for speech recognition. Please don't contact me.`, scored Recommend/65 with no exclusions or flags. The exact phrase list recognizes `do not contact me` but does not recognize the normalized contraction. Human review is essential, and an explicit contraction/negation policy plus regression cases is a high-priority follow-up.
2. **ID normalization collision:** posts with IDs `review-a` and ` review-a ` passed the batch duplicate guard and returned two recommendations with the same trimmed ID. Uniqueness checks and the feed join operate on raw IDs before schema normalization. Seed IDs are canonical; arbitrary imported inputs are not covered by that assumption.
3. **Empty-batch validation gap:** `rankPosts(validBrand, [], "invalid-clock")` returned `[]`. No per-post call occurs to validate the clock or brand. Decide the batch contract and test it before broadening the data path.
4. The code comment calling JavaScript string comparison “code-point” ordering is imprecise for arbitrary Unicode IDs. Updated documentation to specify UTF-16 code-unit ordering; did not change the comparator.
5. The evaluation plan called the split manifest “committed,” but it is untracked in the current working tree. Corrected the description. The only reachable local commit is `b2fff78`; current Day 1 work includes uncommitted and untracked files. No commit or push was made by this review.

These are actual probes or repository observations, not inferred failures from proposed labels. The current 47-test suite did not catch bugs 1–3. No held-out posts were scored to discover them.

### Actual verification results

| Command/check | Result from this review |
| --- | --- |
| `npm.cmd run build` | Exit 0; `/`, `/_not-found`, and `/icon.svg` prerendered. |
| `npm.cmd run typecheck` | Exit 0; route generation and TypeScript passed. |
| `npm.cmd run lint` | Exit 0; no warnings or errors. |
| `npm.cmd test` | Exit 0; 47 tests passed in 4 files. No new tests were added in this pass. |
| `npm.cmd run rank:dev` | Exit 0; the development runner passed and printed 40 brand/post results and three full examples, without label comparisons. |
| `npm.cmd audit --json` | Exit 0; zero known vulnerabilities reported at the time of this review. |
| `npm.cmd start -- --hostname 127.0.0.1` and the existing temporary Chrome/Playwright script | Production `/` returned HTTP 200; both brands, all 8 brand/filter combinations, filter retention, mouse/Enter explanation controls, and widths 1440/768/390/320 passed. No horizontal overflow, console errors, or page errors. Server stopped afterward. |
| Read-only pattern secret scan | No candidates found in reachable local history (1 commit, 20 historical blobs), current nonignored project sources, commit message, or inspected Git config. No secret values were printed. This does not exhaustively cover arbitrary ignored files, unreachable objects, unseen remotes, or every credential format. |
| Runtime import-graph and JSON inventory checks | Scorer imports only its schemas locally; no annotation JSON in scorer/client/development scoring paths. Two explicitly fictional brands, 30 distinct synthetic posts, and 60 proposed / 0 reviewed annotations confirmed. |

The actual development command again showed the same post yielding different decisions: VoiceStack AI/post-01 = Recommend/100 and SecureStack/post-01 = Skip/0. Sort, stable-tie, repeatability, and nonmutation tests passed. There is no wall-clock/random/network input in the scorer. The numeric score is labeled heuristic and not a probability; engagement categories are explicitly synthetic and unmeasured.

No independent annotation review, ranking-quality measurement, full accessibility audit, browser-injected empty/error scenario, or route-error retry fault test was performed. Current browser checks use external temporary tooling and are not replayed by `npm test`. The application and fixture labels remain a synthetic authoring exercise, not proof of customer value.

### Proposed next work, not implemented

First agree and test opt-out wording and canonical-ID/batch contracts. Then make explicitly versioned corrections on development data. Manually review development annotations before adding reviewed-label evaluation, preserve the held-out split, and make browser smoke checks reproducible from the repository. Any evaluation report must distinguish code correctness, annotation quality, and product usefulness.

Five interview questions will be presented without answers for the user's attempt. No answer key was added during this review.

## Day 1 follow-up verification and sort semantics — 2026-10-27

### What works and the smallest improvement

The two fictional profiles, 30 synthetic posts, 20/10 ID split, fixed-clock deterministic scorer, and interactive development feed remain in place. Brand selection recalculates recommendation results, decision filters use real scorer decisions, exclusions override thresholds, and risk flags cause Review unless an exclusion already requires Skip. Engagement categories do not earn points. All score contributions come directly from `scorePost`; labels are outside the runtime scoring graph.

The raw scorer intentionally puts a Skip/55 above a Review/45 because it sorts evidence points, not engagement suitability. That is consistent with the engine but a poor default for an opportunity inbox. Added the smallest presentation-only change: one Sort by selector with **Opportunity priority** (default: Recommend → Review → Skip, highest score within each group) and **Raw heuristic score** (highest score regardless of decision). Each uses ID ties. The sorting helper copies the array and leaves decisions, scores, evidence, and raw score ranks unchanged. Cards now label the original rank explicitly as “Raw score rank.” The active sort and filter survive brand switching.

No redesign, domain/schema change, scoring-version/weight change, label edit, new dependency, LLM integration, extra page, or Day 2 implementation was introduced. `rules-v2.0.0` remains the scoring baseline.

### What was actually verified

After the final code correction, ran these commands in sequence on Windows:

| Command | Actual result |
| --- | --- |
| `npm.cmd run typecheck` | Exit 0; route generation and TypeScript passed. |
| `npm.cmd run lint` | Exit 0; zero warnings/errors. |
| `npm.cmd run test -- --run` | Exit 0; **58 tests passed in 4 files; zero failed**. |
| `npm.cmd run build` | Exit 0; `/`, `/_not-found`, and `/icon.svg` prerendered successfully. |

The script for `test` already uses `vitest run`, so the requested command expands to `vitest run --run`, which completed successfully. The four-command sequence also passed before the accessible-label correction; it was rerun because the UI code changed. No unit failure was observed in either run.

New tests cover both sort modes for both brands, the excluded score-55 example, deterministic ties, unchanged evidence and inputs, filtering in each mode, empty lists, default priority presentation, exclusion-over-risk precedence, and scoring invariance under changed brand/post IDs. Existing tests cover engagement invariance, fixed recency boundaries, repeatability, source mutation protection, split overlap/missing membership, and keeping repetitive families together. The development runner test also verifies that reason sums equal scores across all 40 development brand/post pairs.

A newly executed import-graph check found the scorer's only local runtime dependency is `schemas.ts`. No production annotation imports or post-ID outcome lookup were found. The page still passes only `getPosts("development")`. The manifest contains 20 development IDs and 10 held-out IDs, with zero overlap. Structural tests read proposed labels for validation but never use them as scorer input or compare held-out predictions.

The production browser run on local port 3100 passed all **16** combinations of 2 brands × 2 sort modes × 4 decision filters. For all development pairs, rendered scores, point arrays, reason text, decisions, and point totals matched fresh scorer output. It also verified changed rankings under brand selection, the Skip/55 versus Review/45 ordering in both modes, retained sort/filter state, risk displays, mouse/Enter explanation controls, and no horizontal overflow at 1440/768/390/320 pixels. No browser console/page errors remained. The owned verification server was stopped afterward.

### Bugs encountered during verification

The first browser check timed out finding the exact “Sort by” label: nesting the select inside its label caused option text to enter the accessible name. Separated the label from the select using the explicit `htmlFor`/`id` relationship, rebuilt, reran all four commands, and reran the browser checks successfully. This demonstrates why static/unit checks alone do not establish usable browser interaction.

The sandbox rejected binding the initial production server to port 3000 with `EACCES`. An authorized local server on port 3100 started successfully. That startup failure was recorded separately from build/test success.

### Two interesting scoring limitations

1. **Relevant text can describe an inactive opportunity.** A direct scorer run on the old VoiceStack AI speech-synthesis post (development post-18) still returned Review/45: topic +25, recognized help request +20, technical discussion +0, recency +0; no exclusions or flags. The prototype being “shelved” is not understood by the lexical rules. Recorded **D3-01** in EVAL_PLAN.md as a possible Day 3 evaluation failure, pending manual review of its proposed Skip annotation. No phrase or post-ID exception was added to force this one example to pass.
2. **Lexical intent and risk rules are incomplete.** Exact phrases can miss contractions or synonyms and can flag quoted or hypothetical controversy. The previously reproduced “don't contact me” opt-out gap is still open. A high heuristic score is therefore neither permission to contact someone nor confidence that an opportunity is useful. Opportunity-priority sorting improves presentation but cannot repair missing semantic evidence.

### What remains unverified

All 60 annotations are still proposed, so there is no independently reviewed ground truth, measured ranking accuracy, calibrated probability, or evidence of real engagement outcomes. No held-out scoring or real-post ingestion evaluation was performed. Full accessibility, the route retry boundary under a forced failure, and browser-injected empty/error data remain unverified; Node-rendered empty/error component tests do pass. Browser tooling remains a temporary external check rather than part of the repository's npm test command. Earlier normalized-ID collisions and empty-batch clock validation gaps also remain open.

### Questions to investigate when considering LLM ranking

- What evidence should a model cite when deciding whether a request is still active, closed, hypothetical, or quoted?
- How will deterministic exclusions retain precedence over any model-generated recommendation or score?
- How will untrusted post text be prevented from supplying instructions to the ranking model?
- Which reviewed development cases would demonstrate useful improvement over this keyless baseline, and how will we keep held-out evaluation independent?
- How will we distinguish missing evidence and uncertainty from model confidence, while measuring reproducibility, latency, and cost honestly?

These are research questions for future work. No LLM integration or Day 2 implementation was started. Five comprehension questions will be asked without an answer key so the user can attempt them first.

## Day 1 independent re-verification — 2026-10-31

### What works and what changed today

Re-inspected the actual scorer, presentation adapter, Client Component state, post cards, schemas, fixtures, split manifest, and tests. Both requested sort modes and their tests were already implemented, so no duplicate control or additional application change was necessary. Only documentation was updated today. No redesign, scoring adjustment, fixture/label edit, new dependency, LLM integration, or Day 2 implementation was introduced.

The verification date is October 31; the scoring reference intentionally remains **2026-10-27T12:00:00.000Z**. Advancing that clock during verification would change the experiment. Ranking version remains `rules-v2.0.0`.

### Commands actually rerun today

| Command | Actual result |
| --- | --- |
| `npm.cmd run typecheck` | Exit 0; route generation and TypeScript passed. |
| `npm.cmd run lint` | Exit 0; no warnings or errors. |
| `npm.cmd run test -- --run` | Exit 0; **58 tests passed in 4 files, zero failed**. The test script expands to `vitest run --run`, which succeeded. |
| `npm.cmd run build` | Exit 0; `/`, `/_not-found`, and `/icon.svg` prerendered successfully. |
| `npm.cmd start -- --hostname 127.0.0.1 --port 3100` | Production server became ready and returned HTTP 200 for the browser checks; stopped after verification. |
| Existing temporary `verify-sort-modes.cjs` Chrome/Playwright check | Exit 0; all 16 brand × sort × filter combinations passed. No browser console/page errors or horizontal overflow at 1440/768/390/320 pixels. |
| Inline Node/Vite and TypeScript import-graph probes | Exit 0; refreshed the 40 development expectations and checked scorer behavior, runtime imports, split membership, and the two product concerns. |

No requested command, unit test, or browser check failed in this October 31 pass. Earlier dated entries describe earlier failures and fixes; those are not being counted as fresh results. Existing temporary browser tooling was reused without installing an application dependency.

### What was verified

- Brand switching recalculates the selected profile's recommendations. The same development post-01 returned VoiceStack AI Recommend/100 and SecureStack Skip/0 in the direct scorer probe. Browser context, scores, and decisions changed with the selector.
- All / Recommend / Review / Skip filters worked in both sort modes for both brands. Counts came from scorer decisions. Sort/filter choices survived a brand switch, and explanations worked with mouse and Enter.
- The browser's displayed scores, signed point contributions, explanation text, and decisions matched freshly calculated scorer outputs for all 40 development pairs. The direct probe and development runner test confirmed contributions sum to each score.
- Changing the same relevant post's synthetic engagement from low to viral left the complete recommendation output unchanged. No popularity metric enters the score.
- Existing tests passed for hard exclusions overriding an above-threshold score and a risk flag, relevant controversy routing to Review, fixed-time recency boundaries, repeatability, stable ties, and input nonmutation. Decision precedence remains exclusion → Skip; otherwise risk → Review; otherwise thresholds.
- The manifest has 20 development IDs and 10 held-out IDs with zero overlap. Structural tests also cover missing/overlapping IDs and cross-split repetitive families. The production page supplies only the development split.
- The scorer's local runtime dependency graph is `ranking.ts` → `schemas.ts`; it imports no human-label JSON or fixture data. Inspection found no individual post-ID outcome lookup, and the ID-renaming invariance test passed. Fixture/test IDs in regression assertions do not determine production outcomes.
- All 60 annotations remain proposed, with zero reviewed. No held-out scoring or annotation-based quality evaluation was performed.

### Product concern A: raw evidence versus opportunity order

Raw heuristic score intentionally permits an excluded Skip/55 to appear above Review/45. That is consistent with raw evidence sorting but an unsuitable default for deciding where to engage. The existing minimal UI correction is appropriate: Opportunity priority groups Recommend → Review → Skip, with descending scores within each group; Raw heuristic score sorts across decisions. Both use deterministic ID ties and preserve score/decision/evidence objects. Raw score ranks are explicitly labeled rather than silently relabeled as priority positions.

Fresh observed positions for VoiceStack AI: in raw mode post-10 (Skip/55) is position 8 and post-08 (Review/45) is position 10; in priority mode they are positions 11 and 9 respectively. The browser verified both modes. No scorer change was necessary.

### Two scoring limitations and the Day 3 case

1. **Relevance does not establish an active opportunity.** Development post-18 mentions that the speech-synthesis prototype was shelved, but a fresh scorer call still returned Review/45: topic +25, help request +20, technical discussion +0, recency +0, no exclusions/flags. Age only removes a bonus; there is no semantic closed-project rule. The existing D3-01 entry in EVAL_PLAN.md is a possible Day 3 evaluation failure, pending human review of its proposed Skip label. It was retained without adding a one-post rule, changing labels, or tuning on held-out content.
2. **Exact phrases do not reliably interpret intent.** Synonyms, contractions, quotations, negation, and hypothetical controversies can be missed or misread. The prior explicit opt-out contraction gap remains open. Better presentation ordering does not repair those missing signals or turn a heuristic into a calibrated probability.

### What remains unverified

No independently reviewed labels, real-conversation usefulness, measured precision/accuracy, engagement outcomes, or probability calibration. No real-post import was exercised. Empty/malformed/missing-context UI states have Node-rendered test coverage, but browser-injected error/empty inputs, route retry fault recovery, and a comprehensive accessibility audit remain unverified. The browser script remains external temporary tooling rather than part of `npm test`. Previously documented canonical-ID collisions and empty-batch validation gaps were not fixed in this verification pass.

### Questions for future LLM-ranking investigation

- What evidence would distinguish an inactive question from a reopened project or a still-useful retrospective?
- Which deterministic exclusions must remain binding regardless of a model's output, and how will unsupported intent claims be surfaced?
- How will instructions embedded in untrusted post text be isolated from the ranking task?
- How will reviewed development cases and a protected held-out experiment establish improvement over the unchanged rules baseline?
- How will repeated-run variation, explanation faithfulness, latency, and cost be measured while preserving a keyless fallback?

These are future evaluation/design questions only. No LLM integration or Day 2 code was added. Comprehension questions are presented without an answer key for the user's attempt.

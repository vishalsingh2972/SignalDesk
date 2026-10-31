# Evaluation plan

## Day 1: correctness, not proven quality

Automated unit tests check rule behavior and deterministic ordering. They are regression checks, not evidence that the heuristic finds valuable conversations. Build, lint, and typecheck verify separate integration and static correctness concerns.

UI acceptance: open `/` and switch between both fictional brands. Confirm the positioning, audience, priority topics, excluded topics, and ranked posts update. Each brand has 20 development posts; verify All / Recommend / Review / Skip filters display only matching decisions and preserve the selected presentation order. Check both sort modes: Opportunity priority groups Recommend → Review → Skip, while Raw heuristic score orders across decisions by score. Each mode breaks ties by ID. Confirm sort/filter choices survive a brand switch, counts match rendered results, raw ranks are labeled clearly, explanations work by mouse and keyboard, and synthetic engagement/heuristic scores are clearly labeled. Check narrow and wide layouts. Empty source data, empty filter results, missing context, and malformed data have separate test coverage. Browser checks must be reported separately from static checks.

## Proposed annotations and manual review

`src/data/human-labels.json` contains exactly one label per brand/post pair (60 total). **All generated labels are proposed annotations, not ground truth.** To review a row, read the brand and post without consulting its rule output, edit `decision` and `reason`, and change `annotationStatus` from `proposed` to `reviewed` only after manual assessment. Leave unresolved cases proposed. Especially review uncertain intent, allegations, opt-outs, negated need, shelved projects, repeated questions, and announcements. A small review log can be kept here or in LEARNING_LOG.md.

Decisions: `recommend` = evidence of a useful, welcome contribution; `skip` = unrelated, closed, repetitive without added value, or explicitly unwelcome; `review` = uncertainty or sensitive context requiring judgment. These definitions are annotation proposals to validate. Do not change a label simply to agree with the engine. When possible, have an independent reviewer annotate held-out posts; if you review them yourself, avoid using their content to tune rules.

## Split and execution policy

The current working-tree ID manifest fixes post-01 through post-20 as development, and post-21 through post-30 as held-out test. At final review it was still untracked, so it must not be described as committed. Both brands use the same split. Repetitive families (12/13/14 and 26/27) remain together. Never move examples in response to a ranking error. Contract tests inspect all data and annotations for structural correctness but do not run scoring on the held-out set or assert its expected decisions.

Run `npm run rank:dev` to score all 40 development pairs. It prints decisions and three actual outputs, imports no annotations, and reports no quality metrics. The page also scores development only. The held-out set is not encrypted or access-controlled; keeping it out of tuning remains an engineering discipline.

## Later evaluation

After annotation review, implement a separate evaluation command that uses reviewed labels only. Tune on development, freeze the candidate's code, weights, and reference date, then score the held-out set once to report the frozen experiment. Use a new version and a fresh holdout if repeated inspection starts influencing tuning.

Suggested future reports: a recommend/skip/review confusion matrix, precision@k with explicit k and denominator (recommend labels treated as useful), raw disagreement counts, and qualitative errors. State that 20 held-out brand/post pairs share just 10 posts, so the pair judgments are not independent. A fixture set this small cannot establish general performance. No precision, accuracy, or engagement results have been measured here.

## Development assumptions to inspect

The scorer conservatively reviews negated need rather than treating all negation as a hard opt-out. A stale shelved project can still receive topic and help points. Vague API requests can receive zero despite a proposed review annotation. These are explicit limitations, not evidence to rewrite annotations or tune on held-out content.

## Final review evidence and test gaps

On 2026-10-27, `npm.cmd test` passed 47 tests and the development command scored 40 pairs. All 60 labels remained proposed, with zero reviewed labels. These results verify engineering behavior, not relevance quality. The current annotations and rules were authored in the same synthetic project context; independent judgment is still needed.

Separate, development-derived probes reproduced unsupported explicit opt-out contractions, IDs colliding after trimming, and an invalid clock accepted for an empty batch. The passing suite does not currently contain regression tests for those failures. Review-only reproducers and the full audit are described in [DAY1_REVIEW.md](DAY1_REVIEW.md). No labels or holdout assignments were changed to improve apparent results, and no held-out scoring or accuracy evaluation was performed.

Production-browser checks were actually rerun for both brands, all four filters, explanation controls, and four viewport widths. This tooling is temporary and is not part of `npm test`; the route retry boundary was not fault-injected. Make that distinction explicit in future reports.

## Day 3 candidate evaluation case D3-01: inactive or shelved projects

- **Source:** development post-18, VoiceStack AI; this is not a held-out observation.
- **Observed output:** Review/45 from `rules-v2.0.0`, fixed reference 2026-10-27 at 12:00 UTC. Breakdown: speech-synthesis topic +25, recognized help request +20, discussion +0, recency +0. No exclusions or risk flags.
- **Concern:** the text says the prototype was shelved. A historical question can look relevant while no active opportunity remains. Removing recency points alone does not establish that a conversation is closed.
- **Annotation status:** the existing Skip annotation is still only proposed and needs human review. Treat this as a possible evaluation failure, not a measured false positive.
- **Day 3 investigation:** assess active need versus historical discussion across varied examples, including quoted “shelved” wording, reopened projects, and still-useful postmortems. Evaluate general behavior on reviewed data before adding a broad closure rule or model-based interpretation.
- **Guardrail:** do not special-case post IDs, add a one-example keyword fix, edit the label to match the scorer, or tune against held-out results. No LLM or Day 3 evaluator was implemented here.

## Follow-up UI verification

The later Day 1 pass ran `npm.cmd run typecheck`, `npm.cmd run lint`, `npm.cmd run test -- --run`, and `npm.cmd run build` after adding two presentation sort modes. All passed; **58 tests passed in 4 files with zero failures**. Production-browser checks covered 16 brand × mode × filter combinations and compared displayed decisions, scores, point contributions, and reason text with the 40 development scorer outputs. Neither the scorer nor proposed labels were adjusted, and no held-out scoring run was performed. See DAY1_REVIEW.md for the initial browser-label failure, its fix, rerun evidence, and remaining verification limits.

On **2026-10-31**, all four commands were rerun successfully: 58 tests passed across 4 files, with zero failures. A fresh production-browser run again passed all 16 brand × sort × filter combinations against newly calculated development expectations. D3-01 was directly rechecked and remains Review/45 at the unchanged 2026-10-27 reference clock. Its proposed Skip annotation still requires manual review; no quality metric or held-out result was produced. No application or scorer change was needed in this re-verification.

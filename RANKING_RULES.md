# Deterministic ranking — rules-v2.0.0

This is a hand-authored lexical baseline, not an LLM or a calibrated probability. The weights were specified before running the development command. No labels, post IDs, engagement categories, scenario tags, split assignments, or held-out results determine the score. The scorer does use `repetitiveOf`, which represents an explicit ingestion-time relationship; it does not discover duplicates itself.

## Contract and weights

`scorePost(brand, post, referenceTime)` returns a validated `Recommendation`. The caller supplies an ISO UTC clock; fixtures use **2026-10-27T12:00:00.000Z**. Malformed data throws a Zod error. Empty post text is intentionally valid and yields a skip rather than throwing.

| Signal | Points | Rule |
| --- | --- | --- |
| Topic group | +25 each, max +50 | Match any alias; each unique topic ID counts once. |
| Help request | +20 once | Recognized help phrase and at least one matching topic. |
| Technical discussion | +10 once | Recognized discussion phrase and at least one matching topic. |
| Age 0–7 days inclusive | +20 | Requires a matching topic. |
| Age >7–30 days inclusive | +10 | Requires a matching topic. |
| Other age | 0 | Future dates also raise a review flag. |
| Announcement | −20 | Requires relevance; also raises a review flag. |
| Marked repetitive post | −25 | Requires relevance; also raises a review flag. |
| Engagement/category tags | 0 | Never read by scoring rules. |

Score is clamped to 0–100. The adjustment is recorded so the sum of reason points always equals the returned score. A hard exclusion can coexist with a high score: exclusions govern the decision, rather than rewriting the relevance evidence.

The conceptual intent of the unvalidated weights is to give topic relevance the largest budget, favor an explicit help request over a general technical discussion, and use recency as supporting evidence. Capping topic points limits the reward for mentioning many aliases/groups. Announcement and repetition penalties are conservative friction, while flags retain manual review. The exact values (25/20/10, penalties, and 60/25 thresholds) have no experimental justification yet; this rationale is a design explanation, not proof that they are optimal. Do not infer historical independence or calibration from a documented table.

Decision precedence: any exclusion → `skip`; otherwise any risk flag → `review`; otherwise score ≥60 → `recommend`; otherwise score ≥25 → `review`; otherwise `skip`. `recommend` means a candidate for human assessment, not permission to post.

Hard exclusions: normalized empty text, no topic match, explicit opt-out phrases, or a brand's exclusion phrases. Risk flags: recognized controversy, ambiguous or negated intent, future timestamp, announcement, or marked repetition. Controversy and ambiguity use phrase matching, not semantic understanding; the complete lists are in the scorer.

## Line-by-line explanation of src/lib/ranking.ts

Line numbers below refer to this version of the file. Blank lines, closing braces, and type-only function signatures organize the code; they do not add scoring behavior.

| Line(s) | What the code does and why |
| --- | --- |
| 1 | Import Zod to validate the caller-supplied reference timestamp. |
| 2 | Import runtime brand, post, and output schemas. |
| 3 | Import TypeScript-only domain types; these disappear at runtime. |
| 5 | Attach a stable ranking version to every result. Change it when rules change. |
| 6–7 | Centralize and freeze the weights, cap, and decision thresholds. |
| 9 | Define the finite help-request vocabulary; a question mark alone is insufficient. |
| 10 | Define technical-discussion phrases. Multiple hits still earn only +10. |
| 11 | Define explicit author opt-out phrases. |
| 12 | Define words that warrant manual review of sensitive claims. |
| 13 | Define uncertainty and negated-need phrases. |
| 14 | Define announcement phrases. |
| 16–17 | Normalize Unicode compatibility forms, lowercase, replace non-letter/non-number runs with spaces, then trim. Thus `code-switching` matches `code switching`; Unicode letters remain intact. |
| 20–21 | Normalize a candidate phrase using the same text rules. |
| 22 | Reject empty phrases and require space-delimited whole-phrase matching. Thus `asr` does not match inside `disaster`. |
| 25–26 | Return true if any phrase matches, without counting repeated hits. |
| 29–30 | Declare the pure single-post API. Its only inputs are brand, post, and reference time. |
| 31 | Validate the brand and reject unknown keys or duplicate topic IDs. |
| 32 | Validate the post, including its synthetic provenance and timestamp. |
| 33 | Validate and parse the explicit reference time, rather than reading the machine clock. |
| 34 | Normalize post text once for all phrase checks. |
| 35 | Filter matching topic groups and return their IDs in brand declaration order. Aliases do not multiply a group's points. |
| 36 | Establish whether any topic is relevant. |
| 37 | Calculate exact elapsed days from UTC milliseconds, including fractional days. |
| 38 | Start a local list of hard exclusions. |
| 39 | Start a local list of review flags. |
| 40 | Start a typed list of score contributions. |
| 41 | Define a local helper to append a rule, signed points, and explanation. Local mutation never changes inputs or shared state. |
| 43 | Exclude empty normalized text, including punctuation-only input. |
| 44 | Exclude explicit opt-outs regardless of relevance. |
| 45–46 | Check each brand-specific exclusion phrase and record exactly which one matched. |
| 48 | Exclude posts with no matching topics. |
| 50–51 | Award +25 per matching group up to two groups; explain the matches even if another rule excludes the post. |
| 52 | Award +20 for a recognized help phrase only when relevant. |
| 53 | Award +10 for a recognized technical phrase only when relevant. |
| 54 | Calculate the age-band bonus with exact inclusive 7/30-day limits. |
| 55 | Add that bonus only when relevant, preventing fresh unrelated posts from rising. |
| 57 | Flag relevant controversy phrases for review; no numerical penalty is invented for an allegation. |
| 58 | Flag relevant ambiguous or negated intent for review. |
| 59 | Flag future timestamps; they receive no recency points. |
| 60–61 | Detect a relevant announcement and record its flag. |
| 62 | Subtract 20 points for the announcement. |
| 64–65 | Detect explicit repetitive metadata on a relevant post and record its flag. |
| 66 | Subtract 25 points and identify the referenced original post. |
| 69 | Sum all numeric contributions, including penalties. |
| 70 | Clamp the sum to the documented 0–100 range. |
| 71 | If clamping changes the sum, record the difference as an explanatory contribution. |
| 72 | Give hard exclusions highest precedence and return `skip`. |
| 73 | Otherwise force manual `review` when any risk exists. |
| 74 | Otherwise `recommend` at 60 or more. |
| 75 | Otherwise `review` at 25 or more, and `skip` below that. |
| 76 | Record the decision logic as a zero-point reason, preserving the numeric total. |
| 78–79 | Validate and return IDs, decision, score, evidence, exclusions, risks, version, and clock. No label lookup occurs. |
| 82–83 | Compare IDs with JavaScript's deterministic UTF-16 code-unit string ordering rather than a machine locale. The implementation comment's phrase “code-point” is imprecise for arbitrary Unicode IDs; current fixture IDs are ASCII. |
| 86–87 | Declare batch ranking separately from single-post scoring. |
| 88 | Reject duplicate IDs because they would make output identity and tie handling ambiguous. |
| 89 | Score each supplied post into a new array. The caller controls which split is supplied. |
| 90 | Sort that new array by descending numeric score, then ascending ID for ties. Input order and arrays remain unchanged. |

## Limitations to validate manually

The topics and exclusions are hypotheses about fictional brands, not customer research. A lexical match does not establish product fit, welcome, purchasing intent, or truth. English aliases do not provide reliable multilingual understanding. Negation and controversy detection are shallow; quoted phrases can trigger false flags. Announcements, repeated questions, and older threads may still deserve useful replies.

Development examples intentionally include possible disagreements with proposed annotations: the negated-need post is conservatively `review` while its proposed label is `skip`; the vague API post has no recognized topic; and the shelved old question has no semantic closed-thread rule. Do not silently change proposed annotations to match the engine or claim these disagreements are measured errors before manual review.

`rankPosts` sorts by raw score even when a high-scoring item is excluded. That is intentional for inspecting heuristic evidence, but it is a poor default priority order for deciding where to engage. The dashboard now defaults to a separate **Opportunity priority** presentation sort: Recommend → Review → Skip, descending scores within each group, then ascending ID. **Raw heuristic score** remains selectable and matches the engine's order. The display helper never changes scores, decisions, evidence, or the original raw score ranks. Cards label those ranks explicitly. Always read `decision`, `exclusions`, and `riskFlags` alongside the score. This UI-order change does not require a scoring-version change; `rules-v2.0.0` remains unchanged.

## Reproduced open bugs from final review

The opt-out rule recognizes only its explicit phrases. `Looking for speech recognition. Please don't contact me.` was actually scored Recommend/65 with no flags or exclusions: the contraction does not normalize to `do not`. This is an open bug in the practical opt-out policy, not a safe interpretation of the author's wishes.

Batch validation also compares raw IDs before the per-post schema trims them: IDs `review-a` and ` review-a ` can produce duplicate output IDs. An empty batch accepts an invalid clock without validation. These findings do not affect the canonical seeded dataset, but they limit the public API contract. [DAY1_REVIEW.md](DAY1_REVIEW.md) records the actual probes, impact, and proposed follow-up. The scorer and version were deliberately preserved for this final review; future fixes require tests and an explicit version/contract decision.

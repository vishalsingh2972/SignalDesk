# Evaluation plan

## Day 1: correctness, not proven quality

Automated unit tests check rule behavior and deterministic ordering. They are regression checks, not evidence that the heuristic finds valuable conversations. Build, lint, and typecheck verify separate integration and static correctness concerns.

Manual acceptance: open `/`, confirm six fictional samples, check descending scores, open each explanation using mouse and keyboard, and verify that its contributions sum to the displayed total. Check narrow and wide layouts. No successful browser inspection should be claimed unless actually performed.

## Later: human-labeled relevance evaluation

Before changing weights, assemble a separate dataset from synthetic cases and, only if authorized, user-provided conversations. Keep source provenance and remove unnecessary personal data. Label examples without showing model/rule scores to reviewers.

Suggested labels: 0 = unrelated or explicitly unwelcome; 1 = relevant but no clear useful contribution; 2 = a clear opportunity for a helpful, non-promotional response. Record a short rationale and disagreements. Include irrelevant fresh questions, stale relevant questions, negation, ambiguous vocabulary, synonyms, and multilingual examples.

Freeze a holdout set separate from examples used to tune weights. Compare baseline and candidate on the same context and reference date. Report precision@k (fraction of top k labeled 2), with k and denominator stated, plus false-positive examples and ranking changes. For small samples, report raw counts and uncertainty rather than implying general performance. Do not publish metric values until labels and an evaluation run exist.

## Known failure to inspect

`sample-06` says the author does not need another observability tool but receives topic and recency points. The rule engine cannot understand that negation. This is a reason to retain human review and collect error cases before adding complexity. No quality metrics have been measured in Day 1.

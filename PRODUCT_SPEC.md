# SignalDesk — Day 1 product scope

## Problem and audience

Technical founders, DevRel teams, and developer-tool companies need to find conversations where they can contribute useful expertise. A popularity signal alone does not establish relevance or permission to promote a product.

Intended product workflow: define company context → import or seed conversations → rank opportunities → explain rankings → human review → evaluate improvements.

## Day 1 agreement

Build documentation, a Next.js + TypeScript + Tailwind foundation, typed seed data, a deterministic ranking function, unit tests, and a simple ranked interface. The existing repository is the application root, and the npm package is `signaldesk`.

Company context is defined in a typed source file today. Conversations are seeded from that same file. The UI displays the context, ordered conversations, rule scores, and expandable explanations. Human review means reading and assessing the evidence today; saved decisions and feedback controls are deferred.

## Data sources

Day 1 uses six explicitly synthetic conversations and a fictional company, authored for this repository. They are not scraped posts, real endorsements, real accounts, or evidence of demand. No follower, impression, conversion, or engagement metrics are fabricated. Dates are fixed fixtures, not a live feed.

Future options, subject to a separate scope decision: user-supplied exports or authorized public APIs with provenance and applicable usage constraints. None is implemented today.

## Non-goals

- Model APIs (including Groq, Gemini, OpenAI), local models, embeddings, or generated replies.
- Live X scraping, automatic posting, or automated outreach.
- Authentication, database, file upload, background jobs, hosting, billing, analytics, or saved review state.
- Production readiness, validated ranking quality, or business outcome claims.
- Completing the remaining six days in this implementation.

## Acceptance criteria

- Installs with npm in the existing root; existing Git metadata remains intact.
- `dev`, `build`, `lint`, `typecheck`, and `test` scripts work on the supported Node version.
- Runtime requires no API keys, paid accounts, environment variables, or remote fonts/data.
- Home page shows company context and all six synthetic examples in descending score order.
- Each score exposes the rule contributions that sum to its total.
- Ranking is reproducible, independent of the wall clock, and does not mutate input.
- Tests cover relevance, help intent, recency boundaries, ties, malformed dates, empty input, normalization, and score limits.
- Product scope, architecture, evaluation plan, and learning decisions are documented.

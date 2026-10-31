# SignalDesk — Day 1 product scope

## Problem and audience

Technical founders, DevRel teams, and developer-tool companies need to find conversations where they can contribute useful expertise. A popularity signal alone does not establish relevance or permission to promote a product.

Intended product workflow: define company context → import or seed conversations → rank opportunities → explain rankings → human review → evaluate improvements.

## Day 1 agreement

Build documentation, a Next.js + TypeScript + Tailwind foundation, typed seed data, a deterministic ranking function, unit tests, and a simple ranked interface. The existing repository is the application root, and the npm package is `signaldesk`.

Company context is defined in editable JSON for exactly two fictional brands: VoiceStack AI (multilingual Voice AI APIs) and SecureStack (enterprise AI security). Posts are seeded from a separate JSON file and validated with Zod. The UI lets users select either brand, inspect its positioning/audience/topics/exclusions, and filter its ranked development feed by decision. Post cards display clearly labeled synthetic engagement, heuristic scores, decisions, topics, risks, exclusions, and expandable explanations. Saved review state remains deferred; human annotations can be edited in a local JSON file.

## Data sources

Day 1 uses 30 explicitly synthetic X-style posts and two fictional brands, authored for this repository. They include developer questions, technical discussions, announcements, viral unrelated posts, uncertain intent, fictional security controversies, repetitive families, and low-engagement relevant cases. Authors have a `fictional_` prefix. No post URLs or real claims are supplied. Engagement is described only with labeled synthetic categories, never invented numeric metrics; it does not affect scores. Separate unit examples test empty text without consuming a fixture post slot.

An explicit ID manifest assigns 20 posts to development and 10 to held-out test. Repetitive families stay within a split. Sixty generated brand/post annotations cover the full cross-product exactly once. Every annotation begins as `proposed`; the user must manually review decisions and reasons before treating them as evaluation targets. Labels are never scorer inputs, and the held-out set is not used for tuning.

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
- Home page lets users select either brand and shows its 20 development examples; held-out posts are excluded.
- Opportunity priority is the default display order (Recommend → Review → Skip, descending scores within each group). Raw heuristic score mode preserves descending scores across all decisions. Both break ties by ID, and neither changes scoring outcomes.
- Recommend / Review / Skip filters use actual scorer decisions, with counts derived from the selected brand's results.
- The responsive interface labels its synthetic provenance visibly and provides distinct empty-data, empty-filter, and error states.
- Each score exposes the rule contributions that sum to its total.
- Ranking is reproducible, independent of the wall clock, and does not mutate input.
- Tests cover brand-specific relevance, help intent, exclusions, risk flags, viral irrelevance, recency boundaries, ties, malformed dates, empty text, normalization, label coverage, and split isolation.
- A development command scores all 40 development brand/post pairs without reading annotations or scoring held-out posts.
- Product scope, architecture, evaluation plan, and learning decisions are documented.

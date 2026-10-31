# Day 1 architecture

## Data flow

`brands.json` + `posts.json` + `split-manifest.json` → Zod-validated `src/data/sample.ts` → `src/app/page.tsx` passes profiles + `getPosts("development")` + fixed clock → interactive `Dashboard` → `buildOpportunityFeed` calls the existing `rankPosts` → presentation sort mode → decision filter → post cards.

The App Router supplies the single `/` page and shared layout. The page remains a Server Component and loads local fixtures at render/build time. Its dashboard child is a Client Component because brand selection and decision filters require event handlers and state. It receives only development posts; neither held-out posts nor annotation files enter its props. Client Components are prerendered initially, then hydrated. Tailwind v4 is loaded through PostCSS; the restrained responsive layout uses local CSS and system fonts. A small SVG app icon is served through Next.js metadata conventions. No new application dependencies, pages, storage, or remote services were added.

## Dashboard state and presentation

The dashboard stores `selectedBrandId` (initially the first supplied brand), `decisionFilter` (initially `all`), and `sortMode` (initially `priority`). The selected profile is derived from the ID. A memo recomputes the real scorer output when the profile, post array, or reference time changes. Results are joined back to their original posts, carrying the original raw score rank. Counts derive from the complete result, while sorting and filtering derive the displayed list. Switching brands retains the active filter and sort mode.

`sortOpportunities` in `src/lib/opportunity-feed.ts` is presentation-only. Priority mode groups Recommend → Review → Skip, with descending score and then ID within each group. Raw mode sorts by score and then ID across all decisions. It sorts a copied array, preserving recommendation objects, evidence, and the original `rank` field. The footer explicitly calls that field “Raw score rank.” `rankPosts` still returns raw score order; no scorer weights, thresholds, exclusions, risks, or version changed. A high-scoring excluded post can therefore appear high in raw mode but cannot outrank Review items in priority mode.

`OpportunityCard` presents the original post text and synthetic engagement category, plus all recommendation evidence. Its disclosure uses native `<details>` state. It shows exclusion/risk precedence even if the excluded post has a high score. Display labels are cosmetic; domain schemas, fixture data, scorer semantics, and `rules-v2.0.0` were preserved.

The presentation adapter catches invalid scoring data and returns an error state rather than a fabricated empty feed. Empty source data and a filter with no results have distinct messages. Error recovery reloads the dashboard or allows another brand selection. `src/app/error.tsx` supplies a route-level fallback using the installed Next.js version's `retry` prop for unexpected render/load failures.

`src/lib/schemas.ts` defines strict Zod contracts for BrandProfile, SocialPost, Recommendation, and HumanLabel. `types.ts` infers static types from those contracts. The fixture loader validates brands and posts; the single-post scorer validates its inputs and outputs. Invalid timestamps throw; normalized empty text is a valid skip case. Zod 4.6.7 is the only added dependency for this continuation. See [Zod schemas](https://zod.dev/api).

## Baseline v2 scoring contract

1. Validate inputs, normalize Unicode text and topic aliases, then match complete phrases.
2. Award 25 per matching topic group (cap 50), 20 for a recognized help request, 10 for a recognized technical discussion, and up to 20 for recency. Auxiliary points require relevance.
3. Penalize announcements by 20 and explicit repetitive metadata by 25. Clamp totals to 0–100 and preserve the full numeric breakdown.
4. Exclusions force skip; otherwise risk flags force review; otherwise score thresholds are recommend ≥60, review ≥25, skip below 25.
5. Sort descending by score, then ascending by ID, without mutating inputs. Scores are not probabilities, and decision overrides may exclude a high-scoring result.

The caller supplies the clock. The current sample reference is **2026-10-27 at 12:00 UTC**; results do not silently drift tomorrow. Every result carries `rules-v2.0.0`. See [RANKING_RULES.md](RANKING_RULES.md) for all weights, phrase lists, risk precedence, and the line-by-line walkthrough.

Weights are hand-authored hypotheses. The pure scorer imports only schemas and types; it knows nothing about fixture IDs, split assignments, or human labels. Synthetic engagement and scenario tags are ignored. `repetitiveOf` is explicit source metadata, not an expected decision; later ingestion would need a separate deduplication policy.

`src/lib/splits.ts` rejects duplicate IDs, overlapping/missing/unknown assignments, invalid repetition roots, and cross-split repetitive families. Both brands share the same post split, preventing a post from leaking between development for one brand and test for another.

`human-labels.json` is imported only by the fixture contract test, which checks schema and pair coverage without running the scorer on held-out posts or comparing decisions. The development runner tests the 40 development pairs and prints results without accessing labels. This is not an accuracy evaluation. Held-out files are visible in the repository; isolation is enforced in the current execution paths and must be maintained during future tuning.

## Dependency decisions

Registry versions checked on 2026-10-19: Next 16.4.2, React 19.3.1, Tailwind 4.3.3, Vitest 5.0.5, and Vite 8.3.4. Vite is Vitest's required peer; Next.js still owns application development and builds. TypeScript 5.9 and ESLint 9 stay within the supported lint-tool peer ranges (the inspected TypeScript ESLint tooling requires TypeScript <6.1 and the React ESLint plugin supports ESLint 9). Node 22.17.1 is the tested baseline. The lockfile records resolved versions.

ESLint runs separately: modern Next.js builds do not run lint automatically. `next typegen` creates route types before `tsc --noEmit`, allowing typecheck on a fresh checkout. Vitest runs pure engine tests in Node, so no DOM emulator or browser-testing dependency is required.

Official references: [Next.js installation](https://nextjs.org/docs/app/getting-started/installation), [Vitest migration](https://vitest.dev/guide/migration/).

## Review limits at the API boundary

The validated seed loader uses canonical IDs, so its data satisfies the current demo path. Direct `rankPosts` calls are less robust: uniqueness is checked before per-post parsing trims IDs, and an empty batch never reaches brand/reference-time validation. The feed's ID map also uses supplied IDs before parsing. Do not interpret the existing Zod calls as an import-ready boundary. The final review reproduced these cases and an unsupported opt-out contraction; see [DAY1_REVIEW.md](DAY1_REVIEW.md). No runtime or scoring changes were made during the review.

No label data enters the scorer's runtime dependency graph (`ranking.ts` → `schemas.ts`) or the Client Component dependency graph. This verifies the current code path, not the independence of human decisions during dataset construction. The two profiles and proposed labels share a synthetic authoring context and have not undergone independent annotation review.

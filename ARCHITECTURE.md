# Day 1 architecture

## Data flow

`src/data/sample.ts` → `rankConversations(conversations, company, referenceTime)` → `src/app/page.tsx` → HTML.

The App Router supplies the `/` route and shared layout. The page is a Server Component and uses local data at render/build time. Tailwind v4 is loaded through its PostCSS plugin. No custom Next.js configuration, API route, ORM, or component library is needed.

Types describe company context, conversations, score contributions, and ranked results. They help catch coding mistakes but are not runtime validation for untrusted imports; an import boundary would need validation in a later scope.

## Baseline v1 scoring contract

1. Normalize text and topics to lowercase ASCII words, treating punctuation as spaces. Remove empty and duplicate topics. Match complete normalized phrases, not substrings.
2. Award 20 points per unique matching topic, capped at 60.
3. With at least one topic match, award 20 for one or more phrases: `how do`, `how can`, `looking for`, `recommend`, `any advice`, `struggling`.
4. With at least one topic match, award 20 if age is 0–7 days inclusive, 10 if greater than 7 and at most 30 days, otherwise 0. Ages use exact UTC elapsed milliseconds. Invalid or future publication dates receive zero recency points.
5. Sum contributions (0–100), sort descending, then break ties by ID using lexical comparison. Seed IDs must be unique.

The caller supplies the clock. An invalid reference timestamp throws. The sample reference is 2026-10-19 at 12:00 UTC; results do not silently drift tomorrow. Each result contains the evidence and points used to calculate it. Scoring returns a new array and leaves inputs intact.

Weights are a hand-authored starting hypothesis, not learned or calibrated probabilities. Topic relevance gates intent and recency so an unrelated fresh request does not rise above relevant discussions. Known limitations include synonyms, non-English text, negation, sarcasm, topic ambiguity, and unrecognized request phrasing. The negative-interest sample intentionally exposes one of these failures.

## Dependency decisions

Registry versions checked on 2026-10-19: Next 16.4.2, React 19.3.1, Tailwind 4.3.3, Vitest 5.0.5, and Vite 8.3.4. Vite is Vitest's required peer; Next.js still owns application development and builds. TypeScript 5.9 and ESLint 9 stay within the supported lint-tool peer ranges (the inspected TypeScript ESLint tooling requires TypeScript <6.1 and the React ESLint plugin supports ESLint 9). Node 22.17.1 is the tested baseline. The lockfile records resolved versions.

ESLint runs separately: modern Next.js builds do not run lint automatically. `next typegen` creates route types before `tsc --noEmit`, allowing typecheck on a fresh checkout. Vitest runs pure engine tests in Node, so no DOM emulator or browser-testing dependency is required.

Official references: [Next.js installation](https://nextjs.org/docs/app/getting-started/installation), [Vitest migration](https://vitest.dev/guide/migration/).

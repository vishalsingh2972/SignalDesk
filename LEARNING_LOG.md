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

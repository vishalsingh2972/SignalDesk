import { spawnSync } from "node:child_process";

// Use the existing Vitest TypeScript loader; no extra CLI/transpiler dependency.
const result = spawnSync(process.execPath, ["node_modules/vitest/vitest.mjs", "run", "src/lib/development.test.ts", "--silent=false"], {
  stdio: "inherit",
  env: { ...process.env, SIGNALDESK_PRINT_DEV: "1" },
});
if (result.error) console.error(result.error.message);
process.exitCode = result.status ?? 1;

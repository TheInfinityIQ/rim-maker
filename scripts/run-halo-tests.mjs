import { spawnSync } from 'node:child_process';

const prepare = spawnSync(process.execPath, ['scripts/prepare-halo-tests.mjs'], { stdio: 'inherit' });
if (prepare.status !== 0) process.exit(prepare.status || 1);
const result = spawnSync(process.execPath, ['node_modules/@playwright/test/cli.js', 'test', 'halo.spec.js'], {
  stdio: 'inherit', env: { ...process.env, HALO_REQUIRE_FULL_PARITY: process.argv.includes('--strict') ? '1' : '0' },
});
const summary = spawnSync(process.execPath, ['scripts/summarize-halo-tests.mjs'], { stdio: 'inherit' });
process.exit(result.error || summary.error ? 1 : (result.status ?? 1) || (summary.status ?? 1));

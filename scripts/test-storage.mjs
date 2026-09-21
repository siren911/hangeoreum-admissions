import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
const cli=fileURLToPath(new URL('../node_modules/vitest/vitest.mjs',import.meta.url));
const child=spawn(process.execPath,[cli,'run','tests/storage.integration.test.ts'],{stdio:'inherit',env:{...process.env,RUN_STORAGE_INTEGRATION:'1'}});
child.on('exit',code=>process.exit(code??1));

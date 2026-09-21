import { spawn } from 'node:child_process';
import { mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
const logDir=fileURLToPath(new URL('../.local/logs/',import.meta.url));
mkdirSync(logDir,{recursive:true});
const cli=fileURLToPath(new URL('../node_modules/wrangler/bin/wrangler.js',import.meta.url));
const child=spawn(process.execPath,[cli,...process.argv.slice(2)],{stdio:'inherit',env:{...process.env,WRANGLER_LOG_PATH:logDir,CLOUDFLARE_SEND_METRICS:'false'}});
child.on('exit',code=>process.exit(code??1));
child.on('error',error=>{console.error(error.message);process.exit(1);});

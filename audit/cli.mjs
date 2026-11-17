#!/usr/bin/env node
import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { evaluate } from './evaluate.mjs';

const { auditExceptions = {} } = JSON.parse(readFileSync('package.json', 'utf8'));

const audit = spawnSync('npm', ['audit', '--json'], { encoding: 'utf8' });
if (audit.stdout === '') {
  console.error(audit.stderr);
  process.exit(1);
}
const { blocking, fixed, gone, excepted } = evaluate(JSON.parse(audit.stdout), auditExceptions);

for (const line of blocking) {
  console.error(`Blocking advisory: ${line}`);
}
for (const line of fixed) {
  console.error(
    `A fix is out for an excepted advisory: ${line}. Run npm audit fix and remove its entry from auditExceptions in package.json.`,
  );
}
for (const id of gone) {
  console.error(
    `${id} no longer affects this project: remove it from auditExceptions in package.json.`,
  );
}
for (const id of excepted) {
  console.log(`Excepted, no fix yet: ${id}: ${auditExceptions[id]}`);
}

if (blocking.length > 0 || fixed.length > 0 || gone.length > 0) {
  process.exit(1);
}

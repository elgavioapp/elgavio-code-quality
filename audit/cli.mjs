#!/usr/bin/env node
import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { evaluate } from './evaluate.mjs';

const { auditExceptions = {} } = JSON.parse(readFileSync('package.json', 'utf8'));

const audit = (...flags) => {
  const result = spawnSync('npm', ['audit', '--json', ...flags], { encoding: 'utf8' });
  if (result.stdout === '') {
    console.error(result.stderr);
    process.exit(1);
  }
  return JSON.parse(result.stdout);
};
const view = (spec) => {
  const result = spawnSync('npm', ['view', spec, 'version', '--json'], { encoding: 'utf8' });
  const versions = result.stdout.trim() === '' ? [] : JSON.parse(result.stdout);
  return Array.isArray(versions) ? versions : [versions];
};
const isPatched = (name, range) => {
  const [latest] = view(name);
  return latest !== undefined && !view(`${name}@${range}`).includes(latest);
};

const { blocking, fixed, gone, excepted } = evaluate(
  { all: audit(), runtime: audit('--omit=dev') },
  auditExceptions,
  isPatched,
);

for (const line of blocking) {
  console.error(`Blocking advisory: ${line}`);
}
for (const line of fixed) {
  console.error(
    `A fixed version is published for an excepted advisory: ${line}. Update to it and remove its entry from auditExceptions in package.json.`,
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

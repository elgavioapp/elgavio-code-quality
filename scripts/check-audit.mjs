// The audit gate's decisions, against made-up `npm audit --json` reports.
import assert from 'node:assert/strict';
import { evaluate } from '../audit/evaluate.mjs';

const advisory = (id, severity = 'high') => ({
  url: `https://github.com/advisories/${id}`,
  title: `${id} title`,
  severity,
  range: '<=1.0.0',
});
const report = (...vulnerabilities) => ({
  vulnerabilities: Object.fromEntries(vulnerabilities.map((v) => [v.name, v])),
});
const glob = (fixAvailable, ...via) => ({ name: 'glob', via, fixAvailable });
const dependent = { name: 'bundler', via: ['glob'], fixAvailable: true };

const reason = { 'GHSA-aaaa': 'no fix yet' };

// An advisory nobody excepted blocks; a moderate one never does.
let result = evaluate(
  report(glob(false, advisory('GHSA-aaaa'), advisory('GHSA-mmmm', 'moderate'))),
  {},
);
assert.equal(result.blocking.length, 1);

// Excepted with no fix: passes, though a dependent reports a fix of its own.
result = evaluate(report(glob(false, advisory('GHSA-aaaa')), dependent), reason);
assert.deepEqual(result, { blocking: [], fixed: [], gone: [], excepted: ['GHSA-aaaa'] });

// Only a breaking fix (an object, `isSemVerMajor`): still excepted.
result = evaluate(
  report(glob({ name: 'bundler', isSemVerMajor: true }, advisory('GHSA-aaaa'))),
  reason,
);
assert.deepEqual(result.excepted, ['GHSA-aaaa']);

// A fix installs: the exception fails the check.
result = evaluate(report(glob(true, advisory('GHSA-aaaa'))), reason);
assert.equal(result.fixed.length, 1);
assert.deepEqual(result.gone, []);

// The advisory no longer shows: the exception is stale.
result = evaluate(report(), reason);
assert.deepEqual(result.gone, ['GHSA-aaaa']);

console.log('audit: every case decided as expected');

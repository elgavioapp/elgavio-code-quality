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
const glob = (...via) => ({ name: 'glob', via });
const dependent = { name: 'bundler', via: ['glob'] };

const reason = { 'GHSA-aaaa': 'no fix yet' };
const unpatched = () => false;
const patched = (name, range) => name === 'glob' && range === '<=1.0.0';

// An advisory nobody excepted blocks; a moderate one never does.
let result = evaluate(
  report(glob(advisory('GHSA-aaaa'), advisory('GHSA-mmmm', 'moderate'))),
  {},
  unpatched,
);
assert.equal(result.blocking.length, 1);

// Excepted with no fixed version published: passes.
result = evaluate(report(glob(advisory('GHSA-aaaa')), dependent), reason, unpatched);
assert.deepEqual(result, { blocking: [], fixed: [], gone: [], excepted: ['GHSA-aaaa'] });

// A fixed version is published: the exception fails the check, asked about the vulnerable package.
result = evaluate(report(glob(advisory('GHSA-aaaa')), dependent), reason, patched);
assert.equal(result.fixed.length, 1);
assert.deepEqual(result.excepted, []);
assert.deepEqual(result.gone, []);

// The advisory no longer shows: the exception is stale.
result = evaluate(report(), reason, unpatched);
assert.deepEqual(result.gone, ['GHSA-aaaa']);

console.log('audit: every case decided as expected');

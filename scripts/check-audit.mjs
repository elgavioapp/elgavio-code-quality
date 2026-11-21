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

// `all` is the whole tree's report, `runtime` the one without dev dependencies.
const both = (...vulnerabilities) => ({
  all: report(...vulnerabilities),
  runtime: report(...vulnerabilities),
});
const devOnly = (...vulnerabilities) => ({ all: report(...vulnerabilities), runtime: report() });

// A high advisory nobody excepted blocks wherever it is; a moderate one only in the runtime.
let result = evaluate(
  devOnly(glob(advisory('GHSA-aaaa'), advisory('GHSA-mmmm', 'moderate'))),
  {},
  unpatched,
);
assert.equal(result.blocking.length, 1);
result = evaluate(both(glob(advisory('GHSA-mmmm', 'moderate'))), {}, unpatched);
assert.equal(result.blocking.length, 1);
result = evaluate(both(glob(advisory('GHSA-llll', 'low'))), {}, unpatched);
assert.equal(result.blocking.length, 0);

// Reported by both, it is one advisory.
result = evaluate(both(glob(advisory('GHSA-aaaa'))), {}, unpatched);
assert.equal(result.blocking.length, 1);

// An excepted moderate one in the runtime passes, and is still there to be found stale.
result = evaluate(both(glob(advisory('GHSA-aaaa', 'moderate')), dependent), reason, unpatched);
assert.deepEqual(result, { blocking: [], fixed: [], gone: [], excepted: ['GHSA-aaaa'] });

// Excepted with no fixed version published: passes.
result = evaluate(both(glob(advisory('GHSA-aaaa')), dependent), reason, unpatched);
assert.deepEqual(result, { blocking: [], fixed: [], gone: [], excepted: ['GHSA-aaaa'] });

// A fixed version is published: the exception fails the check, asked about the vulnerable package.
result = evaluate(both(glob(advisory('GHSA-aaaa')), dependent), reason, patched);
assert.equal(result.fixed.length, 1);
assert.deepEqual(result.excepted, []);
assert.deepEqual(result.gone, []);

// The advisory no longer shows: the exception is stale.
result = evaluate(both(), reason, unpatched);
assert.deepEqual(result.gone, ['GHSA-aaaa']);

console.log('audit: every case decided as expected');

const BLOCKING = new Set(['high', 'critical']);

const idOf = (advisory) => advisory.url.split('/').at(-1) ?? advisory.url;

/**
 * Sorts an `npm audit --json` report against the advisories a project lets through.
 *
 * npm's own `fixAvailable` can't say whether an excepted advisory has a fix: it reads `true` where
 * `npm audit fix` changes the tree and leaves the advisory in place. `isPatched` asks the registry
 * instead.
 *
 * @param {{ vulnerabilities?: Record<string, { name: string, via: (string | { url: string, title: string, severity: string, range: string })[] }> }} report
 * @param {Record<string, string>} exceptions Advisory id (`GHSA-…`) to why it is let through.
 * @param {(name: string, range: string) => boolean} isPatched Whether the package's latest version
 *   is outside the advisory's vulnerable range.
 */
export const evaluate = (report, exceptions, isPatched) => {
  const blocking = [];
  const fixed = [];
  const excepted = new Set();
  const present = new Set();

  for (const vulnerability of Object.values(report.vulnerabilities ?? {})) {
    for (const advisory of vulnerability.via) {
      if (typeof advisory === 'string' || !BLOCKING.has(advisory.severity)) {
        continue;
      }
      const id = idOf(advisory);
      const line = `${vulnerability.name} ${advisory.range}: ${advisory.title} (${advisory.url})`;
      present.add(id);
      if (!Object.hasOwn(exceptions, id)) {
        blocking.push(line);
      } else if (isPatched(vulnerability.name, advisory.range)) {
        fixed.push(line);
      } else {
        excepted.add(id);
      }
    }
  }

  const gone = Object.keys(exceptions).filter((id) => !present.has(id));
  return { blocking, fixed, gone, excepted: [...excepted] };
};

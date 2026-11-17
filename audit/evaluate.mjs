const BLOCKING = new Set(['high', 'critical']);

const idOf = (advisory) => advisory.url.split('/').at(-1) ?? advisory.url;

/**
 * Sorts an `npm audit --json` report against the advisories a project lets through.
 *
 * @param {{ vulnerabilities?: Record<string, { name: string, via: (string | { url: string, title: string, severity: string, range: string })[], fixAvailable: unknown }> }} report
 * @param {Record<string, string>} exceptions Advisory id (`GHSA-…`) to why it is let through.
 */
export const evaluate = (report, exceptions) => {
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
      } else if (vulnerability.fixAvailable === true) {
        // A fix that installs without a breaking change: the exception has outlived its reason.
        fixed.push(line);
      } else {
        excepted.add(id);
      }
    }
  }

  const gone = Object.keys(exceptions).filter((id) => !present.has(id));
  return { blocking, fixed, gone, excepted: [...excepted] };
};

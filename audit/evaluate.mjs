const SEVERITIES = ['info', 'low', 'moderate', 'high', 'critical'];
const atLeast = (minimum) => (severity) =>
  SEVERITIES.indexOf(severity) >= SEVERITIES.indexOf(minimum);

// Whatever ships is held to more than what only builds and tests it.
const BLOCKING = { all: atLeast('high'), runtime: atLeast('moderate') };

const idOf = (advisory) => advisory.url.split('/').at(-1) ?? advisory.url;

/**
 * Sorts `npm audit --json` reports against the advisories a project lets through: a high or
 * critical advisory anywhere blocks, and a moderate one in what the project ships.
 *
 * npm's own `fixAvailable` can't say whether an excepted advisory has a fix: it reads `true` where
 * `npm audit fix` changes the tree and leaves the advisory in place. `isPatched` asks the registry
 * instead.
 *
 * @typedef {{ vulnerabilities?: Record<string, { name: string, via: (string | { url: string, title: string, severity: string, range: string })[] }> }} Report
 * @param {{ all: Report, runtime: Report }} reports The whole tree's report, and the one
 *   `--omit=dev` gives.
 * @param {Record<string, string>} exceptions Advisory id (`GHSA-…`) to why it is let through.
 * @param {(name: string, range: string) => boolean} isPatched Whether the package's latest version
 *   is outside the advisory's vulnerable range.
 */
export const evaluate = (reports, exceptions, isPatched) => {
  const blocking = [];
  const fixed = [];
  const excepted = new Set();
  const present = new Set();
  const seen = new Set();

  for (const [scope, blocks] of Object.entries(BLOCKING)) {
    for (const vulnerability of Object.values(reports[scope].vulnerabilities ?? {})) {
      for (const advisory of vulnerability.via) {
        if (typeof advisory === 'string' || !blocks(advisory.severity)) {
          continue;
        }
        const id = idOf(advisory);
        const line = `${vulnerability.name} ${advisory.range}: ${advisory.title} (${advisory.url})`;
        present.add(id);
        if (seen.has(line)) {
          continue;
        }
        seen.add(line);
        if (!Object.hasOwn(exceptions, id)) {
          blocking.push(line);
        } else if (isPatched(vulnerability.name, advisory.range)) {
          fixed.push(line);
        } else {
          excepted.add(id);
        }
      }
    }
  }

  const gone = Object.keys(exceptions).filter((id) => !present.has(id));
  return { blocking, fixed, gone, excepted: [...excepted] };
};

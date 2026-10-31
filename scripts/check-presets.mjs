// Lints the fixture with both presets: everything in fixture/clean must pass, and every file in
// fixture/violations must raise the rule its name spells, so a preset that silently stops loading
// fails here instead of in a consuming repo.
import { execFileSync } from 'node:child_process';
import { readdirSync } from 'node:fs';
import { basename } from 'node:path';

const lint = (dir) => {
  try {
    return execFileSync(
      'npx',
      ['oxlint', '--type-aware', '-c', 'fixture/.oxlintrc.json', '-f', 'json', dir],
      { encoding: 'utf8' },
    );
  } catch (error) {
    return error.stdout;
  }
};

const diagnostics = (dir) =>
  JSON.parse(lint(dir)).diagnostics.map(({ code, filename }) => ({
    rule: code.replace(/^.*\((.*)\)$/, '$1'),
    file: basename(filename),
  }));

const failures = [];

for (const { rule, file } of diagnostics('fixture/clean')) {
  failures.push(`fixture/clean/${file}: unexpected ${rule}`);
}

const found = diagnostics('fixture/violations');
for (const file of readdirSync('fixture/violations')) {
  const rule = file.split('.')[0];
  if (rule !== 'index' && !found.some((d) => d.file === file && d.rule === rule)) {
    failures.push(`fixture/violations/${file}: ${rule} was not reported`);
  }
}

if (failures.length > 0) {
  console.error(failures.join('\n'));
  process.exit(1);
}
console.log('Presets OK');

# @elgavio/code-quality

Shared oxlint, Prettier and tsconfig presets.

```sh
npm install --save-dev @elgavio/code-quality oxlint oxlint-tsgolint prettier
```

Keep `oxlint`, `oxlint-tsgolint` and `prettier` in your own `devDependencies`: their bins must live
in your `node_modules/.bin`, and this package's peer ranges say which versions go together. All
three peers are optional, so a project that only uses Prettier doesn't need oxlint.

## Using it

**oxlint**: `.oxlintrc.json` extends the presets by relative path; oxlint doesn't resolve a bare
package specifier. Add `react.json` only in React projects, and `next.json` (oxlint's Next.js
plugin) only in Next.js ones, always on top of `base.json`. Keep your own `ignorePatterns`.

```json
{
  "extends": [
    "./node_modules/@elgavio/code-quality/oxlint/base.json",
    "./node_modules/@elgavio/code-quality/oxlint/react.json",
    "./node_modules/@elgavio/code-quality/oxlint/next.json"
  ]
}
```

A rule set locally replaces the preset's options for that rule, so adding your own
`no-restricted-imports` pattern means repeating the preset's `index` pattern alongside it.

**Prettier**: `"prettier": "@elgavio/code-quality/prettier.json"` in `package.json`.
`.prettierignore` can't be shared.

**tsconfig**: `"extends": "@elgavio/code-quality/tsconfig/base.json"`. It holds strictness flags
only; `target`, `lib`, `module`, `moduleResolution`, `jsx`, `types` and paths stay yours.

**Scripts**:

```json
"lint": "oxlint --type-aware --report-unused-disable-directives-severity=error --max-warnings=0 ."
```

## Auditing dependencies

`elgavio-audit` runs `npm audit` and fails on any high or critical advisory, except those listed in
`auditExceptions` in your `package.json`, each with the reason it is let through:

```json
"scripts": { "audit": "elgavio-audit" },
"auditExceptions": {
  "GHSA-xxxx-xxxx-xxxx": "Why it can't be fixed yet, and why it is safe meanwhile."
}
```

An exception is only for an advisory with no fixed version yet. It fails the check again by itself
once the package publishes a version outside the advisory's vulnerable range (update to it, which
may take a dependent's major bump, and remove the entry), or once the advisory no longer affects
the project, so it can't outlive its reason. npm's own `fixAvailable` isn't asked: it can read
`true` where `npm audit fix` leaves the advisory in place.

## Developing

- `npm test` lints `fixture/` with both presets: `fixture/clean` must pass, and each file in
  `fixture/violations` must raise the rule it's named after. Add a violation file when adding a
  rule worth guarding: oxlint silently ignores a preset it can't load.
- `npm run typecheck` compiles the fixture against `tsconfig/base.json`.
- `npm test` also runs `elgavio-audit`'s decisions against made-up `npm audit --json` reports
  (`scripts/check-audit.mjs`).

## License

MIT

# Contributing to Aether LMS

Bug reports, accessibility improvements, Sakai layout fixes, and small focused pull requests are welcome. Describe what happened, what you expected, your Aether/Chrome versions, and whether the issue occurs with Aether switched off. Share fictional or redacted examples instead of private academic data. Report security issues using [SECURITY.md](SECURITY.md).

## Run from source

Load the repository folder containing `manifest.json` through Chrome's **Load unpacked** control. No build step is required. After editing, reload the extension and refresh the LMS tab.

## Test

Install a current supported Node.js release with npm, plus Python 3. From the repository root:

```sh
npm install
npx playwright install chromium
npm test
```

Direct development dependencies are pinned in `package.json`. Transitive dependencies are resolved by npm during installation; a lockfile is not currently supplied.

- `npm run test:unit`: unit, parsing, archive-boundary, and bundled-reader integrity checks.
- `npm run test:startup`: deliberately delayed-page startup checks.
- `npm run test:browser`: main Chrome extension regressions, including tool frames and file previews.
- `node tests/fallbacks.cjs`: WebGL-disabled and cancellation checks.
- `node tests/browser.cjs --smoke`: package-oriented checks, including hover dismissal and role/document variants.

Tests use intercepted fictional Sakai pages and fresh browser profiles. They do not require a university account. Output goes into `reports/`; generated reports are excluded from source ZIP exports. Keep private LMS captures out of commits.

`AETHER_CHROMIUM` can select an existing compatible Chromium executable. `AETHER_EXTENSION` can select a different unpacked extension folder for the main and startup suites. `AETHER_REPORT_DIR` changes the main browser suite's report directory. Use the ordinary Playwright Chromium installation when these variables are unset.

The optional native-tab visibility probe is `AETHER_HEADFUL=1 node tests/fallbacks.cjs` in a shell that supports that syntax. Some automation hosts do not update `document.hidden` on tab changes; this probe is separate from the default passing suite.

Checked-in PPTX, DOCX, XLSX, ZIP, and audio fixtures contain fictional content. Regenerate them with `node tests/generate-office.cjs` after installing development dependencies.

## Source layout

| Location | Responsibility |
|---|---|
| `src/prepaint.js`, `content.js`, `dashboard.js` | Early preferences, native page extraction, workspace, shortcuts, on-page activity. |
| `src/scene.js`, `ambient.js`, `motion.js` | Folded field, stars, contours, animation scheduling, fallbacks. |
| `src/classifier.js`, `lists.js`, `assignment-state.js` | Reversible native record styling and conservative assignment states. |
| `src/resource-info.js`, `resource-access.js`, `resource-preview.js` | File descriptors, same-origin reads, copyright consent, preview lifecycle. |
| `preview/` | Local PDF/Office readers and archive bounds. |
| `vendor/`, `fonts/` | Bundled assets, licenses, and Office provenance. |
| `tests/` | Fictional Sakai fixtures and regression suites. |
| `docs/`, `CHANGELOG.md` | Design decisions and historical release notes. |

Preserve native nodes, handlers, values, authentication, and permissions. Keep document conversion local. Exercise Aether OFF, keyboard navigation, supported role differences, same-origin frames, cancellation, and narrow layouts when changing UI behavior. Editable or unsupported structures should retain usable native layouts.

## Package a release

```sh
python scripts/package.py
```

This uses Python's standard library and creates an unpacked extension, installable ZIP, and SHA-256 hashes in `dist/`. Use `--out PATH` for another output directory. Ordering, timestamps, and text line endings are normalized. Development dependencies, tests, reports, and Git metadata are excluded from the installable ZIP.

To test that package, set `AETHER_EXTENSION` to its unpacked folder and run `node tests/browser.cjs --smoke`.

To create a clean source ZIP from a committed revision:

```sh
git archive --format=zip --prefix=aether-lms/ --output=aether-lms-source.zip HEAD
```

The export omits generated reports through `.gitattributes`. A source ZIP is a snapshot; it does not include Git history. Historical reports in the original development repository record fixture results and do not establish compatibility with every live LUMS customization.

Keep dependency licenses and provenance intact. First-party contributions are under the project's [MIT License](LICENSE).

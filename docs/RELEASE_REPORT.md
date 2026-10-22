# Aether LMS v1.0.0 release verification

22 October 2026. The extension is implemented on `feature/v1.0`; the supplied original is recoverable from `v0.8.1`, the rollback archive and the Git history bundle.

## Automated results

| Suite | Result | Evidence |
|---|---|---|
| Unmodified v0.8.1 baseline | 10/10 passed | `reports/baseline/results.json` |
| v1.0 unpacked MV3 Chromium | 34/34 passed | `reports/v1.0/results.json` |
| WebGL-disabled / fallback / cancellation | 5/5 passed | `reports/fallbacks/results.json` |
| Final clean installable package smoke check | 10/10 passed | `reports/package/results.json` |
| Deterministic package, ZIP CRC, asset hashes and exact rollback archive | Passed | `reports/package-integrity.json` |
| Unit, timestamp, spring, classifier and source integrity | 7/7 passed | `tests/unit.cjs`; rerun with `npm run test:unit` |
| Native hidden-tab visibility probe | Environment limitation | `reports/fallbacks/native-visibility-probe.json` |

**39 primary browser checks, 10 final-package smoke checks and 7 unit/security checks pass for v1.0.** The separate native visibility probe could not reach a hidden document on this automation host, including an offscreen headed browser. It timed out waiting for `document.hidden`; it is not counted as a passing lifecycle test. The original probe result is preserved rather than represented as successful.

All browser checks loaded the actual unpacked MV3 extension in isolated Chromium profiles. Requests to the LMS were intercepted with synthetic Sakai fixtures; no university account or live data was accessed. These results are not proof of live authenticated LUMS compatibility. Form tests submitted only intercepted fixtures.

## Functional coverage

- Parser-time enabled class and critical CSS verified by the fixture's first inline parser script, before body parsing. Native content is visible with graphics present or unavailable. Styling does not await fonts, storage, PDF.js or graphics.
- Home, actual course context, native course/tool links, original dropdown handlers, checkboxes, sorting, pagination, nested folders and downloads.
- PDF.js renders both pages; Previous/Next, arrow keys and Escape work. Sequential PDFs, image, inert text/code/CSV, folders and metadata retain native Open original behavior.
- Permission-denied, invalid PDF, oversized file and external-preview fallbacks. Pending fetch cancellation verified as an aborted browser request. Embedded script-like text remains inert.
- Assignment status meanings, explicit timestamps/PKT, ambiguous dates and date-only end-of-day deadlines. Original CSRF input, file input, draft button, required answer and confirmation controls remain present.
- Assessment/gradebook geometry retained; announcement cards and unsupported DOM fallback; same-origin iframe previews and delayed iframe loading.
- Dynamic row cloning/removal, original handlers and one Preview control per record. Real-page activity mutation and honest no-data fallback.
- Keyboard reordering and persisted course/tool order; fast navigation, refresh and Back/Forward without duplicate workspaces or controls.
- Motion springs return to rest; OS reduced motion changes take effect live without destroying the saved preference. WebGL context loss preserves content and creates a portable canvas.
- Aether OFF restores original records, roles/layout and controls, removes preview UI and ambient graphics, and persists after refresh.
- No uncaught browser page errors were observed in the passing suites.

## Layout and visual inspection

Home and Resources were tested at **360, 390, 640, 775, 1024, 1280, 1440 and 1920 px**. Each check verifies no viewport-wide horizontal overflow and an onscreen, visible Actions menu. Home and Resources screenshots are in `reports/v1.0/`. Desktop, 775 px and narrow mobile screenshots were visually inspected. A dropdown-contrast issue discovered in screenshots was corrected and retested. The portable renderer screenshot is in `reports/fallbacks/`.

The ambient layer has a negative z-index inside an isolated body context. The portal container is transparent, while native surfaces retain their backgrounds. No native ancestor is positioned or transformed to accommodate graphics. Tests check computed stacking, pointer-events and native link hit targets.

## Measured performance

Machine: 11th Gen Intel(R) Core(TM) i7-1165G7 @ 2.80GHz, 8 logical CPUs, Windows x64. Browser: Chromium 149.0.7827.55. These are short, warm local-fixture samples, not university network timings or certified GPU benchmarks. Browser graphics backend was not controlled.

| Sample | Active WebGL + ambient | WebGL disabled / Canvas 2D |
|---|---:|---:|
| Viewport | 1440 x 1000 | 1280 x 960 |
| Sampled browser RAF intervals | 87 | 87 |
| Median interval | 16.70 ms | 16.70 ms |
| 95th percentile interval | 16.90 ms | 16.90 ms |
| Browser task time over sample | 0.205 s | 0.309 s |
| Renderer JS heap snapshot | 35.74 MiB | 9.01 MiB |
| DOMContentLoaded | 48.6 ms | 232.3 ms |

RAF intervals measure browser scheduling availability; they do not prove that each graphics effect renders at 60 FPS. Desktop WebGL targets roughly 60 FPS, standard laptops about 30 FPS, and low-power/coarse-pointer devices about 20 FPS. Ambient contours target 25 FPS or 12.5 FPS on low tiers. DPR and render width are capped. The portable sculpture intentionally uses a lower frame/particle budget. No long-duration heap growth, GPU memory or battery profiling was completed. Absolute performance on live Sakai and other devices is unverified.

## Security and permissions audit

- Manifest version remains 3, runtime permission remains **storage only**, and content script hosts remain restricted to `https://lms.lums.edu.pk/*`. No new host permission or background service was added.
- Every script, worker, decoder, font and WebAssembly file is packaged locally. No CDN, eval, external analytics or remote executable loader was introduced. The retained CSP permits only local scripts and the existing packaged Wasm decoders.
- Academic operations remain controlled by original Sakai nodes and handlers. No CSRF, grade, submission, countdown or authentication logic was replaced.
- Preview requests remain same-origin, read-only GET, with original limits and bounded caches. Redirects fail closed. External resource previews retain native shortcuts without automatic external fetches.
- PDF message source, token and origin checks, disabled eval/XFA/annotations and local worker/assets are retained from the tested baseline. Source filenames and academic text use inert text nodes.
- Cloned tool icons have executable elements, event attributes, unsafe references and external embedded URLs removed. Native font glyphs remain supported.
- No unexpected network destination was observed. An explicit external-origin isolation probe was intercepted and aborted; it confirmed the extension did not mount there. Font downloads happened at development time only, from the official Google Fonts repository.

This is a source/behavior audit, not a penetration test or a new independent audit of the retained third-party PDF.js version.

## Known limitations

1. Authenticated live LUMS, university-specific DOM changes, every permission combination and restrictive real-world content-security policies remain unverified.
2. Native hidden-tab visibility could not be observed on the automation host. Visibility suspension is implemented, but a successful native hidden-state browser check is still outstanding. The unsuccessful probe is preserved separately.
3. Device coverage is limited to Chromium on this Windows host; full touch hardware, every screen reader, older Chromium versions and GPU/battery behavior were not independently tested.
4. On unsupported or sensitive Sakai layouts, native structure is intentionally retained. Academic activity uses only confirmed current-page links; no cross-course aggregation, invented grades, progress or deadlines are shown.
5. PDFs still fall back to Open original when permissions, format, size, password or a site policy prevent embedding.

The package version is 1.0.0 as requested. Operational deployment to the user's live LMS should include a manual authenticated smoke check; no publishing or private-account access was performed.

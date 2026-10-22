# v0.8.1 audit and v1.0 implementation decisions

The supplied archive is the authoritative baseline. It contains 222 files, an MV3 manifest, locally packaged PDF.js 5.6.205 and Lato. No `.git` directory, package manifest, automated tests, or historical release report was supplied. The adjacent Downloads folders are release snapshots, not Git history. A new repository records the unmodified archive as its first commit, tagged `v0.8.1`; work continues on `feature/v1.0`.

## Responsibilities retained

- `prepaint.js`: synchronous origin/path guard and enabled preference before first paint.
- `content.js`: native site/tool extraction, context-aware workspace, mirrored saved ordering, keyboard/drag reordering, settings toggles, progressive graphics initialization.
- `scene.js`: locally compiled WebGL point sculpture, capped resolution, portable canvas fallback, visibility control and GPU disposal.
- `ambient.js`: page-wide pointer-reactive canvas; validated same-origin frame pointer relay.
- `lists.js`: enhances original rows in place, journals attributes for restoration, maintains labels/roles, supports dynamic changes and deadline transitions.
- `assignment-state.js`: conservative status inference and timestamp interpretation. Retained unchanged.
- `resource-preview.js`: same-origin read-only GET, cancellation, bounded 24 MB memory cache, per-resource read limits, inert excerpts, permission-aware fallbacks, native original-link activation.
- `preview/`: separate extension-origin PDF reader, token/source/origin checked messages, locally packaged worker/decoders, disabled evaluation/XFA/annotations.
- Existing styles: native portal, resources, frames, cards, workspace and preview behavior.

## Regression risks and response

The baseline's ambient canvas has a very high z-index. Replace its position in the paint order without positioning or transforming native Sakai ancestors. Native content must remain visible if any renderer fails. Preserve document-start CSS and synchronous DOM adapters; fonts, storage and graphics must never gate rendering.

The generic card adapter can classify gradebooks and assessments as ordinary lists. Add an explicit conservative classifier: sensitive tools and editing matrices keep native geometry; comparative tables remain tables; recognized information lists receive cards; unsupported structures receive styling only.

Keep preview limits (12 MB PDF/image, 128 KB text, 1 MB folder), status meanings and all storage keys. Improve icon cloning by excluding active SVG/HTML and external references. No change to permission, host, authentication, native handlers or remote data access.

## Implementation order

1. Establish genuine unpacked Chromium fixture baseline; save tag and report.
2. Add locally packaged Oswald, Space Grotesk and variable Doto with licenses and semantic tokens; preserve Lato for records and Segoe UI for native tools.
3. Shared visibility-aware RAF scheduler, bounded spring integration, authored-heading reveals, delegated card motion.
4. Original folded mathematical particle sculpture, adaptive budgets, marching-square contour field, low-cost halftone/constellation ambient system. Verify paint order/fallbacks.
5. Editorial Home composition and verified on-page academic activity; absent data yields original Sakai shortcuts. Course headers stay compact.
6. Retain native course/tool URLs, controls and order storage; refine file/assignment records.
7. Conservative additional-tool classification and accessible form stability.
8. Run functional/security/responsive regressions, inspect screenshots, record measured conditions and package.

## Reference interpretation

`layer.ai prompt.txt` describes a racing marketing site. Its single-file/CDN/Lenis/scroll-reset/loading-veil instructions are not this project's requirements. Only its engineering ideas are adapted: mass-one damped springs with 1 ms integration steps and a 64 ms cap; a reference-counted ticker; one-time authored text entrances; device-dependent DPR/budgets; marching-square isolines; restrained pointer glints and computational section seams. No driver assets, branding, remote executable dependencies, global scroll controller or full-page loading veil are incorporated.

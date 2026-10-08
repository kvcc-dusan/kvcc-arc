---
name: kvcc-arc
description: Personal design system for all UI work (apps, dashboards, websites, mini apps, artifacts, prototypes). Arc-based: semantic CSS tokens, CSS-module React components, calm spring motion, strict copy and layout rules. Use whenever building, styling, or reviewing any interface.
---

# kvcc-arc

Design system derived from Arc (MIT, uiarc.dev). One visual language across every surface: real React apps, single-file artifacts, design prototypes.

## Sources of truth

| What | Where |
|---|---|
| Tokens (light, dark, 8 accents, motion) | `references/tokens.md`, generated from `registry/foundation.css` |
| Component index (107 components, 22 blocks) | `references/component-index.md` |
| Component source | repo `registry/components/<id>/`, or installed under `components/arc/` |
| Rules | `references/rules.md` |
| Which component for which job | `references/components.md` |
| Components outside the Arc free set (app shell, more as added) | `references/extensions.md` |
| Page layout, states, responsive | `references/composition.md` |
| Pre-finish review with grep sweeps | `references/checklist.md` |
| Personal overrides | `kvcc/theme.css` |

## Workflow

1. State the job, the single primary action, and the regions (see `composition.md`).
2. Pick an existing item per region from `components.md`. Read its docs before use. Write new UI only when nothing fits, and then follow `rules.md`.
3. Install (React apps): `npx shadcn@latest add <registry>/arc-foundation` once per app, import `components/arc/foundation.css` in the root layout, load Geist and Inter, then add items by id. Registry: `https://kvcc-arc-registry.netlify.app/r/<id>.json`, or register `"@kvcc": "https://kvcc-arc-registry.netlify.app/r/{name}.json"` in `components.json` and add `@kvcc/<id>`. Extensions install the same way.
4. Compose with documented props only. Layout through the page container and CSS modules. Never restyle internals.
5. Design every state (loading, empty, error, success, disabled) in both themes.
6. Run `checklist.md` and report.

## Hard rules (always on)

- Semantic tokens only. No raw hex, no `--neutral-*` in product code, no Tailwind color classes.
- Geist for headings 30px and up, Inter elsewhere. Weights 400 and 500 only. Sentence case. No uppercase, no eyebrow labels, no em dashes.
- Accent marks active, selected, progress, emphasis. Status colors only with a label.
- Cards rest on a 1px border. Shadows only on floating layers. No decorative gradients, glows, nested cards, icons in rounded tiles.
- Radii 18 / 26 / 34 (control / panel / surface), concentric when nested. 4px spacing grid.
- One `h1`, one primary button per surface, one page container.
- No custom focus rings. Keyboard focus uses the shared outline.
- Motion: transform and opacity, tokens from `motion-tokens`, reduced-motion branch for every animation, no overshoot on state indicators.
- Touch targets at least 44px. Check 390, 768, 1024, 1440px. No sideways page scroll.

## Single-file surfaces (artifacts, prototypes, no npm)

Package installs are unavailable, so use the bundle in `bundle/` (generated from the same tokens and component CSS as the React components):

| File | Use |
|---|---|
| `bundle/template-app.html` | Start here for a mini app: app shell, stat cards, charts, table, wired up. Copy it and replace the sample content. |
| `bundle/kvcc-bundle.html` | Markup reference: one working example of every component (buttons, fields, tabs, dialog, toast, select, table, charts). Copy the markup, keep the class names. |
| `bundle/kvcc.css`, `bundle/kvcc.js` | The inlinable parts. Inline both into the artifact's `<style>` and `<script>`, and load Geist and Inter from Google Fonts. |
| `bundle/README.md` | How the bundle works: class naming, `window.kvcc` API, what is not covered. |

Rules for single-file work:

1. Inline the CSS and JS; never link them. Only Google Fonts and allowlisted CDNs load externally.
2. Set theme with `kvcc.setTheme("light" | "dark")`, following `prefers-color-scheme` unless the host sets one. Accent with `kvcc.setAccent(name)`.
3. Builders (`kvcc.select`, `kvcc.table`, `kvcc.barChart`, `kvcc.sparkline`, `kvcc.appShell`) render the same markup as the React components. Behaviors (tabs, dialog, toast, tooltip, switch, checkbox, progress) wire from data attributes.
4. For anything the bundle lacks, build to `rules.md` with semantic tokens only. Do not claim a hand-built control is the Arc component.
5. Sample data stays labeled as sample data.

## Do not

- Reconstruct paid Arc Pro source. Compose from free items and the rules instead.
- Edit `registry/foundation.css`. Override in `kvcc/theme.css`.

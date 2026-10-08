# Handoff: kvcc-arc

Context transfer from a claude.ai chat session (2026-10-08) to Claude Code. Updated 2026-10-08 after the first Claude Code session (registry deployed, skill installed, bundle and design system page built). Self-contained: read this file, `CLAUDE.md`, and `kvcc/README.md`, then continue from "Next steps".

## 1. Goal

Own a personal design system that reproduces the visual language and UX logic of Arc (https://uiarc.dev) and is available on every surface where UI gets built: React apps, single-file artifacts and mini apps, Claude Design prototypes. Requirements:

- Same visual output everywhere, extensible with new components in the same style.
- Not dependent on the upstream site being up or the free tier staying unchanged: a local, owned copy.
- Usable by AI agents: rules and tokens machine-readable, loaded automatically.
- No Arc Pro purchase. Pro source must not be reconstructed.

Owner: Dušan Kovačić (handle kvcc), designer-developer. Preferences: peer tone, short, direct. Documents in English, neutral technical spec tone, no first-person narration.

## 2. Decisions and reasoning

1. **Claude Design is a consumer, not the home.** A link plus prompt makes Claude Design guess tokens from rendered pages. Arc publishes real source, so source is canonical. Claude Design artifacts are single-file HTML and cannot install npm packages; Arc is React + CSS modules + `motion`. No single format serves all surfaces, so the owned thing is a repo, and per-surface artifacts are derived.
2. **Fork structure.** Repo root is a clone of Arc's free repo (MIT). `upstream` remote = Arc. All additions live under `kvcc/` plus root `CLAUDE.md`. No upstream path is modified, so `git merge upstream/main` stays clean. Personal token overrides go in `kvcc/theme.css`, never in `registry/foundation.css`.
3. **Most of the look is tokens plus rules** (radii 18/26/34, surface roles, Geist + Inter, restraint). Those are small, portable CSS and text and work on every surface at near-full fidelity. Components add the last stretch, mostly spring motion.
4. **Self-hosted shadcn registry** (`@kvcc`): Arc's prebuilt `public/r/*.json` items with `registryDependencies` URLs rewritten from `https://uiarc.dev/r/` to the new host, plus a `kvcc-theme` item. Static JSON on Netlify.
5. **Repo is private.** MIT permits it; only `LICENSE` and copyright notice must be retained. Do not use GitHub's Fork button (forks of public repos stay public).
6. Graphite (earlier personal design system attempt) is abandoned. Do not reference or reuse it.

## 3. Links

| What | URL |
|---|---|
| Arc, starting page the user sent | https://uiarc.dev/components/copy-button |
| Arc theming docs | https://uiarc.dev/docs/theming |
| Arc AI and MCP docs | https://uiarc.dev/docs/ai |
| Arc llms.txt (index, install, agent rules) | https://uiarc.dev/llms.txt |
| Arc full context | https://uiarc.dev/llms-full.txt |
| Arc pricing and license summary | https://uiarc.dev/pricing , https://uiarc.dev/license |
| Arc MCP server | https://uiarc.dev/api/mcp (`claude mcp add --transport http arc https://uiarc.dev/api/mcp`) |
| Arc skill files (not in repo, served by site) | https://uiarc.dev/r/skills/arc/{SKILL,INSTRUCTIONS,design,copy,motion,accessibility,components,composition,responsive,checklist}.md ; install all: `npx shadcn@latest add https://uiarc.dev/r/arc-skill.json` |
| Arc registry index / catalog | https://uiarc.dev/r/registry.json , https://uiarc.dev/r/catalog.json |
| Upstream repo (MIT, free set) | https://github.com/kuratlielia/arc-library |
| Own repo (private) | https://github.com/kvcc-dusan/kvcc-arc |
| Local path (user's Mac) | `/Users/dusankvcc/Desktop/Atrium/Claude Code/kvcc-arc` |
| Netlify project | https://app.netlify.com/projects/kvcc-arc-registry |
| Registry URL (live) | https://kvcc-arc-registry.netlify.app |
| Design system page (private artifact) | https://claude.ai/artifact/CmxhiyWeLiS3ULcAVGnDnB |

Arc facts: free set = 107 components + 22 blocks (all items in `registry.json`, tier free). Pro = 45 components + 66 blocks, $199 lifetime / $129 per year / team $599; not part of this project. Tokens: semantic roles, 8 accents (`data-accent`), dark via `data-theme="dark"`, oklch neutrals, Geist (30px and up) + Inter, weights 400 and 500 only.

## 4. Done

Commits on `main` (pushed to `origin/main`):

- `833dd1f` Add kvcc layer on top of Arc.
- `4ab4116` Add self-hosted registry builder.
- `988b087` Fix skill installer clobbering `components.md` (macOS is case-insensitive; the generated index is now `references/component-index.md`).
- `e9844b1` README status: registry deployed, skill installed.
- `2a9b99d` Single-file bundle (`kvcc/bundle/`).
- `9025e76` Design system reference page.

Contents of the kvcc layer:

| Path | Purpose |
|---|---|
| `kvcc/theme.css` | Personal overrides, loaded after `foundation.css`. Empty template. |
| `kvcc/tokens/tokens.json`, `TOKENS.md` | Generated from `registry/foundation.css` and `registry/motion-tokens.ts`. |
| `kvcc/COMPONENTS.md`, `components.json` | Generated component index (131 items: 107 components, 22 blocks, 2 support). |
| `kvcc/skill/kvcc-arc/` | Agent skill: `SKILL.md` plus `references/{rules,components,composition,checklist}.md`. Condensed rewrite of Arc's agent skill files. |
| `kvcc/scripts/extract-tokens.mjs` | Regenerates `kvcc/tokens/`. |
| `kvcc/scripts/build-index.mjs` | Regenerates `COMPONENTS.md`, `components.json`. |
| `kvcc/scripts/check-skill-ids.mjs` | Verifies component ids named in `references/components.md` exist in `registry.json` (currently 0 unknown). |
| `kvcc/scripts/install-skill.sh` | Copies the skill plus generated references into `~/.claude/skills/kvcc-arc`. Tested against a temp HOME only. |
| `kvcc/scripts/build-registry.mjs` | `node kvcc/scripts/build-registry.mjs --base <url>` writes `kvcc/registry-dist/` (132 items, `registry.json` index, `_headers`, `index.html`). Output is gitignored via `kvcc/.gitignore`. |
| `kvcc/scripts/build-bundle.mjs` | Writes `kvcc/bundle/dist/{kvcc.css,kvcc.js,kvcc-bundle.html,design-system.html}`. CSS is derived from `registry/foundation.css`, `kvcc/theme.css` and 15 registry CSS modules (classes scoped to `kv-<id>__<class>`). |
| `kvcc/bundle/src/` | Hand-written inputs: `extras.css` (CSS versions of Motion/Radix states), `behaviors.js` (vanilla `window.kvcc`: theme, accent, toast, dialog, tooltip, tabs, progress, toggles), `select.js`, `table.js`, `charts.js` (builder functions `kvcc.select/table/barChart/sparkline` that emit the React markup so registry CSS applies), `demo-data.js` (sample data), `demo.html` (starter template with markup per component), `design-system.html` (reference page shell). |
| `kvcc/bundle/dist/` | Generated, committed. Components (19): button, input, textarea, checkbox, switch, badge, card, tabs, alert, progress, skeleton, metric-card, dialog, toast, tooltip, select, sortable-data-table, bar-chart, sparkline. The generator unwraps `:global(...)` and the base styles set global `border-box`, which registry CSS assumes. |
| `kvcc/extensions/app-shell/` | First extension: sidebar nav, top bar, content region. `app-shell.tsx`, `app-shell.module.css`, `item.json` (manifest read by `build-registry.mjs`), `README.md`. Installs from the registry as `app-shell` (verified: install into a Vite + React 19 + TS project typechecks and renders). Bundle port: `kvcc/bundle/src/app-shell.js`, example page `dist/template-app.html`. |
| `kvcc/extensions/` | Home for components not in the free set. Empty. |
| `kvcc/upstream-skills/README.md` | How to fetch verbatim upstream skill files. |
| `CLAUDE.md` | Repo-level agent instructions. |

Verified:
- Token and index counts match upstream (107 / 22 / 131, all free).
- Registry build: no `uiarc.dev/r/` references remain in output.
- Against a local HTTP registry, the real shadcn CLI fetched items, resolved transitive registry dependencies, and installed npm dependencies (`motion`, `lucide-react`) into the target project's `package.json`.

Verified since:
- Registry is live at https://kvcc-arc-registry.netlify.app. A real `npx shadcn@latest add https://kvcc-arc-registry.netlify.app/r/button.json` in a scratch project created the 4 files and added `motion` to `package.json`.
- Skill installed to `~/.claude/skills/kvcc-arc` (listed as available in a session). Not yet confirmed to auto-load in a fresh project.
- Bundle rendered in the browser pane (light theme); dialog, toast, switch, tabs verified by script. Dark theme and accents verified by computed values only (pane does not repaint snapshots). No phone-width or keyboard-flow check beyond tab arrows.
- Design system page published as a private artifact: https://claude.ai/artifact/CmxhiyWeLiS3ULcAVGnDnB (version 1).

Upstream skill diff done (2026-10-08): `references/rules.md` now includes the rules the first rewrite had dropped (accent intent, 44px touch targets, responsive widths, interruptible motion, save-in-place, space token range, Geist/Inter placement). Verbatim originals are fetched from `https://uiarc.dev/r/skills/arc/<name>.md`; not stored in the repo.

Not verified:
- Whether Claude Design applies the design system page to a new design. Test: link the artifact in a Claude Design prompt, ask for a small screen, check radii, weights, copy against the rules.
- Skill content fidelity: Arc's skill files were read through a summarizing fetch, not copied byte for byte. `references/` is a rewrite. Verbatim originals: `npx shadcn@latest add https://uiarc.dev/r/arc-skill.json`.
- Bundle markup in `demo.html` is hand-ported; it can drift if Arc renames CSS module classes. No automated check yet.

## 5. Current state

- Registry deployed. Netlify site `kvcc-arc-registry`, id `ad391246-b854-48dc-9394-74b47e4867e5`. Deploy command that works (needs a Netlify personal access token in `NETLIFY_AUTH_TOKEN`, never written to the repo; revoke it afterwards):
  ```bash
  node kvcc/scripts/build-registry.mjs --base https://kvcc-arc-registry.netlify.app
  npx netlify-cli@27.11.2 deploy --prod --no-build --dir kvcc/registry-dist --site ad391246-b854-48dc-9394-74b47e4867e5
  ```
  `--no-build` is required: without it the CLI detects the repo root as Next.js (upstream Arc) and tries `next build`. `netlify-cli` OAuth login fails (GitHub account already in use); do not try to fix it. The Netlify MCP `deploy-site` command (`npx @netlify/mcp`) is blocked by the Claude Code auto-mode classifier in this setup.
- Name-based installs: add `"registries": { "@kvcc": "https://kvcc-arc-registry.netlify.app/r/{name}.json" }` to a project's `components.json`, then `npx shadcn@latest add @kvcc/button`.
- The Artifact tool's "Design System" type is not offered on this account (`action: list, scope: types` returned empty). The design system page is a regular HTML artifact instead.
- macOS filesystem is case-insensitive: never name two generated files that differ only by case.

## 6. Next steps

Done since the first session: skill packaged for claude.ai, upstream skill diff, sync script, extension verifier (see section 4 and `CLAUDE.md` commands).

1. **You: redeploy the registry** (needs a Netlify token, section 5). `app-shell`, `settings-page` and `ai-chat` are not installable from the live URL until you do. Then verify against the live URL: `npx shadcn@latest add https://kvcc-arc-registry.netlify.app/r/app-shell.json` in a scratch project.
2. **You: upload `kvcc/skill/dist/kvcc-arc.zip`** (`bash kvcc/scripts/package-skill.sh` rebuilds it) in claude.ai, Settings, Capabilities, Skills, so chats and artifacts get the rules and the bundle. Then ask a chat for a small dashboard and check it follows the rules.
3. **Claude Design test, round 1 (2026-10-08, "Team settings" mobile screen):** it followed the rules (18/26px radii, weights 400 and 500, sentence case, 44px controls, labeled sample data) but approximated the tokens: own variable names, hand-picked oklch values, 15px and 13px text off the scale, hand-built switch on `--accent`, Discard filled and Save outlined. Fix shipped: an "Apply this system" section with ten numbered instructions and the exact token CSS as printed text (artifact version 4). The artifact is private, so Claude Design cannot open it unless it is shared (Share menu, anyone with the link); fallback is `kvcc/bundle/dist/design-brief.md`, attached or pasted. Round 2 (attached design-brief.md): pasted the token CSS verbatim and used tokens throughout, Save changes primary, switch on `--control-*` at 42x24, accent only on the active nav item, labeled sample data, reduced-motion branch. Remaining gaps: it embedded Google Fonts as "Inter" and "Geist" while our `--font-body` expects "Inter Variable" (silent fallback to the system font), so the printed CSS and the brief now end with the font override block (`--font-display: "Geist"`, `--font-body: "Inter"`); a few literals (44px, 52px, 48px) instead of `--control-height-md`. Round 3 (2026-10-08, brief with font override and size-token rule): PASS. Mechanical check of the output: fonts embedded as "Inter" and "Geist" with the override block pasted (so the tokens resolve), weights only 400 and 500, every font size and control height a token, no color literals (the only literal px are the spec'd switch geometry 42x24 / 18 / 3 and the 390x844 device frame), Save changes primary and Discard secondary, switch on `--control-*`, accent only on the active nav item, labeled sample data, reduced-motion branch. Minor mock-level gaps, not system issues: the save bar is always visible (no dirty state), bottom nav has labels but no icons, save bar is `role=region` rather than `role=status`. Round 4 (dashboard: sidebar, 3 stat cards, bar chart, selectable sortable table with status pills, row actions menu; light theme, blue accent): PASS on tokens (fonts mapped correctly, weights 400 and 500 only, every size and height a token, no color literals, one primary button, shadow only on the menu, series tokens only in the chart, tabular numerals, `aria-sort`, `aria-haspopup`, Escape closes the menu, status pills carry a dot plus text). Gaps were in areas the brief did not cover: menu used `--radius-control` and 44px items instead of `--radius-panel` and 36px, no arrow-key navigation or focus return; chart grid in `--border-subtle` and the average as a 2px `--series-3` line; stat change lines uncolored; Delete removes the row with no confirmation. Fix shipped: brief rules 12 to 16 (menus and popovers, charts, tables, stat cards, destructive actions). Next: rerun the dashboard prompt once to confirm the new rules stick. Original step: **test the design system artifact in Claude Design**: link it in a prompt, ask for a small screen, check radii, weights and copy against the rules. Adjust `kvcc/bundle/src/design-system.html`, rebuild, republish to the same URL.
4. **Extensions**: `app-shell`, `settings-page` and `ai-chat` are built (only `app-shell` has a bundle port). Remaining: data grid, advanced charts, command-heavy dashboards. Recipe: component + CSS module in `kvcc/extensions/<id>/` (import motion tokens as `../lib/motion-tokens`, reuse Arc items by relative path), `item.json` manifest, `README.md`, a row in `kvcc/skill/kvcc-arc/references/extensions.md`, optional vanilla port in `kvcc/bundle/src/` and an id in `COMPONENTS` of `build-bundle.mjs`. Gate: `node kvcc/scripts/verify-extension.mjs <id>` passes, then look at it in the browser (empty, filled, error, mobile, dark) before committing. Controls must be 44px on coarse pointers (`@media (pointer: coarse)`).
5. **Bundle gaps**: line chart with axes, donut chart, command palette. (Dropdown menu and popover done. `build-bundle.mjs` now fails if any `kv-*` class used by the demos or JS builders, including prefix-built names, is missing from the generated CSS.)
6. **Upstream sync**: `bash kvcc/scripts/sync-upstream.sh --verify`, then redeploy the registry and republish the design system artifact. Upstream was fully merged as of 2026-10-08.

## 6b. Open questions

- Registry access: currently planned public (contents are Arc's MIT source plus an empty theme). Gate it (auth header) only once extensions worth hiding exist.
- Whether Claude Design applies a Design System artifact reliably, and whether custom skills load in claude.ai chats, are unverified.

## 7. Operational notes

- Earlier chat session ran in a cloud sandbox that blocked uiarc.dev, netlify and ui.shadcn.com. Claude Code on the user's Mac reaches them.
- Git identity is set repo-locally (not global): `Dušan Kovačić <dusankvcc@gmail.com>`. Commit trailers used: `Co-Authored-By: Claude ...`.
- Do not edit `registry/foundation.css` or other upstream paths. Regenerate generated files instead of editing them.
- Do not reproduce Arc Pro source. Compose from free items and the rules.

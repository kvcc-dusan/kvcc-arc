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
| `kvcc/bundle/src/` | Hand-written inputs: `extras.css` (CSS versions of Motion/Radix states), `behaviors.js` (vanilla `window.kvcc`: theme, accent, toast, dialog, tooltip, tabs, progress, toggles), `demo.html` (starter template with markup per component), `design-system.html` (reference page shell). |
| `kvcc/bundle/dist/` | Generated, committed. Components: button, input, textarea, checkbox, switch, badge, card, tabs, alert, progress, skeleton, metric-card, dialog, toast, tooltip. |
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

1. Test the design system page in Claude Design (see "Not verified"). Adjust `kvcc/bundle/src/design-system.html` based on what Claude Design actually picks up, rebuild, republish to the same URL.
2. Finish the bundle: select, data table, chart basics (the original step 3 list). Add a check that classes used in `demo.html` exist in the generated CSS.
3. Propose the skill as a claude.ai account skill (single `SKILL.md` with the rules) so it applies in chats. Confirm the local skill auto-loads in a fresh Claude Code project.
4. **Extensions**: components absent from the free set (data grid, app shell, sidebar, settings page, AI chat, advanced charts, command-heavy dashboards) built natively to the rules in `kvcc/extensions/<id>/`, and added to the registry build and the bundle.
5. Optional: fetch verbatim upstream skill files into `kvcc/upstream-skills/` and diff against `references/` for drift.
6. Upstream sync routine: `git fetch upstream && git merge upstream/main`, rerun `extract-tokens`, `build-index`, `build-bundle`, `build-registry`, redeploy the registry, republish the design system artifact.

## 6b. Open questions

- Registry access: currently planned public (contents are Arc's MIT source plus an empty theme). Gate it (auth header) only once extensions worth hiding exist.
- Whether Claude Design applies a Design System artifact reliably, and whether custom skills load in claude.ai chats, are unverified.

## 7. Operational notes

- Earlier chat session ran in a cloud sandbox that blocked uiarc.dev, netlify and ui.shadcn.com. Claude Code on the user's Mac reaches them.
- Git identity is set repo-locally (not global): `Dušan Kovačić <dusankvcc@gmail.com>`. Commit trailers used: `Co-Authored-By: Claude ...`.
- Do not edit `registry/foundation.css` or other upstream paths. Regenerate generated files instead of editing them.
- Do not reproduce Arc Pro source. Compose from free items and the rules.

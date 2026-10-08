# Handoff: kvcc-arc

Context transfer from a claude.ai chat session (2026-10-08) to Claude Code. Self-contained: read this file, `CLAUDE.md`, and `kvcc/README.md`, then continue from "Next steps".

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
| Registry URL (not live until first deploy) | https://kvcc-arc-registry.netlify.app |

Arc facts: free set = 107 components + 22 blocks (all items in `registry.json`, tier free). Pro = 45 components + 66 blocks, $199 lifetime / $129 per year / team $599; not part of this project. Tokens: semantic roles, 8 accents (`data-accent`), dark via `data-theme="dark"`, oklch neutrals, Geist (30px and up) + Inter, weights 400 and 500 only.

## 4. Done

Commits on `main` (pushed to `origin/main`):

- `833dd1f` Add kvcc layer on top of Arc.
- `4ab4116` Add self-hosted registry builder.

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
| `kvcc/extensions/` | Home for components not in the free set. Empty. |
| `kvcc/upstream-skills/README.md` | How to fetch verbatim upstream skill files. |
| `CLAUDE.md` | Repo-level agent instructions. |

Verified:
- Token and index counts match upstream (107 / 22 / 131, all free).
- Registry build: no `uiarc.dev/r/` references remain in output.
- Against a local HTTP registry, the real shadcn CLI fetched items, resolved transitive registry dependencies, and installed npm dependencies (`motion`, `lucide-react`) into the target project's `package.json`.

Not verified:
- The final file-write step of `shadcn add` from the self-hosted registry (the sandbox could not reach ui.shadcn.com, which the CLI calls for base-color data). Upstream `target` paths (`@components/arc/...`) are unchanged.
- The skill installer on the user's real `~/.claude`.
- Skill content fidelity: Arc's skill files were read through a summarizing fetch, not copied byte for byte. `references/` is a rewrite. Verbatim originals can be fetched with the `npx shadcn@latest add https://uiarc.dev/r/arc-skill.json` command.

## 5. Current state and blocker

Netlify project exists (created through the Netlify connector):

- Name `kvcc-arc-registry`, site id `ad391246-b854-48dc-9394-74b47e4867e5`, team id `697741bc58aa54ce03f355c0`.
- No deploy yet: `https://kvcc-arc-registry.netlify.app` does not serve anything.
- `kvcc/registry-dist/` was built with base `https://kvcc-arc-registry.netlify.app` (rebuild any time with the command above).

Blocker: deploy failed because `netlify-cli` is not authenticated on the user's Mac. `npx netlify-cli login` opens the browser, and authorizing with GitHub reports that the account is already in use (the Netlify account was created through GitHub sign-in; the CLI OAuth flow trips on it). Do not try to fix the OAuth login. Separate issue: `npx netlify-cli` currently resolves to `27.12.0`, which does not exist on npm (ETARGET); pin `netlify-cli@27.11.2`.

Workarounds, in order of preference:

1. **Personal access token, no OAuth.** In Netlify: User settings, Applications, Personal access tokens, create one. Then:
   ```bash
   NETLIFY_AUTH_TOKEN=<token> npx netlify-cli@27.11.2 deploy --prod --dir kvcc/registry-dist --site ad391246-b854-48dc-9394-74b47e4867e5
   ```
   The token must never be written into the repo or committed.
2. Netlify MCP deploy: its `deploy-site` operation returns an `npx -y @netlify/mcp@latest --site-id <id> --proxy-path <url>` command to run from the directory to deploy. It needs outbound access to `netlify-mcp.netlify.app`, which is available on the user's Mac but not in the cloud sandbox.
3. Manual: drag `kvcc/registry-dist` onto https://app.netlify.com/projects/kvcc-arc-registry (Deploys).

After deploying, verify:

```bash
curl -s https://kvcc-arc-registry.netlify.app/r/button.json | head -c 300
# scratch project with components.json:
npx shadcn@latest add https://kvcc-arc-registry.netlify.app/r/button.json
```

Register the namespace for name-based installs in a project's `components.json`: `"registries": { "@kvcc": "https://kvcc-arc-registry.netlify.app/r/{name}.json" }`, then `npx shadcn@latest add @kvcc/button`.

## 6. Next steps

1. Deploy the registry (section 5), verify a real install end to end, then set the README status row to done and commit.
2. Install the skill locally: `bash kvcc/scripts/install-skill.sh`. Confirm it loads in a fresh Claude Code project. Also propose it as a claude.ai account skill (single `SKILL.md` containing the rules) so it applies in chats.
3. Build the **single-file bundle** for artifacts and mini apps, in `kvcc/bundle/`: inlined token CSS (`:root`, dark, 8 accents), Google Fonts (Geist, Inter), CSS-only motion via `--ease-*`, `--duration-*`, `--ease-spring`, and hand-ported versions of the most-used components (button, input, select, switch, tabs, card, dialog, toast, badge, table, metric card, charts basics). Follow `kvcc/skill/kvcc-arc/references/rules.md`. Add a generator script so the bundle derives from `registry/` rather than being hand-maintained where possible. Artifact constraints: scripts only from allowlisted CDNs with pinned versions, stylesheets only from Google Fonts, no npm.
4. Generate the **Claude Design System artifact** from `kvcc/tokens/` plus the rules (Artifact tool, "Design System" type, listed via `action: list, scope: types`). Then test how Claude Design applies it to a new design.
5. **Extensions**: components absent from the free set (data grid, app shell, sidebar, settings page, AI chat, advanced charts, command-heavy dashboards) built natively to the rules in `kvcc/extensions/<id>/`, and added to the registry build.
6. Optional: fetch verbatim upstream skill files into `kvcc/upstream-skills/` and diff against `references/` for drift.
7. Add an upstream sync routine: `git fetch upstream && git merge upstream/main`, rerun the three generators, rebuild and redeploy the registry.

## 6b. Open questions

- Registry access: currently planned public (contents are Arc's MIT source plus an empty theme). Gate it (auth header) only once extensions worth hiding exist.
- Whether Claude Design applies a Design System artifact reliably, and whether custom skills load in claude.ai chats, are unverified.

## 7. Operational notes

- Tool environment from the previous session: cloud sandbox blocked outbound access to uiarc.dev, netlify, ui.shadcn.com. On the user's Mac these are reachable.
- Git identity is set repo-locally (not global): `Dušan Kovačić <dusankvcc@gmail.com>`. Commit trailers used: `Co-Authored-By: Claude ...`.
- Do not edit `registry/foundation.css` or other upstream paths. Regenerate generated files instead of editing them.
- Do not reproduce Arc Pro source. Compose from free items and the rules.

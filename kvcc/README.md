# kvcc-arc

Personal design system. Fork of Arc (https://github.com/kuratlielia/arc-library, MIT) extended with a kvcc layer: rules, generated references, agent skill, extensions. Goal: one visual language available on every surface where UI gets built.

## Status

| Component | State |
|---|---|
| Fork of Arc free set (107 components, 22 blocks, tokens, motion presets) | Done |
| Token reference, component index (generated) | Done |
| Agent skill (`kvcc/skill/kvcc-arc/`) | Installed to `~/.claude/skills/kvcc-arc` |
| Self-hosted shadcn registry (`@kvcc`) | Done. Live at https://kvcc-arc-registry.netlify.app; `shadcn add` verified end to end |
| Design System reference page (`kvcc/bundle/dist/design-system.html`, published as a private artifact) | Done. The Artifact "Design System" type is not offered on this account |
| Single-file bundle for artifacts and mini apps (`kvcc/bundle/`) | 19 components: CSS derived from registry, vanilla JS (`kvcc.select`, `kvcc.table`, `kvcc.barChart`, `kvcc.sparkline`). Not yet: line chart with axes, donut, command palette |
| Claude Design System artifact | Not started |
| Extensions (components absent from free set, `kvcc/extensions/`) | Started: `app-shell` (React + registry item + bundle port + `template-app.html`). Next: settings page, AI chat, data grid, advanced charts |

## Surfaces

| Surface | Mechanism |
|---|---|
| React apps (Claude Code, local) | shadcn registry install (`@kvcc`); skill loaded from `~/.claude/skills/kvcc-arc` |
| Single-file artifacts and mini apps | Inlined token CSS, Google Fonts, CSS-only motion; rules from the skill; no npm components |
| Claude Design | Design System artifact generated from `kvcc/tokens/` and the rules |

Arc components are React plus CSS modules plus the `motion` library. Surfaces without package installs get tokens and rules at full fidelity and ports of components at reduced motion fidelity.

## Repository layout

```text
registry/, lib/, public/r/, registry.json, scripts/   upstream, kept unmodified
kvcc/theme.css                                        personal token overrides (loaded after foundation.css)
kvcc/tokens/                                          generated: tokens.json, TOKENS.md
kvcc/COMPONENTS.md, kvcc/components.json              generated component index
kvcc/skill/kvcc-arc/                                  agent skill: SKILL.md and references/
kvcc/extensions/                                      components not in the free set
kvcc/upstream-skills/                                 verbatim upstream skill files (manual fetch)
kvcc/scripts/                                         generators, checks, installer
CLAUDE.md                                             repo-level agent instructions
```

## Upstream sync

`upstream` remote points to the Arc repository. Merge with `git fetch upstream && git merge upstream/main`. Conflicts are limited to files this fork modifies; the kvcc layer adds files and modifies no upstream path. After a merge run the generators:

```bash
node kvcc/scripts/extract-tokens.mjs
node kvcc/scripts/build-index.mjs
node kvcc/scripts/check-skill-ids.mjs
```

## Skill install

```bash
bash kvcc/scripts/install-skill.sh
```

Copies the skill and fresh generated references to `~/.claude/skills/kvcc-arc`.

## License and provenance

- Repository license: MIT, copyright Elia Kuratli (`LICENSE`). Retain it in all copies.
- The Arc website states a separate rule against reselling the source as a UI kit or template. Distributing this fork as a product is out of scope.
- Arc Pro source is not part of this repository and is not reconstructed.
- `kvcc/skill/kvcc-arc/references/` is a condensed rewrite of Arc's published agent skill files. The originals were read through a summarizing fetch and are not byte-identical copies. Verbatim originals: see `kvcc/upstream-skills/README.md`.

## Open items

1. Push to `origin` (https://github.com/kvcc-dusan/kvcc-arc, private).
2. Host the registry: `node kvcc/scripts/build-registry.mjs --base <url>`, deploy `kvcc/registry-dist/` as a static site.
3. Build the single-file bundle (foundation CSS plus selected component ports).
4. Generate the Claude Design System artifact from `kvcc/tokens/`.
5. Verify how Claude Design applies a Design System artifact and whether the skill loads in claude.ai chats.

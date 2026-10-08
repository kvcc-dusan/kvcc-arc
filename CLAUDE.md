# kvcc-arc

Personal design system. Fork of Arc (kuratlielia/arc-library, MIT) with a kvcc layer. Spec and architecture: `kvcc/README.md`. Project context, decisions, links, current status, and next steps: `kvcc/HANDOFF.md` (read first).

## Layout

- Upstream files (untouched, merge from `upstream` remote): `registry/`, `lib/`, `public/r/`, `registry.json`, `scripts/`, `README.md`, `LICENSE`.
- kvcc layer (all additions live here): `kvcc/`.
- Agent rules for any UI work: `kvcc/skill/kvcc-arc/SKILL.md` and `kvcc/skill/kvcc-arc/references/`.

## Commands

- `node kvcc/scripts/extract-tokens.mjs`: regenerate `kvcc/tokens/` from `registry/foundation.css`.
- `node kvcc/scripts/build-index.mjs`: regenerate `kvcc/COMPONENTS.md` and `kvcc/components.json`.
- `node kvcc/scripts/build-bundle.mjs`: regenerate `kvcc/bundle/dist/` (single-file `kvcc-bundle.html`, `kvcc.css`, `kvcc.js`). Hand-written inputs live in `kvcc/bundle/src/`.
- `node kvcc/scripts/verify-extension.mjs [id...]`: build the registry, install extensions into a scratch Vite project with the real shadcn CLI, typecheck, and lint against the rules (needs network). Run it before committing any extension.
- `bash kvcc/scripts/sync-upstream.sh [--verify]`: merge `upstream/main` and regenerate everything derived.
- `bash kvcc/scripts/install-skill.sh`: install the skill (with the single-file bundle) into `~/.claude/skills/kvcc-arc`. `bash kvcc/scripts/package-skill.sh` builds `kvcc/skill/dist/kvcc-arc.zip` for claude.ai.
- `node kvcc/scripts/check-skill-ids.mjs`: verify every component id named in the skill exists in `registry.json`.
- `npm run check`: upstream typecheck, lint, registry check (requires `npm install`).

## Rules

- Never edit `registry/foundation.css`; override in `kvcc/theme.css`.
- Keep upstream paths untouched where possible so `git merge upstream/main` stays clean.
- New components go in `kvcc/extensions/<id>/`, built to `kvcc/skill/kvcc-arc/references/rules.md`. Recipe and checklist: `kvcc/HANDOFF.md` section 6, item 4.
- Do not reproduce Arc Pro source.

# kvcc-arc

Personal design system. Fork of Arc (kuratlielia/arc-library, MIT) with a kvcc layer. Spec and architecture: `kvcc/README.md`. Project context, decisions, links, current status, and next steps: `kvcc/HANDOFF.md` (read first).

## Layout

- Upstream files (untouched, merge from `upstream` remote): `registry/`, `lib/`, `public/r/`, `registry.json`, `scripts/`, `README.md`, `LICENSE`.
- kvcc layer (all additions live here): `kvcc/`.
- Agent rules for any UI work: `kvcc/skill/kvcc-arc/SKILL.md` and `kvcc/skill/kvcc-arc/references/`.

## Commands

- `node kvcc/scripts/extract-tokens.mjs`: regenerate `kvcc/tokens/` from `registry/foundation.css`.
- `node kvcc/scripts/build-index.mjs`: regenerate `kvcc/COMPONENTS.md` and `kvcc/components.json`.
- `node kvcc/scripts/check-skill-ids.mjs`: verify every component id named in the skill exists in `registry.json`.
- `npm run check`: upstream typecheck, lint, registry check (requires `npm install`).

## Rules

- Never edit `registry/foundation.css`; override in `kvcc/theme.css`.
- Keep upstream paths untouched where possible so `git merge upstream/main` stays clean.
- New components go in `kvcc/extensions/<id>/`, built to `kvcc/skill/kvcc-arc/references/rules.md`.
- Do not reproduce Arc Pro source.

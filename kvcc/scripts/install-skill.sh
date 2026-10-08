#!/usr/bin/env bash
# Installs the kvcc-arc skill into ~/.claude/skills so every Claude Code project loads it.
# Run from anywhere: bash kvcc/scripts/install-skill.sh
set -euo pipefail
root="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
dest="$HOME/.claude/skills/kvcc-arc"
node "$root/kvcc/scripts/extract-tokens.mjs" >/dev/null
node "$root/kvcc/scripts/build-index.mjs" >/dev/null
mkdir -p "$dest/references"
cp "$root/kvcc/skill/kvcc-arc/SKILL.md" "$dest/SKILL.md"
cp "$root/kvcc/skill/kvcc-arc/references/"*.md "$dest/references/"
cp "$root/kvcc/tokens/TOKENS.md" "$dest/references/tokens.md"
cp "$root/kvcc/COMPONENTS.md" "$dest/references/component-index.md"
# The single-file bundle ships with the skill so chat surfaces can inline it.
node "$root/kvcc/scripts/build-bundle.mjs" >/dev/null
mkdir -p "$dest/bundle"
cp "$root/kvcc/bundle/dist/kvcc.css" "$root/kvcc/bundle/dist/kvcc.js" "$root/kvcc/bundle/dist/kvcc-bundle.html" "$root/kvcc/bundle/dist/template-app.html" "$root/kvcc/bundle/README.md" "$dest/bundle/"
echo "Installed kvcc-arc skill to $dest"

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
cp "$root/kvcc/COMPONENTS.md" "$dest/references/COMPONENTS.md"
echo "Installed kvcc-arc skill to $dest"

#!/usr/bin/env bash
# Builds kvcc/skill/dist/kvcc-arc.zip for upload to claude.ai (Settings, Capabilities, Skills). Installs into a temp HOME first so your real ~/.claude is untouched.
set -euo pipefail
root="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
tmp="$(mktemp -d)"
HOME="$tmp" bash "$root/kvcc/scripts/install-skill.sh" >/dev/null
mkdir -p "$root/kvcc/skill/dist"
rm -f "$root/kvcc/skill/dist/kvcc-arc.zip"
(cd "$tmp/.claude/skills" && zip -qr "$root/kvcc/skill/dist/kvcc-arc.zip" kvcc-arc)
rm -rf "$tmp"
echo "Wrote kvcc/skill/dist/kvcc-arc.zip ($(du -h "$root/kvcc/skill/dist/kvcc-arc.zip" | cut -f1))"
unzip -l "$root/kvcc/skill/dist/kvcc-arc.zip" | tail -n +4 | head -30

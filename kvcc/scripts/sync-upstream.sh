#!/usr/bin/env bash
# Pulls Arc upstream into main and regenerates everything derived from it.
# Usage: bash kvcc/scripts/sync-upstream.sh [--verify]   (--verify also installs and typechecks every extension; needs network)
# Stops before merging if the working tree is dirty. If the merge conflicts, resolve it, then rerun the generator steps below by hand.
set -euo pipefail
root="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$root"

if [ -n "$(git status --porcelain)" ]; then echo "Working tree is dirty. Commit or stash first." >&2; exit 1; fi

git fetch upstream
incoming="$(git log --oneline HEAD..upstream/main)"
if [ -z "$incoming" ]; then echo "Already up to date with upstream."; exit 0; fi
echo "Incoming from upstream:"; echo "$incoming"

git merge --no-edit upstream/main

node kvcc/scripts/extract-tokens.mjs
node kvcc/scripts/build-index.mjs
node kvcc/scripts/check-skill-ids.mjs
node kvcc/scripts/build-bundle.mjs
[ "${1:-}" = "--verify" ] && node kvcc/scripts/verify-extension.mjs

git add -A
if ! git diff --cached --quiet; then git commit -m "Regenerate derived files after upstream sync"; fi

cat <<'MSG'

Synced. Remaining by hand:
  1. Review the diff for upstream class renames that break kvcc/bundle/src/demo.html or the vanilla ports.
  2. bash kvcc/scripts/install-skill.sh
  3. node kvcc/scripts/build-registry.mjs --base https://kvcc-arc-registry.netlify.app, then deploy kvcc/registry-dist (see HANDOFF.md section 5).
  4. Republish the design system artifact (kvcc/bundle/dist/design-system.html) to the same URL.
MSG

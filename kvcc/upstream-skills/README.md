# Upstream skill files

Arc publishes its agent skill files on its site, not in the repository. `kvcc/skill/kvcc-arc/references/` holds a condensed rewrite. To keep the verbatim originals for reference, run from the repo root on a machine with internet access:

```bash
npx shadcn@latest add https://uiarc.dev/r/arc-skill.json
```

Move the resulting skill files into this folder and keep them read-only. They are a reference for diffing against `references/`, not loaded by any agent.

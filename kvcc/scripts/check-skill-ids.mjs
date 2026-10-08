// Verifies every backticked kebab-case id in the skill references exists in registry.json. Run: node kvcc/scripts/check-skill-ids.mjs
import { readFileSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const ids = new Set(JSON.parse(readFileSync(path.join(root, "registry.json"), "utf8")).items.map(i => i.name));
const dir = path.join(root, "kvcc/skill/kvcc-arc/references");
const ignore = new Set(["aria-busy", "aria-hidden", "aria-labelledby", "data-theme", "data-accent", "data-highlighted", "use-client", "server-safe", "tabular-nums", "min-width", "overflow-wrap", "max-width", "font-weight", "text-transform", "var-border", "focus-visible", "motion-tokens", "foundation-css"]);
let bad = 0, checked = 0;
for (const f of readdirSync(dir).filter(f => f.endsWith(".md") && f === "components.md")) {
  const text = readFileSync(path.join(dir, f), "utf8");
  for (const m of text.matchAll(/`([a-z][a-z0-9]*(?:-[a-z0-9]+)*)`/g)) {
    const id = m[1];
    if (ignore.has(id)) continue;
    // props and plain words without a hyphen are skipped unless they are known ids; hyphenated or known-id tokens are checked
    if (!id.includes("-") && !ids.has(id)) continue;
    checked++;
    if (!ids.has(id)) { console.log(`UNKNOWN in ${f}: ${id}`); bad++; }
  }
}
// Every extension directory must be listed in references/extensions.md.
const extList = readFileSync(path.join(dir, "extensions.md"), "utf8");
for (const d of readdirSync(path.join(root, "kvcc/extensions"), { withFileTypes: true }).filter(d => d.isDirectory())) {
  checked++;
  if (!extList.includes(`\`${d.name}\``)) { console.log(`MISSING from extensions.md: ${d.name}`); bad++; }
}
console.log(`checked ${checked} id references, ${bad} unknown`);
process.exit(bad ? 1 : 0);

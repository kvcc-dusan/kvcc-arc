// Builds a self-hosted shadcn registry into kvcc/registry-dist/ from upstream prebuilt items (public/r) plus kvcc items.
// Usage: node kvcc/scripts/build-registry.mjs --base https://registry.example.com
//        (or KVCC_REGISTRY_URL=...). Item URLs resolve as <base>/r/<name>.json.
import { readFileSync, writeFileSync, mkdirSync, readdirSync, rmSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const argBase = process.argv.indexOf("--base") > -1 ? process.argv[process.argv.indexOf("--base") + 1] : undefined;
const base = (argBase ?? process.env.KVCC_REGISTRY_URL ?? "").replace(/\/+$/, "");
if (!/^https?:\/\//.test(base)) { console.error("Missing base URL. Pass --base https://host or set KVCC_REGISTRY_URL."); process.exit(1); }

const UPSTREAM = "https://uiarc.dev/r/";
const out = path.join(root, "kvcc/registry-dist");
rmSync(out, { recursive: true, force: true });
mkdirSync(path.join(out, "r"), { recursive: true });

const rewrite = url => (url.startsWith(UPSTREAM) ? `${base}/r/${url.slice(UPSTREAM.length)}` : url);
const written = [];
const write = (name, item) => { writeFileSync(path.join(out, "r", `${name}.json`), JSON.stringify(item, null, 2) + "\n"); written.push(item); };

// 1. Upstream items, with registryDependencies pointed at this registry.
const srcDir = path.join(root, "public/r");
for (const f of readdirSync(srcDir).filter(f => f.endsWith(".json"))) {
  const item = JSON.parse(readFileSync(path.join(srcDir, f), "utf8"));
  if (item.registryDependencies) item.registryDependencies = item.registryDependencies.map(rewrite);
  write(item.name, item);
}

// 2. kvcc items.
write("kvcc-theme", {
  $schema: "https://ui.shadcn.com/schema/registry-item.json",
  name: "kvcc-theme", type: "registry:item", title: "kvcc theme",
  description: "Personal token overrides. Import after arc/foundation.css.",
  categories: ["foundation"], dependencies: [],
  registryDependencies: [`${base}/r/arc-foundation.json`],
  files: [{ path: "kvcc/theme.css", type: "registry:component", target: "@components/arc/kvcc-theme.css", content: readFileSync(path.join(root, "kvcc/theme.css"), "utf8") }],
});

// 3. Extensions: kvcc/extensions/<id>/item.json lists the files; contents are inlined here.
const extDir = path.join(root, "kvcc/extensions");
for (const id of readdirSync(extDir, { withFileTypes: true }).filter(d => d.isDirectory()).map(d => d.name)) {
  const manifestPath = path.join(extDir, id, "item.json");
  let manifest;
  try { manifest = JSON.parse(readFileSync(manifestPath, "utf8")); } catch { console.warn(`skip extensions/${id}: no readable item.json`); continue; }
  write(manifest.name, {
    $schema: "https://ui.shadcn.com/schema/registry-item.json",
    name: manifest.name, type: "registry:ui", title: manifest.title, description: manifest.description,
    categories: manifest.categories ?? [], dependencies: manifest.dependencies ?? [],
    registryDependencies: (manifest.registryDependencies ?? []).map(dep => `${base}/r/${dep}.json`),
    files: manifest.files.map(f => ({ path: `kvcc/extensions/${id}/${f}`, type: "registry:component", target: `@components/arc/${manifest.name}/${f}`, content: readFileSync(path.join(extDir, id, f), "utf8") })),
    meta: { tier: "kvcc", kind: "extension", tags: manifest.tags ?? [] },
  });
}

// 4. Index.
writeFileSync(path.join(out, "r/registry.json"), JSON.stringify({
  $schema: "https://ui.shadcn.com/schema/registry.json", name: "kvcc", homepage: base,
  items: written.map(({ files, ...meta }) => ({ ...meta, files: files.map(({ content, ...f }) => f) })),
}, null, 2) + "\n");

writeFileSync(path.join(out, "_headers"), "/r/*\n  Content-Type: application/json; charset=utf-8\n  Access-Control-Allow-Origin: *\n  Cache-Control: public, max-age=300\n");
writeFileSync(path.join(out, "index.html"), `<!doctype html><meta charset="utf-8"><title>kvcc registry</title><p>shadcn registry. Install: <code>npx shadcn@latest add ${base}/r/button.json</code></p>\n`);
console.log(`built ${written.length} items to kvcc/registry-dist (base ${base})`);

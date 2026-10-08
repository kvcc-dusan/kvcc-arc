#!/usr/bin/env node
// Verifies an extension the way a consumer would use it: builds the registry, serves it locally, installs the item into a scratch
// Vite + React + TypeScript project with the real shadcn CLI, then typechecks. Also checks the manifest and the skill docs entry.
// Usage: node kvcc/scripts/verify-extension.mjs <id> [<id>...]   (no ids: every extension)
// Needs network for npm and the shadcn CLI. The scratch project is cached in the OS temp dir, so later runs are fast.
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { createServer } from "node:http";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const extDir = join(root, "kvcc", "extensions");
const PORT = 4879;
const base = `http://localhost:${PORT}`;
const scratch = join(tmpdir(), "kvcc-verify-project");

const allIds = readdirSync(extDir, { withFileTypes: true }).filter(d => d.isDirectory()).map(d => d.name);
const ids = process.argv.slice(2).length ? process.argv.slice(2) : allIds;
const exec = promisify(execFile);
// Async on purpose: the registry server runs in this process, so a blocking exec would starve it and deadlock the CLI.
const run = async (cmd, args, cwd, label) => {
  try { return (await exec(cmd, args, { cwd, encoding: "utf8", timeout: 240000, maxBuffer: 16 * 1024 * 1024 })).stdout; }
  catch (error) { throw new Error(`${label} failed:\n${[error.stdout, error.stderr].filter(Boolean).join("\n").trim().slice(-1500)}`); }
};

const failures = [];
const fail = (id, message) => failures.push(`${id}: ${message}`);

// 1. Static checks: manifest, files, imports, docs.
const references = readFileSync(join(root, "kvcc", "skill", "kvcc-arc", "references", "extensions.md"), "utf8");
for (const id of ids) {
  const dir = join(extDir, id);
  if (!existsSync(join(dir, "item.json"))) { fail(id, "missing item.json"); continue; }
  const manifest = JSON.parse(readFileSync(join(dir, "item.json"), "utf8"));
  if (manifest.name !== id) fail(id, `manifest name "${manifest.name}" does not match folder`);
  for (const file of manifest.files ?? []) if (!existsSync(join(dir, file))) fail(id, `manifest lists missing file ${file}`);
  if (!existsSync(join(dir, "README.md"))) fail(id, "missing README.md");
  if (!references.includes(`\`${id}\``)) fail(id, "not listed in skill references/extensions.md");
  for (const file of (manifest.files ?? []).filter(f => /\.(tsx?|css)$/.test(f))) {
    const text = readFileSync(join(dir, file), "utf8");
    if (text.includes("@/lib/") || text.includes("@/registry/")) fail(id, `${file} imports through an app alias; use the installed relative layout (../lib/motion-tokens)`);
    if (/#[0-9a-fA-F]{3,8}\b|\brgb\(|\bhsl\(/.test(text) && file.endsWith(".css")) fail(id, `${file} uses a raw color; use semantic tokens`);
    if (/font-weight:\s*[6-9]00|font-weight:\s*bold/.test(text)) fail(id, `${file} uses weight above 500`);
    if (/text-transform:\s*uppercase/.test(text)) fail(id, `${file} uses uppercase text`);
    if (text.includes("—")) fail(id, `${file} contains an em dash`);
  }
}

if (!failures.length) {
  // 2. Build the registry and serve it.
  await run("node", [join(root, "kvcc", "scripts", "build-registry.mjs"), "--base", base], root, "registry build");
  const dist = join(root, "kvcc", "registry-dist");
  const server = createServer((req, res) => {
    try { const body = readFileSync(join(dist, decodeURIComponent((req.url ?? "/").split("?")[0]))); res.writeHead(200, { "content-type": "application/json" }); res.end(body); }
    catch { res.writeHead(404); res.end(); }
  });
  await new Promise(resolve => server.listen(PORT, resolve));

  try {
    // 3. Scratch project, created once.
    if (!existsSync(join(scratch, "node_modules"))) {
      rmSync(scratch, { recursive: true, force: true });
      mkdirSync(join(scratch, "src"), { recursive: true });
      const files = {
        "package.json": { name: "kvcc-verify", private: true, type: "module", dependencies: { react: "^19.0.0", "react-dom": "^19.0.0" }, devDependencies: { vite: "^6.0.0", typescript: "^5.6.0", "@types/react": "^19.0.0", "@types/react-dom": "^19.0.0" } },
        "tsconfig.json": { compilerOptions: { target: "ES2022", module: "ESNext", moduleResolution: "bundler", jsx: "react-jsx", strict: true, skipLibCheck: true, noEmit: true, baseUrl: ".", paths: { "@/*": ["./src/*"] }, types: ["vite/client"] }, include: ["src"] },
        "components.json": { $schema: "https://ui.shadcn.com/schema.json", style: "new-york", rsc: false, tsx: true, tailwind: { config: "", css: "src/index.css", baseColor: "neutral", cssVariables: true }, aliases: { components: "@/components", utils: "@/lib/utils", ui: "@/components/ui", lib: "@/lib", hooks: "@/hooks" } },
      };
      for (const [name, content] of Object.entries(files)) writeFileSync(join(scratch, name), JSON.stringify(content, null, 2));
      writeFileSync(join(scratch, "src", "index.css"), "");
      await run("npm", ["install", "--silent"], scratch, "npm install in scratch project");
    }
    // 4. Install each extension fresh and typecheck everything installed so far.
    rmSync(join(scratch, "src", "components"), { recursive: true, force: true });
    for (const id of ids) {
      try { await run("npx", ["-y", "shadcn@latest", "add", `${base}/r/${id}.json`, "-y", "-o"], scratch, `install ${id}`); }
      catch (error) { fail(id, error.message); }
    }
    try { await run("npx", ["tsc", "--noEmit"], scratch, "typecheck"); }
    catch (error) { failures.push(`typecheck (${ids.join(", ")}): ${error.message}`); }
  } finally {
    server.close();
  }
}

if (failures.length) {
  console.error(`FAIL\n${failures.map(f => `- ${f}`).join("\n")}`);
  process.exit(1);
}
console.log(`PASS: ${ids.join(", ")} (manifest, docs, rules lint, install, typecheck)`);

import { cpSync, existsSync, mkdirSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

const FILES = ["pglite.data", "pglite.wasm", "initdb.wasm", "initdb.js"];

function srcDir() {
  return join(process.cwd(), "node_modules/@electric-sql/pglite/dist");
}

function copyInto(dest) {
  const src = srcDir();
  mkdirSync(dest, { recursive: true });
  for (const name of FILES) {
    const from = join(src, name);
    if (existsSync(from)) cpSync(from, join(dest, name));
  }
}

function walk(dir, visit) {
  if (!existsSync(dir)) return;
  visit(dir);
  for (const name of readdirSync(dir)) {
    const next = join(dir, name);
    if (statSync(next).isDirectory()) walk(next, visit);
  }
}

/** Copy wasm + data next to the bundled PGLite JS. Safe to call more than once. */
export function copyPgliteIntoFunctions() {
  const root = join(process.cwd(), ".vercel/output/functions");
  if (!existsSync(root)) return;
  walk(root, (dir) => {
    if (dir.endsWith("_libs")) copyInto(dir);
  });
}

/**
 * Vite closeBundle often runs before Nitro writes the function folder.
 * Also hook Nitro `compiled` so the files exist in the real output.
 */
export function pgliteAssetsPlugin() {
  return {
    name: "app-builder:pglite-assets",
    apply: "build",
    closeBundle() {
      copyPgliteIntoFunctions();
    },
  };
}

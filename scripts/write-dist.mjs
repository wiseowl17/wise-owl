#!/usr/bin/env node
/**
 * Grok / Vercel project settings look for a `dist` folder after `npm run build`.
 * Nitro writes `.vercel/output`. Copy static assets to `dist` and prerender
 * HTML shells with the Nitro server so the live host has real pages.
 */
import { cpSync, existsSync, mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { pathToFileURL } from "node:url";

const root = process.cwd();
const staticDir = join(root, ".vercel/output/static");
const serverEntry = join(root, ".vercel/output/functions/__server.func/index.mjs");
const distDir = join(root, "dist");

if (!existsSync(staticDir) || !existsSync(serverEntry)) {
  console.error("[write-dist] missing Nitro output — run vite build first");
  process.exit(1);
}

mkdirSync(distDir, { recursive: true });
cpSync(staticDir, distDir, { recursive: true });

const { default: app } = await import(pathToFileURL(serverEntry).href);
if (!app?.fetch) {
  console.error("[write-dist] Nitro server has no fetch handler");
  process.exit(1);
}

const routes = [
  ["/", "index.html"],
  ["/onboard", "onboard/index.html"],
  ["/onboard", "onboard.html"],
  ["/login", "login.html"],
  ["/login", "login/index.html"],
  ["/studio", "studio/index.html"],
  ["/p/wise-owl", "p/wise-owl/index.html"],
  ["/invoice", "invoice.html"],
];

for (const [route, out] of routes) {
  const res = await app.fetch(new Request(`http://127.0.0.1${route}`));
  if (!res.ok) {
    console.error(`[write-dist] ${route} -> ${res.status}`);
    process.exit(1);
  }
  const html = await res.text();
  const file = join(distDir, out);
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, html);
  console.log(`[write-dist] ${out} (${html.length} bytes)`);
}

writeFileSync(join(distDir, "404.html"), await (await app.fetch(new Request("http://127.0.0.1/"))).text());
console.log("[write-dist] ready");

#!/usr/bin/env node
/**
 * Fail the build if the compiled server cannot render the homepage.
 * A green `vite build` is not enough — the last outage compiled, then every
 * request threw `Export 'ssr_exports' is not defined`. Vercel only promotes a
 * deploy when this command exits 0, so a broken server never replaces production.
 */
import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { createServer } from "node:net";

const PATHS = (process.env.SMOKE_PATHS || "/").split(",").map((p) => p.trim()).filter(Boolean);

function freePort() {
  return new Promise((resolve, reject) => {
    const server = createServer();
    server.listen(0, "127.0.0.1", () => {
      const address = server.address();
      const port = typeof address === "object" && address ? address.port : 0;
      server.close(() => resolve(port));
    });
    server.on("error", reject);
  });
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

const port = await freePort();
const viteBin = "node_modules/.bin/vite";
const args = ["preview", "--host", "127.0.0.1", "--port", String(port), "--strictPort"];
const command = existsSync("scripts/with-app-env.mjs")
  ? ["scripts/with-app-env.mjs", viteBin, ...args]
  : [viteBin, ...args];

const child = spawn("node", command, {
  stdio: ["ignore", "pipe", "pipe"],
  env: process.env,
});

let log = "";
child.stdout.on("data", (chunk) => {
  log += chunk.toString();
});
child.stderr.on("data", (chunk) => {
  log += chunk.toString();
});

function stop() {
  if (!child.killed) child.kill("SIGTERM");
}

const deadline = Date.now() + 60_000;
let failure = "";

try {
  for (const path of PATHS) {
    let healthy = false;
    let last = "";
    while (Date.now() < deadline) {
      if (child.exitCode != null) {
        failure = `preview exited ${child.exitCode} before ${path} responded\n${log.slice(-2000)}`;
        break;
      }
      try {
        const response = await fetch(`http://127.0.0.1:${port}${path}`);
        const text = await response.text();
        last = `${response.status} ${text.slice(0, 220).replace(/\s+/g, " ")}`;
        const crashed =
          response.status >= 500 ||
          text.includes("ssr_exports") ||
          text.includes('"unhandled": true') ||
          text.includes('"unhandled":true');
        if (crashed) {
          failure = `${path} crashed: ${last}`;
          break;
        }
        if (response.status >= 200 && response.status < 400) {
          healthy = true;
          console.log(`[smoke] ${path} ${response.status}`);
          break;
        }
      } catch {
        /* preview still booting */
      }
      await sleep(400);
    }
    if (failure) break;
    if (!healthy) {
      failure = `${path} never became healthy. last=${last || "no response"}\n${log.slice(-2000)}`;
      break;
    }
  }
} finally {
  stop();
}

if (failure) {
  console.error(`[smoke] ${failure}`);
  process.exit(1);
}

console.log("[smoke] server rendered");

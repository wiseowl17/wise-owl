import type { Plugin } from "vite";
import { defineConfig, loadEnv } from "vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { nitro } from "nitro/vite";
// @ts-expect-error JS plugin alongside the TS vite config
import { grokPwaPlugin } from "./scripts/grok-pwa-plugin.mjs";

/**
 * Serve the Vercel function in `api/studio.ts` from the dev server, so local
 * work runs the same code against the Neon `dev` branch in `.env.local`.
 * On Vercel, `api/studio.ts` is deployed as its own serverless function.
 */
function studioApiPlugin(): Plugin {
  return {
    name: "wise-owl:studio-api",
    apply: "serve",
    configureServer(server) {
      Object.assign(process.env, loadEnv("development", process.cwd(), ""));
      server.middlewares.use(async (req, res, next) => {
        if ((req.url ?? "").split("?")[0] !== "/api/studio") return next();
        try {
          const chunks: Buffer[] = [];
          for await (const chunk of req) chunks.push(chunk as Buffer);
          const headers = new Headers();
          for (const [key, value] of Object.entries(req.headers)) {
            if (typeof value === "string") headers.set(key, value);
          }
          const method = (req.method ?? "GET").toUpperCase();
          const request = new Request(`http://${req.headers.host}${req.url}`, {
            method,
            headers,
            body: method === "GET" || method === "HEAD" ? undefined : Buffer.concat(chunks),
          });
          const mod = (await server.ssrLoadModule("/api/studio.ts")) as Record<
            string,
            ((request: Request) => Promise<Response> | Response) | undefined
          >;
          const handler = mod[method];
          const response = handler
            ? await handler(request)
            : new Response("Method Not Allowed", { status: 405 });
          res.statusCode = response.status;
          response.headers.forEach((value, key) => res.setHeader(key, value));
          res.end(Buffer.from(await response.arrayBuffer()));
        } catch (err) {
          console.error("[studio-api]", err);
          res.statusCode = 500;
          res.setHeader("content-type", "application/json");
          res.end(JSON.stringify({ error: "Dev API crashed. See the terminal." }));
        }
      });
    },
  };
}

// `0.0.0.0:8080` is the live-preview contract — don't change host/port.
export default defineConfig(({ command, isPreview }) => ({
  server: {
    host: "0.0.0.0",
    port: 8080,
    strictPort: true,
  },
  preview: {
    host: "127.0.0.1",
    port: 8081,
    strictPort: true,
  },
  resolve: { tsconfigPaths: true },
  plugins: [
    studioApiPlugin(),
    // PWA head + ?install=1 tutorial page; runs before Start/Nitro.
    grokPwaPlugin(),
    tailwindcss(),
    tanstackStart(),
    ...(command === "build" || isPreview
      ? [
          nitro({
            preset: "vercel",
            // Auto-registers server/middleware/* (the PWA install page +
            // manifest + head-tag middleware). Nitro v3 defaults serverDir to
            // false, so removing this silently unwires /?install=1 on deploys.
            serverDir: "./server",
          }),
        ]
      : []),
    viteReact(),
  ],
}));

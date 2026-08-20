/** Which database backend is active. */
export type DbSource = "neon" | "pglite";

/**
 * Read the Postgres URL at runtime. Use bracket access so Vite/Nitro cannot
 * replace `process.env.DATABASE_URL` with `undefined` at build time.
 */
function readDatabaseUrl(): string | undefined {
  if (typeof process === "undefined") return undefined;
  const env = process.env;
  const value = (
    env["DATABASE_URL"] ||
    env["POSTGRES_URL"] ||
    env["POSTGRES_PRISMA_URL"] ||
    env["NEON_DATABASE_URL"] ||
    ""
  ).trim();
  return value || undefined;
}

export function getDbSource(): DbSource {
  return readDatabaseUrl() ? "neon" : "pglite";
}

/** Snapshot-friendly alias. Prefer `getDbSource()`. */
export const dbSource: DbSource = getDbSource();

/**
 * Minimal shared SQL surface, satisfied by both Neon and PGLite. Both the
 * tagged-template and `.query()` forms resolve to an array of row objects.
 */
export interface Sql {
  <T = Record<string, unknown>>(
    strings: TemplateStringsArray,
    ...values: unknown[]
  ): Promise<T[]>;
  query<T = Record<string, unknown>>(
    text: string,
    params?: unknown[],
  ): Promise<T[]>;
}

const globalRef = globalThis as typeof globalThis & {
  __pgSqlPromise__?: Promise<Sql>;
  __pgliteInstance__?: Promise<import("@electric-sql/pglite").PGlite>;
  __pgliteMigrateChain__?: Promise<void>;
};

const OID_INT8 = 20;
const OID_DATE = 1082;
const OID_INTERVAL = 1186;
const identity = (v: string) => v;

const pgliteParsers = {
  [OID_INT8]: Number,
  [OID_DATE]: identity,
  [OID_INTERVAL]: identity,
};

type Run = <T>(text: string, params: unknown[]) => Promise<T[]>;

function toSql(run: Run): Sql {
  const sql = (async <T = Record<string, unknown>>(
    strings: TemplateStringsArray,
    ...values: unknown[]
  ): Promise<T[]> => {
    let text = strings[0];
    for (let i = 0; i < values.length; i += 1) text += `$${i + 1}${strings[i + 1]}`;
    return run<T>(text, values);
  }) as unknown as Sql;
  sql.query = <T = Record<string, unknown>>(text: string, params: unknown[] = []) =>
    run<T>(text, params);
  return sql;
}

function createNeonSql(): Promise<Sql> {
  globalRef.__pgSqlPromise__ ??= (async () => {
    const connectionString = readDatabaseUrl();
    if (!connectionString) {
      throw new Error("DATABASE_URL is not set.");
    }
    const { Pool, types } = await import("pg");
    types.setTypeParser(OID_INT8, Number);
    types.setTypeParser(OID_DATE, identity);
    types.setTypeParser(OID_INTERVAL, identity);
    const pool = new Pool({ connectionString });
    return toSql(async <T>(text: string, params: unknown[]) => {
      const res = await pool.query(text, params);
      return res.rows as T[];
    });
  })().catch((err) => {
    globalRef.__pgSqlPromise__ = undefined;
    throw err;
  });
  return globalRef.__pgSqlPromise__;
}

function isMissingPgliteAsset(err: unknown) {
  const message = err instanceof Error ? err.message : String(err);
  return (
    message.includes("pglite.data") ||
    message.includes("pglite.wasm") ||
    message.includes("ENOENT")
  );
}

async function loadPgliteFiles(): Promise<{ data: Uint8Array; wasm: Uint8Array }> {
  const { readFile } = await import("node:fs/promises");
  const { join } = await import("node:path");
  const cwd = typeof process !== "undefined" ? process.cwd() : ".";
  const dirs = [
    join(cwd, "public/pglite"),
    join(cwd, "pglite"),
    "/var/task/pglite",
    "/var/task/_libs",
    "/var/task/public/pglite",
    join(cwd, "node_modules/@electric-sql/pglite/dist"),
    "/var/task/node_modules/@electric-sql/pglite/dist",
  ];

  for (const dir of dirs) {
    try {
      const data = await readFile(join(dir, "pglite.data"));
      const wasm = await readFile(join(dir, "pglite.wasm"));
      return { data, wasm };
    } catch {
      /* try the next location */
    }
  }

  const env = typeof process !== "undefined" ? process.env : {};
  const bases = [
    env["VERCEL_PROJECT_PRODUCTION_URL"]
      ? `https://${env["VERCEL_PROJECT_PRODUCTION_URL"]}`
      : "",
    env["VERCEL_URL"] ? `https://${env["VERCEL_URL"]}` : "",
    env["BETTER_AUTH_URL"] ?? "",
  ].filter(Boolean);

  for (const base of bases) {
    try {
      const root = base.replace(/\/$/, "");
      const [dataRes, wasmRes] = await Promise.all([
        fetch(`${root}/pglite/pglite.data`),
        fetch(`${root}/pglite/pglite.wasm`),
      ]);
      if (!dataRes.ok || !wasmRes.ok) continue;
      return {
        data: new Uint8Array(await dataRes.arrayBuffer()),
        wasm: new Uint8Array(await wasmRes.arrayBuffer()),
      };
    } catch {
      /* try the next origin */
    }
  }

  throw new Error("Could not load the embedded database files.");
}

async function openPglite(): Promise<import("@electric-sql/pglite").PGlite> {
  const { PGlite } = await import("@electric-sql/pglite");
  try {
    const pg = new PGlite({ parsers: pgliteParsers });
    await pg.waitReady;
    return pg;
  } catch (err) {
    if (!isMissingPgliteAsset(err)) throw err;
  }

  const { data, wasm } = await loadPgliteFiles();
  const wasmModule = await WebAssembly.compile(wasm as BufferSource);
  const pg = new PGlite({
    parsers: pgliteParsers,
    pgliteWasmModule: wasmModule,
    fsBundle: new Blob([data as BlobPart]),
    dataDir: "memory://",
  });
  await pg.waitReady;
  return pg;
}

async function createPgliteSql(): Promise<Sql> {
  globalRef.__pgliteInstance__ ??= openPglite().catch((err) => {
    globalRef.__pgliteInstance__ = undefined;
    throw err;
  });
  const pg = await globalRef.__pgliteInstance__;

  const migrate = async (): Promise<void> => {
    const migrations = import.meta.glob("/migrations/*.sql", {
      query: "?raw",
      import: "default",
      eager: true,
    }) as Record<string, string>;
    await pg.exec(
      "create table if not exists _migrations (name text primary key, applied_at timestamptz not null default now())",
    );
    const doneRows = await pg.query<{ name: string }>(
      "select name from _migrations",
    );
    const done = new Set(doneRows.rows.map((r) => r.name));
    for (const [path, text] of Object.entries(migrations).sort(([a], [b]) =>
      a.localeCompare(b),
    )) {
      const name = path.split("/").pop() as string;
      if (done.has(name)) continue;
      await pg.transaction(async (tx) => {
        await tx.exec(text);
        await tx.query("insert into _migrations (name) values ($1)", [name]);
      });
    }
  };
  const pass = (globalRef.__pgliteMigrateChain__ ?? Promise.resolve())
    .catch(() => undefined)
    .then(migrate);
  globalRef.__pgliteMigrateChain__ = pass;
  await pass;

  return toSql(async <T>(text: string, params: unknown[]) => {
    const result = await pg.query<T>(text, params);
    return result.rows;
  });
}

let sqlPromise: Promise<Sql> | null = null;

async function createSql(): Promise<Sql> {
  if (typeof window !== "undefined") {
    throw new Error(
      "@/lib/db is server-only — call getSql() from a createServerFn handler " +
        "or a server route loader, never from client code.",
    );
  }
  return getDbSource() === "neon" ? createNeonSql() : createPgliteSql();
}

export function getSql(): Promise<Sql> {
  sqlPromise ??= createSql().catch((err) => {
    sqlPromise = null;
    throw err;
  });
  return sqlPromise;
}

export async function getPglite(): Promise<import("@electric-sql/pglite").PGlite> {
  if (getDbSource() !== "pglite") {
    throw new Error("getPglite() is only available on the PGLite fallback (no DATABASE_URL)");
  }
  await getSql();
  const pg = await globalRef.__pgliteInstance__;
  if (!pg) throw new Error("PGLite instance failed to initialize");
  return pg;
}

export function ensureDbReady(): Promise<void> {
  if (getDbSource() !== "pglite") return Promise.resolve();
  return getSql()
    .then(() => undefined)
    .catch((err) => {
      console.error("[db] ensureDbReady failed:", err);
    });
}

const globalBoot = globalThis as typeof globalThis & {
  __pgBootstrapPromise__?: Promise<void>;
};
const onServerless = Boolean(
  typeof process !== "undefined" &&
    (process.env["VERCEL"] ||
      process.env["AWS_LAMBDA_FUNCTION_NAME"] ||
      process.env["LAMBDA_TASK_ROOT"]),
);
// Preview only. On Vercel, wait until a route actually queries so a missing
// wasm file cannot take down the public site at import time.
if (typeof window === "undefined" && getDbSource() === "pglite" && !onServerless) {
  globalBoot.__pgBootstrapPromise__ ??= ensureDbReady().catch((err) => {
    globalBoot.__pgBootstrapPromise__ = undefined;
    console.error("[db] PGLite bootstrap failed:", err);
    throw err;
  });
}

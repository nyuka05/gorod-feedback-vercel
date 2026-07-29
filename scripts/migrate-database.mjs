import { createHash } from "node:crypto";
import { readdir, readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { createClient } from "@libsql/client";
import { config } from "dotenv";

config({ path: ".env.local", quiet: true });
config({ quiet: true });

const url = process.env.TURSO_DATABASE_URL?.trim();
const authToken = process.env.TURSO_AUTH_TOKEN?.trim();
if (!url || !authToken) {
  throw new Error("Set TURSO_DATABASE_URL and TURSO_AUTH_TOKEN before running migrations.");
}

const client = createClient({ url, authToken });
const migrationsDirectory = resolve("drizzle");

await client.execute(`CREATE TABLE IF NOT EXISTS app_migrations (
  name TEXT PRIMARY KEY,
  checksum TEXT NOT NULL,
  applied_at TEXT NOT NULL
)`);

const files = (await readdir(migrationsDirectory))
  .filter((name) => name.endsWith(".sql"))
  .sort();

for (const name of files) {
  const sql = await readFile(resolve(migrationsDirectory, name), "utf8");
  const checksum = createHash("sha256").update(sql).digest("hex");
  const applied = await client.execute({
    sql: "SELECT checksum FROM app_migrations WHERE name = ?",
    args: [name],
  });

  if (applied.rows.length > 0) {
    if (applied.rows[0].checksum !== checksum) {
      throw new Error(`Migration ${name} was changed after it had been applied.`);
    }
    console.log(`skip ${name}`);
    continue;
  }

  const statements = sql
    .split("--> statement-breakpoint")
    .map((statement) => statement.trim())
    .filter(Boolean);
  await client.batch([
    ...statements.map((statement) => ({ sql: statement, args: [] })),
    {
      sql: "INSERT INTO app_migrations (name, checksum, applied_at) VALUES (?, ?, ?)",
      args: [name, checksum, new Date().toISOString()],
    },
  ], "write");
  console.log(`applied ${name}`);
}

client.close();

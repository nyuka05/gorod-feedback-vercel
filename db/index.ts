import type { Client, InStatement, InValue } from "@libsql/client";
import { createClient } from "@libsql/client/web";

type Row = Record<string, unknown>;

export class PreparedQuery {
  private readonly args: InValue[];

  constructor(
    private readonly client: Client,
    private readonly sql: string,
    args: InValue[] = [],
  ) {
    this.args = args;
  }

  bind(...args: unknown[]) {
    return new PreparedQuery(this.client, this.sql, args as InValue[]);
  }

  async first<T = Row>(): Promise<T | null> {
    const result = await this.client.execute(this.statement());
    return (result.rows[0] as T | undefined) ?? null;
  }

  async all<T = Row>(): Promise<{ results: T[] }> {
    const result = await this.client.execute(this.statement());
    return { results: result.rows as unknown as T[] };
  }

  async run() {
    return this.client.execute(this.statement());
  }

  statement(): InStatement {
    return { sql: this.sql, args: this.args };
  }
}

export type Database = {
  prepare(sql: string): PreparedQuery;
  batch(statements: PreparedQuery[]): Promise<unknown>;
};

let client: Client | null = null;
let database: Database | null = null;

function getClient() {
  if (client) return client;

  const configuredUrl = process.env.TURSO_DATABASE_URL?.trim();
  if (!configuredUrl) {
    throw new Error("TURSO_DATABASE_URL is required.");
  }

  client = createClient({
    url: configuredUrl,
    authToken: process.env.TURSO_AUTH_TOKEN?.trim() || undefined,
  });
  return client;
}

export function getDatabase(): Database {
  if (database) return database;
  const libsql = getClient();
  database = {
    prepare: (sql) => new PreparedQuery(libsql, sql),
    batch: async (statements) => libsql.batch(statements.map((statement) => statement.statement()), "write"),
  };
  return database;
}

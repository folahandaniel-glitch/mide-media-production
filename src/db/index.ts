import { createClient, type Client } from "@libsql/client";
import { drizzle, type LibSQLDatabase } from "drizzle-orm/libsql";
import * as schema from "./schema";

export const LOCAL_DB_URL = "file:./data/local.db";

export function databaseConfig() {
  return {
    url: process.env.DATABASE_URL || LOCAL_DB_URL,
    authToken: process.env.DATABASE_AUTH_TOKEN || undefined,
  };
}

type Db = LibSQLDatabase<typeof schema> & { $client: Client };

const globalForDb = globalThis as unknown as { __mmpDb?: Db };

function create(): Db {
  const client = createClient(databaseConfig());
  return drizzle(client, { schema });
}

export const db: Db = globalForDb.__mmpDb ?? create();
if (process.env.NODE_ENV !== "production") globalForDb.__mmpDb = db;

export { schema };

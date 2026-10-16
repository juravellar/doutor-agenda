// Fails the production build when the database lacks a column the code
// selects. Migrations are applied by hand (see the README), and deploying
// code before its migration takes every page that reads the new column down.
// A failed build keeps the previous deployment live instead.
//
// Runs only on Vercel production builds, or with CHECK_DB_SCHEMA=1.
import { fileURLToPath } from "node:url";

import pg from "pg";

import { snapshotColumns } from "./snapshot-columns.mjs";

if (process.env.VERCEL_ENV !== "production" && !process.env.CHECK_DB_SCHEMA) {
  process.exit(0);
}

const expected = snapshotColumns(
  fileURLToPath(new URL("../drizzle", import.meta.url)),
);

// An unreachable database fails the build within seconds instead of leaving
// it hanging until the platform's build timeout.
const client = new pg.Client({
  connectionString: process.env.DATABASE_URL,
  connectionTimeoutMillis: 15_000,
  query_timeout: 15_000,
});
await client.connect();
const { rows } = await client.query(
  `select table_name || '.' || column_name as column
     from information_schema.columns
    where table_schema = 'public'`,
);
await client.end();

const present = new Set(rows.map((row) => row.column));
const missing = expected.filter((column) => !present.has(column));
if (missing.length > 0) {
  console.error(
    `The database is missing ${missing.length} column(s) the code uses:\n` +
      missing.map((column) => `  - ${column}`).join("\n") +
      "\nApply the pending migrations in drizzle/ before deploying.",
  );
  process.exit(1);
}
console.log(`Database schema OK (${expected.length} columns checked).`);

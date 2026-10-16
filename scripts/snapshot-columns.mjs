import { readFileSync } from "node:fs";
import { join } from "node:path";

// Every "table.column" in the latest drizzle-kit snapshot, i.e. the schema
// the code expects once all migrations in drizzle/ are applied.
export const snapshotColumns = (drizzleDir) => {
  const journal = JSON.parse(
    readFileSync(join(drizzleDir, "meta", "_journal.json"), "utf8"),
  );
  const latest = journal.entries.at(-1).idx;
  const snapshot = JSON.parse(
    readFileSync(
      join(
        drizzleDir,
        "meta",
        `${String(latest).padStart(4, "0")}_snapshot.json`,
      ),
      "utf8",
    ),
  );
  return Object.values(snapshot.tables).flatMap((table) =>
    Object.keys(table.columns).map((column) => `${table.name}.${column}`),
  );
};

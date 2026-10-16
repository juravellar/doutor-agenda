import { readFileSync } from "node:fs";
import { join } from "node:path";

// The latest drizzle-kit snapshot, i.e. the schema the code expects once all
// migrations in drizzle/ are applied.
const latestSnapshot = (drizzleDir) => {
  const journal = JSON.parse(
    readFileSync(join(drizzleDir, "meta", "_journal.json"), "utf8"),
  );
  const latest = journal.entries.at(-1).idx;
  return JSON.parse(
    readFileSync(
      join(
        drizzleDir,
        "meta",
        `${String(latest).padStart(4, "0")}_snapshot.json`,
      ),
      "utf8",
    ),
  );
};

// Every "table.column" of the snapshot.
export const snapshotColumns = (drizzleDir) =>
  Object.values(latestSnapshot(drizzleDir).tables).flatMap((table) =>
    Object.keys(table.columns).map((column) => `${table.name}.${column}`),
  );

// Every index and unique constraint of the snapshot, by name. Postgres backs
// unique constraints with an index of the same name.
export const snapshotIndexes = (drizzleDir) =>
  Object.values(latestSnapshot(drizzleDir).tables).flatMap((table) => [
    ...Object.keys(table.indexes ?? {}),
    ...Object.keys(table.uniqueConstraints ?? {}),
  ]);

import { is } from "drizzle-orm";
import { getTableConfig, PgTable } from "drizzle-orm/pg-core";
import { describe, expect, it } from "vitest";

import { snapshotColumns } from "../../scripts/snapshot-columns.mjs";
import * as schema from "./schema";

// The build checks the production database against the latest drizzle-kit
// snapshot, so a schema change without a generated migration would slip
// through it.
describe("drizzle snapshot", () => {
  it("has every column of the schema (run drizzle-kit generate after a change)", () => {
    const schemaColumns = Object.values(schema)
      .filter((value) => is(value, PgTable))
      .flatMap((table) => {
        const { name, columns } = getTableConfig(table);
        return columns.map((column) => `${name}.${column.name}`);
      });

    expect(snapshotColumns("drizzle").sort()).toEqual(schemaColumns.sort());
  });
});

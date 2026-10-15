import { describe, expect, it } from "vitest";

import { loggableError } from "./action-errors";

describe("loggableError", () => {
  it("keeps no query parameters from a failed Drizzle query", () => {
    const pgError = Object.assign(
      new Error('duplicate key value violates unique constraint "x"'),
      {
        code: "23505",
        constraint: "patients_email_unique",
        routine: "_bt_check_unique",
        detail: "Key (email)=(maria@exemplo.com) already exists.",
      },
    );
    const error = new Error(
      "Failed query: insert into patients ...\nparams: Maria Silva,maria@exemplo.com,11999999999,female",
      { cause: pgError },
    );
    error.name = "DrizzleQueryError";

    const logged = loggableError(error);

    expect(logged).toEqual({
      name: "DrizzleQueryError",
      code: "23505",
      constraint: "patients_email_unique",
      routine: "_bt_check_unique",
    });
    expect(JSON.stringify(logged)).not.toContain("maria");
  });

  it("logs only the class of other errors", () => {
    expect(
      loggableError(new TypeError("Maria Silva is not a function")),
    ).toEqual({
      name: "TypeError",
      code: undefined,
      constraint: undefined,
      routine: undefined,
    });
    expect(loggableError("Maria")).toEqual({ name: "string" });
  });
});

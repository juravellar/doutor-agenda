// Thrown by server actions when the message is meant for the user; any other
// error reaches the client as SERVER_ERROR_MESSAGE.
export class UserFacingError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "UserFacingError";
  }
}

export const SERVER_ERROR_MESSAGE = "Não foi possível concluir a operação.";

// Shows messages the server chose to expose (such as plan limits) and falls
// back to the form's own message for everything else.
export const actionErrorMessage = (
  error: { serverError?: string },
  fallback: string,
) =>
  error.serverError && error.serverError !== SERVER_ERROR_MESSAGE
    ? error.serverError
    : fallback;

// What is safe to log about an unexpected error. Never its message: Drizzle
// writes the failed query's parameters into it (patient names, emails,
// phones), and Postgres puts the offending values in its own message and
// detail. Only the error class and the database's codes are kept.
export const loggableError = (error: unknown) => {
  if (!(error instanceof Error)) {
    return { name: typeof error };
  }
  const cause = error.cause as
    | { code?: unknown; constraint?: unknown; routine?: unknown }
    | undefined;
  const source = typeof cause === "object" && cause ? cause : error;
  const field = (value: unknown) =>
    typeof value === "string" ? value : undefined;
  return {
    name: error.name,
    code: field((source as { code?: unknown }).code),
    constraint: field((source as { constraint?: unknown }).constraint),
    routine: field((source as { routine?: unknown }).routine),
  };
};

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

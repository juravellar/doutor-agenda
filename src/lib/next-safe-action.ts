import { createSafeActionClient } from "next-safe-action";

import { SERVER_ERROR_MESSAGE, UserFacingError } from "./action-errors";

export const actionClient = createSafeActionClient({
  handleServerError(error) {
    if (error instanceof UserFacingError) {
      return error.message;
    }
    console.error("Action error:", error.message);
    return SERVER_ERROR_MESSAGE;
  },
});

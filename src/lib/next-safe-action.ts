import { createSafeActionClient } from "next-safe-action";

import {
  loggableError,
  SERVER_ERROR_MESSAGE,
  UserFacingError,
} from "./action-errors";

export const actionClient = createSafeActionClient({
  handleServerError(error) {
    if (error instanceof UserFacingError) {
      return error.message;
    }
    console.error("Action error:", loggableError(error));
    return SERVER_ERROR_MESSAGE;
  },
});

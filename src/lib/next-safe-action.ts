import { createSafeActionClient } from "next-safe-action";

import { SERVER_ERROR_MESSAGE } from "./action-errors";
import { PlanLimitError } from "./plan-limits";

export const actionClient = createSafeActionClient({
  handleServerError(error) {
    if (error instanceof PlanLimitError) {
      return error.message;
    }
    console.error("Action error:", error.message);
    return SERVER_ERROR_MESSAGE;
  },
});

// Copy into your implementation and adjust import location.
import { CallbackDecisionProvider } from "../../src/index.js";
export const provider = new CallbackDecisionProvider(
  "your-versioned-provider",
  async (input) => {
    // Connect a model, external service or hybrid policy; validate and map its evidence.
    throw new Error("Implement decision transport; never silently fall back");
  },
);

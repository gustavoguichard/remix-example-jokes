import type { Result } from "remix-domains";
import { errorMessagesFor } from "remix-domains";

function fieldHasErrors(result: Result | undefined, field: string): boolean {
  return Boolean(fieldFirstMessage(result, field));
}

function fieldFirstMessage(
  result: Result | undefined,
  field: string
): string | undefined {
  return result ? errorMessagesFor(result.inputErrors, field)[0] : undefined;
}

export { fieldHasErrors, fieldFirstMessage };

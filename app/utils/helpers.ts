import type { ErrorResult } from "remix-domains";

export const errorByName = (data: ErrorResult | undefined, name: string) =>
  data?.inputErrors.find(({ path }) => path.includes(name));

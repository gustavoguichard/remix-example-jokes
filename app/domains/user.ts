import { makeDomainFunction } from "remix-domains";
import { z } from "zod";

const enforceUser = makeDomainFunction(z.object({ id: z.string().nonempty() }))(
  async () => ({})
);

export { enforceUser };

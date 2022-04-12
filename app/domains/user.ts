import { makeDomainFunction } from "remix-domains";
import { z } from "zod";
import { db } from "~/utils/db.server";
import bcrypt from "bcryptjs";

const enforceUser = makeDomainFunction(z.object({ id: z.string().nonempty() }))(
  async () => ({})
);

const registrationSchema = z.object({
  username: z.string().min(3, "Usernames must be at least 3 characters long"),
  password: z.string().min(6, "Passwords must be at least 6 characters long"),
  redirectTo: z
    .string()
    .optional()
    .default("/jokes")
    .refine((val = "/jokes") => {
      return ["/jokes", "/", "https://remix.run"].includes(val);
    }),
});

const login = makeDomainFunction(registrationSchema)(
  async ({ username, password, redirectTo }) => {
    const user = await db.user.findUnique({
      where: { username },
    });
    if (!user) throw new Error("User not found");
    const isCorrectPassword = await bcrypt.compare(password, user.passwordHash);
    if (!isCorrectPassword) throw new Error("Incorrect password");
    return { id: user.id, username, redirectTo };
  }
);

const register = makeDomainFunction(registrationSchema)(
  async ({ username, password, redirectTo }) => {
    if (await db.user.findFirst({ where: { username } }))
      throw new Error(`User with username ${username} already exists`);

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await db.user.create({
      data: { username, passwordHash },
    });
    return { id: user.id, username, redirectTo };
  }
);

export { register, login, enforceUser };

import { InputError, makeDomainFunction } from "remix-domains";
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
  loginType: z.preprocess(
    (val) => val ?? "login",
    z.enum(["login", "register"])
  ),
});

const signInSignUp = makeDomainFunction(registrationSchema)(
  async ({ username, password, redirectTo, loginType }) => {
    let user = await db.user.findUnique({
      where: { username },
    });
    if (loginType === "register") {
      if (user)
        throw new InputError(
          `User with username ${username} already exists`,
          "username"
        );
      const passwordHash = await bcrypt.hash(password, 10);
      user = await db.user.create({ data: { username, passwordHash } });
      return { id: user.id, username, redirectTo };
    }

    if (!user) throw new InputError("User not found", "username");
    const isCorrectPassword = await bcrypt.compare(password, user.passwordHash);
    if (!isCorrectPassword)
      throw new InputError("Incorrect password", "password");
    return { id: user.id, username, redirectTo };
  }
);

export { signInSignUp, enforceUser };

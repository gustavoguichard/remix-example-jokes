import { makeDomainFunction } from "remix-domains";
import { z } from "zod";
import { db } from "~/utils/db.server";

const userIdSchema = z.string().nonempty();
const findRSSJokes = makeDomainFunction(
  z.any(),
  z.object({ host: z.string().nonempty() })
)(async (_i, { host }) => {
  const protocol = host.includes("localhost") ? "http" : "https";
  const domain = `${protocol}://${host}`;
  const jokes = await db.joke.findMany({
    take: 100,
    orderBy: { createdAt: "desc" },
    include: { jokester: { select: { username: true } } },
  });
  return { jokes, jokesUrl: `${domain}/jokes` };
});

const listUserJokes = makeDomainFunction(
  z.any(),
  userIdSchema
)(async (_i, id) => ({
  user: await db.user.findUnique({
    where: { id },
    select: { id: true, username: true },
  }),
  jokes: await db.joke.findMany({
    take: 5,
    select: { id: true, name: true },
    where: { jokesterId: id },
    orderBy: { createdAt: "desc" },
  }),
}));

const jokeSchema = z.object({
  name: z.string().min(2, `That joke's name is too short`),
  content: z.string().min(10, "That joke is too short"),
});
const createJoke = makeDomainFunction(
  jokeSchema,
  userIdSchema
)((fields, jokesterId) => db.joke.create({ data: { ...fields, jokesterId } }));

const getRandomJoke = makeDomainFunction(
  z.any(),
  userIdSchema
)(async (_i, jokesterId) => {
  const count = await db.joke.count({ where: { jokesterId } });
  const jokes = await db.joke.findMany({
    take: 1,
    skip: Math.floor(Math.random() * count),
    where: { jokesterId },
  });
  if (jokes.length === 0) throw new Error("No jokes yet!");
  return jokes[0];
});

const getJoke = makeDomainFunction(
  z.object({ jokeId: z.string().nonempty() }),
  userIdSchema
)(async ({ jokeId }, jokesterId) => {
  const joke = await db.joke.findUnique({ where: { id: jokeId } });
  if (!joke) throw new Error("What a joke! Not found.");
  return { joke, isOwner: joke.jokesterId === jokesterId };
});

const deleteJoke = makeDomainFunction(
  z.object({ _method: z.literal("delete") }),
  z.object({ jokesterId: userIdSchema, jokeId: z.string().nonempty() })
)(async (_i, { jokeId, jokesterId }) => {
  const joke = await db.joke.findUnique({
    where: { id: jokeId },
  });
  if (!joke) throw new Error("Can't delete what does not exist");
  if (joke.jokesterId !== jokesterId)
    throw new Error("Can't delete what does not exist");

  return db.joke.delete({ where: { id: jokeId } });
});

export { jokeSchema };
export {
  createJoke,
  deleteJoke,
  getJoke,
  getRandomJoke,
  findRSSJokes,
  listUserJokes,
};

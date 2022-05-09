import type {
  ActionFunction,
  LoaderFunction,
  MetaFunction,
} from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { useCatch, useLoaderData, useParams } from "@remix-run/react";

import { getUserId, requireUserId } from "~/utils/session.server";
import { JokeDisplay } from "~/components/joke";
import { deleteJoke, getJoke } from "~/domains/jokes.server";
import type { UnpackData } from "remix-domains";
import { inputFromForm } from "remix-domains";

export const meta: MetaFunction = ({
  data,
}: {
  data: LoaderData | undefined;
}) => {
  if (!data) {
    return {
      title: "No joke",
      description: "No joke found",
    };
  }
  return {
    title: `"${data.joke.name}" joke`,
    description: `Enjoy the "${data.joke.name}" joke and much more`,
  };
};

type LoaderData = UnpackData<typeof getJoke>;
export const loader: LoaderFunction = async ({ request, params }) => {
  const result = await getJoke(params, await getUserId(request));
  if (!result.success) throw new Response("Not found", { status: 404 });

  return json<LoaderData>(result.data);
};

export const action: ActionFunction = async ({ request, params }) => {
  const result = await deleteJoke(await inputFromForm(request), {
    ...params,
    jokesterId: await requireUserId(request),
  });
  if (!result.success) throw new Response("Bad request", { status: 400 });

  return redirect("/jokes");
};

export default function JokeRoute() {
  const data = useLoaderData<LoaderData>();
  return <JokeDisplay joke={data.joke} isOwner={data.isOwner} />;
}

export function CatchBoundary() {
  const caught = useCatch();
  const params = useParams();
  switch (caught.status) {
    case 400: {
      return (
        <div className="error-container">
          What you're trying to do is not allowed.
        </div>
      );
    }
    case 404: {
      return (
        <div className="error-container">
          Huh? What the heck is {params.jokeId}?
        </div>
      );
    }
    case 401: {
      return (
        <div className="error-container">
          Sorry, but {params.jokeId} is not your joke.
        </div>
      );
    }
    default: {
      throw new Error(`Unhandled error: ${caught.status}`);
    }
  }
}

export function ErrorBoundary({ error }: { error: Error }) {
  console.error(error);

  const { jokeId } = useParams();
  return (
    <div className="error-container">
      There was an error loading joke by the id {jokeId}. Sorry.
    </div>
  );
}

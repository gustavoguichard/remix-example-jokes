import type { LoaderFunction } from "@remix-run/node";
import { json } from "@remix-run/node";
import { Link, useCatch, useLoaderData } from "@remix-run/react";
import type { UnpackData } from "remix-domains";
import { getRandomJoke } from "~/domains/jokes";

import { getUserId } from "~/utils/session.server";

type LoaderData = UnpackData<typeof getRandomJoke>;
export const loader: LoaderFunction = async ({ request }) => {
  const result = await getRandomJoke(null, await getUserId(request));
  if (!result.success) {
    throw new Response("No jokes to be found!", { status: 404 });
  }
  return json<LoaderData>(result.data);
};

export default function JokesIndexRoute() {
  const data = useLoaderData<LoaderData>();

  return (
    <div>
      <p>Here's a random joke:</p>
      <p>{data.content}</p>
      <Link to={data.id}>"{data.name}" Permalink</Link>
    </div>
  );
}

export function CatchBoundary() {
  const caught = useCatch();

  if (caught.status === 404) {
    return (
      <div className="error-container">
        <p>
          There are no jokes to display.
          <br />
          <small>
            Note: this is the deployed version of the jokes app example and
            because we don't want to show you unmoderated content, we only
            display jokes you create in this version.
          </small>
        </p>
        <Link to="new">Add your own</Link>
      </div>
    );
  }
  throw new Error(`Unexpected caught response with status: ${caught.status}`);
}

export function ErrorBoundary({ error }: { error: Error }) {
  console.error(error);
  return <div>I did a whoopsies.</div>;
}

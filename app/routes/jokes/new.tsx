import type { ActionFunction, LoaderFunction } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { Link, useCatch, useTransition } from "@remix-run/react";
import type { UnpackData } from "remix-domains";
import { inputFromFormData } from "remix-domains";

import { JokeDisplay } from "~/components/joke";
import { createJoke, jokeSchema } from "~/domains/jokes";
import { enforceUser } from "~/domains/user";
import { getUserId } from "~/utils/session.server";
import Form from "~/components/form";
import { performMutation } from "remix-forms";

export const loader: LoaderFunction = async ({ request }) => {
  const result = await enforceUser({ id: await getUserId(request) });
  if (!result.success) {
    throw new Response("Unauthorized", { status: 401 });
  }
  return json<UnpackData<typeof enforceUser>>(result.data);
};

export const action: ActionFunction = async ({ request }) => {
  const result = await performMutation({
    request,
    schema: jokeSchema,
    mutation: createJoke,
  });
  if (!result.success) return json(result, { status: 400 });
  return redirect(`/jokes/${result.data.id}?redirectTo=/jokes/new`);
};

export default function NewJokeRoute() {
  const transition = useTransition();

  if (transition.submission?.formData) {
    const joke = inputFromFormData(transition.submission.formData);
    if (jokeSchema.safeParse(joke).success) {
      return <JokeDisplay joke={joke} isOwner={true} canDelete={false} />;
    }
  }

  return (
    <div>
      <p>Add your own hilarious joke</p>
      <Form schema={jokeSchema} multiline={["content"]}>
        {({ Field, Errors, Button }) => (
          <>
            <Field name="name" label="Name:" />
            <Field name="content" label="Content:" />
            <div>
              <Button>Add</Button>
            </div>
          </>
        )}
      </Form>
    </div>
  );
}

export function CatchBoundary() {
  const caught = useCatch();

  if (caught.status === 401) {
    return (
      <div className="error-container">
        <p>You must be logged in to create a joke.</p>
        <Link to="/login?redirectTo=/jokes/new">Login</Link>
      </div>
    );
  }

  throw new Error(`Unexpected caught response with status: ${caught.status}`);
}

export function ErrorBoundary({ error }: { error: Error }) {
  console.error(error);
  return <div>Something unexpected went wrong. Sorry about that.</div>;
}

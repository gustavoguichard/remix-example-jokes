import type { ActionFunction, LoaderFunction } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import {
  Form,
  Link,
  useActionData,
  useCatch,
  useTransition,
} from "@remix-run/react";
import type { ErrorResult, UnpackData } from "remix-domains";
import { inputFromForm } from "remix-domains";

import { JokeDisplay } from "~/components/joke";
import { createJoke, jokeSchema } from "~/domains/jokes";
import { enforceUser } from "~/domains/user";
import { errorByName } from "~/utils/helpers";
import { getUserId } from "~/utils/session.server";

export const loader: LoaderFunction = async ({ request }) => {
  const result = await enforceUser({ id: await getUserId(request) });
  if (!result.success) {
    throw new Response("Unauthorized", { status: 401 });
  }
  return json<UnpackData<typeof enforceUser>>(result.data);
};

type ActionData = ErrorResult & {
  fields: {
    name: string;
    content: string;
  };
};
const badRequest = (data: ActionData) => json(data, { status: 400 });
export const action: ActionFunction = async ({ request }) => {
  const fields = await inputFromForm(request);
  const result = await createJoke(fields, await getUserId(request));
  if (!result.success) {
    return badRequest({ ...result, fields });
  }
  return redirect(`/jokes/${result.data.id}?redirectTo=/jokes/new`);
};

export default function NewJokeRoute() {
  const actionData = useActionData<ActionData>();
  const transition = useTransition();

  if (transition.submission?.formData) {
    const joke = Object.fromEntries(transition.submission.formData);
    if (jokeSchema.safeParse(joke).success) {
      return (
        <JokeDisplay
          joke={joke as unknown as UnpackData<typeof createJoke>}
          isOwner={true}
          canDelete={false}
        />
      );
    }
  }

  return (
    <div>
      <p>Add your own hilarious joke</p>
      <Form method="post">
        <div>
          <label>
            Name:{" "}
            <input
              type="text"
              defaultValue={actionData?.fields.name}
              name="name"
              aria-invalid={Boolean(errorByName(actionData, "name"))}
              aria-errormessage={
                errorByName(actionData, "name") ? "name-error" : undefined
              }
            />
          </label>
          {errorByName(actionData, "name") ? (
            <p className="form-validation-error" role="alert" id="name-error">
              {errorByName(actionData, "name")!.message}
            </p>
          ) : null}
        </div>
        <div>
          <label>
            Content:{" "}
            <textarea
              defaultValue={actionData?.fields.content}
              name="content"
              aria-invalid={Boolean(errorByName(actionData, "content"))}
              aria-errormessage={
                errorByName(actionData, "content") ? "content-error" : undefined
              }
            />
          </label>
          {errorByName(actionData, "content") ? (
            <p
              className="form-validation-error"
              role="alert"
              id="content-error"
            >
              {errorByName(actionData, "content")!.message}
            </p>
          ) : null}
        </div>
        <div>
          {actionData?.errors.length ? (
            <p className="form-validation-error" role="alert">
              {actionData.errors[0].message}
            </p>
          ) : null}
          <button type="submit" className="button">
            Add
          </button>
        </div>
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

import type { ActionArgs, LinksFunction, MetaFunction } from "@remix-run/node";
import { json } from "@remix-run/node";
import { Form, Link, useActionData } from "@remix-run/react";

import { createUserSession } from "~/utils/session.server";
import stylesUrl from "../styles/login.css";
import { inputFromForm } from "remix-domains";
import { signInSignUp } from "~/domains/user.server";
import { fieldFirstMessage, fieldHasErrors } from "~/utils/helpers";

export const meta: MetaFunction = () => {
  return {
    title: "Remix Jokes | Login",
    description: "Login to submit your own jokes to Remix Jokes!",
  };
};

export const links: LinksFunction = () => {
  return [{ rel: "stylesheet", href: stylesUrl }];
};

export async function action({ request }: ActionArgs) {
  const fields = await inputFromForm(request);
  const result = await signInSignUp(fields);
  if (!result.success) return json({ ...result, fields }, { status: 400 });

  return createUserSession(result.data.id, result.data.redirectTo);
}

export default function Login() {
  const actionData = useActionData<typeof action>();
  return (
    <div className="container">
      <div className="content" data-light="">
        <h1>Login</h1>
        <Form method="post">
          <fieldset>
            <legend className="sr-only">Login or Register?</legend>
            <label>
              <input
                type="radio"
                name="loginType"
                value="login"
                defaultChecked={
                  !actionData?.fields?.loginType ||
                  actionData?.fields?.loginType === "login"
                }
              />{" "}
              Login
            </label>
            <label>
              <input
                type="radio"
                name="loginType"
                value="register"
                defaultChecked={actionData?.fields?.loginType === "register"}
              />{" "}
              Register
            </label>
          </fieldset>
          <div>
            <label htmlFor="username-input">Username</label>
            <input
              type="text"
              id="username-input"
              name="username"
              defaultValue={actionData?.fields?.username}
              aria-invalid={fieldHasErrors(actionData, "username")}
              aria-errormessage={
                fieldHasErrors(actionData, "username")
                  ? "username-error"
                  : undefined
              }
            />
            {fieldHasErrors(actionData, "username") ? (
              <p
                className="form-validation-error"
                role="alert"
                id="username-error"
              >
                {fieldFirstMessage(actionData, "username")}
              </p>
            ) : null}
          </div>
          <div>
            <label htmlFor="password-input">Password</label>
            <input
              id="password-input"
              name="password"
              defaultValue={actionData?.fields?.password}
              type="password"
              aria-invalid={fieldHasErrors(actionData, "password")}
              aria-errormessage={
                fieldHasErrors(actionData, "password")
                  ? "password-error"
                  : undefined
              }
            />
            {fieldHasErrors(actionData, "password") ? (
              <p
                className="form-validation-error"
                role="alert"
                id="password-error"
              >
                {fieldFirstMessage(actionData, "password")}
              </p>
            ) : null}
          </div>
          <div id="form-error-message">
            {actionData?.errors.length ? (
              <p className="form-validation-error" role="alert">
                {actionData.errors.map(({ message }) => message).join(", ")}
              </p>
            ) : null}
          </div>
          <button type="submit" className="button">
            Submit
          </button>
        </Form>
      </div>
      <div className="links">
        <ul>
          <li>
            <Link to="/">Home</Link>
          </li>
          <li>
            <Link to="/jokes">Jokes</Link>
          </li>
        </ul>
      </div>
    </div>
  );
}

import type {
  ActionFunction,
  LinksFunction,
  MetaFunction,
} from "@remix-run/node";
import { json } from "@remix-run/node";
import { Form, Link, useActionData } from "@remix-run/react";

import { createUserSession } from "~/utils/session.server";
import stylesUrl from "../styles/login.css";
import type { ErrorResult } from "remix-domains";
import { inputFromUrl } from "remix-domains";
import { formatErrors } from "remix-domains";
import { inputFromForm } from "remix-domains";
import { login, register } from "~/domains/user";

export const meta: MetaFunction = () => {
  return {
    title: "Remix Jokes | Login",
    description: "Login to submit your own jokes to Remix Jokes!",
  };
};

export const links: LinksFunction = () => {
  return [{ rel: "stylesheet", href: stylesUrl }];
};

const errorByName = (data: ErrorResult | undefined, name: string) =>
  data?.inputErrors.find(({ path }) => path.includes(name));

type ActionData = ErrorResult & {
  fields?: { loginType: string; username: string; password: string };
};

/**
 * This helper function gives us typechecking for our ActionData return
 * statements, while still returning the accurate HTTP status, 400 Bad Request,
 * to the client.
 */
const badRequest = (data: ActionData) => json(data, { status: 400 });
export const action: ActionFunction = async ({ request }) => {
  const fields = await inputFromForm(request);
  if (!["register", "login"].includes(fields.loginType))
    return badRequest({
      success: false,
      fields,
      errors: [{ message: `Login type invalid` }],
      inputErrors: [],
    });

  const func = fields.loginType === "login" ? login : register;
  const result = await func(fields, inputFromUrl(request));
  if (!result.success) return badRequest({ ...result, fields });

  return createUserSession(result.data.id, result.data.redirectTo);
};

export default function Login() {
  const actionData = useActionData<ActionData>();
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
              aria-invalid={Boolean(errorByName(actionData, "username"))}
              aria-errormessage={
                errorByName(actionData, "username")
                  ? "username-error"
                  : undefined
              }
            />
            {errorByName(actionData, "username") ? (
              <p
                className="form-validation-error"
                role="alert"
                id="username-error"
              >
                {errorByName(actionData, "username")?.message}
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
              aria-invalid={Boolean(errorByName(actionData, "password"))}
              aria-errormessage={
                errorByName(actionData, "password")
                  ? "password-error"
                  : undefined
              }
            />
            {errorByName(actionData, "password") ? (
              <p
                className="form-validation-error"
                role="alert"
                id="password-error"
              >
                {errorByName(actionData, "password")?.message}
              </p>
            ) : null}
          </div>
          <div id="form-error-message">
            {actionData?.errors.length ? (
              <p className="form-validation-error" role="alert">
                {formatErrors(actionData).error}
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

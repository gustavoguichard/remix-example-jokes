import type {
  ActionFunction,
  LinksFunction,
  MetaFunction,
} from "@remix-run/node";
import { json } from "@remix-run/node";
import { Link, useActionData } from "@remix-run/react";

import { createUserSession } from "~/utils/session.server";
import stylesUrl from "../styles/login.css";
import { registrationSchema, signInSignUp } from "~/domains/user";
import Form from "~/components/form";
import { PerformMutation, performMutation } from "remix-forms";

export const meta: MetaFunction = () => {
  return {
    title: "Remix Jokes | Login",
    description: "Login to submit your own jokes to Remix Jokes!",
  };
};

export const links: LinksFunction = () => {
  return [{ rel: "stylesheet", href: stylesUrl }];
};

export const action: ActionFunction = async ({ request }) => {
  const result = await performMutation({
    request,
    schema: registrationSchema,
    mutation: signInSignUp,
  });
  if (!result.success) return json(result, { status: 400 });

  return createUserSession(result.data.id, result.data.redirectTo);
};

export default function Login() {
  const actionData = useActionData();
  console.log(actionData);
  return (
    <div className="container">
      <div className="content" data-light="">
        <h1>Login</h1>
        <Form schema={registrationSchema} hiddenFields={["redirectTo"]}>
          {({ Field, Errors, Button }) => (
            <>
              <Field name="loginType">
                {({ Errors }) => (
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
                        defaultChecked={
                          actionData?.fields?.loginType === "register"
                        }
                      />{" "}
                      Register
                    </label>
                    <Errors />
                  </fieldset>
                )}
              </Field>
              <Field name="username" />
              <Field name="password">
                {({ Label, SmartInput, Errors }) => (
                  <>
                    <Label />
                    <SmartInput type="password" />
                    <Errors />
                  </>
                )}
              </Field>
              <Errors />
              <Button>Submit</Button>
            </>
          )}
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

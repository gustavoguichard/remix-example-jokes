import type { LinksFunction, LoaderFunction } from "@remix-run/node";
import { json } from "@remix-run/node";
import { Form, Link, Outlet, useLoaderData } from "@remix-run/react";
import type { UnpackResult } from "remix-domains";
import { listUserJokes } from "~/domains/jokes";
import { getUserId, logout } from "~/utils/session.server";

import stylesUrl from "../styles/jokes.css";

type LoaderData = UnpackResult<typeof listUserJokes>;
export const loader: LoaderFunction = async ({ request }) => {
  const result = await listUserJokes(null, await getUserId(request));
  if (result.errors.length) throw logout(request);

  return json<LoaderData>(result);
};

export const links: LinksFunction = () => {
  return [{ rel: "stylesheet", href: stylesUrl }];
};

export default function JokesScreen() {
  const result = useLoaderData<LoaderData>();
  const user = result.success ? result.data.user : null;
  const jokes = result.success ? result.data.jokes : [];

  return (
    <div className="jokes-layout">
      <header className="jokes-header">
        <div className="container">
          <h1 className="home-link">
            <Link to="/" title="Remix Jokes" aria-label="Remix Jokes">
              <span className="logo">🤪</span>
              <span className="logo-medium">J🤪KES</span>
            </Link>
          </h1>
          {user ? (
            <div className="user-info">
              <span>{`Hi ${user.username}`}</span>
              <Form action="/logout" method="post">
                <button type="submit" className="button">
                  Logout
                </button>
              </Form>
            </div>
          ) : (
            <Link to="/login">Login</Link>
          )}
        </div>
      </header>
      <main className="jokes-main">
        <div className="container">
          <div className="jokes-list">
            {jokes.length ? (
              <>
                <Link to=".">Get a random joke</Link>
                <p>Here are a few more jokes to check out:</p>
                <ul>
                  {jokes.map(({ id, name }) => (
                    <li key={id}>
                      <Link to={id} prefetch="intent">
                        {name}
                      </Link>
                    </li>
                  ))}
                </ul>
                <Link to="new" className="button">
                  Add your own
                </Link>
              </>
            ) : null}
          </div>
          <div className="jokes-outlet">
            <Outlet />
          </div>
        </div>
      </main>
      <footer className="jokes-footer">
        <div className="container">
          <Link reloadDocument to="/jokes.rss">
            RSS
          </Link>
        </div>
      </footer>
    </div>
  );
}

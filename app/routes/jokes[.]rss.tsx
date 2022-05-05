import type { LoaderFunction } from "@remix-run/node";
import { findRSSJokes } from "~/domains/jokes";

export const loader: LoaderFunction = async ({ request: { headers } }) => {
  const result = await findRSSJokes(null, {
    host: headers.get("X-Forwarded-Host") ?? headers.get("host"),
  });
  if (!result.success) throw new Response("", { status: 503 });

  const { jokes, jokesUrl } = result.data;
  const rssString = `
    <rss xmlns:blogChannel="${jokesUrl}" version="2.0">
      <channel>
        <title>Remix Jokes</title>
        <link>${jokesUrl}</link>
        <description>Some funny jokes</description>
        <language>en-us</language>
        <generator>Kody the Koala</generator>
        <ttl>40</ttl>
        ${jokes
          .map((joke) =>
            `
            <item>
              <title>${joke.name}</title>
              <description>A funny joke called ${joke.name}</description>
              <author>${joke.jokester.username}</author>
              <pubDate>${joke.createdAt}</pubDate>
              <link>${jokesUrl}/${joke.id}</link>
              <guid>${jokesUrl}/${joke.id}</guid>
            </item>
          `.trim()
          )
          .join("\n")}
      </channel>
    </rss>
  `.trim();

  return new Response(rssString, {
    headers: {
      "Cache-Control": `public, max-age=${60 * 10}, s-maxage=${60 * 60 * 24}`,
      "Content-Type": "application/xml",
      "Content-Length": String(Buffer.byteLength(rssString)),
    },
  });
};

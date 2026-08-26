import assert from "node:assert/strict";
import test from "node:test";
import { buildOAuth1Authorization, publishXPost } from "../lib/x-api";

const credentials = {
  apiKey: "consumer-key",
  apiSecret: "consumer-secret",
  accessToken: "access-token",
  accessTokenSecret: "access-secret",
  accountUsername: "RealRyanNichols",
};

test("OAuth 1.0a authorization is deterministic and RFC 3986 encoded", () => {
  const header = buildOAuth1Authorization({
    method: "POST",
    url: "https://api.x.com/2/tweets",
    consumerKey: "key with space",
    consumerSecret: "secret&value",
    token: "token/value",
    tokenSecret: "token!secret",
    nonce: "fixed-nonce",
    timestamp: "1787749200",
  });
  assert.equal(
    header,
    'OAuth oauth_consumer_key="key%20with%20space", oauth_nonce="fixed-nonce", oauth_signature="I%2Bn%2F7QJVcLYB3WoH72VXVEQ0w10%3D", oauth_signature_method="HMAC-SHA1", oauth_timestamp="1787749200", oauth_token="token%2Fvalue", oauth_version="1.0"',
  );
});

test("publishXPost sends JSON and returns a canonical status URL", async () => {
  let request: { url: string; init?: RequestInit } | null = null;
  const fakeFetch: typeof fetch = async (url, init) => {
    request = { url: String(url), init };
    return new Response(JSON.stringify({ data: { id: "12345", text: "Update" } }), {
      status: 201,
      headers: { "content-type": "application/json" },
    });
  };

  const result = await publishXPost("Update", credentials, fakeFetch);
  assert.equal(result.url, "https://x.com/RealRyanNichols/status/12345");
  const sentRequest = request as { url: string; init?: RequestInit } | null;
  assert.ok(sentRequest);
  assert.equal(sentRequest.url, "https://api.x.com/2/tweets");
  assert.equal(sentRequest.init?.body, JSON.stringify({ text: "Update" }));
  assert.match(String(new Headers(sentRequest.init?.headers).get("authorization")), /^OAuth /);
});

test("publishXPost refuses text over the X limit before sending", async () => {
  let called = false;
  const fakeFetch: typeof fetch = async () => {
    called = true;
    throw new Error("should not be called");
  };
  await assert.rejects(
    publishXPost("x".repeat(281), credentials, fakeFetch),
    /between 1 and 280/,
  );
  assert.equal(called, false);
});

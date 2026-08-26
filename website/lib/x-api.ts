import crypto from "node:crypto";

const CREATE_POST_URL = "https://api.x.com/2/tweets";

export type XCredentials = {
  apiKey: string;
  apiSecret: string;
  accessToken: string;
  accessTokenSecret: string;
  accountUsername: string;
};

type OAuthInput = {
  method: string;
  url: string;
  consumerKey: string;
  consumerSecret: string;
  token: string;
  tokenSecret: string;
  nonce?: string;
  timestamp?: string;
};

function percentEncode(value: string): string {
  return encodeURIComponent(value).replace(/[!'()*]/g, (character) =>
    `%${character.charCodeAt(0).toString(16).toUpperCase()}`,
  );
}

function compareEncoded(left: string, right: string): number {
  return left < right ? -1 : left > right ? 1 : 0;
}

export function buildOAuth1Authorization(input: OAuthInput): string {
  const parsedUrl = new URL(input.url);
  const baseUrl = `${parsedUrl.protocol}//${parsedUrl.host}${parsedUrl.pathname}`;
  const oauthParams: Record<string, string> = {
    oauth_consumer_key: input.consumerKey,
    oauth_nonce: input.nonce ?? crypto.randomBytes(18).toString("hex"),
    oauth_signature_method: "HMAC-SHA1",
    oauth_timestamp:
      input.timestamp ?? Math.floor(Date.now() / 1000).toString(),
    oauth_token: input.token,
    oauth_version: "1.0",
  };
  const signatureParams = [
    ...Object.entries(oauthParams),
    ...Array.from(parsedUrl.searchParams.entries()),
  ]
    .map(([key, value]) => [percentEncode(key), percentEncode(value)] as const)
    .sort(([leftKey, leftValue], [rightKey, rightValue]) =>
      leftKey === rightKey
        ? compareEncoded(leftValue, rightValue)
        : compareEncoded(leftKey, rightKey),
    )
    .map(([key, value]) => `${key}=${value}`)
    .join("&");
  const signatureBase = [
    input.method.toUpperCase(),
    percentEncode(baseUrl),
    percentEncode(signatureParams),
  ].join("&");
  const signingKey = `${percentEncode(input.consumerSecret)}&${percentEncode(
    input.tokenSecret,
  )}`;
  const signature = crypto
    .createHmac("sha1", signingKey)
    .update(signatureBase)
    .digest("base64");

  return `OAuth ${Object.entries({
    ...oauthParams,
    oauth_signature: signature,
  })
    .sort(([left], [right]) => compareEncoded(left, right))
    .map(([key, value]) => `${percentEncode(key)}="${percentEncode(value)}"`)
    .join(", ")}`;
}

export function getXCredentials(): XCredentials | null {
  const apiKey = process.env.X_API_KEY?.trim();
  const apiSecret = process.env.X_API_SECRET?.trim();
  const accessToken = process.env.X_ACCESS_TOKEN?.trim();
  const accessTokenSecret = process.env.X_ACCESS_TOKEN_SECRET?.trim();
  if (!apiKey || !apiSecret || !accessToken || !accessTokenSecret) return null;

  return {
    apiKey,
    apiSecret,
    accessToken,
    accessTokenSecret,
    accountUsername:
      process.env.X_ACCOUNT_USERNAME?.trim().replace(/^@/, "") ||
      "RealRyanNichols",
  };
}

export async function publishXPost(
  text: string,
  credentials: XCredentials,
  fetchImpl: typeof fetch = fetch,
): Promise<{ id: string; text: string; url: string }> {
  const body = text.trim();
  if (!body || body.length > 280) {
    throw new Error("X post text must contain between 1 and 280 characters.");
  }

  const response = await fetchImpl(CREATE_POST_URL, {
    method: "POST",
    headers: {
      authorization: buildOAuth1Authorization({
        method: "POST",
        url: CREATE_POST_URL,
        consumerKey: credentials.apiKey,
        consumerSecret: credentials.apiSecret,
        token: credentials.accessToken,
        tokenSecret: credentials.accessTokenSecret,
      }),
      "content-type": "application/json",
    },
    body: JSON.stringify({ text: body }),
    signal: AbortSignal.timeout(15_000),
  });

  const payload = (await response.json().catch(() => null)) as
    | { data?: { id?: string; text?: string }; detail?: string; title?: string }
    | null;
  if (!response.ok || !payload?.data?.id) {
    const detail = payload?.detail || payload?.title || `HTTP ${response.status}`;
    throw new Error(`X API rejected the post: ${detail}`);
  }

  return {
    id: payload.data.id,
    text: payload.data.text || body,
    url: `https://x.com/${credentials.accountUsername}/status/${payload.data.id}`,
  };
}

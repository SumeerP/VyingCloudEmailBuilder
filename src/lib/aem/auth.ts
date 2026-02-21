/**
 * Adobe IMS OAuth Server-to-Server token exchange for AEM OpenAPI.
 * Uses client_credentials grant type to obtain an IMS access token.
 *
 * Required env vars:
 *   AEM_IMS_CLIENT_ID     - from Adobe Developer Console project
 *   AEM_IMS_CLIENT_SECRET - from Adobe Developer Console project
 *   AEM_IMS_SCOPES        - comma-separated scopes (e.g. "aem.folders,aem.sites")
 */

const IMS_TOKEN_ENDPOINT = "https://ims-na1.adobelogin.com/ims/token/v3";

let cachedToken: { accessToken: string; expiresAt: number } | null = null;

export async function getIMSAccessToken(): Promise<string> {
  // Return cached token if still valid (with 5-min buffer)
  if (cachedToken && Date.now() < cachedToken.expiresAt - 5 * 60 * 1000) {
    return cachedToken.accessToken;
  }

  const clientId = process.env.AEM_IMS_CLIENT_ID;
  const clientSecret = process.env.AEM_IMS_CLIENT_SECRET;
  const scopes = process.env.AEM_IMS_SCOPES || "aem.folders,aem.sites";

  if (!clientId || !clientSecret) {
    throw new Error("AEM IMS credentials not configured (AEM_IMS_CLIENT_ID, AEM_IMS_CLIENT_SECRET)");
  }

  const body = new URLSearchParams({
    grant_type: "client_credentials",
    client_id: clientId,
    client_secret: clientSecret,
    scope: scopes,
  });

  const response = await fetch(IMS_TOKEN_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`IMS token exchange failed (${response.status}): ${text}`);
  }

  const data = await response.json();

  cachedToken = {
    accessToken: data.access_token,
    // expires_in is in seconds; convert to absolute ms timestamp
    expiresAt: Date.now() + data.expires_in * 1000,
  };

  return cachedToken.accessToken;
}

/**
 * Returns standard headers for AEM OpenAPI requests.
 */
export async function getAEMHeaders(): Promise<Record<string, string>> {
  const token = await getIMSAccessToken();
  return {
    Authorization: `Bearer ${token}`,
    "X-Api-Key": process.env.AEM_IMS_CLIENT_ID!,
    "X-Adobe-Accept-Experimental": "1",
    "Content-Type": "application/json",
  };
}

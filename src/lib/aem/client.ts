/**
 * AEM OpenAPI Content Fragment Management client.
 *
 * Uses the /adobe/sites/cf/ endpoints on the AEM Author service.
 * Base URL: https://author-p{programId}-e{envId}.adobeaemcloud.com
 *
 * Ref: https://developer.adobe.com/experience-cloud/experience-manager-apis/api/stable/sites/
 */

import { getAEMHeaders } from "./auth";

const AEM_AUTHOR_HOST = process.env.AEM_AUTHOR_URL;
// e.g. "https://author-p181502-e1907767.adobeaemcloud.com"

function baseUrl(): string {
  if (!AEM_AUTHOR_HOST) {
    throw new Error("AEM_AUTHOR_URL not configured");
  }
  // Strip trailing slash
  return AEM_AUTHOR_HOST.replace(/\/+$/, "");
}

/** Custom error for AEM environment issues (hibernation, etc.) */
export class AEMEnvironmentError extends Error {
  status: string;
  healthy: string;

  constructor(status: string, healthy: string) {
    const msg =
      healthy === "hibernated"
        ? "AEM environment is hibernated. Please wake it up in Cloud Manager or visit the Author URL in your browser, then wait a few minutes."
        : `AEM environment is unavailable (status: ${status}, healthy: ${healthy}). Check Cloud Manager for details.`;
    super(msg);
    this.name = "AEMEnvironmentError";
    this.status = status;
    this.healthy = healthy;
  }
}

/**
 * Checks if AEM returned an HTML error page (e.g. hibernated env)
 * instead of JSON. Throws AEMEnvironmentError if detected.
 */
async function assertJsonResponse(res: Response, operation: string): Promise<void> {
  const contentType = res.headers.get("content-type") || "";

  // AEM returns text/html when the env is hibernated or unavailable
  if (contentType.includes("text/html")) {
    const html = await res.text();

    // Parse status and healthy from the HTML error page
    const statusMatch = html.match(/status="(\d+)"/);
    const healthyMatch = html.match(/healthy="([^"]+)"/);
    const status = statusMatch?.[1] || String(res.status);
    const healthy = healthyMatch?.[1] || "unknown";

    throw new AEMEnvironmentError(status, healthy);
  }

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`AEM ${operation} failed (${res.status}): ${text}`);
  }
}

// ──────────────────────────────────────────────
// Content Fragment Models
// ──────────────────────────────────────────────

/** List all Content Fragment Models */
export async function listModels(cursor?: string) {
  const headers = await getAEMHeaders();
  const params = new URLSearchParams();
  if (cursor) params.set("cursor", cursor);

  const url = `${baseUrl()}/adobe/sites/cf/models${params.toString() ? "?" + params.toString() : ""}`;
  const res = await fetch(url, { headers });

  await assertJsonResponse(res, "listModels");
  return res.json();
}

/** Get a specific Content Fragment Model */
export async function getModel(modelId: string) {
  const headers = await getAEMHeaders();
  const url = `${baseUrl()}/adobe/sites/cf/models/${modelId}`;
  const res = await fetch(url, { headers });

  await assertJsonResponse(res, "getModel");
  return res.json();
}

// ──────────────────────────────────────────────
// Content Fragments
// ──────────────────────────────────────────────

export interface ListFragmentsParams {
  cursor?: string;
  limit?: number;
  modelId?: string;
  parentPath?: string;
}

/** List Content Fragments, optionally filtered by model or parent folder */
export async function listFragments(params?: ListFragmentsParams) {
  const headers = await getAEMHeaders();
  const qs = new URLSearchParams();
  if (params?.cursor) qs.set("cursor", params.cursor);
  if (params?.limit) qs.set("limit", String(params.limit));
  if (params?.modelId) qs.set("filter", `cq:model eq '${params.modelId}'`);
  if (params?.parentPath) qs.set("parentPath", params.parentPath);

  const url = `${baseUrl()}/adobe/sites/cf/fragments${qs.toString() ? "?" + qs.toString() : ""}`;
  const res = await fetch(url, { headers });

  await assertJsonResponse(res, "listFragments");
  return res.json();
}

/** Get a specific Content Fragment by ID */
export async function getFragment(fragmentId: string) {
  const headers = await getAEMHeaders();
  const url = `${baseUrl()}/adobe/sites/cf/fragments/${fragmentId}`;
  const res = await fetch(url, { headers });

  await assertJsonResponse(res, "getFragment");
  return res.json();
}

export interface CreateFragmentPayload {
  title: string;
  description?: string;
  modelId: string;
  parentPath: string;
  fields: Record<string, unknown>;
}

/** Create a new Content Fragment */
export async function createFragment(payload: CreateFragmentPayload) {
  const headers = await getAEMHeaders();
  const url = `${baseUrl()}/adobe/sites/cf/fragments`;
  const res = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify({
      title: payload.title,
      description: payload.description || "",
      modelId: payload.modelId,
      parentPath: payload.parentPath,
      fields: payload.fields,
    }),
  });

  await assertJsonResponse(res, "createFragment");
  return res.json();
}

export interface UpdateFragmentPayload {
  title?: string;
  description?: string;
  fields?: Record<string, unknown>;
}

/** Update (PATCH) a Content Fragment */
export async function updateFragment(fragmentId: string, payload: UpdateFragmentPayload) {
  const headers = await getAEMHeaders();
  const url = `${baseUrl()}/adobe/sites/cf/fragments/${fragmentId}`;
  const res = await fetch(url, {
    method: "PATCH",
    headers,
    body: JSON.stringify(payload),
  });

  await assertJsonResponse(res, "updateFragment");
  return res.json();
}

/** Delete a Content Fragment */
export async function deleteFragment(fragmentId: string) {
  const headers = await getAEMHeaders();
  const url = `${baseUrl()}/adobe/sites/cf/fragments/${fragmentId}`;
  const res = await fetch(url, {
    method: "DELETE",
    headers,
  });

  await assertJsonResponse(res, "deleteFragment");
  return { success: true };
}

// ──────────────────────────────────────────────
// Fragment Variations
// ──────────────────────────────────────────────

/** List variations for a Content Fragment */
export async function listVariations(fragmentId: string) {
  const headers = await getAEMHeaders();
  const url = `${baseUrl()}/adobe/sites/cf/fragments/${fragmentId}/variations`;
  const res = await fetch(url, { headers });

  await assertJsonResponse(res, "listVariations");
  return res.json();
}

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  listFragments,
  getFragment,
  createFragment,
  updateFragment,
  deleteFragment,
  listVariations,
} from "@/lib/aem/client";

/**
 * AEM OpenAPI Content Fragment Management proxy.
 * Uses /adobe/sites/cf/ endpoints on AEM Author via IMS OAuth S2S.
 * Keeps all Adobe credentials server-side.
 */

async function requireAuth() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");
  return user;
}

// ─── GET: List or fetch fragments ───────────────────────────
export async function GET(request: NextRequest) {
  try {
    await requireAuth();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const fragmentId = searchParams.get("id");
  const modelId = searchParams.get("model");
  const parentPath = searchParams.get("parentPath");
  const variations = searchParams.get("variations"); // "true" to get variations
  const cursor = searchParams.get("cursor") || undefined;
  const limit = searchParams.get("limit");

  // Check if AEM is configured
  if (!process.env.AEM_AUTHOR_URL || !process.env.AEM_IMS_CLIENT_ID) {
    return NextResponse.json({
      items: [],
      message: "AEM not configured. Set AEM_AUTHOR_URL, AEM_IMS_CLIENT_ID, AEM_IMS_CLIENT_SECRET.",
    });
  }

  try {
    // Get variations for a specific fragment
    if (fragmentId && variations === "true") {
      const data = await listVariations(fragmentId);
      return NextResponse.json(data);
    }

    // Get a specific fragment by ID
    if (fragmentId) {
      const data = await getFragment(fragmentId);
      return NextResponse.json(data);
    }

    // List fragments with optional filters
    const data = await listFragments({
      modelId: modelId || undefined,
      parentPath: parentPath || undefined,
      cursor,
      limit: limit ? parseInt(limit, 10) : undefined,
    });
    return NextResponse.json(data);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to fetch from AEM";
    console.error("AEM OpenAPI proxy error:", message);
    return NextResponse.json({ error: message }, { status: 502 });
  }
}

// ─── POST: Create a new fragment ────────────────────────────
export async function POST(request: NextRequest) {
  try {
    await requireAuth();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!process.env.AEM_AUTHOR_URL || !process.env.AEM_IMS_CLIENT_ID) {
    return NextResponse.json({
      success: false,
      message: "AEM not configured.",
    });
  }

  try {
    const body = await request.json();
    const { title, description, modelId, parentPath, fields } = body;

    if (!title || !modelId || !parentPath) {
      return NextResponse.json(
        { error: "title, modelId, and parentPath are required" },
        { status: 400 }
      );
    }

    const data = await createFragment({
      title,
      description,
      modelId,
      parentPath,
      fields: fields || {},
    });
    return NextResponse.json({ success: true, data });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to create fragment";
    console.error("AEM create error:", message);
    return NextResponse.json({ error: message }, { status: 502 });
  }
}

// ─── PATCH: Update a fragment ───────────────────────────────
export async function PATCH(request: NextRequest) {
  try {
    await requireAuth();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!process.env.AEM_AUTHOR_URL || !process.env.AEM_IMS_CLIENT_ID) {
    return NextResponse.json({ success: false, message: "AEM not configured." });
  }

  try {
    const body = await request.json();
    const { fragmentId, title, description, fields } = body;

    if (!fragmentId) {
      return NextResponse.json({ error: "fragmentId is required" }, { status: 400 });
    }

    const data = await updateFragment(fragmentId, { title, description, fields });
    return NextResponse.json({ success: true, data });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to update fragment";
    console.error("AEM update error:", message);
    return NextResponse.json({ error: message }, { status: 502 });
  }
}

// ─── DELETE: Delete a fragment ──────────────────────────────
export async function DELETE(request: NextRequest) {
  try {
    await requireAuth();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!process.env.AEM_AUTHOR_URL || !process.env.AEM_IMS_CLIENT_ID) {
    return NextResponse.json({ success: false, message: "AEM not configured." });
  }

  try {
    const { searchParams } = new URL(request.url);
    const fragmentId = searchParams.get("id");

    if (!fragmentId) {
      return NextResponse.json({ error: "id query parameter is required" }, { status: 400 });
    }

    await deleteFragment(fragmentId);
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to delete fragment";
    console.error("AEM delete error:", message);
    return NextResponse.json({ error: message }, { status: 502 });
  }
}

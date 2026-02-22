import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createFragment, updateFragment, AEMEnvironmentError } from "@/lib/aem/client";

/**
 * AEM OpenAPI Content Fragment publish/upsert proxy.
 * Creates a new fragment or updates an existing one via the
 * Content Fragment Management OpenAPI (/adobe/sites/cf/).
 */
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!process.env.AEM_AUTHOR_URL || !process.env.AEM_IMS_CLIENT_ID) {
    return NextResponse.json({
      success: false,
      message: "AEM not configured. Set AEM_AUTHOR_URL, AEM_IMS_CLIENT_ID, AEM_IMS_CLIENT_SECRET.",
    });
  }

  try {
    const body = await request.json();
    const { fragmentId, title, description, modelId, parentPath, fields } = body;

    let data;

    if (fragmentId) {
      // Update existing fragment
      data = await updateFragment(fragmentId, {
        title,
        description,
        fields,
      });
    } else {
      // Create new fragment
      if (!title || !modelId || !parentPath) {
        return NextResponse.json(
          { error: "title, modelId, and parentPath are required for new fragments" },
          { status: 400 }
        );
      }
      data = await createFragment({
        title,
        description,
        modelId,
        parentPath,
        fields: fields || {},
      });
    }

    return NextResponse.json({ success: true, data });
  } catch (error: unknown) {
    if (error instanceof AEMEnvironmentError) {
      return NextResponse.json(
        { error: error.message, code: "AEM_UNAVAILABLE", healthy: error.healthy },
        { status: 503 }
      );
    }
    const message = error instanceof Error ? error.message : "Failed to publish to AEM";
    console.error("AEM publish error:", message);
    return NextResponse.json({ error: message }, { status: 502 });
  }
}

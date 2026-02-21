import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { listModels, getModel } from "@/lib/aem/client";

/**
 * AEM OpenAPI Content Fragment Models proxy.
 * Lists or fetches CF Models via /adobe/sites/cf/models.
 */
export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!process.env.AEM_AUTHOR_URL || !process.env.AEM_IMS_CLIENT_ID) {
    return NextResponse.json({
      items: [],
      message: "AEM not configured. Set AEM_AUTHOR_URL, AEM_IMS_CLIENT_ID, AEM_IMS_CLIENT_SECRET.",
    });
  }

  const { searchParams } = new URL(request.url);
  const modelId = searchParams.get("id");
  const cursor = searchParams.get("cursor") || undefined;

  try {
    if (modelId) {
      const data = await getModel(modelId);
      return NextResponse.json(data);
    }

    const data = await listModels(cursor);
    return NextResponse.json(data);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to fetch models";
    console.error("AEM models error:", message);
    return NextResponse.json({ error: message }, { status: 502 });
  }
}

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const AEM_AUTHOR_URL = process.env.AEM_AUTHOR_URL;
const AEM_TOKEN = process.env.AEM_TOKEN;

/**
 * AEM Content Fragment proxy — fetches fragments from AEM Author instance.
 * This runs as a Vercel Edge-compatible API route, keeping AEM credentials server-side.
 */
export async function GET(request: NextRequest) {
  // Verify authentication
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const model = searchParams.get("model");
  const path = searchParams.get("path");

  if (!AEM_AUTHOR_URL || !AEM_TOKEN) {
    // Return mock data when AEM is not configured
    return NextResponse.json({
      items: [],
      message: "AEM not configured. Using built-in fragments.",
    });
  }

  try {
    let aemUrl: string;
    if (path) {
      // Fetch specific fragment
      aemUrl = `${AEM_AUTHOR_URL}/api/assets${path}.json`;
    } else if (model) {
      // List fragments by model
      aemUrl = `${AEM_AUTHOR_URL}/api/assets.json?path=/content/dam&property=cq:model&property.value=${model}`;
    } else {
      return NextResponse.json({ error: "model or path parameter required" }, { status: 400 });
    }

    const response = await fetch(aemUrl, {
      headers: {
        Authorization: `Bearer ${AEM_TOKEN}`,
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: `AEM returned ${response.status}` },
        { status: response.status || 502 }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("AEM proxy error:", error);
    return NextResponse.json(
      { error: "Failed to fetch from AEM" },
      { status: 502 }
    );
  }
}

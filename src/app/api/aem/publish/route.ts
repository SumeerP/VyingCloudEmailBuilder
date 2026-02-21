import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const AEM_AUTHOR_URL = process.env.AEM_AUTHOR_URL;
const AEM_TOKEN = process.env.AEM_TOKEN;

/**
 * AEM Content Fragment publish proxy — creates/updates fragments in AEM.
 */
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!AEM_AUTHOR_URL || !AEM_TOKEN) {
    return NextResponse.json({
      success: false,
      message: "AEM not configured. Fragment not published.",
    });
  }

  try {
    const body = await request.json();
    const { path, model, data: fragmentData, title } = body;

    const response = await fetch(
      `${AEM_AUTHOR_URL}/api/assets${path}`,
      {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${AEM_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          class: "asset/fragment",
          properties: {
            title,
            "cq:model": model,
            elements: fragmentData,
          },
        }),
      }
    );

    if (!response.ok) {
      return NextResponse.json(
        { error: `AEM returned ${response.status}` },
        { status: 502 }
      );
    }

    const result = await response.json();
    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    console.error("AEM publish error:", error);
    return NextResponse.json(
      { error: "Failed to publish to AEM" },
      { status: 502 }
    );
  }
}

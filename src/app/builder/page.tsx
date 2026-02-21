import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import BuilderClient from "./builder-client";

export const dynamic = "force-dynamic";

export default async function BuilderPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  // Fetch user profile + org data
  const { data: profile } = await supabase
    .from("user_profiles")
    .select("*, organizations(*)")
    .eq("id", user.id)
    .single();

  // Fetch default brand kit
  const { data: brandKit } = await supabase
    .from("brand_kits")
    .select("config")
    .eq("org_id", profile?.org_id)
    .eq("is_default", true)
    .single();

  // Fetch content blocks
  const { data: blocks } = await supabase
    .from("content_blocks")
    .select("*")
    .eq("org_id", profile?.org_id)
    .order("created_at", { ascending: false });

  const initialBlocks = (blocks || []).map((b) => ({
    id: b.id,
    name: b.name,
    desc: b.description,
    cat: b.category,
    tags: b.tags,
    comps: b.components,
    createdAt: b.created_at,
  }));

  return (
    <BuilderClient
      user={{ id: user.id, email: user.email! }}
      orgId={profile?.org_id}
      initialBrand={brandKit?.config || null}
      initialBlocks={initialBlocks}
    />
  );
}

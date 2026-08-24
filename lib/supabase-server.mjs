import { createClient } from "@supabase/supabase-js";

export function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    throw new Error("Supabase server configuration is missing.");
  }

  return createClient(url, serviceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

export async function getUserFromRequest(req, admin = getSupabaseAdmin()) {
  const header = req.headers.get("authorization");
  if (!header?.startsWith("Bearer ")) {
    return { user: null, error: "Unauthorized" };
  }

  const token = header.slice(7);
  const { data, error } = await admin.auth.getUser(token);
  return {
    user: data?.user || null,
    error: error?.message || null,
  };
}

export async function requireAdmin(req, admin = getSupabaseAdmin()) {
  const { user, error } = await getUserFromRequest(req, admin);
  if (!user) return { user: null, profile: null, error: error || "Unauthorized" };

  const { data: profile, error: profileError } = await admin
    .from("profiles")
    .select("id,is_admin")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError || profile?.is_admin !== true) {
    return { user, profile: null, error: "Admin access required" };
  }

  return { user, profile, error: null };
}

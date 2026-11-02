import { supabase } from "@/integrations/supabase/client";
import { redirect } from "@tanstack/react-router";

export const STAFF_ROLES = ["admin", "manager", "staff"] as const;

/**
 * Reads the signed-in user's own role rows through the RLS own-read policy
 * on user_roles (no admin client, no RPC needed).
 */
export async function fetchMyRole(): Promise<string | null> {
  const { data, error } = await supabase.from("user_roles").select("role");
  if (error) return null;
  const roles = (data ?? []) as { role: string }[];
  for (const r of roles) {
    if (STAFF_ROLES.includes(r.role as (typeof STAFF_ROLES)[number])) return r.role;
  }
  return roles.length > 0 ? "customer" : null;
}

/** beforeLoad guard for staff-only routes; guests are sent to their own reservations. */
export async function requireStaff() {
  const role = await fetchMyRole();
  if (!STAFF_ROLES.includes(role as (typeof STAFF_ROLES)[number])) {
    throw redirect({ to: "/my-reservations" });
  }
}

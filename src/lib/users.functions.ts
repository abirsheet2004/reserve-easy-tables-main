import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { STAFF_ROLES } from "@/lib/booking";

export type ManagedUser = {
  id: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  created_at: string;
  reservations: number;
};

/**
 * Staff-only directory of registered guests. Verifies the caller's role through
 * the user_roles own-read policy (RLS) before reading staff-visible profile data.
 */
export const listManagedUsers = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<ManagedUser[]> => {
    const { data: roles } = await context.supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", context.userId);
    const isStaff = (roles ?? []).some((r) => STAFF_ROLES.includes(r.role as string));
    if (!isStaff) throw new Error("Only staff can view the user directory.");

    const [profilesRes, reservationsRes] = await Promise.all([
      context.supabase
        .from("profiles")
        .select("id,full_name,email,phone,created_at")
        .order("created_at", { ascending: false }),
      context.supabase.from("reservations").select("customer_id"),
    ]);

    if (profilesRes.error) throw profilesRes.error;
    if (reservationsRes.error) throw reservationsRes.error;

    const counts = new Map<string, number>();
    for (const r of reservationsRes.data ?? [])
      counts.set(r.customer_id, (counts.get(r.customer_id) ?? 0) + 1);

    return (profilesRes.data ?? []).map((p) => ({
      id: p.id,
      full_name: p.full_name,
      email: p.email,
      phone: p.phone,
      created_at: p.created_at,
      reservations: counts.get(p.id) ?? 0,
    }));
  });

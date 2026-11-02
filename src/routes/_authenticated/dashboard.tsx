import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  CalendarCheck,
  Users,
  Table2,
  TrendingUp,
  Clock,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Hourglass,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { format, startOfDay, endOfDay, subDays, isAfter } from "date-fns";
import { requireStaff } from "@/lib/role-guard";

export const Route = createFileRoute("/_authenticated/dashboard")({
  beforeLoad: requireStaff,
  head: () => ({
    meta: [
      { title: "Dashboard — Maison Laurent" },
      { name: "description", content: "Live overview of reservations, occupancy, and revenue." },
    ],
  }),
  component: Dashboard,
});

type ResRow = {
  id: string;
  guest_name: string;
  party_size: number;
  status: string;
  starts_at: string;
  created_at?: string;
  restaurant_tables?: { label: string | null; category: string | null } | null;
};

const statusTone: Record<string, string> = {
  pending: "bg-amber-100 text-amber-900 border-amber-200",
  confirmed: "bg-emerald-100 text-emerald-900 border-emerald-200",
  cancelled: "bg-rose-100 text-rose-900 border-rose-200",
  completed: "bg-stone-200 text-stone-800 border-stone-300",
  seated: "bg-sky-100 text-sky-900 border-sky-200",
};

function Dashboard() {
  const { data: stats } = useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: async () => {
      const today = new Date();
      const start = startOfDay(today).toISOString();
      const end = endOfDay(today).toISOString();
      const [tables, resToday, week, recent] = await Promise.all([
        supabase.from("restaurant_tables").select("id,status,capacity"),
        supabase
          .from("reservations")
          .select("*, restaurant_tables(label,category)")
          .gte("starts_at", start)
          .lte("starts_at", end)
          .order("starts_at"),
        supabase
          .from("reservations")
          .select("id,party_size,starts_at,status")
          .gte("starts_at", subDays(today, 6).toISOString()),
        supabase
          .from("reservations")
          .select("*, restaurant_tables(label,category)")
          .order("created_at", { ascending: false })
          .limit(6),
      ]);
      return {
        tables: tables.data ?? [],
        today: (resToday.data ?? []) as ResRow[],
        week: week.data ?? [],
        recent: (recent.data ?? []) as ResRow[],
      };
    },
  });

  const totalTables = stats?.tables.length ?? 0;
  const occupied = stats?.tables.filter((t) => t.status === "occupied").length ?? 0;
  const reservedCount = stats?.tables.filter((t) => t.status === "reserved").length ?? 0;
  const todayRes = stats?.today ?? [];
  const todayGuests = todayRes.reduce((s, r) => s + (r.party_size ?? 0), 0);
  const pendingCount = todayRes.filter((r) => r.status === "pending").length;
  const confirmedCount = todayRes.filter((r) => r.status === "confirmed").length;
  const cancelledCount = todayRes.filter((r) => r.status === "cancelled").length;
  const now = new Date();
  const upcoming = todayRes
    .filter((r) => isAfter(new Date(r.starts_at), now) && r.status !== "cancelled")
    .slice(0, 5);
  const allUpcoming =
    upcoming.length === 0
      ? (stats?.today ?? [])
          .filter((r) => r.status === "confirmed" || r.status === "pending")
          .slice(0, 5)
      : upcoming;

  // 7-day chart
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = subDays(new Date(), 6 - i);
    const key = format(d, "yyyy-MM-dd");
    const label = format(d, "EEE");
    const count =
      stats?.week.filter((r) => format(new Date(r.starts_at), "yyyy-MM-dd") === key).length ?? 0;
    return { day: label, reservations: count };
  });

  const statusPie = [
    {
      name: "Available",
      value: stats?.tables.filter((t) => t.status === "available").length ?? 0,
      color: "var(--color-status-available)",
    },
    { name: "Reserved", value: reservedCount, color: "var(--color-status-reserved)" },
    { name: "Occupied", value: occupied, color: "var(--color-status-occupied)" },
    {
      name: "Cleaning",
      value: stats?.tables.filter((t) => t.status === "cleaning").length ?? 0,
      color: "var(--color-status-cleaning)",
    },
    {
      name: "Maintenance",
      value: stats?.tables.filter((t) => t.status === "maintenance").length ?? 0,
      color: "var(--color-status-maintenance)",
    },
  ].filter((s) => s.value > 0);

  const cards = [
    {
      label: "Reservations today",
      value: todayRes.length,
      icon: CalendarCheck,
      tone: "text-primary",
    },
    { label: "Guests expected", value: todayGuests, icon: Users, tone: "text-accent-foreground" },
    {
      label: "Tables occupied",
      value: `${occupied}/${totalTables}`,
      icon: Table2,
      tone: "text-status-occupied",
    },
    {
      label: "Occupancy",
      value: totalTables
        ? `${Math.round(((occupied + reservedCount) / totalTables) * 100)}%`
        : "0%",
      icon: TrendingUp,
      tone: "text-status-available",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl">Dashboard</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Today, {format(new Date(), "EEEE d MMMM yyyy")}
          </p>
        </div>
        <div className="flex gap-2">
          <Button asChild size="sm">
            <Link to="/book">+ New reservation</Link>
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link to="/reservations">Manage bookings</Link>
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link to="/tables">Tables</Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        {cards.map((c) => (
          <Card key={c.label}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{c.label}</CardTitle>
              <c.icon className={`h-4 w-4 ${c.tone}`} />
            </CardHeader>
            <CardContent>
              <div className="font-display text-3xl">{c.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-3 grid-cols-3">
        {[
          { label: "Pending today", value: pendingCount, icon: Hourglass, tone: "text-amber-600" },
          {
            label: "Confirmed today",
            value: confirmedCount,
            icon: CheckCircle2,
            tone: "text-emerald-600",
          },
          { label: "Cancelled today", value: cancelledCount, icon: XCircle, tone: "text-rose-600" },
        ].map((c) => (
          <Card key={c.label}>
            <CardContent className="flex items-center gap-3 pt-5">
              <c.icon className={`h-5 w-5 ${c.tone}`} />
              <div>
                <div className="font-display text-2xl leading-none">{c.value}</div>
                <div className="text-xs text-muted-foreground mt-1">{c.label}</div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Reservations · last 7 days</CardTitle>
          </CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={days}>
                <XAxis dataKey="day" stroke="var(--color-muted-foreground)" fontSize={12} />
                <YAxis stroke="var(--color-muted-foreground)" fontSize={12} allowDecimals={false} />
                <Tooltip
                  contentStyle={{
                    background: "var(--color-card)",
                    border: "1px solid var(--color-border)",
                    borderRadius: 8,
                  }}
                />
                <Bar dataKey="reservations" fill="var(--color-primary)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Floor status</CardTitle>
          </CardHeader>
          <CardContent className="h-72">
            {statusPie.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusPie}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={3}
                  >
                    {statusPie.map((s, i) => (
                      <Cell key={i} fill={s.color} />
                    ))}
                  </Pie>
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-muted-foreground text-sm">
                No tables yet
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Upcoming today</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="space-y-2">
            {allUpcoming.length === 0 && (
              <p className="text-sm text-muted-foreground">No upcoming reservations today.</p>
            )}
            {allUpcoming.map((r) => (
              <div
                key={r.id}
                className="flex items-center justify-between rounded-md border border-border px-3 py-2"
              >
                <div>
                  <div className="text-sm font-medium">{r.guest_name}</div>
                  <div className="text-xs text-muted-foreground">
                    {format(new Date(r.starts_at), "HH:mm")} · {r.party_size} guests
                    {r.restaurant_tables?.label ? ` · ${r.restaurant_tables.label}` : ""}
                  </div>
                </div>
                <Badge variant="outline" className={statusTone[r.status] ?? ""}>
                  {r.status}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Recent activity</CardTitle>
            <ArrowRight className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="space-y-2">
            {(stats?.recent ?? []).length === 0 && (
              <p className="text-sm text-muted-foreground">No reservations yet.</p>
            )}
            {(stats?.recent ?? []).map((r) => (
              <div
                key={r.id}
                className="flex items-center justify-between rounded-md border border-border px-3 py-2"
              >
                <div>
                  <div className="text-sm font-medium">{r.guest_name}</div>
                  <div className="text-xs text-muted-foreground">
                    {format(new Date(r.starts_at), "EEE d MMM, HH:mm")} · {r.party_size} guests
                  </div>
                </div>
                <Badge variant="outline" className={statusTone[r.status] ?? ""}>
                  {r.status}
                </Badge>
              </div>
            ))}
            {(stats?.recent ?? []).some((r) => r.status === "pending") && (
              <div className="flex items-center gap-2 text-xs text-amber-700 pt-1">
                <AlertCircle className="h-3.5 w-3.5" /> Pending reservations need confirmation in
                Bookings.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

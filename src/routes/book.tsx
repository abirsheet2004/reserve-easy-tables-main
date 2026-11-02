import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { format } from "date-fns";
import { Utensils, Users, CalendarCheck, Loader2, LogIn } from "lucide-react";
import {
  CATEGORY_LABEL,
  SEATING_SLOTS,
  DEFAULT_DURATION_HOURS,
  addHours,
  slotToDate,
  toDateInputValue,
  type TableCategory,
} from "@/lib/booking";

export const Route = createFileRoute("/book")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Book a table — Maison Laurent" },
      {
        name: "description",
        content:
          "Search seating times and reserve your evening at Maison Laurent — window, VIP, family, or outdoor tables.",
      },
      { property: "og:title", content: "Book a table — Maison Laurent" },
      {
        property: "og:description",
        content: "Search availability and reserve your evening at Maison Laurent.",
      },
    ],
  }),
  component: Book,
});

function Book() {
  const navigate = useNavigate();
  const [user, setUser] = useState<{ id: string; email?: string } | null>(null);
  const [profileLoaded, setProfileLoaded] = useState(false);
  const [loading, setLoading] = useState(false);

  const today = toDateInputValue(new Date());
  const [form, setForm] = useState({
    guest_name: "",
    guest_email: "",
    guest_phone: "",
    party_size: 2,
    date: today,
    slot: "19:00",
    duration: String(DEFAULT_DURATION_HOURS),
    category: "any",
    table_id: "",
    special_requests: "",
  });

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) {
        setProfileLoaded(true);
        return;
      }
      setUser({ id: data.user.id, email: data.user.email });
      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name,phone")
        .eq("id", data.user.id)
        .maybeSingle();
      setForm((f) => ({
        ...f,
        guest_name: profile?.full_name ?? "",
        guest_phone: profile?.phone ?? "",
        guest_email: data.user.email ?? "",
      }));
      setProfileLoaded(true);
    });
  }, []);

  const starts = form.date && form.slot ? slotToDate(form.date, form.slot) : null;
  const ends = starts ? addHours(starts, Number(form.duration)) : null;

  // Live availability (Module B) — only for signed-in guests; the RPC is auth-only.
  const { data: available, isFetching: checking } = useQuery({
    queryKey: [
      "book-available",
      form.date,
      form.slot,
      form.duration,
      form.party_size,
      form.category,
      user?.id,
    ],
    enabled: !!user && !!starts && !!ends,
    queryFn: async () => {
      const { data, error } = await supabase.rpc("find_available_tables", {
        _starts_at: starts!.toISOString(),
        _ends_at: ends!.toISOString(),
        _party_size: form.party_size,
        ...(form.category !== "any" ? { _category: form.category as TableCategory } : {}),
      });
      if (error) throw error;
      return (data ?? []) as Array<{
        id: string;
        label: string;
        category: TableCategory;
        capacity: number;
      }>;
    },
  });

  const tableOptions = available ?? [];
  const selectedTableId = tableOptions.some((table) => table.id === form.table_id)
    ? form.table_id
    : "";

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!user) {
      toast.info("Please sign in to complete your booking.");
      navigate({ to: "/auth" });
      return;
    }
    if (!starts || !ends) return;
    setLoading(true);
    const { error } = await supabase.from("reservations").insert({
      customer_id: user.id,
      table_id: selectedTableId || null,
      guest_name: form.guest_name,
      guest_email: form.guest_email || null,
      guest_phone: form.guest_phone || null,
      party_size: form.party_size,
      starts_at: starts.toISOString(),
      ends_at: ends.toISOString(),
      special_requests: form.special_requests || null,
      status: "pending",
    });
    setLoading(false);
    if (error) return toast.error(error.message);
    toast.success("Reservation requested! You'll get an in-app notification when it's confirmed.");
    navigate({ to: "/my-reservations" });
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border">
        <div className="mx-auto max-w-4xl px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 font-display text-lg font-semibold">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground">
              <Utensils className="h-4 w-4" />
            </span>
            Maison Laurent
          </Link>
          {!user && (
            <Button asChild variant="outline" size="sm">
              <Link to="/auth">Sign in</Link>
            </Button>
          )}
        </div>
      </header>

      <div className="mx-auto max-w-3xl px-6 py-12">
        <div className="mb-8">
          <h1 className="font-display text-4xl">Reserve your table</h1>
          <p className="text-muted-foreground mt-2">
            Pick a date and seating time, search live availability, and choose your table.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Booking details</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={submit} className="space-y-5">
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Full name</Label>
                  <Input
                    id="name"
                    required
                    value={form.guest_name}
                    onChange={(e) => setForm({ ...form, guest_name: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={form.guest_phone}
                    onChange={(e) => setForm({ ...form, guest_phone: e.target.value })}
                  />
                </div>
                <div className="sm:col-span-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={form.guest_email}
                    onChange={(e) => setForm({ ...form, guest_email: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="party">Party size</Label>
                  <Input
                    id="party"
                    type="number"
                    min={1}
                    max={20}
                    required
                    value={form.party_size}
                    onChange={(e) => setForm({ ...form, party_size: Number(e.target.value) })}
                  />
                </div>
                <div>
                  <Label htmlFor="duration">Duration (hrs)</Label>
                  <Select
                    value={form.duration}
                    onValueChange={(v) => setForm({ ...form, duration: v })}
                  >
                    <SelectTrigger id="duration">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[1, 2, 3, 4].map((h) => (
                        <SelectItem key={h} value={String(h)}>
                          {h} hour{h > 1 ? "s" : ""}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Search & find: date + seating times */}
              <div className="rounded-lg border border-border bg-secondary/40 p-4 space-y-3">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Search availability
                </p>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="date">Date</Label>
                    <Input
                      id="date"
                      type="date"
                      required
                      min={today}
                      value={form.date}
                      onChange={(e) => setForm({ ...form, date: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="slot">Seating time</Label>
                    <Select value={form.slot} onValueChange={(v) => setForm({ ...form, slot: v })}>
                      <SelectTrigger id="slot">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {SEATING_SLOTS.map((s) => (
                          <SelectItem key={s} value={s}>
                            {s}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <Label>Table category</Label>
                  <Select
                    value={form.category}
                    onValueChange={(v) => setForm({ ...form, category: v, table_id: "" })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="any">Any category</SelectItem>
                      {(Object.keys(CATEGORY_LABEL) as TableCategory[]).map((c) => (
                        <SelectItem key={c} value={c}>
                          {CATEGORY_LABEL[c]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="table">Table</Label>
                  <Select
                    value={selectedTableId}
                    onValueChange={(v) => setForm({ ...form, table_id: v })}
                    disabled={!user || tableOptions.length === 0}
                  >
                    <SelectTrigger>
                      <SelectValue
                        placeholder={
                          !user
                            ? "Sign in to see live availability"
                            : checking
                              ? "Checking availability…"
                              : tableOptions.length === 0
                                ? "No free tables for that time"
                                : "Choose your table"
                        }
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {tableOptions.map((t) => (
                        <SelectItem key={t.id} value={t.id}>
                          <span className="flex items-center gap-2">
                            <span className="capitalize font-medium">{t.label}</span>
                            <span className="text-muted-foreground text-xs">
                              {CATEGORY_LABEL[t.category]}
                            </span>
                            <span className="text-muted-foreground text-xs">
                              <Users className="inline h-3 w-3" /> {t.capacity}
                            </span>
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground mt-1">
                    {user
                      ? "Only genuinely free tables are listed — double bookings are blocked automatically."
                      : "Sign in to check live availability and pick a table."}
                  </p>
                </div>
              </div>

              <div>
                <Label htmlFor="req">Special requests</Label>
                <Textarea
                  id="req"
                  placeholder="Anniversary, seating notes, celebration…"
                  value={form.special_requests}
                  onChange={(e) => setForm({ ...form, special_requests: e.target.value })}
                />
              </div>

              <Button
                type="submit"
                size="lg"
                className="w-full"
                disabled={loading || !profileLoaded}
              >
                {!user ? (
                  <LogIn className="mr-2 h-4 w-4" />
                ) : loading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <CalendarCheck className="mr-2 h-4 w-4" />
                )}
                {user ? "Request reservation" : "Sign in & reserve"}
              </Button>
              {user && (
                <p className="text-xs text-center text-muted-foreground">
                  We'll confirm shortly — you'll be notified in-app. Today is{" "}
                  {format(new Date(), "EEEE d MMMM")}.
                </p>
              )}
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Loader2, CalendarDays, Users, Armchair, CircleCheck } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import {
  STATUS_BADGE,
  STATUS_LABEL,
  CATEGORY_LABEL,
  SEATING_SLOTS,
  DEFAULT_DURATION_HOURS,
  addHours,
  slotToDate,
  toDateInputValue,
  type ReservationStatus,
  type TableCategory,
} from "@/lib/booking";
import { getCurrentUser } from "@/lib/auth-guards";

export const Route = createFileRoute("/_authenticated/my-reservations")({
  head: () => ({
    meta: [
      { title: "My Reservations — Maison Laurent" },
      { name: "description", content: "View, modify, or cancel your table reservations." },
    ],
  }),
  component: MyReservations,
});

type Row = {
  id: string;
  guest_name: string;
  guest_email: string | null;
  guest_phone: string | null;
  party_size: number;
  starts_at: string;
  ends_at: string;
  status: ReservationStatus;
  special_requests: string | null;
  table_id: string | null;
  created_at: string;
  restaurant_tables: { label: string; category: TableCategory } | null;
};

const EDITABLE: ReservationStatus[] = ["pending", "confirmed"];

function MyReservations() {
  const qc = useQueryClient();
  const [details, setDetails] = useState<Row | null>(null);
  const [cancelRow, setCancelRow] = useState<Row | null>(null);
  const [editRow, setEditRow] = useState<Row | null>(null);

  const { data: rows, isLoading } = useQuery({
    queryKey: ["my-reservations"],
    queryFn: async () => {
      const user = await getCurrentUser();
      if (!user) return [] as Row[];
      const { data, error } = await supabase
        .from("reservations")
        .select("*, restaurant_tables(label, category)")
        .eq("customer_id", user.id)
        .order("starts_at", { ascending: false })
        .limit(100);
      if (error) throw error;
      return data as Row[];
    },
  });

  // Generate reminder / seating-time alerts for upcoming confirmed reservations.
  useEffect(() => {
    supabase.rpc("ensure_reservation_alerts").then(() => {
      qc.invalidateQueries({ queryKey: ["my-notifications"] });
    });
  }, [qc]);

  async function cancelReservation(row: Row) {
    const { error } = await supabase
      .from("reservations")
      .update({ status: "cancelled" })
      .eq("id", row.id);
    setCancelRow(null);
    if (error) return toast.error(error.message);
    toast.success("Reservation cancelled");
    qc.invalidateQueries({ queryKey: ["my-reservations"] });
    qc.invalidateQueries({ queryKey: ["my-notifications"] });
  }

  const upcoming = (rows ?? []).filter(
    (r) => EDITABLE.includes(r.status) && new Date(r.starts_at) > new Date(),
  );
  const past = (rows ?? []).filter((r) => !upcoming.includes(r));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="font-display text-3xl">My reservations</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Your booking history and upcoming visits.
          </p>
        </div>
        <Button asChild>
          <Link to="/book">
            <CalendarDays className="mr-2 h-4 w-4" /> Book a table
          </Link>
        </Button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20 text-muted-foreground">
          <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Loading your reservations…
        </div>
      ) : (rows ?? []).length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center space-y-4">
            <Armchair className="h-10 w-10 mx-auto text-muted-foreground/50" />
            <div>
              <p className="font-medium">No reservations yet</p>
              <p className="text-sm text-muted-foreground mt-1">
                Book your first table and it will appear here.
              </p>
            </div>
            <Button asChild>
              <Link to="/book">Reserve a table</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          {upcoming.length > 0 && (
            <section className="space-y-3">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                Upcoming
              </h2>
              <div className="grid gap-3 md:grid-cols-2">
                {upcoming.map((r) => (
                  <ReservationCard
                    key={r.id}
                    row={r}
                    onDetails={() => setDetails(r)}
                    onEdit={() => setEditRow(r)}
                    onCancel={() => setCancelRow(r)}
                  />
                ))}
              </div>
            </section>
          )}
          {past.length > 0 && (
            <section className="space-y-3">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                History
              </h2>
              <div className="grid gap-3 md:grid-cols-2">
                {past.map((r) => (
                  <ReservationCard key={r.id} row={r} onDetails={() => setDetails(r)} />
                ))}
              </div>
            </section>
          )}
        </>
      )}

      <DetailsDialog row={details} onClose={() => setDetails(null)} />
      {editRow && (
        <EditDialog
          row={editRow}
          onClose={() => setEditRow(null)}
          onSaved={() => {
            setEditRow(null);
            qc.invalidateQueries({ queryKey: ["my-reservations"] });
            qc.invalidateQueries({ queryKey: ["my-notifications"] });
          }}
        />
      )}

      <AlertDialog open={!!cancelRow} onOpenChange={(o) => !o && setCancelRow(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel this reservation?</AlertDialogTitle>
            <AlertDialogDescription>
              {cancelRow &&
                `Your table on ${format(new Date(cancelRow.starts_at), "EEE d MMM 'at' HH:mm")} will be cancelled. This cannot be undone.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep reservation</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => cancelRow && cancelReservation(cancelRow)}
            >
              Yes, cancel it
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function ReservationCard({
  row,
  onDetails,
  onEdit,
  onCancel,
}: {
  row: Row;
  onDetails: () => void;
  onEdit?: () => void;
  onCancel?: () => void;
}) {
  const editable = EDITABLE.includes(row.status) && new Date(row.starts_at) > new Date();
  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-base font-semibold">
            {format(new Date(row.starts_at), "EEE d MMM yyyy")}
            <span className="text-muted-foreground font-normal">
              {" "}
              · {format(new Date(row.starts_at), "HH:mm")}
            </span>
          </CardTitle>
          <Badge variant="outline" className={`capitalize ${STATUS_BADGE[row.status]}`}>
            {STATUS_LABEL[row.status]}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <Users className="h-3.5 w-3.5" /> {row.party_size} guests
          </span>
          <span className="inline-flex items-center gap-1">
            <Armchair className="h-3.5 w-3.5" />
            {row.restaurant_tables
              ? `${row.restaurant_tables.label} · ${CATEGORY_LABEL[row.restaurant_tables.category]}`
              : "Table to be assigned"}
          </span>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={onDetails}>
            Details
          </Button>
          {editable && onEdit && (
            <Button size="sm" variant="outline" onClick={onEdit}>
              Modify
            </Button>
          )}
          {editable && onCancel && (
            <Button
              size="sm"
              variant="ghost"
              className="text-destructive hover:text-destructive"
              onClick={onCancel}
            >
              Cancel
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function DetailsDialog({ row, onClose }: { row: Row | null; onClose: () => void }) {
  if (!row) return null;
  const lines: Array<[string, string]> = [
    ["Booking ID", row.id],
    ["Guest name", row.guest_name],
    ["Email", row.guest_email ?? "—"],
    ["Phone", row.guest_phone ?? "—"],
    ["Date", format(new Date(row.starts_at), "EEEE d MMMM yyyy")],
    [
      "Time",
      `${format(new Date(row.starts_at), "HH:mm")} → ${format(new Date(row.ends_at), "HH:mm")}`,
    ],
    ["Party size", String(row.party_size)],
    [
      "Table",
      row.restaurant_tables
        ? `${row.restaurant_tables.label} (${CATEGORY_LABEL[row.restaurant_tables.category]})`
        : "To be assigned",
    ],
    ["Status", STATUS_LABEL[row.status]],
    ["Special requests", row.special_requests ?? "—"],
    ["Booked on", format(new Date(row.created_at), "d MMM yyyy, HH:mm")],
  ];
  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display">Reservation details</DialogTitle>
        </DialogHeader>
        <dl className="space-y-2 text-sm">
          {lines.map(([k, v]) => (
            <div key={k} className="flex justify-between gap-4">
              <dt className="text-muted-foreground shrink-0">{k}</dt>
              <dd className="text-right break-all">{v}</dd>
            </div>
          ))}
        </dl>
      </DialogContent>
    </Dialog>
  );
}

function EditDialog({
  row,
  onClose,
  onSaved,
}: {
  row: Row;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [date, setDate] = useState(toDateInputValue(new Date(row.starts_at)));
  const [slot, setSlot] = useState(format(new Date(row.starts_at), "HH:mm"));
  const [duration, setDuration] = useState(
    String(
      Math.max(
        1,
        Math.round((new Date(row.ends_at).getTime() - new Date(row.starts_at).getTime()) / 3600000),
      ),
    ),
  );
  const [partySize, setPartySize] = useState(row.party_size);
  const [tableId, setTableId] = useState(row.table_id ?? "");
  const [requests, setRequests] = useState(row.special_requests ?? "");
  const [saving, setSaving] = useState(false);

  const starts = date && slot ? slotToDate(date, slot) : null;
  const ends = starts ? addHours(starts, Number(duration)) : null;

  const { data: available, isFetching: checking } = useQuery({
    queryKey: ["edit-available", row.id, date, slot, duration, partySize],
    enabled: !!starts && !!ends,
    queryFn: async () => {
      const { data, error } = await supabase.rpc("find_available_tables", {
        _starts_at: starts!.toISOString(),
        _ends_at: ends!.toISOString(),
        _party_size: partySize,
        _exclude_reservation_id: row.id,
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
  const currentStillFree = !row.table_id ? false : tableOptions.some((t) => t.id === row.table_id);

  async function save() {
    if (!starts || !ends) return;
    setSaving(true);
    const { error } = await supabase
      .from("reservations")
      .update({
        starts_at: starts.toISOString(),
        ends_at: ends.toISOString(),
        party_size: partySize,
        table_id: tableId || null,
        special_requests: requests || null,
      })
      .eq("id", row.id);
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Reservation updated");
    onSaved();
  }

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-display">Modify reservation</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="ed-date">Date</Label>
              <Input
                id="ed-date"
                type="date"
                min={toDateInputValue(new Date())}
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="ed-slot">Seating time</Label>
              <Select value={slot} onValueChange={setSlot}>
                <SelectTrigger id="ed-slot">
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
            <div>
              <Label htmlFor="ed-party">Party size</Label>
              <Input
                id="ed-party"
                type="number"
                min={1}
                max={20}
                value={partySize}
                onChange={(e) => setPartySize(Number(e.target.value))}
              />
            </div>
            <div>
              <Label htmlFor="ed-dur">Duration (hrs)</Label>
              <Input
                id="ed-dur"
                type="number"
                min={1}
                max={6}
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
              />
            </div>
          </div>
          <div>
            <Label>Table</Label>
            <Select value={tableId} onValueChange={setTableId}>
              <SelectTrigger>
                <SelectValue placeholder="Select an available table" />
              </SelectTrigger>
              <SelectContent>
                {checking && (
                  <div className="p-3 text-sm text-muted-foreground">Checking availability…</div>
                )}
                {currentStillFree && row.table_id && (
                  <SelectItem value={row.table_id}>
                    {row.restaurant_tables?.label} (current)
                  </SelectItem>
                )}
                {tableOptions
                  .filter((t) => t.id !== row.table_id)
                  .map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.label} · {CATEGORY_LABEL[t.category]} · seats {t.capacity}
                    </SelectItem>
                  ))}
                {!checking && tableOptions.length === 0 && (
                  <div className="p-3 text-sm text-muted-foreground">
                    No tables available for that time and party size.
                  </div>
                )}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="ed-req">Special requests</Label>
            <Textarea id="ed-req" value={requests} onChange={(e) => setRequests(e.target.value)} />
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <CircleCheck className="h-3.5 w-3.5 text-status-available" /> Double bookings are
            prevented automatically — only genuinely free tables are listed.
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
            <Button onClick={save} disabled={saving || !starts}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Save changes
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

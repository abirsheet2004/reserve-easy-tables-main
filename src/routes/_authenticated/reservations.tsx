import { createFileRoute, Link } from "@tanstack/react-router";
import { requireStaff } from "@/lib/role-guard";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { Loader2, Search, CalendarPlus } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import {
  STATUS_BADGE,
  STATUS_LABEL,
  CATEGORY_LABEL,
  SEATING_SLOTS,
  addHours,
  slotToDate,
  toDateInputValue,
  type ReservationStatus,
  type TableCategory,
} from "@/lib/booking";

export const Route = createFileRoute("/_authenticated/reservations")({
  beforeLoad: requireStaff,
  head: () => ({
    meta: [
      { title: "Booking Management — Maison Laurent" },
      {
        name: "description",
        content: "Search, filter, confirm, modify, and assign every booking.",
      },
    ],
  }),
  component: BookingManagement,
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

function BookingManagement() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [dateFilter, setDateFilter] = useState("");
  const [details, setDetails] = useState<Row | null>(null);
  const [editRow, setEditRow] = useState<Row | null>(null);
  const [cancelRow, setCancelRow] = useState<Row | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const { data: rows, isLoading } = useQuery({
    queryKey: ["reservations-all"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("reservations")
        .select("*, restaurant_tables(label,category)")
        .order("starts_at", { ascending: false })
        .limit(300);
      if (error) throw error;
      return data as Row[];
    },
  });

  const filtered = useMemo(() => {
    return (rows ?? []).filter((r) => {
      const q = search.trim().toLowerCase();
      if (q && !r.guest_name.toLowerCase().includes(q) && !r.id.toLowerCase().includes(q))
        return false;
      if (statusFilter !== "all" && r.status !== statusFilter) return false;
      if (dateFilter && format(new Date(r.starts_at), "yyyy-MM-dd") !== dateFilter) return false;
      return true;
    });
  }, [rows, search, statusFilter, dateFilter]);

  async function setStatus(id: string, status: ReservationStatus) {
    setBusyId(id);
    const { error } = await supabase.from("reservations").update({ status }).eq("id", id);
    setBusyId(null);
    if (error) return toast.error(error.message);
    toast.success("Booking updated");
    qc.invalidateQueries({ queryKey: ["reservations-all"] });
  }

  async function confirmCancel() {
    if (!cancelRow) return;
    await setStatus(cancelRow.id, "cancelled");
    setCancelRow(null);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between flex-wrap gap-4">
        <div>
          <h1 className="font-display text-3xl">Booking management</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Search, confirm, modify, cancel, and assign tables for every booking.
          </p>
        </div>
        <Button asChild>
          <Link to="/book">
            <CalendarPlus className="mr-2 h-4 w-4" />
            New reservation
          </Link>
        </Button>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Guest name or booking ID…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            {(Object.keys(STATUS_LABEL) as ReservationStatus[]).map((s) => (
              <SelectItem key={s} value={s}>
                {STATUS_LABEL[s]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Input
          type="date"
          value={dateFilter}
          onChange={(e) => setDateFilter(e.target.value)}
          aria-label="Filter by date"
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>
            Bookings · {filtered.length}
            {(rows ?? []).length !== filtered.length && ` of ${(rows ?? []).length}`}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12 text-muted-foreground">
              <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Loading bookings…
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Guest</TableHead>
                    <TableHead>Party</TableHead>
                    <TableHead>Date &amp; time</TableHead>
                    <TableHead>Table</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell>
                        <div className="font-medium">{r.guest_name}</div>
                        <div className="text-xs text-muted-foreground">
                          {r.guest_email ?? r.guest_phone ?? "—"}
                        </div>
                      </TableCell>
                      <TableCell>{r.party_size}</TableCell>
                      <TableCell>
                        <div>{format(new Date(r.starts_at), "d MMM · HH:mm")}</div>
                        <div className="text-xs text-muted-foreground">
                          → {format(new Date(r.ends_at), "HH:mm")}
                        </div>
                      </TableCell>
                      <TableCell>
                        {r.restaurant_tables ? (
                          <Badge variant="outline">
                            {r.restaurant_tables.label} ·{" "}
                            {CATEGORY_LABEL[r.restaurant_tables.category]}
                          </Badge>
                        ) : (
                          <span className="text-xs text-muted-foreground">Unassigned</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={`capitalize ${STATUS_BADGE[r.status]}`}>
                          {STATUS_LABEL[r.status]}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="inline-flex flex-wrap justify-end gap-1">
                          <Button size="sm" variant="outline" onClick={() => setDetails(r)}>
                            Details
                          </Button>
                          {r.status === "pending" && (
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={busyId === r.id}
                              onClick={() => setStatus(r.id, "confirmed")}
                            >
                              Confirm
                            </Button>
                          )}
                          {EDITABLE.includes(r.status) && (
                            <Button size="sm" variant="outline" onClick={() => setEditRow(r)}>
                              Modify / assign
                            </Button>
                          )}
                          {(r.status === "confirmed" || r.status === "pending") && (
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={busyId === r.id}
                              onClick={() => setStatus(r.id, "seated")}
                            >
                              Seat
                            </Button>
                          )}
                          {r.status === "seated" && (
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={busyId === r.id}
                              onClick={() => setStatus(r.id, "completed")}
                            >
                              Complete
                            </Button>
                          )}
                          {r.status !== "cancelled" && r.status !== "completed" && (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-destructive hover:text-destructive"
                              onClick={() => setCancelRow(r)}
                            >
                              Cancel
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {filtered.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                        No bookings match your filters.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <DetailsDialog row={details} onClose={() => setDetails(null)} />
      {editRow && (
        <ModifyDialog
          row={editRow}
          onClose={() => setEditRow(null)}
          onSaved={() => {
            setEditRow(null);
            qc.invalidateQueries({ queryKey: ["reservations-all"] });
          }}
        />
      )}

      <AlertDialog open={!!cancelRow} onOpenChange={(o) => !o && setCancelRow(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel this booking?</AlertDialogTitle>
            <AlertDialogDescription>
              {cancelRow &&
                `${cancelRow.guest_name}'s table on ${format(new Date(cancelRow.starts_at), "EEE d MMM 'at' HH:mm")} will be cancelled and the guest notified in-app.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep booking</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={confirmCancel}
            >
              Yes, cancel it
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
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
        : "Unassigned",
    ],
    ["Status", STATUS_LABEL[row.status]],
    ["Special requests", row.special_requests ?? "—"],
    ["Booked on", format(new Date(row.created_at), "d MMM yyyy, HH:mm")],
  ];
  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display">Booking details</DialogTitle>
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

function ModifyDialog({
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
    queryKey: ["admin-available", row.id, date, slot, duration, partySize],
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

  const currentStillFree = row.table_id
    ? (available ?? []).some((t) => t.id === row.table_id)
    : false;

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
    toast.success("Booking updated — the guest has been notified");
    onSaved();
  }

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-display">Modify booking · {row.guest_name}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="bm-date">Date</Label>
              <Input
                id="bm-date"
                type="date"
                min={toDateInputValue(new Date())}
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="bm-slot">Seating time</Label>
              <Select value={slot} onValueChange={setSlot}>
                <SelectTrigger id="bm-slot">
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
              <Label htmlFor="bm-party">Party size</Label>
              <Input
                id="bm-party"
                type="number"
                min={1}
                max={20}
                value={partySize}
                onChange={(e) => setPartySize(Number(e.target.value))}
              />
            </div>
            <div>
              <Label htmlFor="bm-dur">Duration (hrs)</Label>
              <Input
                id="bm-dur"
                type="number"
                min={1}
                max={6}
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
              />
            </div>
          </div>
          <div>
            <Label>Assign table</Label>
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
                {(available ?? [])
                  .filter((t) => t.id !== row.table_id)
                  .map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.label} · {CATEGORY_LABEL[t.category]} · seats {t.capacity}
                    </SelectItem>
                  ))}
                {!checking && (available ?? []).length === 0 && (
                  <div className="p-3 text-sm text-muted-foreground">
                    No tables free for that time and party size.
                  </div>
                )}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground mt-1">
              Only genuinely free tables are listed — double bookings are blocked by the database.
            </p>
          </div>
          <div>
            <Label htmlFor="bm-req">Special requests</Label>
            <Input id="bm-req" value={requests} onChange={(e) => setRequests(e.target.value)} />
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

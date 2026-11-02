import { createFileRoute } from "@tanstack/react-router";
import { requireStaff } from "@/lib/role-guard";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
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
import { Loader2, Plus, Users, Pencil, Trash2, Armchair } from "lucide-react";
import { toast } from "sonner";
import {
  CATEGORY_LABEL,
  TABLE_STATUS_LABEL,
  type TableCategory,
  type TableStatus,
} from "@/lib/booking";

export const Route = createFileRoute("/_authenticated/tables")({
  beforeLoad: requireStaff,
  head: () => ({
    meta: [
      { title: "Table Management — Maison Laurent" },
      {
        name: "description",
        content: "Add, edit, and manage restaurant tables, capacity, and availability.",
      },
    ],
  }),
  component: TablesManagement,
});

type TableRow = {
  id: string;
  label: string;
  capacity: number;
  category: TableCategory;
  status: TableStatus;
  notes: string | null;
};

const statusColors: Record<TableStatus, string> = {
  available: "bg-status-available",
  reserved: "bg-status-reserved",
  occupied: "bg-status-occupied",
  cleaning: "bg-status-cleaning",
  maintenance: "bg-status-maintenance",
};

type FormState = {
  label: string;
  capacity: number;
  category: TableCategory;
  status: TableStatus;
  notes: string;
};
const emptyForm: FormState = {
  label: "",
  capacity: 2,
  category: "standard",
  status: "available",
  notes: "",
};

function TablesManagement() {
  const qc = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<TableRow | null>(null);
  const [deleting, setDeleting] = useState<TableRow | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [saving, setSaving] = useState(false);

  const { data: tables, isLoading } = useQuery({
    queryKey: ["tables-all"],
    queryFn: async () => {
      const { data, error } = await supabase.from("restaurant_tables").select("*").order("label");
      if (error) throw error;
      return data as TableRow[];
    },
  });

  // Live updates for the floor.
  useEffect(() => {
    const ch = supabase
      .channel("tables-manage")
      .on("postgres_changes", { event: "*", schema: "public", table: "restaurant_tables" }, () => {
        qc.invalidateQueries({ queryKey: ["tables-all"] });
      })
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, [qc]);

  function openAdd() {
    setEditing(null);
    setForm(emptyForm);
    setDialogOpen(true);
  }

  function openEdit(t: TableRow) {
    setEditing(t);
    setForm({
      label: t.label,
      capacity: t.capacity,
      category: t.category,
      status: t.status,
      notes: t.notes ?? "",
    });
    setDialogOpen(true);
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const payload = {
      label: form.label.trim(),
      capacity: form.capacity,
      category: form.category,
      status: form.status,
      notes: form.notes || null,
    };
    const { error } = editing
      ? await supabase.from("restaurant_tables").update(payload).eq("id", editing.id)
      : await supabase.from("restaurant_tables").insert(payload);
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success(editing ? "Table updated" : "Table added");
    setDialogOpen(false);
    qc.invalidateQueries({ queryKey: ["tables-all"] });
  }

  async function remove() {
    if (!deleting) return;
    const { error } = await supabase.from("restaurant_tables").delete().eq("id", deleting.id);
    setDeleting(null);
    if (error) return toast.error(error.message);
    toast.success("Table deleted");
    qc.invalidateQueries({ queryKey: ["tables-all"] });
  }

  async function updateStatus(id: string, status: TableStatus) {
    const { error } = await supabase.from("restaurant_tables").update({ status }).eq("id", id);
    if (error) toast.error(error.message);
    else toast.success("Status updated");
  }

  const counts = (tables ?? []).reduce<Record<string, number>>((acc, t) => {
    acc[t.status] = (acc[t.status] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between flex-wrap gap-4">
        <div>
          <h1 className="font-display text-3xl">Table management</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Add, edit, and keep every table's capacity, category, and availability up to date.
          </p>
        </div>
        <Button onClick={openAdd}>
          <Plus className="mr-2 h-4 w-4" /> Add table
        </Button>
      </div>

      <div className="flex gap-2 flex-wrap">
        {(Object.keys(TABLE_STATUS_LABEL) as TableStatus[]).map((s) => (
          <Badge key={s} variant="outline" className="gap-2">
            <span className={`h-2 w-2 rounded-full ${statusColors[s]}`} />
            {TABLE_STATUS_LABEL[s]} · {counts[s] ?? 0}
          </Badge>
        ))}
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20 text-muted-foreground">
          <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Loading tables…
        </div>
      ) : (tables ?? []).length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center space-y-4">
            <Armchair className="h-10 w-10 mx-auto text-muted-foreground/50" />
            <p className="font-medium">No tables yet</p>
            <p className="text-sm text-muted-foreground">
              Add your first table to start taking reservations.
            </p>
            <Button onClick={openAdd}>
              <Plus className="mr-2 h-4 w-4" /> Add table
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {(tables ?? []).map((t) => (
            <Card key={t.id} className="overflow-hidden">
              <div className={`h-1.5 ${statusColors[t.status]}`} />
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between gap-2">
                  <CardTitle className="font-display text-2xl">{t.label}</CardTitle>
                  <Badge variant="secondary" className="capitalize">
                    {CATEGORY_LABEL[t.category]}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Users className="h-4 w-4" /> Seats {t.capacity}
                </div>
                {t.notes && <p className="text-xs text-muted-foreground line-clamp-2">{t.notes}</p>}
                <Select
                  value={t.status}
                  onValueChange={(v) => updateStatus(t.id, v as TableStatus)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(Object.keys(TABLE_STATUS_LABEL) as TableStatus[]).map((s) => (
                      <SelectItem key={s} value={s}>
                        <span className="flex items-center gap-2">
                          <span className={`h-2 w-2 rounded-full ${statusColors[s]}`} />
                          {TABLE_STATUS_LABEL[s]}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1"
                    onClick={() => openEdit(t)}
                  >
                    <Pencil className="mr-1 h-3.5 w-3.5" /> Edit
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-destructive hover:text-destructive"
                    onClick={() => setDeleting(t)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Add / edit dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display">
              {editing ? `Edit table ${editing.label}` : "Add a table"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={save} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="t-label">Label</Label>
                <Input
                  id="t-label"
                  required
                  placeholder="e.g. T7"
                  value={form.label}
                  onChange={(e) => setForm({ ...form, label: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="t-cap">Capacity</Label>
                <Input
                  id="t-cap"
                  type="number"
                  min={1}
                  max={30}
                  required
                  value={form.capacity}
                  onChange={(e) => setForm({ ...form, capacity: Number(e.target.value) })}
                />
              </div>
              <div>
                <Label>Category</Label>
                <Select
                  value={form.category}
                  onValueChange={(v) => setForm({ ...form, category: v as TableCategory })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(Object.keys(CATEGORY_LABEL) as TableCategory[]).map((c) => (
                      <SelectItem key={c} value={c}>
                        {CATEGORY_LABEL[c]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Availability status</Label>
                <Select
                  value={form.status}
                  onValueChange={(v) => setForm({ ...form, status: v as TableStatus })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(Object.keys(TABLE_STATUS_LABEL) as TableStatus[]).map((s) => (
                      <SelectItem key={s} value={s}>
                        {TABLE_STATUS_LABEL[s]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label htmlFor="t-notes">Notes (optional)</Label>
              <Textarea
                id="t-notes"
                placeholder="Near the window, power outlet, quiet corner…"
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={saving}>
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}{" "}
                {editing ? "Save changes" : "Add table"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete confirm */}
      <AlertDialog open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete table {deleting?.label}?</AlertDialogTitle>
            <AlertDialogDescription>
              This removes the table permanently. Tables with existing reservations cannot be
              deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep table</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={remove}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

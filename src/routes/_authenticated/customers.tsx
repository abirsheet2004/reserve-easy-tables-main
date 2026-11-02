import { createFileRoute } from "@tanstack/react-router";
import { requireStaff } from "@/lib/role-guard";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Loader2, Search, Users } from "lucide-react";
import { useState } from "react";
import { format } from "date-fns";
import { listManagedUsers } from "@/lib/users.functions";

export const Route = createFileRoute("/_authenticated/customers")({
  beforeLoad: requireStaff,
  head: () => ({
    meta: [
      { title: "User Management — Maison Laurent" },
      { name: "description", content: "Guest accounts, contact details, and reservation counts." },
    ],
  }),
  component: UserManagement,
});

type UserRow = {
  id: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  created_at: string;
  reservations: number;
};

function UserManagement() {
  const [search, setSearch] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["users-list"],
    queryFn: listManagedUsers,
  });

  const filtered = (data ?? []).filter((u) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return (
      (u.full_name ?? "").toLowerCase().includes(q) ||
      (u.email ?? "").toLowerCase().includes(q) ||
      (u.phone ?? "").toLowerCase().includes(q) ||
      u.id.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl">User Management</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Guest accounts, contact details, and reservation counts.
        </p>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search by name, email, phone, or ID…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-4 w-4 text-primary" /> Registered guests
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12 text-muted-foreground">
              <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Loading users…
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>User ID</TableHead>
                    <TableHead>Joined</TableHead>
                    <TableHead>Reservations</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((u) => (
                    <TableRow key={u.id}>
                      <TableCell className="font-medium">{u.full_name ?? "—"}</TableCell>
                      <TableCell>{u.email ?? "—"}</TableCell>
                      <TableCell>{u.phone ?? "—"}</TableCell>
                      <TableCell className="text-xs text-muted-foreground font-mono">
                        {u.id.slice(0, 8)}…
                      </TableCell>
                      <TableCell>{format(new Date(u.created_at), "d MMM yyyy")}</TableCell>
                      <TableCell>{u.reservations}</TableCell>
                    </TableRow>
                  ))}
                  {filtered.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                        No matching users.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

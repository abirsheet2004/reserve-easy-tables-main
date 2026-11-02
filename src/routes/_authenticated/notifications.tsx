import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, Bell, BellRing, CheckCheck } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

export const Route = createFileRoute("/_authenticated/notifications")({
  head: () => ({
    meta: [
      { title: "Notifications — Maison Laurent" },
      {
        name: "description",
        content: "In-app reservation updates, reminders, and seating alerts.",
      },
    ],
  }),
  component: Notifications,
});

type NotificationRow = {
  id: string;
  type: string;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
  reservation_id: string | null;
};

function Notifications() {
  const qc = useQueryClient();
  const [marking, setMarking] = useState(false);

  const { data: rows, isLoading } = useQuery({
    queryKey: ["my-notifications"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100);
      if (error) throw error;
      return data as NotificationRow[];
    },
  });

  // Generate reminders / seating alerts for upcoming confirmed reservations.
  useEffect(() => {
    supabase.rpc("ensure_reservation_alerts").then(() => {
      qc.invalidateQueries({ queryKey: ["my-notifications"] });
      qc.invalidateQueries({ queryKey: ["notifications-unread"] });
    });
  }, [qc]);

  const unread = (rows ?? []).filter((n) => !n.is_read);

  async function markRead(n: NotificationRow) {
    if (n.is_read) return;
    const { error } = await supabase.from("notifications").update({ is_read: true }).eq("id", n.id);
    if (error) return toast.error(error.message);
    qc.invalidateQueries({ queryKey: ["my-notifications"] });
    qc.invalidateQueries({ queryKey: ["notifications-unread"] });
  }

  async function markAllRead() {
    setMarking(true);
    const { error } = await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("is_read", false);
    setMarking(false);
    if (error) return toast.error(error.message);
    toast.success("All notifications marked as read");
    qc.invalidateQueries({ queryKey: ["my-notifications"] });
    qc.invalidateQueries({ queryKey: ["notifications-unread"] });
  }

  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex items-end justify-between flex-wrap gap-4">
        <div>
          <h1 className="font-display text-3xl">Notifications</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Reservation updates, reminders, and seating alerts — all kept in-app.
          </p>
        </div>
        {unread.length > 0 && (
          <Button variant="outline" onClick={markAllRead} disabled={marking}>
            <CheckCheck className="mr-2 h-4 w-4" /> Mark all read ({unread.length})
          </Button>
        )}
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20 text-muted-foreground">
          <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Loading notifications…
        </div>
      ) : (rows ?? []).length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center space-y-3">
            <Bell className="h-10 w-10 mx-auto text-muted-foreground/50" />
            <p className="font-medium">No notifications yet</p>
            <p className="text-sm text-muted-foreground">
              Booking updates and reminders will appear here.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {(rows ?? []).map((n) => (
            <Card
              key={n.id}
              className={`transition ${!n.is_read ? "border-primary/40 bg-primary/5" : "opacity-80"}`}
            >
              <CardContent className="p-4">
                <button
                  type="button"
                  onClick={() => markRead(n)}
                  className="w-full text-left space-y-1.5"
                  title={n.is_read ? undefined : "Click to mark as read"}
                >
                  <div className="flex items-start justify-between gap-3">
                    <span className="flex items-center gap-2 font-medium">
                      {n.is_read ? (
                        <Bell className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <BellRing className="h-4 w-4 text-primary" />
                      )}
                      {n.title}
                      {!n.is_read && (
                        <Badge className="bg-primary text-primary-foreground">New</Badge>
                      )}
                    </span>
                    <span className="text-xs text-muted-foreground shrink-0">
                      {format(new Date(n.created_at), "d MMM, HH:mm")}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground pl-6">{n.message}</p>
                </button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

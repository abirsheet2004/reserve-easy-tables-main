import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Loader2, CalendarDays, UserRound } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/profile")({
  head: () => ({
    meta: [
      { title: "My profile — Maison Laurent" },
      { name: "description", content: "View and update your name, email, and phone number." },
    ],
  }),
  component: Profile,
});

function Profile() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [form, setForm] = useState({ full_name: "", phone: "", email: "" });
  const [emailDirty, setEmailDirty] = useState(false);

  useEffect(() => {
    (async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) return;
      setUserId(u.user.id);
      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name,phone")
        .eq("id", u.user.id)
        .maybeSingle();
      setForm({
        full_name: profile?.full_name ?? "",
        phone: profile?.phone ?? "",
        email: u.user.email ?? "",
      });
      setLoading(false);
    })();
  }, []);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!userId) return;
    setSaving(true);
    const { error: pErr } = await supabase
      .from("profiles")
      .update({ full_name: form.full_name, phone: form.phone })
      .eq("id", userId);
    if (!pErr && emailDirty && form.email) {
      const { error: eErr } = await supabase.auth.updateUser({ email: form.email });
      if (eErr) {
        setSaving(false);
        return toast.error(eErr.message);
      }
      toast.info("A confirmation link was sent to your new email address.");
    }
    setSaving(false);
    setEmailDirty(false);
    if (pErr) return toast.error(pErr.message);
    toast.success("Profile saved");
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24 text-muted-foreground">
        <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Loading your profile…
      </div>
    );
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="font-display text-3xl">Your profile</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Keep your details up to date for a smoother visit.
          </p>
        </div>
        <Button asChild variant="outline">
          <Link to="/my-reservations">
            <CalendarDays className="mr-2 h-4 w-4" /> Reservation history
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserRound className="h-4 w-4 text-primary" /> Personal details
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={save} className="space-y-4">
            <div>
              <Label htmlFor="full_name">Full name</Label>
              <Input
                id="full_name"
                value={form.full_name}
                onChange={(e) => setForm({ ...form, full_name: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                type="tel"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={form.email}
                onChange={(e) => {
                  setEmailDirty(e.target.value !== form.email);
                  setForm({ ...form, email: e.target.value });
                }}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Changing your email requires confirming a link we send to the new address.
              </p>
            </div>
            <Button type="submit" disabled={saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Save changes
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

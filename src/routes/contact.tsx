import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { MapPin, Phone, Mail, Clock } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact — Maison Laurent" },
      {
        name: "description",
        content:
          "Get in touch with Maison Laurent for private dining, press, or general enquiries. Open Tue–Sun, 6–11 PM.",
      },
      { property: "og:title", content: "Contact — Maison Laurent" },
      { property: "og:description", content: "Private dining, press, and general enquiries." },
    ],
  }),
  component: ContactPage,
});

function ContactPage() {
  const [sending, setSending] = useState(false);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSending(true);
    setTimeout(() => {
      setSending(false);
      (e.target as HTMLFormElement).reset();
      toast.success("Thanks — we'll reply within one business day.");
    }, 600);
  }

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      <section className="border-b border-border bg-secondary/40">
        <div className="mx-auto max-w-4xl px-6 py-20 text-center">
          <h1 className="font-display text-5xl">Contact</h1>
          <p className="mt-4 text-muted-foreground">
            Reservations are fastest online — for everything else, drop us a note.
          </p>
          <Button asChild className="mt-6">
            <Link to="/book">Book a table</Link>
          </Button>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-16 grid md:grid-cols-2 gap-12">
        <div className="space-y-6">
          {[
            { icon: MapPin, title: "Address", body: "18 Rue des Vignes" },
            { icon: Phone, title: "Phone", body: "+1 (555) 018-2245" },
            { icon: Mail, title: "Email", body: "hello@maisonlaurent.com" },
            { icon: Clock, title: "Hours", body: "Tue–Sun · 6:00 – 11:00 PM" },
          ].map((c) => (
            <div key={c.title} className="flex gap-4">
              <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <c.icon className="h-5 w-5" />
              </span>
              <div>
                <p className="font-medium">{c.title}</p>
                <p className="text-sm text-muted-foreground">{c.body}</p>
              </div>
            </div>
          ))}
        </div>

        <form
          onSubmit={handleSubmit}
          className="rounded-2xl border border-border bg-card p-6 space-y-4"
        >
          <div>
            <Label htmlFor="name">Name</Label>
            <Input id="name" name="name" required className="mt-1.5" />
          </div>
          <div>
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" required className="mt-1.5" />
          </div>
          <div>
            <Label htmlFor="message">Message</Label>
            <Textarea id="message" name="message" rows={5} required className="mt-1.5" />
          </div>
          <Button type="submit" className="w-full" disabled={sending}>
            {sending ? "Sending…" : "Send message"}
          </Button>
        </form>
      </section>

      <SiteFooter />
    </div>
  );
}

import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  CalendarCheck,
  Users,
  LayoutDashboard,
  Utensils,
  Sparkles,
  Clock,
  Star,
  Wine,
  GlassWater,
  Cake,
  Phone,
  MapPin,
  Mail,
} from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import heroImg from "@/assets/hero-dining.jpg";
import dishImg from "@/assets/dish-quail.jpg";
import chefImg from "@/assets/chef.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Maison Laurent — Fine Dining & Table Reservations" },
      {
        name: "description",
        content:
          "Seasonal French tasting menus, private dining, and instant online table reservations at Maison Laurent.",
      },
      { property: "og:title", content: "Maison Laurent — Fine Dining & Table Reservations" },
      {
        property: "og:description",
        content:
          "Seasonal French tasting menus, private dining, and instant online table reservations.",
      },
    ],
  }),
  component: Landing,
});

const menuHighlights = [
  { name: "Roasted Quail", desc: "Smoked pear, black garlic jus", price: "$42", tag: "Signature" },
  { name: "Cellar Scallops", desc: "Brown butter, sea grape, yuzu", price: "$38", tag: "Seasonal" },
  {
    name: "Truffle Tagliolini",
    desc: "Aged parmesan, winter truffle",
    price: "$46",
    tag: "Chef's pick",
  },
  { name: "Duck à l'Orange", desc: "Confit leg, bitter marmalade", price: "$44", tag: "Classic" },
  { name: "Beetroot Tartare", desc: "Horseradish snow, rye crisp", price: "$26", tag: "Vegan" },
  { name: "Burnt Honey Tart", desc: "Crème fraîche, thyme", price: "$18", tag: "Dessert" },
];

const experiences = [
  {
    icon: Wine,
    title: "Cellar Pairings",
    body: "Six pours matched to the tasting menu by our head sommelier.",
  },
  {
    icon: GlassWater,
    title: "Chef's Counter",
    body: "Eight seats facing the pass. Courses served by the chefs themselves.",
  },
  {
    icon: Cake,
    title: "Private Dining",
    body: "The Vintner's Room seats up to 20 for celebrations and offsites.",
  },
];

const testimonials = [
  {
    name: "Amara Osei",
    role: "Food critic, The Ledger",
    quote: "The quail alone justifies the trip. Service that anticipates rather than reacts.",
  },
  {
    name: "Julian Reyes",
    role: "Regular since 2019",
    quote: "Booking takes ten seconds and they still remember my wife is allergic to shellfish.",
  },
  {
    name: "Petra Lindqvist",
    role: "Event planner",
    quote: "We host every client dinner here. The private room team is flawless.",
  },
];

const faqs = [
  {
    q: "How far in advance should I book?",
    a: "Weeknights usually open up same-day, but weekend seatings fill two to three weeks out. Reserve online any time.",
  },
  {
    q: "Do you accommodate dietary restrictions?",
    a: "Yes. Add notes to your reservation and the kitchen will prepare alternatives for vegan, gluten-free, and allergy needs.",
  },
  { q: "Is there a dress code?", a: "Smart casual. Jackets are welcome but never required." },
  {
    q: "Can I modify or cancel a reservation?",
    a: "Sign in to your account and manage your booking any time up to two hours before the seating.",
  },
];

function Landing() {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      {/* 1 — Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10">
          <img
            src={heroImg}
            alt="Dining room at Maison Laurent"
            width={1600}
            height={1200}
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-background via-background/90 to-background/40" />
        </div>
        <div className="mx-auto max-w-6xl px-6 py-24 md:py-36 grid md:grid-cols-2 gap-12 items-center">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs text-muted-foreground">
              <Sparkles className="h-3.5 w-3.5 text-accent" /> Now taking reservations
            </span>
            <h1 className="mt-6 font-display text-5xl md:text-6xl font-semibold leading-tight text-foreground">
              A table set,
              <br />a story served.
            </h1>
            <p className="mt-6 text-lg text-muted-foreground max-w-lg">
              Seasonal tasting menus by Chef Laurent, poured from a cellar of forgotten vintages.
              Reserve your evening in a few taps — we'll take care of the rest.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild size="lg">
                <Link to="/book">
                  <CalendarCheck className="mr-2 h-4 w-4" />
                  Book a table
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link to="/about">Discover our story</Link>
              </Button>
            </div>
          </div>
          <div className="relative hidden md:block">
            <div className="aspect-[4/5] rounded-2xl bg-gradient-to-br from-primary/90 via-primary to-[oklch(0.28_0.09_25)] p-8 shadow-2xl flex flex-col justify-between text-primary-foreground">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-accent">
                  Tonight's Prix Fixe
                </p>
                <h2 className="mt-4 font-display text-3xl leading-tight">
                  Roasted quail, smoked pear, black garlic jus
                </h2>
              </div>
              <div className="space-y-3 text-sm">
                <div className="flex items-center gap-3">
                  <Clock className="h-4 w-4 text-accent" /> Seatings 6:00 – 10:00 PM
                </div>
                <div className="flex items-center gap-3">
                  <Users className="h-4 w-4 text-accent" /> Parties of 1–8
                </div>
                <div className="flex items-center gap-3">
                  <Utensils className="h-4 w-4 text-accent" /> 7-course tasting · $145
                </div>
              </div>
            </div>
            <div className="absolute -bottom-6 -left-6 rounded-xl bg-card border border-border p-4 shadow-xl w-56">
              <p className="text-xs text-muted-foreground">Available now</p>
              <p className="font-display text-xl">Window table for 2</p>
              <p className="text-xs text-status-available mt-1">● Available at 7:30 PM</p>
            </div>
          </div>
        </div>
      </section>

      {/* 2 — Stats */}
      <section className="border-y border-border bg-secondary/50">
        <div className="mx-auto max-w-6xl px-6 py-10 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {[
            { k: "12", v: "Tables" },
            { k: "5★", v: "Guest rating" },
            { k: "18k+", v: "Guests served" },
            { k: "24/7", v: "Online booking" },
          ].map((s) => (
            <div key={s.v}>
              <p className="font-display text-4xl text-primary">{s.k}</p>
              <p className="mt-1 text-xs text-muted-foreground uppercase tracking-wider">{s.v}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 3 — About / Chef */}
      <section className="mx-auto max-w-6xl px-6 py-20 grid md:grid-cols-2 gap-12 items-center">
        <img
          src={chefImg}
          alt="Chef Laurent plating in the kitchen"
          width={1000}
          height={1200}
          loading="lazy"
          className="rounded-2xl object-cover w-full aspect-[4/5] shadow-xl"
        />
        <div>
          <p className="text-xs uppercase tracking-[0.25em] text-accent">Our story</p>
          <h2 className="mt-3 font-display text-4xl">Cooking with the seasons since 2014</h2>
          <p className="mt-5 text-muted-foreground">
            Maison Laurent began as a twelve-seat room above a wine shop. A decade later the menu
            still changes with the market: we buy what's best that morning and build the evening
            around it.
          </p>
          <p className="mt-4 text-muted-foreground">
            Every guest profile carries favourite tables and visit history — so the second visit
            always feels like the tenth.
          </p>
          <Button asChild variant="outline" className="mt-8">
            <Link to="/about">More about us</Link>
          </Button>
        </div>
      </section>

      {/* 4 — Signature menu */}
      <section className="border-t border-border bg-secondary/40">
        <div className="mx-auto max-w-6xl px-6 py-20">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.25em] text-accent">From the kitchen</p>
              <h2 className="mt-3 font-display text-4xl">Signature plates</h2>
            </div>
          </div>
          <div className="mt-10 grid md:grid-cols-3 gap-6">
            {menuHighlights.map((m) => (
              <div
                key={m.name}
                className="rounded-xl border border-border bg-card p-6 hover:shadow-lg transition"
              >
                <div className="flex items-start justify-between gap-3">
                  <h3 className="font-display text-xl">{m.name}</h3>
                  <span className="font-display text-lg text-primary">{m.price}</span>
                </div>
                <p className="mt-2 text-sm text-muted-foreground">{m.desc}</p>
                <span className="mt-4 inline-block rounded-full bg-accent/20 px-3 py-1 text-xs text-accent-foreground">
                  {m.tag}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 5 — Experiences */}
      <section className="mx-auto max-w-6xl px-6 py-20 grid md:grid-cols-2 gap-12 items-center">
        <div>
          <p className="text-xs uppercase tracking-[0.25em] text-accent">Experiences</p>
          <h2 className="mt-3 font-display text-4xl">More than a dinner</h2>
          <div className="mt-8 space-y-6">
            {experiences.map((e) => (
              <div key={e.title} className="flex gap-4">
                <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <e.icon className="h-5 w-5" />
                </span>
                <div>
                  <h3 className="font-display text-xl">{e.title}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{e.body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
        <img
          src={dishImg}
          alt="Roasted quail with smoked pear"
          width={1200}
          height={1200}
          loading="lazy"
          className="rounded-2xl object-cover w-full aspect-square shadow-xl"
        />
      </section>

      {/* 6 — Staff platform */}
      <section className="border-y border-border bg-secondary/40">
        <div className="mx-auto max-w-6xl px-6 py-20">
          <p className="text-xs uppercase tracking-[0.25em] text-accent">For the team</p>
          <h2 className="mt-3 font-display text-4xl">A floor that runs itself</h2>
          <div className="mt-10 grid md:grid-cols-3 gap-6">
            {[
              {
                icon: CalendarCheck,
                title: "Effortless bookings",
                body: "Guests choose party size, time, and table category. We confirm instantly.",
              },
              {
                icon: LayoutDashboard,
                title: "Table management",
                body: "Hosts see availability, capacities, and table status in real time.",
              },
              {
                icon: Users,
                title: "User management",
                body: "Guest profiles, contact details, and reservation history follow every guest.",
              },
            ].map((f) => (
              <div key={f.title} className="rounded-xl border border-border bg-card p-6">
                <div className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <f.icon className="h-5 w-5" />
                </div>
                <h3 className="mt-4 font-display text-xl">{f.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{f.body}</p>
              </div>
            ))}
          </div>
          <Button asChild variant="outline" className="mt-8">
            <Link to="/dashboard">Open staff dashboard</Link>
          </Button>
        </div>
      </section>

      {/* 7 — Testimonials */}
      <section className="mx-auto max-w-6xl px-6 py-20">
        <p className="text-xs uppercase tracking-[0.25em] text-accent">Guest book</p>
        <h2 className="mt-3 font-display text-4xl">What guests say</h2>
        <div className="mt-10 grid md:grid-cols-3 gap-6">
          {testimonials.map((t) => (
            <figure key={t.name} className="rounded-xl border border-border bg-card p-6">
              <div className="flex gap-1 text-accent">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className="h-4 w-4 fill-current" />
                ))}
              </div>
              <blockquote className="mt-4 text-sm text-muted-foreground">"{t.quote}"</blockquote>
              <figcaption className="mt-5">
                <p className="font-medium">{t.name}</p>
                <p className="text-xs text-muted-foreground">{t.role}</p>
              </figcaption>
            </figure>
          ))}
        </div>
      </section>

      {/* 8 — FAQ + reservation CTA */}
      <section className="border-t border-border bg-secondary/40">
        <div className="mx-auto max-w-6xl px-6 py-20 grid md:grid-cols-2 gap-12">
          <div>
            <p className="text-xs uppercase tracking-[0.25em] text-accent">Good to know</p>
            <h2 className="mt-3 font-display text-4xl">Frequently asked</h2>
            <Accordion type="single" collapsible className="mt-6">
              {faqs.map((f) => (
                <AccordionItem key={f.q} value={f.q}>
                  <AccordionTrigger className="text-left">{f.q}</AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">{f.a}</AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
          <div className="rounded-2xl bg-primary text-primary-foreground p-8 flex flex-col justify-between">
            <div>
              <h2 className="font-display text-3xl">Reserve your evening</h2>
              <p className="mt-3 text-primary-foreground/80">
                Pick a date, party size, and preferred room. Confirmation lands instantly.
              </p>
              <ul className="mt-6 space-y-3 text-sm text-primary-foreground/90">
                <li className="flex items-center gap-3">
                  <MapPin className="h-4 w-4 text-accent" /> 18 Rue des Vignes
                </li>
                <li className="flex items-center gap-3">
                  <Phone className="h-4 w-4 text-accent" /> +1 (555) 018-2245
                </li>
                <li className="flex items-center gap-3">
                  <Mail className="h-4 w-4 text-accent" /> hello@maisonlaurent.com
                </li>
              </ul>
            </div>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild size="lg" variant="secondary">
                <Link to="/book">Book a table</Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="bg-transparent text-primary-foreground border-primary-foreground/40 hover:bg-primary-foreground/10 hover:text-primary-foreground"
              >
                <Link to="/contact">Contact us</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}

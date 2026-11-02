import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import chefImg from "@/assets/chef.jpg";
import heroImg from "@/assets/hero-dining.jpg";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About — Maison Laurent" },
      {
        name: "description",
        content:
          "The story, kitchen, and team behind Maison Laurent — seasonal French dining since 2014.",
      },
      { property: "og:title", content: "About — Maison Laurent" },
      {
        property: "og:description",
        content: "The story, kitchen, and team behind Maison Laurent.",
      },
    ],
  }),
  component: AboutPage,
});

const timeline = [
  { year: "2014", text: "Twelve seats above a wine shop. One market menu a night." },
  { year: "2018", text: "Moved to Rue des Vignes and opened the cellar to guests." },
  { year: "2021", text: "The Chef's Counter launches — eight seats facing the pass." },
  { year: "2026", text: "Full digital reservations, guest profiles, and a live floor board." },
];

const team = [
  { name: "Chef Laurent Vasseur", role: "Executive Chef" },
  { name: "Noor Haddad", role: "Head Sommelier" },
  { name: "Émile Rousset", role: "Pastry Chef" },
  { name: "Sofia Marchetti", role: "General Manager" },
];

function AboutPage() {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      <section className="relative">
        <img
          src={heroImg}
          alt="Maison Laurent dining room"
          width={1600}
          height={1200}
          className="h-72 w-full object-cover"
        />
        <div className="absolute inset-0 bg-background/70 flex items-center">
          <div className="mx-auto max-w-4xl px-6">
            <h1 className="font-display text-5xl">Our story</h1>
            <p className="mt-3 text-muted-foreground max-w-xl">
              Seasonal French cooking, served with the kind of hospitality that remembers you.
            </p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-20 grid md:grid-cols-2 gap-12 items-center">
        <img
          src={chefImg}
          alt="Chef Laurent"
          width={1000}
          height={1200}
          loading="lazy"
          className="rounded-2xl w-full aspect-[4/5] object-cover shadow-xl"
        />
        <div>
          <h2 className="font-display text-4xl">Cooking with the seasons</h2>
          <p className="mt-5 text-muted-foreground">
            We buy what's best each morning and build the evening around it. Nothing is frozen,
            nothing is filler, and the menu changes as often as the market does.
          </p>
          <p className="mt-4 text-muted-foreground">
            Guest profiles carry dietary notes, favourite tables, and visit history, so every return
            visit picks up where the last one ended.
          </p>
        </div>
      </section>

      <section className="border-y border-border bg-secondary/40">
        <div className="mx-auto max-w-4xl px-6 py-20">
          <h2 className="font-display text-4xl">Milestones</h2>
          <ol className="mt-8 space-y-6 border-l border-border pl-6">
            {timeline.map((t) => (
              <li key={t.year}>
                <p className="font-display text-xl text-primary">{t.year}</p>
                <p className="text-sm text-muted-foreground">{t.text}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-20">
        <h2 className="font-display text-4xl">The team</h2>
        <div className="mt-10 grid sm:grid-cols-2 md:grid-cols-4 gap-6">
          {team.map((m) => (
            <div key={m.name} className="rounded-xl border border-border bg-card p-6">
              <p className="font-medium">{m.name}</p>
              <p className="mt-1 text-sm text-muted-foreground">{m.role}</p>
            </div>
          ))}
        </div>
        <Button asChild size="lg" className="mt-10">
          <Link to="/book">Reserve a table</Link>
        </Button>
      </section>

      <SiteFooter />
    </div>
  );
}

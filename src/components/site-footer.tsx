import { Link } from "@tanstack/react-router";
import { Utensils, Instagram, Facebook, Twitter } from "lucide-react";

export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-sidebar text-sidebar-foreground">
      <div className="mx-auto max-w-6xl px-6 py-14 grid gap-10 md:grid-cols-4">
        <div>
          <div className="flex items-center gap-2 font-display text-lg font-semibold">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-accent text-accent-foreground">
              <Utensils className="h-4 w-4" />
            </span>
            Maison Laurent
          </div>
          <p className="mt-4 text-sm text-sidebar-foreground/70">
            Seasonal French cuisine, poured from a cellar of forgotten vintages.
          </p>
          <div className="mt-5 flex gap-3 text-sidebar-foreground/70">
            <Instagram className="h-5 w-5" />
            <Facebook className="h-5 w-5" />
            <Twitter className="h-5 w-5" />
          </div>
        </div>
        <div>
          <h4 className="text-sm font-semibold uppercase tracking-wider text-accent">Explore</h4>
          <ul className="mt-4 space-y-2 text-sm text-sidebar-foreground/70">
            <li>
              <Link to="/about">About</Link>
            </li>
            <li>
              <Link to="/contact">Contact</Link>
            </li>
            <li>
              <Link to="/book">Reservations</Link>
            </li>
            <li>
              <Link to="/my-reservations">My reservations</Link>
            </li>
          </ul>
        </div>
        <div>
          <h4 className="text-sm font-semibold uppercase tracking-wider text-accent">
            For the team
          </h4>
          <ul className="mt-4 space-y-2 text-sm text-sidebar-foreground/70">
            <li>
              <Link to="/auth">Sign in</Link>
            </li>
            <li>
              <Link to="/dashboard">Dashboard</Link>
            </li>
            <li>
              <Link to="/reservations">Bookings</Link>
            </li>
            <li>
              <Link to="/tables">Table management</Link>
            </li>
            <li>
              <Link to="/customers">User management</Link>
            </li>
          </ul>
        </div>
        <div>
          <h4 className="text-sm font-semibold uppercase tracking-wider text-accent">Visit</h4>
          <p className="mt-4 text-sm text-sidebar-foreground/70">
            18 Rue des Vignes
            <br />
            Open Tue–Sun · 6–11 PM
            <br />
            +1 (555) 018-2245
          </p>
        </div>
      </div>
      <div className="border-t border-sidebar-border py-6 text-center text-xs text-sidebar-foreground/60">
        © {new Date().getFullYear()} Maison Laurent. All rights reserved.
      </div>
    </footer>
  );
}

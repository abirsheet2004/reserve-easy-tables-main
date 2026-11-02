import {
  createFileRoute,
  Outlet,
  redirect,
  Link,
  useNavigate,
  useRouterState,
} from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";
import {
  CalendarDays,
  LayoutDashboard,
  Table2,
  Users,
  User,
  LogOut,
  Utensils,
  Menu,
  Bell,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { fetchMyRole, STAFF_ROLES } from "@/lib/role-guard";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async () => {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) throw redirect({ to: "/auth" });
    return { user: data.user };
  },
  component: AuthenticatedLayout,
});

const staffNavItems = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/reservations", label: "Bookings", icon: CalendarDays },
  { to: "/tables", label: "Tables", icon: Table2 },
  { to: "/customers", label: "User Management", icon: Users },
  { to: "/notifications", label: "Notifications", icon: Bell },
  { to: "/profile", label: "Profile", icon: User },
] as const;

const guestNavItems = [
  { to: "/my-reservations", label: "My Reservations", icon: CalendarDays },
  { to: "/notifications", label: "Notifications", icon: Bell },
  { to: "/profile", label: "Profile", icon: User },
] as const;

type SidebarInnerProps = {
  email: string;
  path: string;
  role: "staff" | "guest" | null;
  onSignOut: () => void;
};

function SidebarInner({ email, path, role, onSignOut }: SidebarInnerProps) {
  const navItems = role === "guest" ? guestNavItems : role === "staff" ? staffNavItems : [];

  return (
    <div className="flex h-full flex-col">
      <Link
        to={role === "guest" ? "/my-reservations" : "/dashboard"}
        className="flex items-center gap-2 px-6 h-16 border-b border-sidebar-border"
      >
        <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-accent text-accent-foreground">
          <Utensils className="h-4 w-4" />
        </span>
        <span className="font-display text-lg font-semibold text-sidebar-foreground">
          Maison Laurent
        </span>
      </Link>
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map((item) => {
          const active = path.startsWith(item.to);
          return (
            <Link
              key={item.to}
              to={item.to}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition",
                active && "bg-sidebar-accent text-sidebar-accent-foreground font-medium",
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="p-3 border-t border-sidebar-border">
        <div className="px-3 py-2 text-xs text-sidebar-foreground/60 truncate">{email}</div>
        <Button
          variant="ghost"
          onClick={onSignOut}
          className="w-full justify-start text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
        >
          <LogOut className="mr-2 h-4 w-4" /> Sign out
        </Button>
      </div>
    </div>
  );
}

function AuthenticatedLayout() {
  const navigate = useNavigate();
  const path = useRouterState({ select: (s) => s.location.pathname });
  const [email, setEmail] = useState<string>("");
  const [role, setRole] = useState<"staff" | "guest" | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setEmail(data.user?.email ?? ""));
    fetchMyRole().then((r) =>
      setRole(STAFF_ROLES.includes(r as (typeof STAFF_ROLES)[number]) ? "staff" : "guest"),
    );
  }, []);

  async function handleSignOut() {
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  return (
    <div className="min-h-screen bg-background">
      <aside className="fixed inset-y-0 left-0 hidden md:flex md:w-64 bg-sidebar border-r border-sidebar-border">
        <SidebarInner email={email} path={path} role={role} onSignOut={handleSignOut} />
      </aside>
      <div className="md:pl-64">
        <header className="h-16 border-b border-border bg-background/70 backdrop-blur sticky top-0 z-20 flex items-center px-4 md:px-8 gap-3">
          <Sheet>
            <SheetTrigger asChild>
              <Button size="icon" variant="ghost" className="md:hidden">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0 w-64 bg-sidebar border-sidebar-border">
              <SidebarInner email={email} path={path} role={role} onSignOut={handleSignOut} />
            </SheetContent>
          </Sheet>
          <div className="flex-1" />
          <Button asChild variant="outline" size="sm">
            <Link to="/book">+ New reservation</Link>
          </Button>
        </header>
        <main className="p-4 md:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

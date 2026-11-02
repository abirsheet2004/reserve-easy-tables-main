import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Utensils, Loader2 } from "lucide-react";

export const Route = createFileRoute("/auth")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Sign in — Maison Laurent" },
      {
        name: "description",
        content: "Sign in or create an account to reserve a table at Maison Laurent.",
      },
      { property: "og:title", content: "Sign in — Maison Laurent" },
      { property: "og:description", content: "Sign in or create an account to reserve a table." },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/dashboard" });
    });
  }, [navigate]);

  const [signIn, setSignIn] = useState({ email: "", password: "" });
  const [signUp, setSignUp] = useState({ email: "", password: "", fullName: "", phone: "" });

  async function handleSignIn(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: signIn.email,
      password: signIn.password,
    });
    setLoading(false);
    if (error) return toast.error(error.message);
    toast.success("Welcome back!");
    navigate({ to: "/dashboard" });
  }

  async function handleSignUp(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email: signUp.email,
      password: signUp.password,
      options: {
        emailRedirectTo: window.location.origin,
        data: { full_name: signUp.fullName, phone: signUp.phone },
      },
    });
    setLoading(false);
    if (error) return toast.error(error.message);
    toast.success("Account created — check your email to verify.");
  }

  return (
    <div className="min-h-screen grid md:grid-cols-2 bg-background">
      <div className="hidden md:flex flex-col justify-between bg-primary text-primary-foreground p-12 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,oklch(0.72_0.13_75/0.25),transparent_60%)]" />
        <Link
          to="/"
          className="relative flex items-center gap-2 font-display text-lg font-semibold"
        >
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-accent text-accent-foreground">
            <Utensils className="h-4 w-4" />
          </span>
          Maison Laurent
        </Link>
        <div className="relative">
          <h2 className="font-display text-4xl leading-tight">
            "The table is set. All that's missing is you."
          </h2>
          <p className="mt-4 text-sm text-primary-foreground/80">— Chef Laurent</p>
        </div>
        <p className="relative text-xs text-primary-foreground/60">Reserve · Manage · Delight</p>
      </div>

      <div className="flex items-center justify-center p-6">
        <Card className="w-full max-w-md border-border">
          <CardHeader>
            <CardTitle className="font-display text-2xl">Welcome</CardTitle>
            <CardDescription>Sign in to manage your reservations.</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="signin">
              <TabsList className="grid grid-cols-2 mb-4">
                <TabsTrigger value="signin">Sign in</TabsTrigger>
                <TabsTrigger value="signup">Create account</TabsTrigger>
              </TabsList>
              <TabsContent value="signin">
                <form onSubmit={handleSignIn} className="space-y-4">
                  <div>
                    <Label htmlFor="si-email">Email</Label>
                    <Input
                      id="si-email"
                      type="email"
                      required
                      value={signIn.email}
                      onChange={(e) => setSignIn({ ...signIn, email: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="si-pw">Password</Label>
                    <Input
                      id="si-pw"
                      type="password"
                      required
                      value={signIn.password}
                      onChange={(e) => setSignIn({ ...signIn, password: e.target.value })}
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Sign in
                  </Button>
                </form>
              </TabsContent>
              <TabsContent value="signup">
                <form onSubmit={handleSignUp} className="space-y-4">
                  <div>
                    <Label htmlFor="su-name">Full name</Label>
                    <Input
                      id="su-name"
                      required
                      value={signUp.fullName}
                      onChange={(e) => setSignUp({ ...signUp, fullName: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="su-phone">Phone</Label>
                    <Input
                      id="su-phone"
                      type="tel"
                      value={signUp.phone}
                      onChange={(e) => setSignUp({ ...signUp, phone: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="su-email">Email</Label>
                    <Input
                      id="su-email"
                      type="email"
                      required
                      value={signUp.email}
                      onChange={(e) => setSignUp({ ...signUp, email: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="su-pw">Password</Label>
                    <Input
                      id="su-pw"
                      type="password"
                      required
                      minLength={6}
                      value={signUp.password}
                      onChange={(e) => setSignUp({ ...signUp, password: e.target.value })}
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Create account
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

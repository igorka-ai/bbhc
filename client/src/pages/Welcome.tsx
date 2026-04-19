import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { type Game } from "@shared/schema";
import { CalendarDays, MapPin, Clock, Users, Trophy, ArrowRight } from "lucide-react";
import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

function WelcomeHeader() {
  return (
    <header className="sticky top-0 z-50 flex items-center justify-between px-6 h-16 border-b border-border/40 bg-background/80 backdrop-blur-md">
      <div className="flex items-center gap-2.5">
        <svg
          width="32" height="32" viewBox="0 0 32 32" fill="none"
          xmlns="http://www.w3.org/2000/svg" aria-label="Brooklyn Beer Hockey Club"
          className="shrink-0"
        >
          <ellipse cx="16" cy="22" rx="11" ry="5" fill="hsl(199 80% 48% / 0.18)" stroke="hsl(199 80% 48%)" strokeWidth="1.5" />
          <path d="M8 22 Q6 18 7 14" stroke="hsl(38 90% 52%)" strokeWidth="2.5" strokeLinecap="round"/>
          <path d="M7 14 L22 4" stroke="hsl(38 90% 52%)" strokeWidth="2.5" strokeLinecap="round"/>
          <circle cx="23" cy="9" r="2" fill="hsl(199 80% 48% / 0.6)"/>
          <circle cx="26" cy="5" r="1.5" fill="hsl(199 80% 48% / 0.4)"/>
        </svg>
        <div>
          <div className="text-sm font-bold text-foreground leading-tight font-display tracking-wide">BROOKLYN</div>
          <div className="text-xs text-primary font-semibold leading-tight tracking-widest">BEER HOCKEY</div>
        </div>
      </div>
      <Link href="/dashboard">
        <Button variant="outline" size="sm" className="gap-1.5">
          Member Portal <ArrowRight size={14} />
        </Button>
      </Link>
    </header>
  );
}

function UpcomingGames() {
  const { data: games = [], isLoading } = useQuery<Game[]>({
    queryKey: ["/api/games"],
    queryFn: () => apiRequest("GET", "/api/games"),
  });

  const upcoming = games.filter((g) => g.status === "upcoming");

  function formatDate(iso: string) {
    const d = new Date(iso + "T00:00:00");
    return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
  }

  function formatTime(time: string) {
    const [h, m] = time.split(":");
    const hour = Number(h);
    const ampm = hour >= 12 ? "PM" : "AM";
    const h12 = hour % 12 || 12;
    return `${h12}:${m} ${ampm}`;
  }

  if (isLoading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="bg-card/50 border-border/40 animate-pulse">
            <CardContent className="p-5 h-28" />
          </Card>
        ))}
      </div>
    );
  }

  if (upcoming.length === 0) {
    return (
      <Card className="bg-card/50 border-border/40">
        <CardContent className="p-8 text-center">
          <CalendarDays className="mx-auto mb-3 text-muted-foreground" size={32} />
          <p className="text-muted-foreground">No games scheduled yet. Check back soon!</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {upcoming.map((game) => (
        <Card key={game.id} className="bg-card/50 border-border/40 hover:border-primary/30 transition-colors">
          <CardContent className="p-5 space-y-3">
            <div className="flex items-center gap-2 text-primary font-semibold font-display text-sm tracking-wide">
              <CalendarDays size={15} />
              {formatDate(game.date)}
            </div>
            <div className="space-y-1.5 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Clock size={14} className="shrink-0" />
                {formatTime(game.time)}
              </div>
              <div className="flex items-center gap-2">
                <MapPin size={14} className="shrink-0" />
                {game.location}
              </div>
              {game.opponent && (
                <div className="flex items-center gap-2">
                  <Users size={14} className="shrink-0" />
                  <span>vs <span className="text-foreground font-medium">{game.opponent}</span></span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

const INITIAL_FORM = { name: "", number: "", position: "skater", email: "", phone: "" };

function JoinForm() {
  const [form, setForm] = useState({ ...INITIAL_FORM });
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: (data: Record<string, unknown>) => apiRequest("POST", "/api/players", data),
    onSuccess: (player: { name: string }) => {
      setSuccess(player.name);
      setError(null);
      setForm({ ...INITIAL_FORM });
    },
    onError: (err: Error) => {
      setError(err.message || "Something went wrong. Please try again.");
      setSuccess(null);
    },
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    mutation.mutate({
      name: form.name,
      number: Number(form.number),
      position: form.position,
      email: form.email,
      phone: form.phone || null,
      isActive: true,
      joinedAt: new Date().toISOString().split("T")[0],
    });
  }

  if (success) {
    return (
      <Card className="bg-card/50 border-primary/30">
        <CardContent className="p-8 text-center space-y-3">
          <div className="text-4xl">🏒</div>
          <h3 className="text-xl font-display font-bold text-foreground">
            Welcome to the club, {success}!
          </h3>
          <p className="text-muted-foreground text-sm">
            You're on the roster. Head to the{" "}
            <Link href="/dashboard" className="text-primary underline underline-offset-2">Member Portal</Link>{" "}
            to check schedules and RSVP.
          </p>
          <Button variant="outline" size="sm" onClick={() => setSuccess(null)}>
            Register another player
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-card/50 border-border/40">
      <CardContent className="p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="reg-name">Full Name *</Label>
              <Input
                id="reg-name"
                required
                placeholder="Bobby Orr"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="reg-number">Jersey Number *</Label>
              <Input
                id="reg-number"
                type="number"
                required
                min={0}
                max={99}
                placeholder="4"
                value={form.number}
                onChange={(e) => setForm((f) => ({ ...f, number: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="reg-position">Position</Label>
              <Select value={form.position} onValueChange={(v) => setForm((f) => ({ ...f, position: v }))}>
                <SelectTrigger id="reg-position">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="skater">Skater</SelectItem>
                  <SelectItem value="goalie">Goalie</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="reg-email">Email *</Label>
              <Input
                id="reg-email"
                type="email"
                required
                placeholder="bobby@example.com"
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="reg-phone">Phone <span className="text-muted-foreground">(optional)</span></Label>
              <Input
                id="reg-phone"
                type="tel"
                placeholder="(555) 123-4567"
                value={form.phone}
                onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
              />
            </div>
          </div>

          {error && (
            <p className="text-sm text-destructive bg-destructive/10 rounded-md px-3 py-2">{error}</p>
          )}

          <Button type="submit" className="w-full" disabled={mutation.isPending}>
            {mutation.isPending ? "Signing up..." : "Join the Club"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

export default function Welcome() {
  return (
    <div className="min-h-dvh flex flex-col">
      <WelcomeHeader />

      {/* Hero */}
      <section className="px-6 pt-16 pb-12 text-center max-w-3xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold tracking-wide mb-6">
          <Trophy size={14} /> EST. BROOKLYN, NY
        </div>
        <h1 className="font-display text-4xl sm:text-5xl font-bold tracking-tight text-foreground leading-tight">
          Brooklyn Beer<br />Hockey Club
        </h1>
        <p className="mt-4 text-muted-foreground text-lg max-w-lg mx-auto">
          Lace up, grab a cold one, and hit the ice with Brooklyn's finest beer league squad.
        </p>
      </section>

      {/* Upcoming Games */}
      <section className="px-6 pb-12 max-w-5xl mx-auto w-full">
        <h2 className="font-display text-xl font-bold text-foreground mb-4 flex items-center gap-2">
          <CalendarDays size={20} className="text-primary" /> Upcoming Games
        </h2>
        <UpcomingGames />
      </section>

      {/* Registration */}
      <section className="px-6 pb-16 max-w-2xl mx-auto w-full">
        <h2 className="font-display text-xl font-bold text-foreground mb-4 flex items-center gap-2">
          <Users size={20} className="text-primary" /> Join the Club
        </h2>
        <JoinForm />
      </section>
    </div>
  );
}

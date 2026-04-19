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

/* ── Inline SVG Components ──────────────────────────────────────────────── */

function PuckSvg({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 60 20" className={`w-16 h-6 fill-current text-blue-400 opacity-60 ${className}`}>
      <ellipse cx="30" cy="10" rx="28" ry="9" />
    </svg>
  );
}

function IceRinkLinesSvg() {
  return (
    <svg viewBox="0 0 400 200" className="absolute inset-0 w-full h-full opacity-5 pointer-events-none">
      <circle cx="200" cy="100" r="80" fill="none" stroke="white" strokeWidth="2"/>
      <line x1="200" y1="0" x2="200" y2="200" stroke="white" strokeWidth="2"/>
      <circle cx="200" cy="100" r="8" fill="white"/>
    </svg>
  );
}

function HockeyStickPuckSvg({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 80 40" className={`w-12 h-6 text-amber-400 fill-current ${className}`}>
      <rect x="2" y="30" width="60" height="6" rx="3"/>
      <rect x="55" y="8" width="6" height="28" rx="3"/>
      <ellipse cx="70" cy="33" rx="8" ry="3" fill="#0099BF"/>
    </svg>
  );
}

function SectionDivider() {
  return (
    <div className="flex items-center justify-center gap-4 py-8">
      <div className="h-px flex-1 max-w-32 bg-gradient-to-r from-transparent to-primary/30" />
      <PuckSvg className="opacity-40" />
      <div className="h-px flex-1 max-w-32 bg-gradient-to-l from-transparent to-primary/30" />
    </div>
  );
}

/* ── Header ──────────────────────────────────────────────────────────── */

function WelcomeHeader() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 h-16 border-b border-white/10 bg-[hsl(222_47%_11%)]/90 backdrop-blur-md">
      <a href="/#/" className="flex items-center gap-2.5 cursor-pointer hover:opacity-80 transition-opacity">
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
      </a>
      <Link href="/dashboard">
        <Button variant="outline" size="sm" className="gap-1.5 border-primary/30 text-primary hover:bg-primary/10">
          Member Portal <ArrowRight size={14} />
        </Button>
      </Link>
    </header>
  );
}

/* ── Upcoming Games ──────────────────────────────────────────────────── */

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
        <Card key={game.id} className="bg-card/50 border-l-2 border-l-primary/60 border-border/40 hover:border-l-primary hover:bg-card/70 transition-all duration-200">
          <CardContent className="p-5 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-primary font-semibold font-display text-sm tracking-wide">
                <CalendarDays size={15} />
                {formatDate(game.date)}
              </div>
              <PuckSvg className="w-8 h-3 opacity-30" />
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
                <div className="flex items-center gap-2 pt-1">
                  <span className="inline-flex items-center gap-1.5">
                    <span className="text-foreground font-display font-semibold text-xs tracking-wide">BBHC</span>
                    <span className="inline-flex items-center justify-center w-7 h-5 rounded bg-primary/15 text-primary text-[10px] font-bold">VS</span>
                    <span className="text-foreground font-medium">{game.opponent}</span>
                  </span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

/* ── Registration Form ───────────────────────────────────────────────── */

const SKILL_LEVELS = [
  { value: "bench_warmer", label: "\u{1FA91} Bench Warmer \u2014 I'm here for the beer" },
  { value: "novice", label: "\u{1F423} Novice \u2014 Just figured out which end of the stick to hold" },
  { value: "beer_leaguer", label: "\u{1F37A} Beer Leaguer \u2014 Solid on skates, shaky on rules" },
  { value: "grinder", label: "\u{1F4AA} Grinder \u2014 No talent, all heart" },
  { value: "dangler", label: "\u{1F3D2} Dangler \u2014 Got moves, just ask me" },
  { value: "sniper", label: "\u{1F3AF} Sniper \u2014 Top shelf where mama hides the cookies" },
  { value: "retired_pro", label: "\u2B50 Retired Pro \u2014 Used to be good, trust me bro" },
];

const INITIAL_FORM = { firstName: "", lastName: "", email: "", phone: "", position: "", skillLevel: "" };

function JoinForm() {
  const [form, setForm] = useState({ ...INITIAL_FORM });
  const [success, setSuccess] = useState<{ firstName: string; skillLevel: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: (data: Record<string, unknown>) => apiRequest("POST", "/api/players", data),
    onSuccess: (player: { firstName: string; skillLevel: string }) => {
      setSuccess({ firstName: player.firstName, skillLevel: player.skillLevel });
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
      firstName: form.firstName,
      lastName: form.lastName,
      email: form.email,
      phone: form.phone || null,
      position: form.position,
      skillLevel: form.skillLevel,
    });
  }

  if (success) {
    const skillLabel = SKILL_LEVELS.find((s) => s.value === success.skillLevel)?.label || success.skillLevel;
    return (
      <Card className="bg-card/50 border-primary/30">
        <CardContent className="p-8 text-center space-y-3">
          <div className="text-4xl">{"\u{1F3D2}"}</div>
          <h3 className="text-xl font-display font-bold text-foreground">
            Welcome to the club, {success.firstName}!
          </h3>
          <p className="text-muted-foreground text-sm">
            You're officially a {skillLabel}. See you on the ice! {"\u{1F3D2}"}
          </p>
          <p className="text-muted-foreground text-sm">
            Head to the{" "}
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
              <Label htmlFor="reg-firstName">First Name *</Label>
              <Input
                id="reg-firstName"
                required
                placeholder="Bobby"
                value={form.firstName}
                onChange={(e) => setForm((f) => ({ ...f, firstName: e.target.value }))}
                className="bg-card border-border/60 text-foreground focus:ring-primary focus:border-primary"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="reg-lastName">Last Name *</Label>
              <Input
                id="reg-lastName"
                required
                placeholder="Orr"
                value={form.lastName}
                onChange={(e) => setForm((f) => ({ ...f, lastName: e.target.value }))}
                className="bg-card border-border/60 text-foreground focus:ring-primary focus:border-primary"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="reg-email">Email Address *</Label>
              <Input
                id="reg-email"
                type="email"
                required
                placeholder="bobby@example.com"
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                className="bg-card border-border/60 text-foreground focus:ring-primary focus:border-primary"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="reg-phone">Phone Number <span className="text-muted-foreground">(optional)</span></Label>
              <Input
                id="reg-phone"
                type="tel"
                placeholder="(555) 123-4567"
                value={form.phone}
                onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                className="bg-card border-border/60 text-foreground focus:ring-primary focus:border-primary"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="reg-position">Position *</Label>
              <Select value={form.position} onValueChange={(v) => setForm((f) => ({ ...f, position: v }))}>
                <SelectTrigger id="reg-position" className="bg-card border-border/60 text-foreground focus:ring-primary focus:border-primary">
                  <SelectValue placeholder="Select position" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="forward">Forward</SelectItem>
                  <SelectItem value="defense">Defence</SelectItem>
                  <SelectItem value="goalie">Goalie</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="reg-skillLevel">Skill Level *</Label>
              <Select value={form.skillLevel} onValueChange={(v) => setForm((f) => ({ ...f, skillLevel: v }))}>
                <SelectTrigger id="reg-skillLevel" className="bg-card border-border/60 text-foreground focus:ring-primary focus:border-primary">
                  <SelectValue placeholder="Select skill level" />
                </SelectTrigger>
                <SelectContent>
                  {SKILL_LEVELS.map((level) => (
                    <SelectItem key={level.value} value={level.value}>
                      {level.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {error && (
            <p className="text-sm text-destructive bg-destructive/10 rounded-md px-3 py-2">{error}</p>
          )}

          <Button type="submit" className="w-full bg-primary text-primary-foreground hover:bg-primary/90" disabled={mutation.isPending}>
            {mutation.isPending ? "Signing up..." : "Drop the Puck! \u{1F3D2}"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

/* ── Main Page ───────────────────────────────────────────────────────── */

export default function Welcome() {
  return (
    <div className="min-h-dvh flex flex-col bg-[hsl(222_47%_11%)]">
      <WelcomeHeader />

      {/* Hero — full-bleed background image */}
      <section
        className="relative min-h-screen flex items-center justify-center bg-cover bg-center"
        style={{
          backgroundImage: `url('https://images.stockcake.com/public/e/3/0/e3065a3c-db7b-4a51-85eb-985f72598ca0_large/dramatic-hockey-action-stockcake.jpg')`,
        }}
      >
        {/* Dark overlay */}
        <div className="absolute inset-0 bg-black/60" />
        {/* Ice rink pattern */}
        <IceRinkLinesSvg />

        <div className="relative z-10 text-center px-6 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-sm text-primary text-xs font-semibold tracking-widest mb-8 border border-white/10">
            <Trophy size={14} /> EST. BROOKLYN, NY
          </div>

          <h1 className="font-display text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.1] mb-6">
            <span className="hero-text-shimmer">Brooklyn Beer</span>
            <br />
            <span className="hero-text-shimmer">Hockey Club</span>
          </h1>

          <p className="text-lg sm:text-xl text-gray-300 max-w-lg mx-auto mb-10 leading-relaxed">
            Lace up, grab a cold one, and hit the ice with Brooklyn's finest beer league squad.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <a
              href="#join"
              className="inline-flex items-center gap-2 px-8 py-3 rounded-lg bg-primary text-primary-foreground font-display font-semibold text-sm tracking-wide hover:bg-primary/90 transition-colors"
            >
              Join the Club <span className="text-lg leading-none">↓</span>
            </a>
            <Link href="/dashboard">
              <span className="inline-flex items-center gap-2 px-8 py-3 rounded-lg border border-white/20 text-white font-display font-semibold text-sm tracking-wide hover:bg-white/10 transition-colors cursor-pointer">
                Member Portal <ArrowRight size={16} />
              </span>
            </Link>
          </div>
        </div>

        {/* Bottom fade */}
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[hsl(222_47%_11%)] to-transparent" />
      </section>

      {/* ── Section Divider ────────────────────────────────────────────── */}
      <SectionDivider />

      {/* ── Upcoming Games ─────────────────────────────────────────────── */}
      <section className="relative px-6 pb-12 max-w-5xl mx-auto w-full">
        <div
          className="absolute inset-0 -z-10 rounded-2xl bg-cover bg-center opacity-[0.07]"
          style={{
            backgroundImage: `url('https://www.brooklynbridgeskating.com/wp-content/uploads/2022/06/Hockey-One-Player-e1654900882358.webp')`,
          }}
        />
        <IceRinkLinesSvg />

        <h2 className="font-display text-2xl font-bold text-foreground mb-6 flex items-center gap-3">
          <CalendarDays size={22} className="text-primary" />
          Upcoming Games
          <PuckSvg className="ml-2 w-10 h-4 opacity-30" />
        </h2>
        <UpcomingGames />
      </section>

      {/* ── Section Divider ────────────────────────────────────────────── */}
      <SectionDivider />

      {/* ── Registration ───────────────────────────────────────────────── */}
      <section id="join" className="px-6 pb-16 max-w-5xl mx-auto w-full scroll-mt-20">
        <div className="grid lg:grid-cols-2 gap-10 items-start">
          {/* Left column — image (hidden on mobile) */}
          <div className="hidden lg:block relative rounded-2xl overflow-hidden">
            <img
              src="https://images.stockcake.com/public/1/0/f/10f97802-80ac-4760-b855-b452831bb117_medium/ice-spray-action-stockcake.jpg"
              alt="Hockey ice spray action"
              className="w-full h-full object-cover rounded-2xl"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[hsl(222_47%_11%)] via-transparent to-transparent" />
            <div className="absolute bottom-6 left-6 right-6">
              <p className="font-display text-lg font-bold text-white">Drop the puck.</p>
              <p className="text-sm text-gray-300 mt-1">Sign up and get on the ice with us.</p>
            </div>
          </div>

          {/* Right column — form */}
          <div>
            <div className="flex items-center gap-3 mb-4">
              <HockeyStickPuckSvg />
              <h2 className="font-display text-2xl font-bold text-foreground flex items-center gap-2">
                <Users size={22} className="text-primary" /> Join the Club
              </h2>
            </div>
            <p className="text-muted-foreground text-sm mb-6">
              Fill out the form below and you'll be on the roster. It's that easy.
            </p>
            <JoinForm />
          </div>
        </div>
      </section>

      {/* ── Footer ─────────────────────────────────────────────────────── */}
      <footer className="mt-auto border-t border-white/5 py-8 px-6 text-center">
        <p className="text-xs text-muted-foreground">
          Brooklyn Beer Hockey Club
        </p>
      </footer>
    </div>
  );
}

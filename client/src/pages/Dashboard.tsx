import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { type Game, type Player, type Attendance } from "@shared/schema";
import { CalendarDays, Users, CheckCircle, Trophy } from "lucide-react";
import { format, parseISO, isAfter } from "date-fns";
import { Link } from "wouter";
import { Badge } from "@/components/ui/badge";

function StatCard({ label, value, icon: Icon, color }: { label: string; value: string | number; icon: any; color: string }) {
  return (
    <div className="bg-card border border-border rounded-xl p-5 flex items-center gap-4">
      <div className={`p-2.5 rounded-lg ${color}`}>
        <Icon size={20} />
      </div>
      <div>
        <div className="text-2xl font-bold font-display leading-none">{value}</div>
        <div className="text-xs text-muted-foreground mt-1">{label}</div>
      </div>
    </div>
  );
}

function AttendancePill({ status }: { status: string }) {
  const map: Record<string, string> = {
    in: "status-in", out: "status-out", maybe: "status-maybe", pending: "status-pending"
  };
  return (
    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${map[status] || "status-pending"}`}>
      {status}
    </span>
  );
}

export default function Dashboard() {
  const { data: games = [] } = useQuery<Game[]>({ queryKey: ["/api/games"], queryFn: () => apiRequest("GET", "/api/games") });
  const { data: players = [] } = useQuery<Player[]>({ queryKey: ["/api/players"], queryFn: () => apiRequest("GET", "/api/players") });

  const upcoming = games
    .filter(g => g.status === "upcoming")
    .sort((a, b) => a.date.localeCompare(b.date));

  const nextGame = upcoming[0];
  const { data: nextAttendance = [] } = useQuery<(Attendance & { player: Player })[]>({
    queryKey: ["/api/games", nextGame?.id, "attendance"],
    queryFn: () => apiRequest("GET", `/api/games/${nextGame?.id}/attendance`),
    enabled: !!nextGame,
  });

  const completedGames = games.filter(g => g.status === "completed");
  const wins = completedGames.filter(g => (g.homeScore ?? 0) > (g.awayScore ?? 0)).length;
  const activePlayers = players.filter(p => p.isActive).length;
  const confirmed = nextAttendance.filter(a => a.status === "in").length;

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold font-display text-foreground">Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-1">Brooklyn Beer Hockey Club</p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Active players" value={activePlayers} icon={Users} color="bg-primary/10 text-primary" />
        <StatCard label="Games played" value={completedGames.length} icon={CalendarDays} color="bg-secondary/10 text-secondary" />
        <StatCard label="Wins" value={wins} icon={Trophy} color="bg-green-500/10 text-green-500" />
        <StatCard label="Confirmed (next)" value={confirmed} icon={CheckCircle} color="bg-purple-500/10 text-purple-400" />
      </div>

      {/* Next game */}
      {nextGame && (
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-border flex items-center justify-between">
            <h2 className="font-display font-semibold text-base">Next Game</h2>
            <Link href="/games">
              <span className="text-xs text-primary hover:underline cursor-pointer">View all →</span>
            </Link>
          </div>
          <div className="p-5 grid md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <CalendarDays size={15} className="text-muted-foreground" />
                <span className="text-sm font-medium">
                  {format(parseISO(nextGame.date), "EEEE, MMMM d")} · {nextGame.time}
                </span>
              </div>
              <div className="text-sm text-muted-foreground ml-5">{nextGame.location}</div>
              {nextGame.opponent && (
                <div className="text-sm text-muted-foreground ml-5">vs. {nextGame.opponent}</div>
              )}
              {nextGame.notes && (
                <div className="text-xs bg-muted/50 rounded-md px-3 py-2 text-muted-foreground ml-5">{nextGame.notes}</div>
              )}
            </div>
            <div>
              <div className="text-xs text-muted-foreground mb-3 font-medium uppercase tracking-wider">Attendance ({nextAttendance.length} players)</div>
              <div className="space-y-1.5 max-h-48 overflow-y-auto">
                {nextAttendance.map(a => (
                  <div key={a.id} className="flex items-center justify-between py-1">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-xs font-bold text-muted-foreground">
                        {a.player?.avatarInitials || a.player?.name?.slice(0, 2).toUpperCase()}
                      </div>
                      <span className="text-sm">{a.player?.name}</span>
                    </div>
                    <AttendancePill status={a.status} />
                  </div>
                ))}
                {nextAttendance.length === 0 && (
                  <div className="text-sm text-muted-foreground text-center py-4">No responses yet</div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Recent results */}
      {completedGames.length > 0 && (
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-border">
            <h2 className="font-display font-semibold text-base">Recent Results</h2>
          </div>
          <div className="divide-y divide-border">
            {completedGames.slice(0, 3).map(g => {
              const won = (g.homeScore ?? 0) > (g.awayScore ?? 0);
              return (
                <div key={g.id} className="px-5 py-3 flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium">{g.opponent || "Scrimmage"}</div>
                    <div className="text-xs text-muted-foreground">{format(parseISO(g.date), "MMM d")} · {g.location}</div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-sm font-bold">{g.homeScore} – {g.awayScore}</span>
                    <Badge variant={won ? "default" : "destructive"} className="text-xs">
                      {won ? "W" : "L"}
                    </Badge>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

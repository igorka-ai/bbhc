import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { type Game, type Player, type Attendance } from "@shared/schema";
import { format, parseISO } from "date-fns";
import { CalendarDays, MapPin, Plus, ChevronDown, ChevronUp, Check, X, HelpCircle, Clock, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

const STATUS_COLOR: Record<string, string> = {
  upcoming: "bg-primary/10 text-primary border-primary/20",
  completed: "bg-green-500/10 text-green-500 border-green-500/20",
  cancelled: "bg-destructive/10 text-destructive border-destructive/20",
};

const ATTENDANCE_ICONS = {
  in: <Check size={14} className="text-green-500" />,
  out: <X size={14} className="text-red-500" />,
  maybe: <HelpCircle size={14} className="text-yellow-500" />,
  pending: <Clock size={14} className="text-muted-foreground" />,
};

function GameCard({ game, onEdit, onDelete }: { game: Game; onEdit: (g: Game) => void; onDelete: (id: number) => void }) {
  const [expanded, setExpanded] = useState(false);
  const qc = useQueryClient();
  const { toast } = useToast();

  const { data: attendance = [] } = useQuery<(Attendance & { player: Player })[]>({
    queryKey: ["/api/games", game.id, "attendance"],
    queryFn: () => apiRequest("GET", `/api/games/${game.id}/attendance`),
    enabled: expanded,
  });

  const { data: players = [] } = useQuery<Player[]>({
    queryKey: ["/api/players"],
    queryFn: () => apiRequest("GET", "/api/players"),
  });

  const rsvpMutation = useMutation({
    mutationFn: ({ playerId, status }: { playerId: number; status: string }) =>
      apiRequest("POST", `/api/games/${game.id}/attendance`, { playerId, status }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/games", game.id, "attendance"] });
      toast({ title: "Attendance updated" });
    },
  });

  const inCount = attendance.filter(a => a.status === "in").length;

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden" data-testid={`card-game-${game.id}`}>
      <div className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className={cn("text-xs font-medium px-2 py-0.5 rounded-full border", STATUS_COLOR[game.status])}>
                {game.status}
              </span>
              {game.opponent && <span className="text-sm font-semibold">vs. {game.opponent}</span>}
              {game.homeScore != null && game.awayScore != null && (
                <span className="font-mono text-sm font-bold ml-1">{game.homeScore}–{game.awayScore}</span>
              )}
            </div>
            <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground flex-wrap">
              <span className="flex items-center gap-1.5">
                <CalendarDays size={13} />
                {format(parseISO(game.date), "EEE, MMM d")} · {game.time}
              </span>
              <span className="flex items-center gap-1.5">
                <MapPin size={13} />
                {game.location}
              </span>
            </div>
            {game.notes && <p className="text-xs text-muted-foreground mt-2 italic">{game.notes}</p>}
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <button onClick={() => onEdit(game)} className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-colors" aria-label="Edit game" data-testid={`button-edit-game-${game.id}`}>
              <Pencil size={14} />
            </button>
            <button onClick={() => onDelete(game.id)} className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors" aria-label="Delete game" data-testid={`button-delete-game-${game.id}`}>
              <Trash2 size={14} />
            </button>
          </div>
        </div>

        <button
          onClick={() => setExpanded(e => !e)}
          className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
          data-testid={`button-expand-game-${game.id}`}
        >
          {expanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
          {inCount} confirmed · Manage attendance
        </button>
      </div>

      {expanded && (
        <div className="border-t border-border px-5 py-4">
          <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">Player Attendance</div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {players.filter(p => p.isActive).map(player => {
              const rec = attendance.find(a => a.playerId === player.id);
              const currentStatus = rec?.status || "pending";
              return (
                <div key={player.id} className="flex items-center justify-between py-1.5 px-3 rounded-lg bg-muted/30">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-muted flex items-center justify-center text-xs font-bold">
                      {player.avatarInitials || player.name.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <div className="text-sm font-medium">{player.name}</div>
                      <div className="text-xs text-muted-foreground">{player.position}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    {(["in", "out", "maybe"] as const).map(s => (
                      <button
                        key={s}
                        onClick={() => rsvpMutation.mutate({ playerId: player.id, status: s })}
                        className={cn(
                          "p-1.5 rounded-md transition-colors text-xs",
                          currentStatus === s
                            ? s === "in" ? "bg-green-500/20 text-green-500" : s === "out" ? "bg-red-500/20 text-red-500" : "bg-yellow-500/20 text-yellow-500"
                            : "text-muted-foreground hover:bg-accent"
                        )}
                        title={s}
                        data-testid={`button-rsvp-${player.id}-${s}`}
                      >
                        {ATTENDANCE_ICONS[s]}
                      </button>
                    ))}
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

const EMPTY_FORM = { date: "", time: "10:00 PM", location: "Iceland, Brooklyn", opponent: "", homeScore: "", awayScore: "", status: "upcoming", notes: "" };

export default function Games() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [dialog, setDialog] = useState<"add" | "edit" | null>(null);
  const [editTarget, setEditTarget] = useState<Game | null>(null);
  const [form, setForm] = useState({ ...EMPTY_FORM });

  const { data: games = [], isLoading } = useQuery<Game[]>({
    queryKey: ["/api/games"],
    queryFn: () => apiRequest("GET", "/api/games"),
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/games", data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["/api/games"] }); setDialog(null); toast({ title: "Game added" }); },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => apiRequest("PATCH", `/api/games/${id}`, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["/api/games"] }); setDialog(null); toast({ title: "Game updated" }); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/games/${id}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["/api/games"] }); toast({ title: "Game removed" }); },
  });

  function openAdd() { setForm({ ...EMPTY_FORM }); setDialog("add"); }
  function openEdit(g: Game) {
    setEditTarget(g);
    setForm({
      date: g.date, time: g.time, location: g.location,
      opponent: g.opponent || "", homeScore: g.homeScore?.toString() || "",
      awayScore: g.awayScore?.toString() || "", status: g.status, notes: g.notes || "",
    });
    setDialog("edit");
  }

  function handleSubmit() {
    const data = {
      ...form,
      homeScore: form.homeScore !== "" ? Number(form.homeScore) : null,
      awayScore: form.awayScore !== "" ? Number(form.awayScore) : null,
    };
    if (dialog === "add") createMutation.mutate(data);
    else if (editTarget) updateMutation.mutate({ id: editTarget.id, data });
  }

  const upcoming = games.filter(g => g.status === "upcoming").sort((a, b) => a.date.localeCompare(b.date));
  const completed = games.filter(g => g.status === "completed").sort((a, b) => b.date.localeCompare(a.date));
  const cancelled = games.filter(g => g.status === "cancelled");

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold font-display">Games</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{games.length} total games</p>
        </div>
        <Button onClick={openAdd} size="sm" data-testid="button-add-game">
          <Plus size={15} className="mr-1.5" /> Add game
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1,2,3].map(i => <div key={i} className="skeleton h-24 rounded-xl" />)}
        </div>
      ) : (
        <>
          {upcoming.length > 0 && (
            <section>
              <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Upcoming</h2>
              <div className="space-y-3">
                {upcoming.map(g => <GameCard key={g.id} game={g} onEdit={openEdit} onDelete={id => deleteMutation.mutate(id)} />)}
              </div>
            </section>
          )}
          {completed.length > 0 && (
            <section>
              <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Past games</h2>
              <div className="space-y-3">
                {completed.map(g => <GameCard key={g.id} game={g} onEdit={openEdit} onDelete={id => deleteMutation.mutate(id)} />)}
              </div>
            </section>
          )}
          {games.length === 0 && (
            <div className="text-center py-16 text-muted-foreground">
              <CalendarDays size={36} className="mx-auto mb-3 opacity-30" />
              <p className="font-medium">No games yet</p>
              <p className="text-sm mt-1">Add your first game to get started</p>
            </div>
          )}
        </>
      )}

      {/* Add / Edit dialog */}
      <Dialog open={!!dialog} onOpenChange={o => !o && setDialog(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display">{dialog === "add" ? "Add game" : "Edit game"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="date">Date</Label>
                <Input id="date" type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} data-testid="input-game-date" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="time">Time</Label>
                <Input id="time" placeholder="10:00 PM" value={form.time} onChange={e => setForm(f => ({ ...f, time: e.target.value }))} data-testid="input-game-time" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="location">Location</Label>
              <Input id="location" value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} data-testid="input-game-location" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="opponent">Opponent (optional)</Label>
              <Input id="opponent" value={form.opponent} onChange={e => setForm(f => ({ ...f, opponent: e.target.value }))} data-testid="input-game-opponent" />
            </div>
            <div className="space-y-1.5">
              <Label>Status</Label>
              <Select value={form.status} onValueChange={v => setForm(f => ({ ...f, status: v }))}>
                <SelectTrigger data-testid="select-game-status"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="upcoming">Upcoming</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {form.status === "completed" && (
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="homeScore">Our score</Label>
                  <Input id="homeScore" type="number" value={form.homeScore} onChange={e => setForm(f => ({ ...f, homeScore: e.target.value }))} data-testid="input-home-score" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="awayScore">Their score</Label>
                  <Input id="awayScore" type="number" value={form.awayScore} onChange={e => setForm(f => ({ ...f, awayScore: e.target.value }))} data-testid="input-away-score" />
                </div>
              </div>
            )}
            <div className="space-y-1.5">
              <Label htmlFor="notes">Notes</Label>
              <Textarea id="notes" rows={2} value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Bring tape, start time may change..." data-testid="input-game-notes" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDialog(null)}>Cancel</Button>
            <Button onClick={handleSubmit} disabled={!form.date || !form.time || !form.location} data-testid="button-save-game">
              {dialog === "add" ? "Add game" : "Save changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

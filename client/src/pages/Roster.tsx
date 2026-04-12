import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { type Player } from "@shared/schema";
import { Plus, Pencil, Trash2, Users, UserCheck, UserX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

const POSITION_COLORS: Record<string, string> = {
  goalie: "bg-secondary/15 text-secondary border-secondary/20",
  skater: "bg-primary/10 text-primary border-primary/20",
};

const AVATAR_COLORS = [
  "bg-blue-500/20 text-blue-400",
  "bg-purple-500/20 text-purple-400",
  "bg-green-500/20 text-green-400",
  "bg-yellow-500/20 text-yellow-500",
  "bg-pink-500/20 text-pink-400",
  "bg-cyan-500/20 text-cyan-400",
];

function PlayerAvatar({ player, size = "md" }: { player: Player; size?: "sm" | "md" | "lg" }) {
  const idx = player.id % AVATAR_COLORS.length;
  const sizeClass = { sm: "w-8 h-8 text-xs", md: "w-10 h-10 text-sm", lg: "w-14 h-14 text-lg" }[size];
  return (
    <div className={cn("rounded-full flex items-center justify-center font-bold shrink-0", sizeClass, AVATAR_COLORS[idx])}>
      {player.avatarInitials || player.name.slice(0, 2).toUpperCase()}
    </div>
  );
}

const EMPTY_FORM = { name: "", number: "", position: "skater", email: "", phone: "", isActive: true, avatarInitials: "", joinedAt: new Date().toISOString().split("T")[0] };

export default function Roster() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [dialog, setDialog] = useState<"add" | "edit" | null>(null);
  const [editTarget, setEditTarget] = useState<Player | null>(null);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [filter, setFilter] = useState<"all" | "active" | "inactive">("all");

  const { data: players = [], isLoading } = useQuery<Player[]>({
    queryKey: ["/api/players"],
    queryFn: () => apiRequest("GET", "/api/players"),
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/players", data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["/api/players"] }); setDialog(null); toast({ title: "Player added" }); },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => apiRequest("PATCH", `/api/players/${id}`, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["/api/players"] }); setDialog(null); toast({ title: "Player updated" }); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/players/${id}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["/api/players"] }); toast({ title: "Player removed" }); },
  });

  function openAdd() { setForm({ ...EMPTY_FORM }); setDialog("add"); }
  function openEdit(p: Player) {
    setEditTarget(p);
    setForm({
      name: p.name, number: p.number?.toString() || "", position: p.position,
      email: p.email || "", phone: p.phone || "", isActive: p.isActive,
      avatarInitials: p.avatarInitials || "", joinedAt: p.joinedAt || "",
    });
    setDialog("edit");
  }

  function handleSubmit() {
    const data = { ...form, number: form.number ? Number(form.number) : null };
    if (dialog === "add") createMutation.mutate(data);
    else if (editTarget) updateMutation.mutate({ id: editTarget.id, data });
  }

  const filtered = players.filter(p =>
    filter === "all" ? true : filter === "active" ? p.isActive : !p.isActive
  );

  const active = players.filter(p => p.isActive).length;
  const goalies = players.filter(p => p.isActive && p.position === "goalie").length;

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold font-display">Roster</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{active} active · {goalies} goalies</p>
        </div>
        <Button onClick={openAdd} size="sm" data-testid="button-add-player">
          <Plus size={15} className="mr-1.5" /> Add player
        </Button>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 bg-muted/40 rounded-lg p-1 w-fit">
        {(["all", "active", "inactive"] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={cn("px-3 py-1.5 rounded-md text-sm font-medium transition-colors", filter === f ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground")}
            data-testid={`button-filter-${f}`}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {/* Player grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {[1,2,3,4,5,6].map(i => <div key={i} className="skeleton h-24 rounded-xl" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <Users size={36} className="mx-auto mb-3 opacity-30" />
          <p className="font-medium">No players</p>
          <p className="text-sm mt-1">Add your first player to build the roster</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filtered.map(player => (
            <div key={player.id} className={cn("bg-card border border-border rounded-xl p-4 flex items-start gap-3", !player.isActive && "opacity-60")} data-testid={`card-player-${player.id}`}>
              <PlayerAvatar player={player} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="font-semibold text-sm truncate">{player.name}</span>
                  {player.number && <span className="font-mono text-xs text-muted-foreground">#{player.number}</span>}
                </div>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  <span className={cn("text-xs px-1.5 py-0.5 rounded border", POSITION_COLORS[player.position])}>
                    {player.position}
                  </span>
                  {!player.isActive && <span className="text-xs text-muted-foreground">inactive</span>}
                </div>
                {player.email && <p className="text-xs text-muted-foreground mt-1 truncate">{player.email}</p>}
              </div>
              <div className="flex gap-1 shrink-0">
                <button onClick={() => openEdit(player)} className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-accent transition-colors" aria-label="Edit" data-testid={`button-edit-player-${player.id}`}>
                  <Pencil size={13} />
                </button>
                <button onClick={() => deleteMutation.mutate(player.id)} className="p-1 rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors" aria-label="Delete" data-testid={`button-delete-player-${player.id}`}>
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit dialog */}
      <Dialog open={!!dialog} onOpenChange={o => !o && setDialog(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display">{dialog === "add" ? "Add player" : "Edit player"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2 space-y-1.5">
                <Label htmlFor="name">Full name</Label>
                <Input id="name" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Mike Torres" data-testid="input-player-name" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="number">Jersey #</Label>
                <Input id="number" type="number" value={form.number} onChange={e => setForm(f => ({ ...f, number: e.target.value }))} placeholder="11" data-testid="input-player-number" />
              </div>
              <div className="space-y-1.5">
                <Label>Position</Label>
                <Select value={form.position} onValueChange={v => setForm(f => ({ ...f, position: v }))}>
                  <SelectTrigger data-testid="select-player-position"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="skater">Skater</SelectItem>
                    <SelectItem value="goalie">Goalie</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="col-span-2 space-y-1.5">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="player@email.com" data-testid="input-player-email" />
              </div>
              <div className="col-span-2 space-y-1.5">
                <Label htmlFor="phone">Phone (optional)</Label>
                <Input id="phone" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="555-0100" data-testid="input-player-phone" />
              </div>
              <div className="col-span-2 space-y-1.5">
                <Label htmlFor="initials">Initials (for avatar)</Label>
                <Input id="initials" maxLength={2} value={form.avatarInitials} onChange={e => setForm(f => ({ ...f, avatarInitials: e.target.value.toUpperCase() }))} placeholder="MT" data-testid="input-player-initials" />
              </div>
              <div className="col-span-2 flex items-center justify-between py-1">
                <Label htmlFor="active-toggle" className="cursor-pointer">Active player</Label>
                <Switch id="active-toggle" checked={form.isActive} onCheckedChange={v => setForm(f => ({ ...f, isActive: v }))} data-testid="switch-player-active" />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDialog(null)}>Cancel</Button>
            <Button onClick={handleSubmit} disabled={!form.name} data-testid="button-save-player">
              {dialog === "add" ? "Add player" : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

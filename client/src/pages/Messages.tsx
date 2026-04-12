import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { type Message, type Player, type Game } from "@shared/schema";
import { format, parseISO } from "date-fns";
import { Send, Trash2, MessageSquare, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

const AVATAR_COLORS = [
  "bg-blue-500/20 text-blue-400",
  "bg-purple-500/20 text-purple-400",
  "bg-green-500/20 text-green-400",
  "bg-yellow-500/20 text-yellow-500",
  "bg-pink-500/20 text-pink-400",
  "bg-cyan-500/20 text-cyan-400",
];

type MessageWithPlayer = Message & { player?: Player };

function MessageBubble({ msg, onDelete }: { msg: MessageWithPlayer; onDelete: (id: number) => void }) {
  const colorIdx = (msg.playerId || 0) % AVATAR_COLORS.length;
  const initials = msg.player?.avatarInitials || msg.playerName.slice(0, 2).toUpperCase();

  return (
    <div className="flex gap-3 group" data-testid={`message-${msg.id}`}>
      <div className={cn("w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-0.5", AVATAR_COLORS[colorIdx])}>
        {initials}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-2 mb-1">
          <span className="text-sm font-semibold">{msg.playerName}</span>
          <span className="text-xs text-muted-foreground">
            {format(parseISO(msg.postedAt), "MMM d · h:mm a")}
          </span>
        </div>
        <div className="bg-card border border-border rounded-2xl rounded-tl-sm px-4 py-2.5 text-sm leading-relaxed inline-block max-w-full">
          {msg.content}
        </div>
      </div>
      <button
        onClick={() => onDelete(msg.id)}
        className="opacity-0 group-hover:opacity-100 p-1.5 text-muted-foreground hover:text-destructive transition-all self-start mt-1"
        aria-label="Delete message"
        data-testid={`button-delete-message-${msg.id}`}
      >
        <Trash2 size={13} />
      </button>
    </div>
  );
}

export default function Messages() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [content, setContent] = useState("");
  const [selectedPlayer, setSelectedPlayer] = useState<string>("");
  const [gameFilter, setGameFilter] = useState<string>("all");
  const bottomRef = useRef<HTMLDivElement>(null);

  const { data: players = [] } = useQuery<Player[]>({
    queryKey: ["/api/players"],
    queryFn: () => apiRequest("GET", "/api/players"),
  });

  const { data: games = [] } = useQuery<Game[]>({
    queryKey: ["/api/games"],
    queryFn: () => apiRequest("GET", "/api/games"),
  });

  const { data: messages = [], isLoading } = useQuery<MessageWithPlayer[]>({
    queryKey: ["/api/messages", gameFilter],
    queryFn: () => {
      const url = gameFilter !== "all" ? `/api/messages?gameId=${gameFilter}` : "/api/messages";
      return apiRequest("GET", url);
    },
    refetchInterval: 10000,
  });

  const sendMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/messages", data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/messages"] });
      setContent("");
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/messages/${id}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["/api/messages"] }); toast({ title: "Message deleted" }); },
  });

  function handleSend() {
    if (!content.trim() || !selectedPlayer) return;
    const player = players.find(p => p.id.toString() === selectedPlayer);
    sendMutation.mutate({
      content: content.trim(),
      playerName: player?.name || "Anonymous",
      playerId: player?.id || null,
      gameId: gameFilter !== "all" ? Number(gameFilter) : null,
    });
  }

  function handleKey(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
  }

  // Scroll to bottom on load
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  const sorted = [...messages].reverse();

  return (
    <div className="flex flex-col h-[calc(100dvh-3.5rem)] md:h-screen max-w-3xl mx-auto">
      {/* Header */}
      <div className="px-6 py-5 border-b border-border shrink-0">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-xl font-bold font-display">Team Chat</h1>
            <p className="text-sm text-muted-foreground mt-0.5">Team messaging board</p>
          </div>
          <Select value={gameFilter} onValueChange={setGameFilter}>
            <SelectTrigger className="w-48 text-sm" data-testid="select-game-filter">
              <SelectValue placeholder="All messages" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All messages</SelectItem>
              {games.map(g => (
                <SelectItem key={g.id} value={g.id.toString()}>
                  {format(parseISO(g.date), "MMM d")} · {g.opponent || "Scrimmage"}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
        {isLoading ? (
          <div className="space-y-4">
            {[1,2,3].map(i => (
              <div key={i} className="flex gap-3">
                <div className="skeleton w-9 h-9 rounded-full" />
                <div className="flex-1 space-y-1.5">
                  <div className="skeleton h-3 w-32 rounded" />
                  <div className="skeleton h-10 w-64 rounded-2xl" />
                </div>
              </div>
            ))}
          </div>
        ) : sorted.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center py-16 text-muted-foreground">
            <MessageSquare size={40} className="mb-3 opacity-25" />
            <p className="font-medium">No messages yet</p>
            <p className="text-sm mt-1">Be the first to say something!</p>
          </div>
        ) : (
          sorted.map(msg => (
            <MessageBubble key={msg.id} msg={msg} onDelete={id => deleteMutation.mutate(id)} />
          ))
        )}
        <div ref={bottomRef} />
      </div>

      {/* Compose */}
      <div className="px-6 py-4 border-t border-border bg-background/80 backdrop-blur shrink-0">
        <div className="flex flex-col gap-2">
          <div className="flex gap-2 items-center">
            <Select value={selectedPlayer} onValueChange={setSelectedPlayer}>
              <SelectTrigger className="w-44 text-sm shrink-0" data-testid="select-message-player">
                <SelectValue placeholder="Posting as…" />
              </SelectTrigger>
              <SelectContent>
                {players.filter(p => p.isActive).map(p => (
                  <SelectItem key={p.id} value={p.id.toString()}>{p.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex gap-2">
            <Textarea
              value={content}
              onChange={e => setContent(e.target.value)}
              onKeyDown={handleKey}
              placeholder="Type a message… (Enter to send)"
              rows={2}
              className="resize-none flex-1"
              data-testid="input-message-content"
            />
            <Button
              onClick={handleSend}
              disabled={!content.trim() || !selectedPlayer || sendMutation.isPending}
              size="icon"
              className="self-end h-10 w-10 shrink-0"
              aria-label="Send"
              data-testid="button-send-message"
            >
              <Send size={15} />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

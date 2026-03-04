import { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { Calendar, MapPin, Users, Check, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";

const TYPE_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  treino_grupo: { label: "Treino em Grupo", color: "text-green-400", bg: "bg-green-400/10 border-green-400/30" },
  masterclass: { label: "Masterclass", color: "text-primary", bg: "bg-primary/10 border-primary/30" },
  retiro: { label: "Retiro", color: "text-purple-400", bg: "bg-purple-400/10 border-purple-400/30" },
  devocional: { label: "Devocional", color: "text-primary-light", bg: "bg-primary-light/10 border-primary-light/30" },
  online: { label: "Online", color: "text-blue-400", bg: "bg-blue-400/10 border-blue-400/30" },
};

const ALL_TYPES = Object.keys(TYPE_CONFIG);

interface EventRow {
  id: string;
  title: string;
  description: string;
  type: string;
  datetime: string;
  location_name: string;
  location_address: string;
  max_capacity: number | null;
  cover_image_url: string | null;
}

const Agenda = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [events, setEvents] = useState<EventRow[]>([]);
  const [confirmations, setConfirmations] = useState<Map<string, number>>(new Map());
  const [userConfirmed, setUserConfirmed] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);

    // Fetch future events
    const { data: eventsData } = await supabase
      .from("events")
      .select("id, title, description, type, datetime, location_name, location_address, max_capacity, cover_image_url")
      .gte("datetime", new Date().toISOString())
      .order("datetime", { ascending: true });

    const evts = (eventsData ?? []) as EventRow[];
    setEvents(evts);

    // Fetch confirmation counts
    if (evts.length > 0) {
      const ids = evts.map((e) => e.id);
      const { data: confs } = await supabase
        .from("event_confirmations")
        .select("event_id")
        .in("event_id", ids);

      const countMap = new Map<string, number>();
      (confs ?? []).forEach((c: any) => {
        countMap.set(c.event_id, (countMap.get(c.event_id) || 0) + 1);
      });
      setConfirmations(countMap);

      // User's confirmations
      if (user) {
        const { data: userConfs } = await supabase
          .from("event_confirmations")
          .select("event_id")
          .eq("user_id", user.id)
          .in("event_id", ids);

        setUserConfirmed(new Set((userConfs ?? []).map((c: any) => c.event_id)));
      }
    }

    setLoading(false);
  }, [user]);

  useEffect(() => {
    load();
  }, [load]);

  const handleConfirm = async (eventId: string) => {
    if (!user) {
      toast({ title: "Faça login", description: "Você precisa estar logado para confirmar presença.", variant: "destructive" });
      return;
    }

    const { error } = await supabase
      .from("event_confirmations")
      .insert({ event_id: eventId, user_id: user.id });

    if (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
      return;
    }

    setUserConfirmed((prev) => new Set(prev).add(eventId));
    setConfirmations((prev) => new Map(prev).set(eventId, (prev.get(eventId) || 0) + 1));
    toast({ title: "Presença confirmada!" });
  };

  const filtered = filter ? events.filter((e) => e.type === filter) : events;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <span className="font-display text-2xl text-primary animate-pulse tracking-wider">CARREGANDO...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="font-display text-4xl text-primary tracking-wider">AGENDA</h1>

      {/* Filters */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        <button
          onClick={() => setFilter(null)}
          className={cn(
            "px-3 py-1.5 rounded-md font-mono text-xs uppercase tracking-wider border transition-all shrink-0",
            !filter ? "bg-primary text-primary-foreground border-primary" : "border-primary/15 text-muted-foreground hover:text-foreground"
          )}
        >
          <Filter className="h-3 w-3 inline mr-1" /> Todos
        </button>
        {ALL_TYPES.map((t) => {
          const cfg = TYPE_CONFIG[t];
          return (
            <button
              key={t}
              onClick={() => setFilter(filter === t ? null : t)}
              className={cn(
                "px-3 py-1.5 rounded-md font-mono text-xs uppercase tracking-wider border transition-all shrink-0",
                filter === t ? cn(cfg.bg, cfg.color) : "border-primary/15 text-muted-foreground hover:text-foreground"
              )}
            >
              {cfg.label}
            </button>
          );
        })}
      </div>

      {/* Event list */}
      {filtered.length === 0 ? (
        <div className="text-center py-16">
          <Calendar className="h-12 w-12 text-primary/30 mx-auto mb-4" />
          <p className="text-muted-foreground">Nenhum evento próximo.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((event) => {
            const cfg = TYPE_CONFIG[event.type] || TYPE_CONFIG.online;
            const count = confirmations.get(event.id) || 0;
            const isConfirmed = userConfirmed.has(event.id);
            const isFull = event.max_capacity !== null && count >= event.max_capacity;
            const spotsLeft = event.max_capacity !== null ? event.max_capacity - count : null;
            const dt = new Date(event.datetime);

            return (
              <Link
                key={event.id}
                to={`/agenda/${event.id}`}
                className="block rounded-lg border border-primary/15 bg-background-secondary p-5 hover:border-primary/30 transition-all"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    {/* Type badge */}
                    <span className={cn("inline-block px-2 py-0.5 rounded text-xs font-mono uppercase tracking-wider border mb-2", cfg.bg, cfg.color)}>
                      {cfg.label}
                    </span>

                    <h3 className="font-display text-xl text-foreground tracking-wider mb-2 truncate">
                      {event.title.toUpperCase()}
                    </h3>

                    <div className="flex flex-col gap-1 text-xs font-mono text-muted-foreground">
                      <span className="flex items-center gap-1.5">
                        <Calendar className="h-3 w-3 shrink-0" />
                        {dt.toLocaleDateString("pt-BR", { weekday: "short", day: "numeric", month: "short" })} — {dt.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                      </span>
                      {event.location_name && (
                        <span className="flex items-center gap-1.5">
                          <MapPin className="h-3 w-3 shrink-0" />
                          {event.location_name}
                        </span>
                      )}
                      <span className="flex items-center gap-1.5">
                        <Users className="h-3 w-3 shrink-0" />
                        {count} confirmado{count !== 1 ? "s" : ""}
                        {spotsLeft !== null && ` · ${spotsLeft} vaga${spotsLeft !== 1 ? "s" : ""}`}
                      </span>
                    </div>
                  </div>

                  {/* Status button */}
                  <div className="shrink-0 mt-1">
                    {isConfirmed ? (
                      <span className="flex items-center gap-1 text-[#4CAF72] font-mono text-xs uppercase tracking-wider">
                        <Check className="h-3.5 w-3.5" /> Confirmado
                      </span>
                    ) : isFull ? (
                      <span className="font-mono text-xs text-destructive uppercase tracking-wider">Lotado</span>
                    ) : (
                      <Button
                        size="sm"
                        onClick={(e) => {
                          e.preventDefault();
                          handleConfirm(event.id);
                        }}
                        className="bg-primary text-primary-foreground hover:bg-primary-light font-mono text-xs uppercase tracking-wider"
                      >
                        Confirmar
                      </Button>
                    )}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Agenda;

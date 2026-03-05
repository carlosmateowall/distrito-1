import { useEffect, useState, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useChecklistStats } from "@/hooks/useChecklistStats";
import { Button } from "@/components/ui/button";
import { Flame, ChevronRight, Play, MapPin, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";
import Leaderboard from "@/components/Leaderboard";
import ProfileStats from "@/components/ProfileStats";
import { getWeekNumber, type WorkoutRow } from "@/lib/workout-utils";
import { Skeleton } from "@/components/ui/skeleton";

interface Profile {
  nome: string;
  streak_atual: number;
  objetivo: string | null;
}

const getGreeting = () => {
  const h = new Date().getHours();
  if (h < 12) return "BOM DIA";
  if (h < 18) return "BOA TARDE";
  return "BOA NOITE";
};

const formatDate = () => {
  const now = new Date();
  return now.toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
};

// --- Sub-components ---

const DayHeader = ({ nome, streak }: { nome: string; streak: number }) => (
  <div className="mb-8">
    <h1 className="font-display text-4xl md:text-5xl text-primary tracking-wider leading-none">
      {getGreeting()}, {nome.split(" ")[0].toUpperCase() || "GUERREIRO"}
    </h1>
    <p className="font-mono text-xs text-muted-foreground uppercase tracking-wider mt-2 capitalize">
      {formatDate()}
    </p>
    {streak > 0 && (
      <div className="flex items-center gap-2 mt-3">
        <Flame className="h-5 w-5 text-primary" />
        <span className="font-mono text-sm text-primary">
          {streak} {streak === 1 ? "dia consecutivo" : "dias consecutivos"}
        </span>
      </div>
    )}
  </div>
);

const DevotionalCard = ({ onMarkRead, read }: { onMarkRead: () => void; read: boolean }) => (
  <div className="bg-background-tertiary rounded-lg border border-primary/15 border-l-2 border-l-primary p-5">
    <p className="font-mono text-xs text-primary uppercase tracking-wider mb-3">
      Devocional do dia
    </p>
    <blockquote className="text-foreground text-sm leading-relaxed mb-1 italic">
      "Tudo posso naquele que me fortalece."
    </blockquote>
    <p className="text-muted-foreground text-xs font-mono mb-4">— Filipenses 4:13</p>
    <Button
      onClick={onMarkRead}
      disabled={read}
      variant="outline"
      size="sm"
      className={cn(
        "font-mono text-xs uppercase tracking-wider",
        read
          ? "border-primary/30 text-primary/50 cursor-default"
          : "border-primary/30 text-primary hover:bg-primary/10"
      )}
    >
      {read ? "✓ Lido" : "Marcar como lido"}
    </Button>
  </div>
);

const protocolsMeta = [
  { key: "corpo" as const, label: "Corpo", emoji: "⚡" },
  { key: "mente" as const, label: "Mente", emoji: "🧠" },
  { key: "espirito" as const, label: "Espírito", emoji: "✝️" },
];

const ChecklistSummary = () => {
  const { stats } = useChecklistStats();

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <p className="font-mono text-xs text-primary uppercase tracking-wider">Checklist diário</p>
        <Link
          to="/checklist"
          className="font-mono text-xs text-muted-foreground hover:text-primary transition-colors flex items-center gap-1"
        >
          Ver tudo <ChevronRight className="h-3 w-3" />
        </Link>
      </div>
       <div className="grid grid-cols-3 gap-3">
         {protocolsMeta.map((p) => {
           const { done, total } = stats[p.key];
           return (
             <div
               key={p.key}
               className="bg-background-tertiary rounded-lg border border-primary/15 p-4 text-center"
             >
               <span className="text-lg mb-1 block text-primary">{p.emoji}</span>
               <p className="font-mono text-xs text-muted-foreground uppercase tracking-wider mb-2">
                 {p.label}
               </p>
               <p className="font-display text-xl text-foreground">
                 {done}<span className="text-muted-foreground">/{total}</span>
               </p>
               <div className="h-1 bg-primary/15 rounded-full mt-2 overflow-hidden">
                 <div
                   className="h-full bg-primary rounded-full transition-all duration-500"
                   style={{ width: `${(done / total) * 100}%` }}
                 />
               </div>
             </div>
           );
         })}
       </div>
    </div>
  );
};

const TodayWorkout = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [workout, setWorkout] = useState<WorkoutRow | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const today = new Date().getDay();
    const week = getWeekNumber();

    supabase
      .from("workouts")
      .select("*")
      .eq("user_id", user.id)
      .eq("week_number", week)
      .eq("day_of_week", today)
      .maybeSingle()
      .then(({ data }) => {
        setWorkout(data as WorkoutRow | null);
        setLoading(false);
      });
  }, [user]);

  if (loading) {
    return (
      <div className="bg-background-tertiary rounded-lg border border-primary/15 p-5 space-y-3">
        <div className="skeleton-gold h-3 w-24 rounded" />
        <div className="skeleton-gold h-6 w-40 rounded" />
        <div className="skeleton-gold h-3 w-20 rounded" />
      </div>
    );
  }

  if (!workout) {
    return (
      <div className="bg-background-tertiary rounded-lg border border-primary/15 p-5">
        <p className="font-mono text-xs text-primary uppercase tracking-wider mb-3">Treino de hoje</p>
        <h3 className="font-display text-2xl text-foreground tracking-wider mb-1">SEM TREINO</h3>
        <p className="font-mono text-xs text-muted-foreground uppercase tracking-wider mb-4">
          Nenhum treino gerado para hoje
        </p>
        <Button
          onClick={() => navigate("/treino")}
          variant="outline"
          size="sm"
          className="font-mono text-xs uppercase tracking-wider border-primary/30 text-primary hover:bg-primary/10"
        >
          Ir para treinos
        </Button>
      </div>
    );
  }

  const isDescanso = workout.status === "descanso";
  const isDone = workout.status === "concluido";

  return (
    <div className="bg-background-tertiary rounded-lg border border-primary/15 p-5">
      <p className="font-mono text-xs text-primary uppercase tracking-wider mb-3">Treino de hoje</p>
      <h3 className="font-display text-2xl text-foreground tracking-wider mb-1">
        {isDescanso ? "DESCANSO" : workout.day_name.toUpperCase()}
      </h3>
      <p className={cn(
        "font-mono text-xs uppercase tracking-wider mb-4",
        isDone ? "text-primary" : isDescanso ? "text-muted-foreground" : "text-primary"
      )}>
        {isDone ? "Concluído ✓" : isDescanso ? "Dia de descanso" : "Pendente"}
      </p>
      {!isDescanso && !isDone && (
        <Button
          onClick={() => navigate(`/treino/${workout.id}`)}
          className="bg-primary text-primary-foreground hover:bg-primary-light font-display text-base tracking-wider"
        >
          <Play className="h-4 w-4 mr-1" />
          INICIAR TREINO
        </Button>
      )}
    </div>
  );
};

interface EventRow {
  id: string;
  title: string;
  datetime: string;
  location_name: string;
}

const NextEvent = () => {
  const [event, setEvent] = useState<EventRow | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from("events")
      .select("id, title, datetime, location_name")
      .gte("datetime", new Date().toISOString())
      .order("datetime", { ascending: true })
      .limit(1)
      .maybeSingle()
      .then(({ data }) => {
        setEvent(data as EventRow | null);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="bg-background-tertiary rounded-lg border border-primary/15 p-5 space-y-3">
        <div className="skeleton-gold h-3 w-24 rounded" />
        <div className="skeleton-gold h-5 w-48 rounded" />
        <div className="skeleton-gold h-3 w-32 rounded" />
      </div>
    );
  }

  if (!event) return null;

  const dt = new Date(event.datetime);

  return (
    <div className="bg-background-tertiary rounded-lg border border-primary/15 p-5">
      <p className="font-mono text-xs text-primary uppercase tracking-wider mb-3">Próximo evento</p>
      <h3 className="font-display text-xl text-foreground tracking-wider mb-2">
        {event.title.toUpperCase()}
      </h3>
      <div className="flex items-center gap-2 text-muted-foreground text-xs font-mono mb-1">
        <Calendar className="h-3 w-3" />
        <span>
          {dt.toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "short" })} — {dt.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
        </span>
      </div>
      {event.location_name && (
        <div className="flex items-center gap-2 text-muted-foreground text-xs font-mono mb-4">
          <MapPin className="h-3 w-3" />
          <span>{event.location_name}</span>
        </div>
      )}
      <Button
        variant="outline"
        size="sm"
        className="font-mono text-xs uppercase tracking-wider border-primary/30 text-primary hover:bg-primary/10"
        asChild
      >
        <Link to={`/agenda/${event.id}`}>Ver detalhes</Link>
      </Button>
    </div>
  );
};

// --- Main Dashboard ---

const Dashboard = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [devotionalRead, setDevotionalRead] = useState(false);

  useEffect(() => {
    if (!user) return;

    // Load profile
    supabase
      .from("profiles")
      .select("nome, streak_atual, objetivo")
      .eq("id", user.id)
      .single()
      .then(({ data }) => {
        if (data) setProfile(data as Profile);
      });

    // Check if devotional already read today
    const today = new Date().toISOString().split("T")[0];
    supabase
      .from("daily_checklist")
      .select("completed")
      .eq("user_id", user.id)
      .eq("date", today)
      .eq("item_key", "devocional_lido")
      .maybeSingle()
      .then(({ data }) => {
        if (data?.completed) setDevotionalRead(true);
      });
  }, [user]);

  const handleDevotionalRead = async () => {
    if (!user) return;
    setDevotionalRead(true);

    const today = new Date().toISOString().split("T")[0];
    // Upsert the checklist item
    const { data: existing } = await supabase
      .from("daily_checklist")
      .select("id")
      .eq("user_id", user.id)
      .eq("date", today)
      .eq("item_key", "devocional_lido")
      .maybeSingle();

    if (existing) {
      await supabase
        .from("daily_checklist")
        .update({ completed: true })
        .eq("id", existing.id);
    } else {
      await supabase
        .from("daily_checklist")
        .insert({
          user_id: user.id,
          date: today,
          protocol: "espirito",
          item_key: "devocional_lido",
          completed: true,
        });
    }
  };

  if (!profile) {
    return (
      <div className="space-y-6 py-4">
        <div className="space-y-3">
          <div className="skeleton-gold h-10 w-72 rounded" />
          <div className="skeleton-gold h-4 w-48 rounded" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="skeleton-gold h-40 rounded-lg" />
          <div className="skeleton-gold h-40 rounded-lg" />
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div className="skeleton-gold h-28 rounded-lg" />
          <div className="skeleton-gold h-28 rounded-lg" />
          <div className="skeleton-gold h-28 rounded-lg" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <DayHeader nome={profile.nome} streak={profile.streak_atual} />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <DevotionalCard onMarkRead={handleDevotionalRead} read={devotionalRead} />
        <TodayWorkout />
      </div>

      <ChecklistSummary />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <ProfileStats />
        <Leaderboard />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <NextEvent />
      </div>

      {/* Manifesto */}
      <div className="text-center py-8 border-t border-primary/10 mt-4">
        <p className="font-display text-xl md:text-2xl text-primary tracking-wider leading-relaxed max-w-2xl mx-auto">
          "O 1% NÃO É SOBRE SER MELHOR QUE OS OUTROS. É SOBRE SER 1% MELHOR QUE VOCÊ MESMO, TODO DIA, SEM EXCEÇÃO."
        </p>
      </div>
    </div>
  );
};

export default Dashboard;

import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Flame, Dumbbell, Brain, Cross, ChevronRight, Play, MapPin, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";

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
      {getGreeting()}, {nome.toUpperCase() || "GUERREIRO"}
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

const protocols = [
  { icon: Dumbbell, label: "Corpo", emoji: "⚡" },
  { icon: Brain, label: "Mente", emoji: "🧠" },
  { icon: Cross, label: "Espírito", emoji: "✝️" },
];

const ChecklistSummary = () => (
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
      {protocols.map((p) => {
        const done = 0;
        const total = 3;
        return (
          <div
            key={p.label}
            className="bg-background-tertiary rounded-lg border border-primary/15 p-4 text-center"
          >
            <span className="text-lg mb-1 block">{p.emoji}</span>
            <p className="font-mono text-xs text-muted-foreground uppercase tracking-wider mb-2">
              {p.label}
            </p>
            <p className="font-display text-xl text-foreground">
              {done}<span className="text-muted-foreground">/{total}</span>
            </p>
            {/* Progress bar */}
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

const TodayWorkout = () => {
  const navigate = useNavigate();
  const workoutName = "PEITO + TRÍCEPS";
  const status = "pendente" as "pendente" | "concluido" | "descanso";

  const statusConfig = {
    pendente: { label: "Pendente", color: "text-primary" },
    concluido: { label: "Concluído ✓", color: "text-green-400" },
    descanso: { label: "Dia de descanso", color: "text-muted-foreground" },
  };

  return (
    <div className="bg-background-tertiary rounded-lg border border-primary/15 p-5">
      <p className="font-mono text-xs text-primary uppercase tracking-wider mb-3">
        Treino de hoje
      </p>
      <h3 className="font-display text-2xl text-foreground tracking-wider mb-1">
        {status === "descanso" ? "DESCANSO" : workoutName}
      </h3>
      <p className={cn("font-mono text-xs uppercase tracking-wider mb-4", statusConfig[status].color)}>
        {statusConfig[status].label}
      </p>
      {status === "pendente" && (
        <Button
          onClick={() => navigate("/treino")}
          className="bg-primary text-primary-foreground hover:bg-primary-light font-display text-base tracking-wider"
        >
          <Play className="h-4 w-4 mr-1" />
          INICIAR TREINO
        </Button>
      )}
    </div>
  );
};

const NextEvent = () => (
  <div className="bg-background-tertiary rounded-lg border border-primary/15 p-5">
    <p className="font-mono text-xs text-primary uppercase tracking-wider mb-3">
      Próximo evento
    </p>
    <h3 className="font-display text-xl text-foreground tracking-wider mb-2">
      MEETUP DISTRITO 1%
    </h3>
    <div className="flex items-center gap-2 text-muted-foreground text-xs font-mono mb-1">
      <Calendar className="h-3 w-3" />
      <span>Sábado, 15 Mar — 10:00</span>
    </div>
    <div className="flex items-center gap-2 text-muted-foreground text-xs font-mono mb-4">
      <MapPin className="h-3 w-3" />
      <span>São Paulo, SP</span>
    </div>
    <Button
      variant="outline"
      size="sm"
      className="font-mono text-xs uppercase tracking-wider border-primary/30 text-primary hover:bg-primary/10"
      asChild
    >
      <Link to="/agenda">Ver detalhes</Link>
    </Button>
  </div>
);

// --- Main Dashboard ---

const Dashboard = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [devotionalRead, setDevotionalRead] = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("profiles")
      .select("nome, streak_atual, objetivo")
      .eq("id", user.id)
      .single()
      .then(({ data }) => {
        if (data) setProfile(data as Profile);
      });
  }, [user]);

  if (!profile) {
    return (
      <div className="flex items-center justify-center py-20">
        <span className="font-display text-2xl text-primary animate-pulse tracking-wider">
          CARREGANDO...
        </span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <DayHeader nome={profile.nome} streak={profile.streak_atual} />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <DevotionalCard onMarkRead={() => setDevotionalRead(true)} read={devotionalRead} />
        <TodayWorkout />
      </div>

      <ChecklistSummary />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <NextEvent />
      </div>
    </div>
  );
};

export default Dashboard;

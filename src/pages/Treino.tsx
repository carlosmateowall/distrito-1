import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  fetchWeekWorkouts,
  generateAndSaveWorkout,
  getWeekNumber,
  DAY_LABELS,
  type WorkoutRow,
} from "@/lib/workout-utils";
import { Dumbbell, Play, Trophy, Loader2, Sparkles, History } from "lucide-react";
import { Link } from "react-router-dom";

const Treino = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [workouts, setWorkouts] = useState<WorkoutRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const week = getWeekNumber();

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data } = await fetchWeekWorkouts(user.id, week);
    setWorkouts(data ?? []);
    setLoading(false);
  }, [user, week]);

  useEffect(() => {
    load();
  }, [load]);

  const handleGenerate = async () => {
    if (!user) return;
    setGenerating(true);
    try {
      const { data: profile } = await supabase
        .from("profiles")
        .select("objetivo, nivel, dias_treino, equipamento, restricoes_alimentares")
        .eq("id", user.id)
        .single();

      if (!profile) throw new Error("Perfil não encontrado");

      await generateAndSaveWorkout(user.id, week, profile);
      toast({ title: "Treino gerado!", description: "Seu plano semanal está pronto." });
      await load();
    } catch (e: any) {
      toast({ title: "Erro", description: e.message, variant: "destructive" });
    } finally {
      setGenerating(false);
    }
  };

  const completedCount = workouts.filter((w) => w.status === "concluido").length;
  const trainingDays = workouts.filter((w) => w.status !== "descanso").length;
  const progress = trainingDays > 0 ? Math.round((completedCount / trainingDays) * 100) : 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <span className="font-display text-2xl text-primary animate-pulse tracking-wider">CARREGANDO...</span>
      </div>
    );
  }

  // No workouts for this week
  if (workouts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <Dumbbell className="h-12 w-12 text-primary/30 mb-4" />
        <h1 className="font-display text-3xl text-primary tracking-wider mb-2">SEM TREINO ESTA SEMANA</h1>
        <p className="text-muted-foreground text-sm mb-6 max-w-sm">
          Gere um plano personalizado com IA baseado no seu perfil.
        </p>
        <Button
          onClick={handleGenerate}
          disabled={generating}
          className="bg-primary text-primary-foreground hover:bg-primary-light font-display text-lg tracking-wider h-12 px-8"
        >
          {generating ? (
            <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> GERANDO...</>
          ) : (
            <><Sparkles className="h-4 w-4 mr-2" /> GERAR MEU TREINO</>
          )}
        </Button>
        <p className="text-muted-foreground font-mono text-xs mt-4 max-w-xs">
          Treino gerado com IA — em breve revisado por profissional
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-4xl text-primary tracking-wider">TREINO</h1>
          <p className="font-mono text-xs text-muted-foreground uppercase tracking-wider mt-1">
            Semana {week} — {progress}% concluído
          </p>
        </div>
        <Link
          to="/treino/historico"
          className="text-muted-foreground hover:text-primary transition-colors flex items-center gap-1 font-mono text-xs uppercase tracking-wider"
        >
          <History className="h-3.5 w-3.5" /> Histórico
        </Link>
      </div>

      {/* Progress bar */}
      <div className="h-2 bg-primary/15 rounded-full overflow-hidden">
        <div
          className="h-full bg-primary rounded-full transition-all duration-700"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Weekly grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {workouts.map((w) => {
          const isDescanso = w.status === "descanso";
          const isDone = w.status === "concluido";

          return (
            <div
              key={w.id}
              className={cn(
                "rounded-lg border p-5 transition-all",
                isDescanso
                  ? "border-border-subtle bg-background-secondary opacity-60"
                  : isDone
                  ? "border-[#4CAF72]/30 bg-[#4CAF72]/5"
                  : "border-primary/15 bg-background-tertiary"
              )}
            >
              <p className="font-mono text-xs text-muted-foreground uppercase tracking-wider mb-1">
                {DAY_LABELS[w.day_of_week]}
              </p>
              <h3 className="font-display text-xl text-foreground tracking-wider mb-3">
                {w.day_name.toUpperCase()}
              </h3>

              {isDone ? (
                <div className="flex items-center gap-1.5 text-[#4CAF72] font-mono text-xs uppercase tracking-wider">
                  <Trophy className="h-3.5 w-3.5" /> Concluído
                </div>
              ) : !isDescanso ? (
                <Button
                  onClick={() => navigate(`/treino/${w.id}`)}
                  size="sm"
                  className="bg-primary text-primary-foreground hover:bg-primary-light font-display tracking-wider"
                >
                  <Play className="h-3.5 w-3.5 mr-1" /> INICIAR
                </Button>
              ) : (
                <span className="font-mono text-xs text-muted-foreground uppercase tracking-wider">
                  Descanso
                </span>
              )}
            </div>
          );
        })}
      </div>

      <p className="text-muted-foreground font-mono text-xs text-center">
        Treino gerado com IA — em breve revisado por profissional
      </p>
    </div>
  );
};

export default Treino;

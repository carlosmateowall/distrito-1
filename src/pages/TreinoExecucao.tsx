import { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { fetchWorkoutExercises, type ExerciseRow, type WorkoutRow } from "@/lib/workout-utils";
import { ArrowLeft, CheckCircle2, Timer, Trophy, PartyPopper } from "lucide-react";

const TreinoExecucao = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [workout, setWorkout] = useState<WorkoutRow | null>(null);
  const [exercises, setExercises] = useState<ExerciseRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [completed, setCompleted] = useState(false);

  // Rest timer
  const [restTime, setRestTime] = useState(0);
  const [restActive, setRestActive] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const load = useCallback(async () => {
    if (!id) return;
    const { data: wData } = await supabase
      .from("workouts")
      .select("*")
      .eq("id", id)
      .single();
    setWorkout(wData as WorkoutRow | null);

    const { data: exData } = await fetchWorkoutExercises(id);
    setExercises(exData ?? []);
    setLoading(false);
  }, [id]);

  useEffect(() => {
    load();
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [load]);

  const startRestTimer = (seconds: number) => {
    if (timerRef.current) clearInterval(timerRef.current);
    setRestTime(seconds);
    setRestActive(true);
    timerRef.current = setInterval(() => {
      setRestTime((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          setRestActive(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const toggleExercise = async (ex: ExerciseRow) => {
    const newCompleted = !ex.completed;
    await supabase.from("exercises").update({ completed: newCompleted }).eq("id", ex.id);
    const updated = exercises.map((e) => (e.id === ex.id ? { ...e, completed: newCompleted } : e));
    setExercises(updated);

    if (newCompleted) {
      startRestTimer(ex.rest_seconds);
    }

    // Check all done
    if (updated.every((e) => e.completed)) {
      await finishWorkout();
    }
  };

  const finishWorkout = async () => {
    if (!id || !user) return;
    await supabase.from("workouts").update({ status: "concluido" }).eq("id", id);

    // Mark checklist treino_concluido
    const today = new Date().toISOString().split("T")[0];
    await supabase
      .from("daily_checklist")
      .update({ completed: true })
      .eq("user_id", user.id)
      .eq("date", today)
      .eq("item_key", "treino_concluido");

    setCompleted(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <span className="font-display text-2xl text-primary animate-pulse tracking-wider">CARREGANDO...</span>
      </div>
    );
  }

  // Completion screen
  if (completed) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center animate-in fade-in slide-in-from-bottom-4 duration-500">
        <PartyPopper className="h-12 w-12 text-primary mb-4" />
        <h1 className="font-display text-4xl text-primary tracking-wider mb-2">TREINO CONCLUÍDO!</h1>
        <p className="text-muted-foreground text-sm mb-2">
          {workout?.day_name} finalizado com sucesso.
        </p>
        <p className="text-foreground font-display text-lg tracking-wider mb-8">
          "DISCIPLINA É O QUE SEPARA O 1%"
        </p>
        <Button
          onClick={() => navigate("/treino")}
          className="bg-primary text-primary-foreground hover:bg-primary-light font-display text-lg tracking-wider"
        >
          VOLTAR AOS TREINOS
        </Button>
      </div>
    );
  }

  const completedCount = exercises.filter((e) => e.completed).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <button
          onClick={() => navigate("/treino")}
          className="text-muted-foreground hover:text-primary transition-colors flex items-center gap-1 font-mono text-xs uppercase tracking-wider mb-3"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Voltar
        </button>
        <h1 className="font-display text-3xl text-primary tracking-wider">
          {workout?.day_name?.toUpperCase()}
        </h1>
        <p className="font-mono text-xs text-muted-foreground uppercase tracking-wider mt-1">
          {completedCount}/{exercises.length} exercícios
        </p>
      </div>

      {/* Progress */}
      <div className="h-2 bg-primary/15 rounded-full overflow-hidden">
        <div
          className="h-full bg-primary rounded-full transition-all duration-500"
          style={{ width: exercises.length ? `${(completedCount / exercises.length) * 100}%` : "0%" }}
        />
      </div>

      {/* Rest timer overlay */}
      {restActive && (
        <div className="bg-background-tertiary border border-primary/15 rounded-lg p-5 text-center animate-in fade-in duration-300">
          <Timer className="h-6 w-6 text-primary mx-auto mb-2" />
          <p className="font-mono text-xs text-muted-foreground uppercase tracking-wider mb-1">Descanso</p>
          <p className="font-display text-5xl text-primary">{restTime}s</p>
        </div>
      )}

      {/* Exercise list */}
      <div className="space-y-3">
        {exercises.map((ex) => (
          <div
            key={ex.id}
            className={cn(
              "rounded-lg border p-4 transition-all duration-300",
              ex.completed
                ? "border-[#4CAF72]/30 bg-[#4CAF72]/5"
                : "border-primary/15 bg-background-secondary"
            )}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1">
                <h3
                  className={cn(
                    "font-display text-lg tracking-wider",
                    ex.completed ? "text-muted-foreground line-through" : "text-foreground"
                  )}
                >
                  {ex.name.toUpperCase()}
                </h3>
                <p className="font-mono text-xs text-muted-foreground mt-0.5">
                  {ex.muscle_groups}
                </p>
                <div className="flex items-center gap-4 mt-2 font-mono text-xs text-foreground">
                  <span>{ex.sets} séries</span>
                  <span>{ex.reps} reps</span>
                  <span className="text-muted-foreground">{ex.rest_seconds}s descanso</span>
                </div>
                {ex.weight_suggested && (
                  <p className="font-mono text-xs text-primary mt-1">
                    Sugestão: {ex.weight_suggested}
                  </p>
                )}
              </div>

              <button
                onClick={() => toggleExercise(ex)}
                className={cn(
                  "mt-1 shrink-0 transition-colors",
                  ex.completed ? "text-[#4CAF72]" : "text-muted-foreground hover:text-primary"
                )}
              >
                <CheckCircle2 className="h-7 w-7" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TreinoExecucao;

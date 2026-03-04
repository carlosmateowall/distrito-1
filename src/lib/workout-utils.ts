import { supabase } from "@/integrations/supabase/client";

// Get ISO week number
export function getWeekNumber(d: Date = new Date()): number {
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  date.setUTCDate(date.getUTCDate() + 4 - (date.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  return Math.ceil(((date.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}

export const DAY_LABELS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

export interface WorkoutRow {
  id: string;
  user_id: string;
  week_number: number;
  day_of_week: number;
  day_name: string;
  status: string;
  created_at: string;
}

export interface ExerciseRow {
  id: string;
  workout_id: string;
  name: string;
  muscle_groups: string;
  sets: number;
  reps: string;
  rest_seconds: number;
  weight_suggested: string | null;
  completed: boolean;
  order_index: number;
}

export async function fetchWeekWorkouts(userId: string, week: number) {
  const { data, error } = await supabase
    .from("workouts")
    .select("*")
    .eq("user_id", userId)
    .eq("week_number", week)
    .order("day_of_week");
  return { data: data as WorkoutRow[] | null, error };
}

export async function fetchWorkoutExercises(workoutId: string) {
  const { data, error } = await supabase
    .from("exercises")
    .select("*")
    .eq("workout_id", workoutId)
    .order("order_index");
  return { data: data as ExerciseRow[] | null, error };
}

export async function generateAndSaveWorkout(
  userId: string,
  week: number,
  profile: { objetivo: string | null; nivel: string | null; dias_treino: number | null; equipamento: string | null; restricoes_alimentares: string | null }
) {
  const { data, error } = await supabase.functions.invoke("generate-workout", {
    body: {
      objetivo: profile.objetivo,
      nivel: profile.nivel,
      dias_treino: profile.dias_treino,
      equipamento: profile.equipamento,
      restricoes_alimentares: profile.restricoes_alimentares,
    },
  });

  if (error) throw new Error(error.message || "Erro ao gerar treino");
  if (data?.error) throw new Error(data.error);

  const plan = data;
  if (!plan?.days || !Array.isArray(plan.days)) throw new Error("Formato inválido da IA");

  // Insert workouts
  for (const day of plan.days) {
    const { data: workout, error: wErr } = await supabase
      .from("workouts")
      .insert({
        user_id: userId,
        week_number: week,
        day_of_week: day.day_of_week,
        day_name: day.day_name,
        status: day.status,
      })
      .select()
      .single();

    if (wErr) throw wErr;

    if (day.exercises && day.exercises.length > 0 && workout) {
      const exercises = day.exercises.map((ex: any, i: number) => ({
        workout_id: workout.id,
        name: ex.name,
        muscle_groups: ex.muscle_groups || "",
        sets: ex.sets || 3,
        reps: ex.reps || "8-12",
        rest_seconds: ex.rest_seconds || 60,
        weight_suggested: ex.weight_suggested || null,
        order_index: ex.order_index ?? i,
      }));

      const { error: eErr } = await supabase.from("exercises").insert(exercises);
      if (eErr) throw eErr;
    }
  }
}

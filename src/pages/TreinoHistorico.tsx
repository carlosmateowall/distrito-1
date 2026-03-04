import { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { ArrowLeft, Trophy } from "lucide-react";
import { cn } from "@/lib/utils";

interface PR {
  id: string;
  exercise_name: string;
  weight: number;
  reps: number;
  recorded_at: string;
}

interface WeekVolume {
  week: number;
  volume: number;
}

const TreinoHistorico = () => {
  const { user } = useAuth();
  const [prs, setPrs] = useState<PR[]>([]);
  const [weekVolumes, setWeekVolumes] = useState<WeekVolume[]>([]);
  const [trainedDays, setTrainedDays] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!user) return;

    // PRs
    const { data: prData } = await supabase
      .from("personal_records")
      .select("*")
      .eq("user_id", user.id)
      .order("recorded_at", { ascending: false });
    setPrs((prData as PR[]) ?? []);

    // Completed workouts for volume chart & calendar
    const { data: workoutsData } = await supabase
      .from("workouts")
      .select("week_number, status, created_at")
      .eq("user_id", user.id)
      .eq("status", "concluido");

    if (workoutsData) {
      // Week volumes (count completed per week, last 8)
      const volumeMap = new Map<number, number>();
      const days = new Set<string>();

      workoutsData.forEach((w: any) => {
        volumeMap.set(w.week_number, (volumeMap.get(w.week_number) || 0) + 1);
        days.add(new Date(w.created_at).toISOString().split("T")[0]);
      });

      const sorted = Array.from(volumeMap.entries())
        .sort((a, b) => a[0] - b[0])
        .slice(-8)
        .map(([week, volume]) => ({ week, volume }));

      setWeekVolumes(sorted);
      setTrainedDays(days);
    }

    setLoading(false);
  }, [user]);

  useEffect(() => {
    load();
  }, [load]);

  // Calendar for current month
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const monthName = now.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });

  const calendarCells: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) calendarCells.push(null);
  for (let d = 1; d <= daysInMonth; d++) calendarCells.push(d);

  const maxVolume = weekVolumes.length > 0 ? Math.max(...weekVolumes.map((v) => v.volume)) : 1;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <span className="font-display text-2xl text-primary animate-pulse tracking-wider">CARREGANDO...</span>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <Link
          to="/treino"
          className="text-muted-foreground hover:text-primary transition-colors flex items-center gap-1 font-mono text-xs uppercase tracking-wider mb-3"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Voltar
        </Link>
        <h1 className="font-display text-4xl text-primary tracking-wider">HISTÓRICO</h1>
      </div>

      {/* Volume chart */}
      <div>
        <p className="font-mono text-xs text-primary uppercase tracking-wider mb-4">
          Treinos por semana (últimas 8)
        </p>
        {weekVolumes.length > 0 ? (
          <div className="flex items-end gap-2 h-32">
            {weekVolumes.map((v) => (
              <div key={v.week} className="flex-1 flex flex-col items-center gap-1">
                <div
                  className="w-full bg-primary rounded-t transition-all duration-500"
                  style={{ height: `${(v.volume / maxVolume) * 100}%`, minHeight: 4 }}
                />
                <span className="font-mono text-xs text-muted-foreground">S{v.week}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground text-sm">Nenhum dado ainda.</p>
        )}
      </div>

      {/* Calendar */}
      <div>
        <p className="font-mono text-xs text-primary uppercase tracking-wider mb-4 capitalize">
          Frequência — {monthName}
        </p>
        <div className="grid grid-cols-7 gap-1 text-center">
          {["D", "S", "T", "Q", "Q", "S", "S"].map((d, i) => (
            <span key={i} className="font-mono text-xs text-muted-foreground py-1">{d}</span>
          ))}
          {calendarCells.map((day, i) => {
            if (day === null) return <div key={i} />;
            const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
            const trained = trainedDays.has(dateStr);
            const isToday = day === now.getDate();

            return (
              <div
                key={i}
                className={cn(
                  "aspect-square flex items-center justify-center rounded text-xs font-mono transition-colors",
                  trained ? "bg-primary text-primary-foreground" : "text-muted-foreground",
                  isToday && !trained && "ring-1 ring-primary/30"
                )}
              >
                {day}
              </div>
            );
          })}
        </div>
      </div>

      {/* PRs */}
      <div>
        <p className="font-mono text-xs text-primary uppercase tracking-wider mb-4 flex items-center gap-2">
          <Trophy className="h-3.5 w-3.5" /> Records pessoais
        </p>
        {prs.length > 0 ? (
          <div className="space-y-2">
            {prs.map((pr) => (
              <div
                key={pr.id}
                className="bg-background-tertiary border border-primary/15 rounded-lg p-4 flex items-center justify-between"
              >
                <div>
                  <h3 className="font-display text-base text-foreground tracking-wider">
                    {pr.exercise_name.toUpperCase()}
                  </h3>
                  <p className="font-mono text-xs text-muted-foreground">
                    {new Date(pr.recorded_at).toLocaleDateString("pt-BR")}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-display text-xl text-primary">{pr.weight}kg</p>
                  <p className="font-mono text-xs text-muted-foreground">{pr.reps} reps</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground text-sm">Nenhum PR registrado ainda.</p>
        )}
      </div>
    </div>
  );
};

export default TreinoHistorico;

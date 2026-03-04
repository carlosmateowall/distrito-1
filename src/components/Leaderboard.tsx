import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";
import { Flame, Trophy, Crown } from "lucide-react";

interface RankingEntry {
  user_id: string;
  nome: string;
  score: number;
}

const RANK_ICONS = ["🥇", "🥈", "🥉"];

const Leaderboard = () => {
  const { user } = useAuth();
  const [ranking, setRanking] = useState<RankingEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const { data } = await supabase
      .from("weekly_ranking")
      .select("user_id, nome, score")
      .order("score", { ascending: false })
      .limit(10);

    setRanking((data as unknown as RankingEntry[]) ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) return null;
  if (ranking.length === 0) {
    return (
      <div className="bg-background-tertiary border border-primary/15 rounded-lg p-5">
        <p className="font-mono text-xs text-primary uppercase tracking-wider mb-3 flex items-center gap-2">
          <Crown className="h-3.5 w-3.5" /> Ranking semanal
        </p>
        <p className="text-muted-foreground text-sm">Nenhum dado esta semana.</p>
      </div>
    );
  }

  // Find user's position
  const userIdx = ranking.findIndex((r) => r.user_id === user?.id);

  // Format name: First Name + Last Initial
  const formatName = (nome: string) => {
    const parts = nome.trim().split(" ");
    if (parts.length <= 1) return parts[0] || "Membro";
    return `${parts[0]} ${parts[parts.length - 1][0]}.`;
  };

  return (
    <div className="bg-background-tertiary border border-primary/15 rounded-lg p-5">
      <div className="flex items-center justify-between mb-4">
        <p className="font-mono text-xs text-primary uppercase tracking-wider flex items-center gap-2">
          <Crown className="h-3.5 w-3.5" /> Ranking semanal
        </p>
        {userIdx >= 0 && (
          <span className="font-mono text-xs text-muted-foreground">
            Sua posição: #{userIdx + 1}
          </span>
        )}
      </div>

      <div className="space-y-2">
        {ranking.map((entry, i) => {
          const isUser = entry.user_id === user?.id;
          return (
            <div
              key={entry.user_id}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-lg transition-colors",
                isUser ? "bg-primary/10 border border-primary/20" : ""
              )}
            >
              {/* Rank */}
              <span className="w-6 text-center shrink-0">
                {i < 3 ? (
                  <span className="text-lg">{RANK_ICONS[i]}</span>
                ) : (
                  <span className="font-mono text-xs text-muted-foreground">{i + 1}</span>
                )}
              </span>

              {/* Avatar */}
              <div className="h-7 w-7 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center shrink-0">
                <span className="font-display text-xs text-primary">
                  {(entry.nome || "?")[0].toUpperCase()}
                </span>
              </div>

              {/* Name */}
              <span className={cn("flex-1 text-sm truncate", isUser ? "text-primary font-medium" : "text-foreground")}>
                {formatName(entry.nome)}
              </span>

              {/* Score */}
              <span className="font-mono text-xs text-primary shrink-0">
                {entry.score} pts
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Leaderboard;

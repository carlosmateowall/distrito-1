import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Flame, Trophy, Award } from "lucide-react";
import { BADGE_INFO } from "@/components/BadgeCelebration";

interface ProfileData {
  nome: string;
  streak_atual: number;
  streak_maximo: number;
}

interface Badge {
  badge_type: string;
  earned_at: string;
}

const ProfileStats = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [badges, setBadges] = useState<Badge[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!user) return;

    const [{ data: p }, { data: b }] = await Promise.all([
      supabase.from("profiles").select("nome, streak_atual, streak_maximo").eq("id", user.id).single(),
      supabase.from("badges").select("badge_type, earned_at").eq("user_id", user.id).order("earned_at"),
    ]);

    setProfile(p as ProfileData | null);
    setBadges((b as Badge[]) ?? []);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading || !profile) return null;

  return (
    <div className="bg-background-tertiary border border-primary/15 rounded-lg p-5 space-y-4">
      <p className="font-mono text-xs text-primary uppercase tracking-wider flex items-center gap-2">
        <Award className="h-3.5 w-3.5" /> Seu perfil
      </p>

      <div className="grid grid-cols-2 gap-3">
        <div className="text-center">
          <Flame className="h-5 w-5 text-primary mx-auto mb-1" />
          <p className="font-display text-2xl text-primary">{profile.streak_atual}</p>
          <p className="font-mono text-xs text-muted-foreground">Streak atual</p>
        </div>
        <div className="text-center">
          <Trophy className="h-5 w-5 text-primary mx-auto mb-1" />
          <p className="font-display text-2xl text-foreground">{profile.streak_maximo}</p>
          <p className="font-mono text-xs text-muted-foreground">Streak máximo</p>
        </div>
      </div>

      {badges.length > 0 && (
        <div>
          <p className="font-mono text-xs text-muted-foreground uppercase tracking-wider mb-2">
            Badges ({badges.length})
          </p>
          <div className="flex flex-wrap gap-2">
            {badges.map((b) => {
              const info = BADGE_INFO[b.badge_type];
              return (
                <div
                  key={b.badge_type}
                  className="h-10 w-10 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center"
                  title={info?.title || b.badge_type}
                >
                  <span className="text-lg">{info?.icon || "🏅"}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfileStats;

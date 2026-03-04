import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { BADGE_INFO } from "@/components/BadgeCelebration";
import {
  Flame, Trophy, Award, LogOut, Pencil, X, Check,
  Dumbbell, CheckCircle2, Calendar, User,
} from "lucide-react";

interface ProfileData {
  nome: string;
  email: string;
  cidade: string | null;
  objetivo: string | null;
  dias_treino: number | null;
  streak_atual: number;
  streak_maximo: number;
  created_at: string;
}

interface Badge {
  badge_type: string;
  earned_at: string;
}

const Perfil = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [badges, setBadges] = useState<Badge[]>([]);
  const [stats, setStats] = useState({ workouts: 0, perfectDays: 0, upcomingEvents: 0 });
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  // Edit form
  const [editNome, setEditNome] = useState("");
  const [editCidade, setEditCidade] = useState("");
  const [editObjetivo, setEditObjetivo] = useState("");
  const [editDias, setEditDias] = useState("");

  const load = useCallback(async () => {
    if (!user) return;

    const [{ data: p }, { data: b }, { data: w }, { data: cl }, { data: ev }] = await Promise.all([
      supabase.from("profiles").select("nome, email, cidade, objetivo, dias_treino, streak_atual, streak_maximo, created_at").eq("id", user.id).single(),
      supabase.from("badges").select("badge_type, earned_at").eq("user_id", user.id).order("earned_at"),
      supabase.from("workouts").select("id").eq("user_id", user.id).eq("status", "concluido"),
      supabase.from("daily_checklist").select("date").eq("user_id", user.id).eq("completed", true),
      supabase.from("event_confirmations").select("event_id, events:event_id(datetime)").eq("user_id", user.id),
    ]);

    setProfile(p as ProfileData | null);
    setBadges((b as Badge[]) ?? []);

    // Count perfect days (all 9 items completed on same date)
    const dateCounts = new Map<string, number>();
    ((cl as any[]) ?? []).forEach((r) => {
      dateCounts.set(r.date, (dateCounts.get(r.date) || 0) + 1);
    });
    const perfectDays = Array.from(dateCounts.values()).filter((c) => c >= 9).length;

    const upcomingEvents = ((ev as any[]) ?? []).filter(
      (e) => e.events?.datetime && new Date(e.events.datetime) > new Date()
    ).length;

    setStats({
      workouts: (w as any[])?.length ?? 0,
      perfectDays,
      upcomingEvents,
    });

    if (p) {
      const prof = p as ProfileData;
      setEditNome(prof.nome);
      setEditCidade(prof.cidade ?? "");
      setEditObjetivo(prof.objetivo ?? "");
      setEditDias(prof.dias_treino?.toString() ?? "");
    }

    setLoading(false);
  }, [user]);

  useEffect(() => {
    load();
  }, [load]);

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);

    const { error } = await supabase
      .from("profiles")
      .update({
        nome: editNome.trim() || profile?.nome,
        cidade: editCidade.trim() || null,
        objetivo: editObjetivo.trim() || null,
        dias_treino: editDias ? parseInt(editDias) : null,
      })
      .eq("id", user.id);

    if (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Perfil atualizado!" });
      setEditing(false);
      await load();
    }
    setSaving(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/login");
  };

  if (loading) {
    return (
      <div className="space-y-6 max-w-lg mx-auto">
        <div className="flex flex-col items-center gap-4">
          <Skeleton className="h-20 w-20 rounded-full bg-background-tertiary" />
          <Skeleton className="h-8 w-48 bg-background-tertiary" />
          <Skeleton className="h-4 w-32 bg-background-tertiary" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-20 rounded-lg bg-background-tertiary" />
          ))}
        </div>
      </div>
    );
  }

  if (!profile) return null;

  const initials = profile.nome
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();

  const memberDays = Math.floor(
    (Date.now() - new Date(profile.created_at).getTime()) / (1000 * 60 * 60 * 24)
  );

  return (
    <div className="space-y-8 max-w-lg mx-auto">
      {/* Avatar & Name */}
      <div className="flex flex-col items-center text-center">
        <div className="h-20 w-20 rounded-full bg-background border-2 border-primary/30 flex items-center justify-center mb-4">
          <span className="font-display text-3xl text-primary">{initials}</span>
        </div>
        <h1 className="font-display text-3xl text-foreground tracking-wider">
          {profile.nome.toUpperCase()}
        </h1>
        <div className="flex items-center gap-3 mt-2 font-mono text-xs text-muted-foreground">
          {profile.cidade && <span>{profile.cidade}</span>}
          <span>Membro há {memberDays} dia{memberDays !== 1 ? "s" : ""}</span>
        </div>
      </div>

      {/* Streak cards */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-background-tertiary border border-primary/15 rounded-lg p-4 text-center">
          <Flame className="h-5 w-5 text-primary mx-auto mb-1" />
          <p className="font-display text-3xl text-primary">{profile.streak_atual}</p>
          <p className="font-mono text-xs text-muted-foreground">Streak atual</p>
        </div>
        <div className="bg-background-tertiary border border-primary/15 rounded-lg p-4 text-center">
          <Trophy className="h-5 w-5 text-primary mx-auto mb-1" />
          <p className="font-display text-3xl text-foreground">{profile.streak_maximo}</p>
          <p className="font-mono text-xs text-muted-foreground">Streak máximo</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { icon: Dumbbell, label: "Treinos", value: stats.workouts },
          { icon: CheckCircle2, label: "Dias 100%", value: stats.perfectDays },
          { icon: Calendar, label: "Eventos", value: stats.upcomingEvents },
        ].map((s) => (
          <div key={s.label} className="bg-background-tertiary border border-primary/15 rounded-lg p-4 text-center">
            <s.icon className="h-4 w-4 text-primary mx-auto mb-1" />
            <p className="font-display text-2xl text-foreground">{s.value}</p>
            <p className="font-mono text-xs text-muted-foreground">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Badges */}
      {badges.length > 0 && (
        <div>
          <p className="font-mono text-xs text-primary uppercase tracking-wider mb-3 flex items-center gap-2">
            <Award className="h-3.5 w-3.5" /> Badges ({badges.length})
          </p>
          <div className="flex flex-wrap gap-2">
            {badges.map((b) => {
              const info = BADGE_INFO[b.badge_type];
              return (
                <div
                  key={b.badge_type}
                  className="h-12 w-12 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center"
                  title={info?.title || b.badge_type}
                >
                  <span className="text-xl">{info?.icon || "🏅"}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {badges.length === 0 && (
        <div className="bg-background-tertiary border border-primary/15 rounded-lg p-5 text-center">
          <Award className="h-8 w-8 text-primary/20 mx-auto mb-2" />
          <p className="text-muted-foreground text-sm">Nenhum badge ainda</p>
          <p className="font-mono text-xs text-muted-foreground mt-1">Complete 7 dias seguidos de checklist para ganhar seu primeiro!</p>
        </div>
      )}

      {/* Edit Profile */}
      {editing ? (
        <div className="bg-background-tertiary border border-primary/15 rounded-lg p-5 space-y-4">
          <p className="font-mono text-xs text-primary uppercase tracking-wider">Editar perfil</p>
          <div>
            <label className="font-mono text-xs text-muted-foreground mb-1 block">Nome</label>
            <Input value={editNome} onChange={(e) => setEditNome(e.target.value)} className="bg-background border-primary/15" />
          </div>
          <div>
            <label className="font-mono text-xs text-muted-foreground mb-1 block">Cidade</label>
            <Input value={editCidade} onChange={(e) => setEditCidade(e.target.value)} className="bg-background border-primary/15" />
          </div>
          <div>
            <label className="font-mono text-xs text-muted-foreground mb-1 block">Objetivo</label>
            <Input value={editObjetivo} onChange={(e) => setEditObjetivo(e.target.value)} className="bg-background border-primary/15" />
          </div>
          <div>
            <label className="font-mono text-xs text-muted-foreground mb-1 block">Dias de treino/semana</label>
            <Input type="number" min={1} max={7} value={editDias} onChange={(e) => setEditDias(e.target.value)} className="bg-background border-primary/15" />
          </div>
          <div className="flex gap-3">
            <Button onClick={handleSave} disabled={saving} className="bg-primary text-primary-foreground hover:bg-primary-light font-mono text-xs uppercase tracking-wider flex-1">
              <Check className="h-3.5 w-3.5 mr-1" /> {saving ? "Salvando..." : "Salvar"}
            </Button>
            <Button onClick={() => setEditing(false)} variant="outline" className="font-mono text-xs uppercase tracking-wider border-primary/15">
              <X className="h-3.5 w-3.5 mr-1" /> Cancelar
            </Button>
          </div>
        </div>
      ) : (
        <Button
          onClick={() => setEditing(true)}
          variant="outline"
          className="w-full font-mono text-xs uppercase tracking-wider border-primary/15 text-primary hover:bg-primary/10"
        >
          <Pencil className="h-3.5 w-3.5 mr-1" /> Editar Perfil
        </Button>
      )}

      {/* Logout */}
      <Button
        onClick={handleLogout}
        variant="outline"
        className="w-full font-mono text-xs uppercase tracking-wider border-destructive/30 text-destructive hover:bg-destructive/10"
      >
        <LogOut className="h-3.5 w-3.5 mr-1" /> Sair da Conta
      </Button>
    </div>
  );
};

export default Perfil;

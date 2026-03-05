import { useEffect, useState, useCallback, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";
import { Crown, Users, MapPin, Trophy, Flame, ExternalLink, Filter } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";

/* ── Types ── */
interface RankingEntry {
  user_id: string;
  nome: string;
  score: number;
}

interface MemberProfile {
  id: string;
  nome: string;
  cidade: string | null;
  streak_atual: number;
  created_at: string;
}

interface VictoryItem {
  id: string;
  nome: string;
  type: "streak" | "workout";
  value: number;
}

const RANK_ICONS = ["🥇", "🥈", "🥉"];

const CITY_GROUPS = [
  { city: "São Paulo", emoji: "🏙️" },
  { city: "Rio de Janeiro", emoji: "🌊" },
  { city: "Belo Horizonte", emoji: "⛰️" },
];

const formatName = (nome: string) => {
  const parts = nome.trim().split(" ");
  if (parts.length <= 1) return parts[0] || "Membro";
  return `${parts[0]} ${parts[parts.length - 1][0]}.`;
};

const getInitials = (nome: string) => {
  const parts = nome.trim().split(" ");
  if (parts.length <= 1) return (parts[0]?.[0] || "?").toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

/* ── Section: Ranking ── */
const RankingSection = ({ ranking, userId }: { ranking: RankingEntry[]; userId?: string }) => {
  const userIdx = ranking.findIndex((r) => r.user_id === userId);

  if (ranking.length === 0) {
    return (
      <div className="bg-background-tertiary border border-primary/15 rounded-lg p-8 text-center">
        <Crown className="h-8 w-8 text-primary mx-auto mb-3 opacity-50" />
        <p className="text-muted-foreground text-sm">Nenhum dado de ranking esta semana.</p>
        <p className="text-muted-foreground text-xs mt-1">Complete itens do checklist para aparecer aqui.</p>
      </div>
    );
  }

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
          const isUser = entry.user_id === userId;
          return (
            <div
              key={entry.user_id}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors",
                isUser ? "bg-primary/10 border border-primary/20" : "hover:bg-background-secondary"
              )}
            >
              <span className="w-7 text-center shrink-0">
                {i < 3 ? (
                  <span className="text-lg">{RANK_ICONS[i]}</span>
                ) : (
                  <span className="font-mono text-xs text-muted-foreground">{i + 1}</span>
                )}
              </span>
              <div className="h-8 w-8 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center shrink-0">
                <span className="font-display text-xs text-primary">
                  {getInitials(entry.nome)}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <span className={cn("text-sm truncate block", isUser ? "text-primary font-medium" : "text-foreground")}>
                  {formatName(entry.nome)}
                </span>
              </div>
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

/* ── Section: Members Grid ── */
const MembersSection = ({ members, cityFilter, setCityFilter, cities }: {
  members: MemberProfile[];
  cityFilter: string;
  setCityFilter: (c: string) => void;
  cities: string[];
}) => {
  const filtered = cityFilter
    ? members.filter((m) => m.cidade === cityFilter)
    : members;

  return (
    <div>
      {/* City filter */}
      <div className="flex items-center gap-2 mb-4 flex-wrap">
        <Filter className="h-3.5 w-3.5 text-primary shrink-0" />
        <button
          onClick={() => setCityFilter("")}
          className={cn(
            "font-mono text-xs px-3 py-1 rounded-full border transition-colors",
            !cityFilter
              ? "bg-primary/20 border-primary/30 text-primary"
              : "border-primary/10 text-muted-foreground hover:text-foreground"
          )}
        >
          Todas
        </button>
        {cities.map((c) => (
          <button
            key={c}
            onClick={() => setCityFilter(c === cityFilter ? "" : c)}
            className={cn(
              "font-mono text-xs px-3 py-1 rounded-full border transition-colors",
              c === cityFilter
                ? "bg-primary/20 border-primary/30 text-primary"
                : "border-primary/10 text-muted-foreground hover:text-foreground"
            )}
          >
            {c}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="bg-background-tertiary border border-primary/15 rounded-lg p-8 text-center">
          <Users className="h-8 w-8 text-primary mx-auto mb-3 opacity-50" />
          <p className="text-muted-foreground text-sm">Nenhum membro encontrado.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {filtered.map((m) => (
            <div
              key={m.id}
              className="bg-background-tertiary border border-primary/15 rounded-lg p-4 text-center"
            >
              <div className="h-12 w-12 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center mx-auto mb-3">
                <span className="font-display text-sm text-primary">
                  {getInitials(m.nome)}
                </span>
              </div>
              <p className="font-display text-sm text-foreground tracking-wider truncate">
                {m.nome.split(" ")[0]}
              </p>
              {m.cidade && (
                <p className="font-mono text-[10px] text-muted-foreground flex items-center justify-center gap-1 mt-1">
                  <MapPin className="h-2.5 w-2.5" /> {m.cidade}
                </p>
              )}
              {m.streak_atual > 0 && (
                <div className="flex items-center justify-center gap-1 mt-2">
                  <Flame className="h-3 w-3 text-primary" />
                  <span className="font-mono text-xs text-primary">{m.streak_atual}d</span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

/* ── Section: City Groups ── */
const CityGroupsSection = () => (
  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
    {CITY_GROUPS.map((g) => (
      <div
        key={g.city}
        className="bg-background-tertiary border border-primary/15 rounded-lg p-5 flex flex-col items-center text-center"
      >
        <span className="text-2xl mb-2">{g.emoji}</span>
        <p className="font-display text-lg text-foreground tracking-wider mb-1">{g.city}</p>
        <p className="font-mono text-[10px] text-muted-foreground uppercase tracking-wider mb-4">
          Grupo de WhatsApp
        </p>
        <button
          disabled
          className="font-mono text-xs text-primary border border-primary/30 rounded-lg px-4 py-2 flex items-center gap-2 opacity-50 cursor-not-allowed"
        >
          <ExternalLink className="h-3 w-3" /> Entrar no Grupo
        </button>
        <p className="font-mono text-[9px] text-muted-foreground mt-2">Link em breve</p>
      </div>
    ))}
  </div>
);

/* ── Section: Victories Feed ── */
const VictoriesFeed = ({ victories }: { victories: VictoryItem[] }) => {
  if (victories.length === 0) {
    return (
      <div className="bg-background-tertiary border border-primary/15 rounded-lg p-8 text-center">
        <Trophy className="h-8 w-8 text-primary mx-auto mb-3 opacity-50" />
        <p className="text-muted-foreground text-sm">Nenhuma conquista recente.</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {victories.map((v, i) => (
        <div
          key={`${v.id}-${i}`}
          className="bg-background-tertiary border border-primary/15 rounded-lg px-4 py-3 flex items-center gap-3"
        >
          <div className="h-8 w-8 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center shrink-0">
            <span className="font-display text-xs text-primary">
              {getInitials(v.nome)}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm text-foreground truncate">
              <span className="text-primary font-medium">{v.nome.split(" ")[0]}</span>
              {v.type === "streak"
                ? ` está com ${v.value} dias de streak 🔥`
                : ` completou ${v.value} treino${v.value > 1 ? "s" : ""} 💪`}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
};

/* ── Main Page ── */
const Comunidade = () => {
  const { user } = useAuth();
  const [ranking, setRanking] = useState<RankingEntry[]>([]);
  const [members, setMembers] = useState<MemberProfile[]>([]);
  const [cityFilter, setCityFilter] = useState("");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const [rankRes, membersRes] = await Promise.all([
      supabase
        .from("weekly_ranking")
        .select("user_id, nome, score")
        .order("score", { ascending: false })
        .limit(10),
      supabase
        .from("profiles")
        .select("id, nome, cidade, streak_atual, created_at")
        .neq("nome", "")
        .order("created_at", { ascending: false }),
    ]);

    setRanking((rankRes.data as unknown as RankingEntry[]) ?? []);
    setMembers((membersRes.data as MemberProfile[]) ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const cities = useMemo(() => {
    const set = new Set<string>();
    members.forEach((m) => m.cidade && set.add(m.cidade));
    return Array.from(set).sort();
  }, [members]);

  const victories = useMemo<VictoryItem[]>(() => {
    const items: VictoryItem[] = [];
    members.forEach((m) => {
      if (m.streak_atual >= 3) {
        items.push({ id: m.id, nome: m.nome, type: "streak", value: m.streak_atual });
      }
    });
    return items.slice(0, 10);
  }, [members]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-10 w-64 skeleton-gold rounded" />
        <div className="h-64 skeleton-gold rounded-lg" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-36 skeleton-gold rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="font-display text-4xl text-primary tracking-wider mb-1">COMUNIDADE</h1>
        <p className="text-muted-foreground font-mono text-xs uppercase tracking-wider">
          Distrito 1% — {members.length} membros
        </p>
      </div>

      <Tabs defaultValue="ranking" className="w-full">
        <TabsList className="w-full bg-background-secondary border border-primary/15">
          <TabsTrigger value="ranking" className="flex-1 font-mono text-xs uppercase data-[state=active]:bg-primary/20 data-[state=active]:text-primary">
            Ranking
          </TabsTrigger>
          <TabsTrigger value="membros" className="flex-1 font-mono text-xs uppercase data-[state=active]:bg-primary/20 data-[state=active]:text-primary">
            Membros
          </TabsTrigger>
          <TabsTrigger value="grupos" className="flex-1 font-mono text-xs uppercase data-[state=active]:bg-primary/20 data-[state=active]:text-primary">
            Grupos
          </TabsTrigger>
          <TabsTrigger value="vitorias" className="flex-1 font-mono text-xs uppercase data-[state=active]:bg-primary/20 data-[state=active]:text-primary">
            Vitórias
          </TabsTrigger>
        </TabsList>

        <TabsContent value="ranking">
          <RankingSection ranking={ranking} userId={user?.id} />
        </TabsContent>

        <TabsContent value="membros">
          <MembersSection
            members={members}
            cityFilter={cityFilter}
            setCityFilter={setCityFilter}
            cities={cities}
          />
        </TabsContent>

        <TabsContent value="grupos">
          <CityGroupsSection />
        </TabsContent>

        <TabsContent value="vitorias">
          <VictoriesFeed victories={victories} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Comunidade;

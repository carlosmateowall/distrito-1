import { useState } from "react";
import { useParams } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { Copy, Trophy, CalendarDays, Users, Plus } from "lucide-react";
import { format, parseISO, isPast } from "date-fns";
import { ptBR } from "date-fns/locale";
import ChallengePostForm from "@/components/ChallengePostForm";

const DesafioDetalhe = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [showPostForm, setShowPostForm] = useState(false);

  const { data: challenge } = useQuery({
    queryKey: ["challenge", id],
    enabled: !!id,
    queryFn: async () => {
      const { data } = await supabase.from("challenges").select("*").eq("id", id!).single();
      return data;
    },
  });

  const { data: members = [] } = useQuery({
    queryKey: ["challenge-members", id],
    enabled: !!id,
    queryFn: async () => {
      const { data } = await supabase
        .from("challenge_members")
        .select("user_id, joined_at")
        .eq("challenge_id", id!);
      if (!data?.length) return [];

      const userIds = data.map((m) => m.user_id);
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, nome")
        .in("id", userIds);

      return (profiles || []).map((p) => ({ ...p, joined_at: data.find((m) => m.user_id === p.id)?.joined_at }));
    },
  });

  const { data: posts = [] } = useQuery({
    queryKey: ["challenge-posts", id],
    enabled: !!id,
    queryFn: async () => {
      const { data } = await supabase
        .from("challenge_posts")
        .select("*")
        .eq("challenge_id", id!)
        .order("created_at", { ascending: false });
      return data || [];
    },
  });

  // Leaderboard: count points per user
  const leaderboard = members
    .map((m) => ({
      ...m,
      points: posts.filter((p: any) => p.user_id === m.id).reduce((sum: number, p: any) => sum + (p.points || 1), 0),
    }))
    .sort((a, b) => b.points - a.points);

  // Map user_id to nome
  const nameMap = Object.fromEntries(members.map((m) => [m.id, m.nome]));

  const isCompleted = challenge && (challenge.status === "completed" || isPast(parseISO(challenge.end_date)));

  const copyCode = () => {
    if (challenge?.invite_code) {
      navigator.clipboard.writeText(challenge.invite_code);
      toast({ title: "Código copiado!" });
    }
  };

  if (!challenge) return <div className="p-4 text-muted-foreground">Carregando...</div>;

  return (
    <div className="p-4 pb-24 space-y-4">
      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold font-mono tracking-tight">{challenge.title}</h1>
          <Badge variant={isCompleted ? "secondary" : "default"}>
            {isCompleted ? "Encerrado" : "Ativo"}
          </Badge>
        </div>
        {challenge.description && (
          <p className="text-sm text-muted-foreground">{challenge.description}</p>
        )}
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <CalendarDays className="h-3 w-3" />
            {format(parseISO(challenge.start_date), "dd MMM", { locale: ptBR })} — {format(parseISO(challenge.end_date), "dd MMM", { locale: ptBR })}
          </span>
          <span className="flex items-center gap-1">
            <Users className="h-3 w-3" />
            {members.length} membros
          </span>
        </div>
        <Button variant="outline" size="sm" onClick={copyCode} className="font-mono tracking-widest">
          <Copy className="h-3 w-3 mr-1" />
          {challenge.invite_code}
        </Button>
      </div>

      {/* Leaderboard */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Trophy className="h-4 w-4 text-primary" /> Ranking
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {leaderboard.map((m, i) => (
            <div key={m.id} className="flex items-center justify-between py-1.5 border-b border-border/50 last:border-0">
              <div className="flex items-center gap-3">
                <span className="text-sm font-mono w-6 text-muted-foreground">
                  {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `${i + 1}.`}
                </span>
                <span className="text-sm font-medium">{m.nome}</span>
              </div>
              <span className="text-sm font-mono text-primary">{m.points} pts</span>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Feed */}
      <div className="space-y-3">
        <h2 className="text-base font-semibold">Feed de treinos</h2>
        {posts.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            Nenhum treino postado ainda. Seja o primeiro! 💪
          </p>
        ) : (
          posts.map((post: any) => (
            <Card key={post.id}>
              <CardContent className="p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold">{nameMap[post.user_id] || "Membro"}</span>
                  <span className="text-[10px] text-muted-foreground">
                    {format(parseISO(post.created_at), "dd/MM HH:mm")}
                  </span>
                </div>
                <p className="text-sm font-medium">{post.title}</p>
                {post.description && <p className="text-xs text-muted-foreground">{post.description}</p>}
                {post.photo_url && (
                  <img src={post.photo_url} alt="Treino" className="rounded-md w-full max-h-64 object-cover" />
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* FAB */}
      {!isCompleted && (
        <Button
          onClick={() => setShowPostForm(true)}
          className="fixed bottom-20 right-4 h-14 w-14 rounded-full shadow-lg z-40"
          size="icon"
        >
          <Plus className="h-6 w-6" />
        </Button>
      )}

      <ChallengePostForm
        open={showPostForm}
        onOpenChange={setShowPostForm}
        challengeId={id!}
        userId={user?.id || ""}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ["challenge-posts", id] });
        }}
      />
    </div>
  );
};

export default DesafioDetalhe;

import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { Plus, LogIn } from "lucide-react";
import ChallengeCard from "@/components/ChallengeCard";

function generateInviteCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

const Desafios = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState("meus");
  const [joinCode, setJoinCode] = useState("");

  // Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const { data: myChallenges = [], isLoading } = useQuery({
    queryKey: ["my-challenges", user?.id],
    enabled: !!user,
    queryFn: async () => {
      // Get challenge IDs user is member of
      const { data: memberships } = await supabase
        .from("challenge_members")
        .select("challenge_id")
        .eq("user_id", user!.id);

      if (!memberships?.length) return [];

      const ids = memberships.map((m) => m.challenge_id);
      const { data } = await supabase
        .from("challenges")
        .select("*")
        .in("id", ids)
        .order("created_at", { ascending: false });

      return data || [];
    },
  });

  const createChallenge = useMutation({
    mutationFn: async () => {
      const invite_code = generateInviteCode();
      const { data, error } = await supabase
        .from("challenges")
        .insert({
          title,
          description,
          created_by: user!.id,
          start_date: startDate,
          end_date: endDate,
          invite_code,
        })
        .select()
        .single();

      if (error) throw error;

      // Auto-join as member
      await supabase.from("challenge_members").insert({
        challenge_id: data.id,
        user_id: user!.id,
      });

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-challenges"] });
      setTitle("");
      setDescription("");
      setStartDate("");
      setEndDate("");
      setTab("meus");
      toast({ title: "Desafio criado! 🔥", description: "Compartilhe o código com seus amigos." });
    },
    onError: () => toast({ title: "Erro ao criar desafio", variant: "destructive" }),
  });

  const joinChallenge = useMutation({
    mutationFn: async () => {
      const { data: challenge, error: findErr } = await supabase
        .from("challenges")
        .select("id")
        .eq("invite_code", joinCode.toUpperCase().trim())
        .single();

      if (findErr || !challenge) throw new Error("Código inválido");

      const { error } = await supabase.from("challenge_members").insert({
        challenge_id: challenge.id,
        user_id: user!.id,
      });

      if (error?.code === "23505") throw new Error("Você já está neste desafio");
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-challenges"] });
      setJoinCode("");
      setTab("meus");
      toast({ title: "Entrou no desafio! 💪" });
    },
    onError: (err: Error) => toast({ title: err.message, variant: "destructive" }),
  });

  return (
    <div className="p-4 pb-24 space-y-4">
      <h1 className="text-2xl font-bold font-mono tracking-tight">Desafios</h1>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="w-full">
          <TabsTrigger value="meus" className="flex-1">Meus Desafios</TabsTrigger>
          <TabsTrigger value="criar" className="flex-1">Criar</TabsTrigger>
          <TabsTrigger value="entrar" className="flex-1">Entrar</TabsTrigger>
        </TabsList>

        <TabsContent value="meus" className="space-y-3 mt-4">
          {isLoading ? (
            <p className="text-muted-foreground text-center py-8">Carregando...</p>
          ) : myChallenges.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                <p>Você ainda não participa de nenhum desafio.</p>
                <p className="text-sm mt-1">Crie um ou entre com um código!</p>
              </CardContent>
            </Card>
          ) : (
            myChallenges.map((c: any) => <ChallengeCard key={c.id} challenge={c} />)
          )}
        </TabsContent>

        <TabsContent value="criar" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Plus className="h-5 w-5" /> Novo Desafio
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Nome do desafio</Label>
                <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ex: 30 dias de treino" />
              </div>
              <div className="space-y-2">
                <Label>Descrição</Label>
                <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Regras e detalhes..." />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Início</Label>
                  <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Fim</Label>
                  <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
                </div>
              </div>
              <Button
                className="w-full"
                onClick={() => createChallenge.mutate()}
                disabled={!title || !startDate || !endDate || createChallenge.isPending}
              >
                {createChallenge.isPending ? "Criando..." : "Criar Desafio"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="entrar" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <LogIn className="h-5 w-5" /> Entrar por Código
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Código do desafio</Label>
                <Input
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                  placeholder="Ex: ABC123"
                  maxLength={6}
                  className="text-center text-2xl font-mono tracking-[0.3em]"
                />
              </div>
              <Button
                className="w-full"
                onClick={() => joinChallenge.mutate()}
                disabled={joinCode.length !== 6 || joinChallenge.isPending}
              >
                {joinChallenge.isPending ? "Entrando..." : "Entrar no Desafio"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Desafios;

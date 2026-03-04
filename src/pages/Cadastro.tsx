import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import NoiseOverlay from "@/components/NoiseOverlay";

const Cadastro = () => {
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (nome.trim().length < 2) {
      toast({ title: "Erro", description: "Nome deve ter pelo menos 2 caracteres.", variant: "destructive" });
      return;
    }
    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: window.location.origin },
      });
      if (error) throw error;

      // Update profile with name
      if (data.user) {
        await supabase
          .from("profiles")
          .update({ nome: nome.trim() })
          .eq("id", data.user.id);
      }

      // If email confirmation is disabled, go straight to onboarding
      if (data.session) {
        navigate("/onboarding");
      } else {
        toast({
          title: "Conta criada!",
          description: "Verifique seu email para confirmar e depois faça login.",
        });
        navigate("/login");
      }
    } catch (error: any) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center relative">
      <NoiseOverlay />
      <div className="relative z-10 w-full max-w-sm px-6">
        <h1 className="font-display text-5xl text-primary text-center tracking-widest mb-2">
          DISTRITO 1%
        </h1>
        <p className="text-muted-foreground text-center font-mono text-xs uppercase tracking-wider mb-10">
          Crie sua conta
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="font-mono text-xs text-primary uppercase tracking-wider mb-1.5 block">
              Nome
            </label>
            <Input
              type="text"
              placeholder="Seu nome"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              required
              maxLength={100}
              className="bg-background-secondary border-primary/15 text-foreground placeholder:text-muted-foreground focus:border-primary/40"
            />
          </div>
          <div>
            <label className="font-mono text-xs text-primary uppercase tracking-wider mb-1.5 block">
              Email
            </label>
            <Input
              type="email"
              placeholder="seu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              maxLength={255}
              className="bg-background-secondary border-primary/15 text-foreground placeholder:text-muted-foreground focus:border-primary/40"
            />
          </div>
          <div>
            <label className="font-mono text-xs text-primary uppercase tracking-wider mb-1.5 block">
              Senha
            </label>
            <Input
              type="password"
              placeholder="Mínimo 6 caracteres"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="bg-background-secondary border-primary/15 text-foreground placeholder:text-muted-foreground focus:border-primary/40"
            />
          </div>
          <Button
            type="submit"
            disabled={loading}
            className="w-full bg-primary text-primary-foreground hover:bg-primary-light font-display text-lg tracking-wider h-12"
          >
            {loading ? "..." : "CRIAR CONTA"}
          </Button>
        </form>

        <p className="text-center mt-8 text-muted-foreground text-sm">
          Já tem conta?{" "}
          <Link to="/login" className="text-primary hover:text-primary-light transition-colors">
            Entrar
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Cadastro;

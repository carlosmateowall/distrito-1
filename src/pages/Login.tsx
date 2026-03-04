import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import NoiseOverlay from "@/components/NoiseOverlay";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: window.location.origin },
        });
        if (error) throw error;
        toast({ title: "Conta criada!", description: "Verifique seu email para confirmar." });
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        navigate("/dashboard");
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
          Elite Performance
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="bg-background-secondary border-border-subtle text-foreground placeholder:text-muted-foreground"
          />
          <Input
            type="password"
            placeholder="Senha"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            className="bg-background-secondary border-border-subtle text-foreground placeholder:text-muted-foreground"
          />
          <Button
            type="submit"
            disabled={loading}
            className="w-full bg-primary text-primary-foreground hover:bg-primary-light font-display text-lg tracking-wider"
          >
            {loading ? "..." : isSignUp ? "CRIAR CONTA" : "ENTRAR"}
          </Button>
        </form>

        <button
          onClick={() => setIsSignUp(!isSignUp)}
          className="w-full text-center mt-6 text-muted-foreground text-sm hover:text-primary transition-colors"
        >
          {isSignUp ? "Já tem conta? Entrar" : "Não tem conta? Criar"}
        </button>
      </div>
    </div>
  );
};

export default Login;

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import NoiseOverlay from "@/components/NoiseOverlay";
import { cn } from "@/lib/utils";

const STEPS = [
  {
    key: "objetivo",
    title: "QUAL SEU OBJETIVO?",
    options: [
      { value: "cutting", label: "Cutting" },
      { value: "bulk", label: "Bulk" },
      { value: "manutencao", label: "Manutenção" },
      { value: "saude_geral", label: "Saúde Geral" },
    ],
  },
  {
    key: "nivel",
    title: "QUAL SEU NÍVEL?",
    options: [
      { value: "iniciante", label: "Iniciante" },
      { value: "intermediario", label: "Intermediário" },
      { value: "avancado", label: "Avançado" },
    ],
  },
  {
    key: "dias_treino",
    title: "DIAS POR SEMANA PARA TREINAR?",
    options: [
      { value: "3", label: "3 dias" },
      { value: "4", label: "4 dias" },
      { value: "5", label: "5 dias" },
      { value: "6", label: "6 dias" },
    ],
  },
  {
    key: "equipamento",
    title: "QUAL SEU EQUIPAMENTO?",
    options: [
      { value: "academia_completa", label: "Academia Completa" },
      { value: "casa_com_equipamentos", label: "Casa com Equipamentos" },
      { value: "sem_equipamento", label: "Sem Equipamento" },
    ],
  },
];

const Onboarding = () => {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [restricoes, setRestricoes] = useState("");
  const [cidade, setCidade] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();

  const totalSteps = STEPS.length + 1; // +1 for final step
  const isQuizStep = step < STEPS.length;
  const currentQuiz = isQuizStep ? STEPS[step] : null;

  const handleSelect = (value: string) => {
    if (!currentQuiz) return;
    setAnswers((prev) => ({ ...prev, [currentQuiz.key]: value }));
    // Auto-advance after selection
    setTimeout(() => setStep((s) => s + 1), 200);
  };

  const handleFinish = async () => {
    if (!user) return;
    setLoading(true);

    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          objetivo: answers.objetivo,
          nivel: answers.nivel,
          dias_treino: parseInt(answers.dias_treino),
          equipamento: answers.equipamento,
          restricoes_alimentares: restricoes.trim() || null,
          cidade: cidade.trim() || null,
          onboarding_complete: true,
        })
        .eq("id", user.id);

      if (error) throw error;
      navigate("/dashboard");
    } catch (error: any) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center relative">
      <NoiseOverlay />
      <div className="relative z-10 w-full max-w-md px-6">
        {/* Progress bar */}
        <div className="flex gap-1.5 mb-10">
          {Array.from({ length: totalSteps }).map((_, i) => (
            <div
              key={i}
              className={cn(
                "h-1 flex-1 rounded-full transition-colors duration-300",
                i <= step ? "bg-primary" : "bg-primary/15"
              )}
            />
          ))}
        </div>

        {/* Step counter */}
        <p className="font-mono text-xs text-muted-foreground uppercase tracking-wider mb-2">
          Passo {step + 1} de {totalSteps}
        </p>

        {isQuizStep && currentQuiz ? (
          <div>
            <h2 className="font-display text-3xl text-primary tracking-wider mb-8">
              {currentQuiz.title}
            </h2>
            <div className="space-y-3">
              {currentQuiz.options.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => handleSelect(opt.value)}
                  className={cn(
                    "w-full text-left px-5 py-4 rounded-lg border transition-all duration-200",
                    "font-body text-sm tracking-wide",
                    answers[currentQuiz.key] === opt.value
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-primary/15 bg-background-secondary text-foreground hover:border-primary/30 hover:bg-background-tertiary"
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div>
            <h2 className="font-display text-3xl text-primary tracking-wider mb-8">
              QUASE LÁ
            </h2>
            <div className="space-y-4">
              <div>
                <label className="font-mono text-xs text-primary uppercase tracking-wider mb-1.5 block">
                  Restrições alimentares (opcional)
                </label>
                <Input
                  type="text"
                  placeholder="Ex: vegetariano, sem lactose..."
                  value={restricoes}
                  onChange={(e) => setRestricoes(e.target.value)}
                  maxLength={500}
                  className="bg-background-secondary border-primary/15 text-foreground placeholder:text-muted-foreground focus:border-primary/40"
                />
              </div>
              <div>
                <label className="font-mono text-xs text-primary uppercase tracking-wider mb-1.5 block">
                  Cidade
                </label>
                <Input
                  type="text"
                  placeholder="Sua cidade"
                  value={cidade}
                  onChange={(e) => setCidade(e.target.value)}
                  maxLength={100}
                  className="bg-background-secondary border-primary/15 text-foreground placeholder:text-muted-foreground focus:border-primary/40"
                />
              </div>
              <Button
                onClick={handleFinish}
                disabled={loading}
                className="w-full bg-primary text-primary-foreground hover:bg-primary-light font-display text-lg tracking-wider h-12 mt-4"
              >
                {loading ? "..." : "COMEÇAR"}
              </Button>
            </div>
          </div>
        )}

        {/* Back button */}
        {step > 0 && (
          <button
            onClick={() => setStep((s) => s - 1)}
            className="mt-6 text-muted-foreground text-sm hover:text-primary transition-colors font-mono text-xs uppercase tracking-wider"
          >
            ← Voltar
          </button>
        )}
      </div>
    </div>
  );
};

export default Onboarding;

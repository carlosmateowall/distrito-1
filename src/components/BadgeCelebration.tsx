import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

const BADGE_INFO: Record<string, { icon: string; title: string; description: string }> = {
  streak_7: { icon: "🔥", title: "7 DIAS DE FOGO", description: "Uma semana de disciplina inabalável." },
  streak_21: { icon: "⚡", title: "21 DIAS — HÁBITO FORMADO", description: "A ciência diz que o hábito se forma em 21 dias. Você conseguiu." },
  streak_30: { icon: "🏆", title: "30 DIAS INVICTO", description: "Um mês inteiro no topo. Isso é raro." },
  streak_60: { icon: "💎", title: "60 DIAS — DIAMANTE", description: "Pressão cria diamantes. Você é a prova." },
  streak_100: { icon: "👑", title: "100 DIAS — LENDA", description: "Você entrou para o hall dos imortais do Distrito 1%." },
  primeiro_evento: { icon: "🤝", title: "PRIMEIRO EVENTO", description: "Presença confirmada no primeiro evento da comunidade." },
  pr_batido: { icon: "💪", title: "PR BATIDO", description: "Novo recorde pessoal registrado!" },
};

interface BadgeCelebrationProps {
  badgeType: string | null;
  onClose: () => void;
}

const BadgeCelebration = ({ badgeType, onClose }: BadgeCelebrationProps) => {
  const info = badgeType ? BADGE_INFO[badgeType] : null;
  if (!info) return null;

  return (
    <Dialog open={!!badgeType} onOpenChange={() => onClose()}>
      <DialogContent className="bg-background border-primary/30 text-center max-w-sm">
        <div className="py-6">
          <span className="text-6xl block mb-4">{info.icon}</span>
          <h2 className="font-display text-3xl text-primary tracking-wider mb-2">{info.title}</h2>
          <p className="text-muted-foreground text-sm mb-6">{info.description}</p>
          <Button
            onClick={onClose}
            className="bg-primary text-primary-foreground hover:bg-primary-light font-display text-base tracking-wider"
          >
            VAMOS!
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export { BadgeCelebration, BADGE_INFO };

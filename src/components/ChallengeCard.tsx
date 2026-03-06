import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CalendarDays, ChevronRight } from "lucide-react";
import { format, isPast, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

interface ChallengeCardProps {
  challenge: {
    id: string;
    title: string;
    start_date: string;
    end_date: string;
    status: string;
    invite_code: string;
  };
}

const ChallengeCard = ({ challenge }: ChallengeCardProps) => {
  const isCompleted = challenge.status === "completed" || isPast(parseISO(challenge.end_date));

  return (
    <Link to={`/desafios/${challenge.id}`}>
      <Card className="hover:border-primary/40 transition-colors">
        <CardContent className="p-4 flex items-center justify-between">
          <div className="space-y-1 min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold truncate">{challenge.title}</h3>
              <Badge variant={isCompleted ? "secondary" : "default"} className="shrink-0 text-[10px]">
                {isCompleted ? "Encerrado" : "Ativo"}
              </Badge>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <CalendarDays className="h-3 w-3" />
              <span>
                {format(parseISO(challenge.start_date), "dd MMM", { locale: ptBR })} —{" "}
                {format(parseISO(challenge.end_date), "dd MMM", { locale: ptBR })}
              </span>
            </div>
          </div>
          <ChevronRight className="h-5 w-5 text-muted-foreground shrink-0" />
        </CardContent>
      </Card>
    </Link>
  );
};

export default ChallengeCard;

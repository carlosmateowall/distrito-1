import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { Flame, PartyPopper } from "lucide-react";

// --- Protocol definitions ---

interface ChecklistItemDef {
  key: string;
  label: string;
  hasNote?: boolean;
  notePlaceholder?: string;
}

interface ProtocolDef {
  key: string;
  label: string;
  emoji: string;
  items: ChecklistItemDef[];
}

const PROTOCOLS: ProtocolDef[] = [
  {
    key: "corpo",
    label: "PROTOCOLO 01 — CORPO",
    emoji: "⚡",
    items: [
      { key: "treino_concluido", label: "Treino do dia concluído" },
      { key: "dieta_seguida", label: "Seguiu o plano alimentar" },
      { key: "sono_7h", label: "Dormiu 7h+ ontem à noite" },
    ],
  },
  {
    key: "mente",
    label: "PROTOCOLO 02 — MENTE",
    emoji: "🧠",
    items: [
      { key: "leitura_15min", label: "Leitura de 15 minutos" },
      { key: "sem_redes_2h", label: "Sem redes sociais nas primeiras 2h do dia" },
      { key: "journaling", label: "Anotou 1 vitória do dia", hasNote: true, notePlaceholder: "Qual foi sua vitória?" },
    ],
  },
  {
    key: "espirito",
    label: "PROTOCOLO 03 — ESPÍRITO",
    emoji: "✝️",
    items: [
      { key: "devocional_lido", label: "Devocional do dia lido" },
      { key: "oracao_matinal", label: "Oração matinal realizada" },
      { key: "gratidao", label: "Gratidão anotada", hasNote: true, notePlaceholder: "Pelo que você é grato hoje?" },
    ],
  },
];

const ALL_ITEMS = PROTOCOLS.flatMap((p) =>
  p.items.map((item) => ({ ...item, protocol: p.key }))
);

const TOTAL_ITEMS = ALL_ITEMS.length;

// --- Types ---

interface ChecklistRow {
  id: string;
  item_key: string;
  protocol: string;
  completed: boolean;
  note: string | null;
}

// --- Helper: today as YYYY-MM-DD ---
const todayStr = () => new Date().toISOString().split("T")[0];

// --- Main Component ---

const Checklist = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [rows, setRows] = useState<Map<string, ChecklistRow>>(new Map());
  const [notes, setNotes] = useState<Map<string, string>>(new Map());
  const [loading, setLoading] = useState(true);
  const [celebrating, setCelebrating] = useState(false);

  const completedCount = Array.from(rows.values()).filter((r) => r.completed).length;
  const allDone = completedCount === TOTAL_ITEMS;

  // --- Load or initialize today's checklist ---
  const loadChecklist = useCallback(async () => {
    if (!user) return;
    const date = todayStr();

    const { data, error } = await supabase
      .from("daily_checklist")
      .select("*")
      .eq("user_id", user.id)
      .eq("date", date);

    if (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
      setLoading(false);
      return;
    }

    // If no rows yet, seed them
    if (!data || data.length === 0) {
      const inserts = ALL_ITEMS.map((item) => ({
        user_id: user.id,
        date,
        protocol: item.protocol,
        item_key: item.key,
        completed: false,
        note: null,
      }));

      const { data: inserted, error: insertErr } = await supabase
        .from("daily_checklist")
        .insert(inserts)
        .select();

      if (insertErr) {
        toast({ title: "Erro", description: insertErr.message, variant: "destructive" });
        setLoading(false);
        return;
      }

      const map = new Map<string, ChecklistRow>();
      (inserted ?? []).forEach((r: any) => map.set(r.item_key, r));
      setRows(map);
    } else {
      const map = new Map<string, ChecklistRow>();
      data.forEach((r: any) => {
        map.set(r.item_key, r);
        if (r.note) setNotes((prev) => new Map(prev).set(r.item_key, r.note));
      });
      setRows(map);
    }

    setLoading(false);
  }, [user, toast]);

  useEffect(() => {
    loadChecklist();
  }, [loadChecklist]);

  // --- Toggle item ---
  const toggleItem = async (itemKey: string, needsNote: boolean) => {
    const row = rows.get(itemKey);
    if (!row) return;

    const newCompleted = !row.completed;
    const noteVal = notes.get(itemKey)?.trim() || null;

    // If unchecking or checking without note requirement, proceed
    if (needsNote && newCompleted && !noteVal) {
      toast({ title: "Atenção", description: "Preencha o campo antes de marcar." });
      return;
    }

    const { error } = await supabase
      .from("daily_checklist")
      .update({ completed: newCompleted, note: newCompleted ? noteVal : null })
      .eq("id", row.id);

    if (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
      return;
    }

    const updated = new Map(rows);
    updated.set(itemKey, { ...row, completed: newCompleted, note: newCompleted ? noteVal : null });
    setRows(updated);

    // Check if all done after this toggle
    const newCount = Array.from(updated.values()).filter((r) => r.completed).length;
    if (newCount === TOTAL_ITEMS && !celebrating) {
      setCelebrating(true);
      // Update streak
      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("streak_atual, streak_maximo")
          .eq("id", user.id)
          .single();

        if (profile) {
          const newStreak = (profile.streak_atual ?? 0) + 1;
          const newMax = Math.max(newStreak, profile.streak_maximo ?? 0);
          await supabase
            .from("profiles")
            .update({ streak_atual: newStreak, streak_maximo: newMax })
            .eq("id", user.id);
        }
      }
      setTimeout(() => setCelebrating(false), 4000);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <span className="font-display text-2xl text-primary animate-pulse tracking-wider">CARREGANDO...</span>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="font-display text-4xl text-primary tracking-wider mb-1">DEVERES DO DIA</h1>
        <p className="font-mono text-xs text-muted-foreground uppercase tracking-wider">
          {todayStr().split("-").reverse().join("/")}
        </p>
      </div>

      {/* Global progress */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="font-mono text-xs text-muted-foreground uppercase tracking-wider">
            Progresso geral
          </span>
          <span className="font-display text-lg text-foreground">
            {completedCount}<span className="text-muted-foreground">/{TOTAL_ITEMS}</span>
          </span>
        </div>
        <div className="h-2 bg-primary/15 rounded-full overflow-hidden">
          <div
            className="h-full bg-primary rounded-full transition-all duration-700 ease-out"
            style={{ width: `${(completedCount / TOTAL_ITEMS) * 100}%` }}
          />
        </div>
      </div>

      {/* Celebration */}
      {celebrating && (
        <div className="bg-primary/10 border border-primary/30 rounded-lg p-5 text-center animate-in fade-in slide-in-from-bottom-4 duration-500">
          <PartyPopper className="h-8 w-8 text-primary mx-auto mb-2" />
          <h2 className="font-display text-2xl text-primary tracking-wider mb-1">DIA COMPLETO!</h2>
          <p className="font-mono text-xs text-muted-foreground uppercase tracking-wider flex items-center justify-center gap-1">
            <Flame className="h-3 w-3 text-primary" /> Streak atualizado
          </p>
        </div>
      )}

      {/* Protocols */}
      {PROTOCOLS.map((protocol) => (
        <section key={protocol.key}>
          <h2 className="font-mono text-xs text-primary uppercase tracking-wider mb-4 flex items-center gap-2">
            <span className="text-base">{protocol.emoji}</span>
            {protocol.label}
          </h2>
          <div className="space-y-2">
            {protocol.items.map((item) => {
              const row = rows.get(item.key);
              const completed = row?.completed ?? false;

              return (
                <div
                  key={item.key}
                  className={cn(
                    "rounded-lg border p-4 transition-all duration-300",
                    completed
                      ? "border-[#4CAF72]/40 bg-[#4CAF72]/5"
                      : "border-primary/15 bg-background-secondary"
                  )}
                >
                  <div className="flex items-start gap-3">
                    {/* Custom checkbox */}
                    <button
                      onClick={() => toggleItem(item.key, !!item.hasNote)}
                      className={cn(
                        "mt-0.5 h-5 w-5 rounded border-2 flex items-center justify-center shrink-0 transition-all duration-300",
                        completed
                          ? "border-[#4CAF72] bg-[#4CAF72]/10"
                          : "border-muted-foreground hover:border-primary"
                      )}
                    >
                      {completed && (
                        <svg className="h-3 w-3 text-[#4CAF72]" viewBox="0 0 12 12" fill="none">
                          <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      )}
                    </button>
                    <div className="flex-1">
                      <span
                        className={cn(
                          "text-sm transition-colors duration-300",
                          completed ? "text-muted-foreground line-through" : "text-foreground"
                        )}
                      >
                        {item.label}
                      </span>

                      {/* Note input for items that require it */}
                      {item.hasNote && (
                        <Input
                          type="text"
                          placeholder={item.notePlaceholder}
                          value={notes.get(item.key) ?? ""}
                          onChange={(e) =>
                            setNotes((prev) => new Map(prev).set(item.key, e.target.value))
                          }
                          disabled={completed}
                          maxLength={300}
                          className="mt-2 h-8 text-xs bg-background border-primary/15 text-foreground placeholder:text-muted-foreground focus:border-primary/40 disabled:opacity-50"
                        />
                      )}

                      {/* Show saved note if completed */}
                      {completed && row?.note && (
                        <p className="mt-1 font-mono text-xs text-muted-foreground italic">
                          "{row.note}"
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
};

export default Checklist;

import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { Loader2, Sparkles, Check, UtensilsCrossed } from "lucide-react";

const MEAL_TYPE_LABELS: Record<string, string> = {
  cafe_manha: "Café da Manhã",
  pre_treino: "Pré-Treino",
  almoco: "Almoço",
  lanche: "Lanche",
  jantar: "Jantar",
  ceia: "Ceia",
};

const MEAL_ORDER = ["cafe_manha", "pre_treino", "almoco", "lanche", "jantar", "ceia"];

const DAY_LABELS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

interface FoodItem {
  name: string;
  quantity: string;
  unit: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

interface MealRow {
  id: string;
  meal_plan_id: string;
  day_of_week: number;
  meal_type: string;
  foods: FoodItem[];
  total_calories: number;
  total_protein: number;
  total_carbs: number;
  total_fat: number;
  completed: boolean;
}

function getWeekStart(): string {
  const d = new Date();
  const day = d.getDay();
  const diff = d.getDate() - day;
  const start = new Date(d.setDate(diff));
  return start.toISOString().split("T")[0];
}

const Dieta = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [meals, setMeals] = useState<MealRow[]>([]);
  const [planId, setPlanId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [selectedDay, setSelectedDay] = useState(new Date().getDay());

  // Generation form
  const [showForm, setShowForm] = useState(false);
  const [peso, setPeso] = useState("");
  const [altura, setAltura] = useState("");
  const [metaCalorica, setMetaCalorica] = useState("");

  const weekStart = getWeekStart();

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);

    const { data: plans } = await supabase
      .from("meal_plans")
      .select("id")
      .eq("user_id", user.id)
      .eq("week_start", weekStart)
      .limit(1);

    if (plans && plans.length > 0) {
      const id = plans[0].id;
      setPlanId(id);

      const { data: mealsData } = await supabase
        .from("meals")
        .select("*")
        .eq("meal_plan_id", id);

      setMeals((mealsData as unknown as MealRow[]) ?? []);
    }

    setLoading(false);
  }, [user, weekStart]);

  useEffect(() => {
    load();
  }, [load]);

  const handleGenerate = async () => {
    if (!user) return;
    setGenerating(true);

    try {
      const { data: profile } = await supabase
        .from("profiles")
        .select("objetivo, nivel, dias_treino, equipamento, restricoes_alimentares")
        .eq("id", user.id)
        .single();

      if (!profile) throw new Error("Perfil não encontrado");

      const { data, error } = await supabase.functions.invoke("generate-meal-plan", {
        body: {
          ...profile,
          peso: peso || undefined,
          altura: altura || undefined,
          meta_calorica: metaCalorica || undefined,
        },
      });

      if (error) throw new Error(error.message || "Erro ao gerar plano");
      if (data?.error) throw new Error(data.error);

      if (!data?.days || !Array.isArray(data.days)) throw new Error("Formato inválido da IA");

      // Create meal plan
      const { data: plan, error: pErr } = await supabase
        .from("meal_plans")
        .insert({ user_id: user.id, week_start: weekStart })
        .select()
        .single();

      if (pErr) throw pErr;

      // Insert meals
      const mealInserts: any[] = [];
      for (const day of data.days) {
        for (const meal of day.meals) {
          mealInserts.push({
            meal_plan_id: plan.id,
            day_of_week: day.day_of_week,
            meal_type: meal.meal_type,
            foods: meal.foods || [],
            total_calories: meal.total_calories || 0,
            total_protein: meal.total_protein || 0,
            total_carbs: meal.total_carbs || 0,
            total_fat: meal.total_fat || 0,
          });
        }
      }

      const { error: mErr } = await supabase.from("meals").insert(mealInserts);
      if (mErr) throw mErr;

      toast({ title: "Plano gerado!", description: "Seu plano alimentar semanal está pronto." });
      setShowForm(false);
      await load();
    } catch (e: any) {
      toast({ title: "Erro", description: e.message, variant: "destructive" });
    } finally {
      setGenerating(false);
    }
  };

  const toggleMeal = async (meal: MealRow) => {
    const newCompleted = !meal.completed;
    await supabase.from("meals").update({ completed: newCompleted }).eq("id", meal.id);

    const updated = meals.map((m) => (m.id === meal.id ? { ...m, completed: newCompleted } : m));
    setMeals(updated);

    // Check if all meals for today are done → auto-complete checklist
    const todayMeals = updated.filter((m) => m.day_of_week === new Date().getDay());
    if (todayMeals.length > 0 && todayMeals.every((m) => m.completed) && user) {
      const today = new Date().toISOString().split("T")[0];
      await supabase
        .from("daily_checklist")
        .update({ completed: true })
        .eq("user_id", user.id)
        .eq("date", today)
        .eq("item_key", "dieta_seguida");
    }
  };

  // Filter meals for selected day
  const dayMeals = meals
    .filter((m) => m.day_of_week === selectedDay)
    .sort((a, b) => MEAL_ORDER.indexOf(a.meal_type) - MEAL_ORDER.indexOf(b.meal_type));

  // Macros for selected day
  const dayCalories = dayMeals.reduce((s, m) => s + m.total_calories, 0);
  const dayProtein = dayMeals.reduce((s, m) => s + m.total_protein, 0);
  const dayCarbs = dayMeals.reduce((s, m) => s + m.total_carbs, 0);
  const dayFat = dayMeals.reduce((s, m) => s + m.total_fat, 0);
  const completedMeals = dayMeals.filter((m) => m.completed).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <span className="font-display text-2xl text-primary animate-pulse tracking-wider">CARREGANDO...</span>
      </div>
    );
  }

  // No plan — show generation
  if (!planId) {
    return (
      <div className="space-y-6">
        <div className="text-center py-12">
          <UtensilsCrossed className="h-12 w-12 text-primary/30 mx-auto mb-4" />
          <h1 className="font-display text-3xl text-primary tracking-wider mb-2">SEM PLANO ALIMENTAR</h1>
          <p className="text-muted-foreground text-sm mb-6 max-w-sm mx-auto">
            Gere um plano personalizado com IA baseado no seu perfil e objetivos.
          </p>

          {!showForm ? (
            <Button
              onClick={() => setShowForm(true)}
              className="bg-primary text-primary-foreground hover:bg-primary-light font-display text-lg tracking-wider h-12 px-8"
            >
              <Sparkles className="h-4 w-4 mr-2" /> GERAR MEU PLANO ALIMENTAR
            </Button>
          ) : (
            <div className="max-w-sm mx-auto space-y-4 text-left">
              <div>
                <label className="font-mono text-xs text-primary uppercase tracking-wider mb-1.5 block">
                  Peso atual (kg) — opcional
                </label>
                <Input
                  type="text"
                  placeholder="Ex: 75"
                  value={peso}
                  onChange={(e) => setPeso(e.target.value)}
                  maxLength={10}
                  className="bg-background-secondary border-primary/15 text-foreground placeholder:text-muted-foreground focus:border-primary/40"
                />
              </div>
              <div>
                <label className="font-mono text-xs text-primary uppercase tracking-wider mb-1.5 block">
                  Altura (cm) — opcional
                </label>
                <Input
                  type="text"
                  placeholder="Ex: 180"
                  value={altura}
                  onChange={(e) => setAltura(e.target.value)}
                  maxLength={10}
                  className="bg-background-secondary border-primary/15 text-foreground placeholder:text-muted-foreground focus:border-primary/40"
                />
              </div>
              <div>
                <label className="font-mono text-xs text-primary uppercase tracking-wider mb-1.5 block">
                  Meta calórica diária (kcal) — opcional
                </label>
                <Input
                  type="text"
                  placeholder="Ex: 2500"
                  value={metaCalorica}
                  onChange={(e) => setMetaCalorica(e.target.value)}
                  maxLength={10}
                  className="bg-background-secondary border-primary/15 text-foreground placeholder:text-muted-foreground focus:border-primary/40"
                />
              </div>
              <Button
                onClick={handleGenerate}
                disabled={generating}
                className="w-full bg-primary text-primary-foreground hover:bg-primary-light font-display text-lg tracking-wider h-12"
              >
                {generating ? (
                  <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> GERANDO...</>
                ) : (
                  "GERAR PLANO"
                )}
              </Button>
            </div>
          )}
        </div>

        <Disclaimer />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-display text-4xl text-primary tracking-wider">DIETA</h1>
        <p className="font-mono text-xs text-muted-foreground uppercase tracking-wider mt-1">
          {completedMeals}/{dayMeals.length} refeições concluídas
        </p>
      </div>

      {/* Day selector */}
      <div className="flex gap-1.5 overflow-x-auto pb-1">
        {DAY_LABELS.map((label, i) => (
          <button
            key={i}
            onClick={() => setSelectedDay(i)}
            className={cn(
              "px-3 py-2 rounded-lg font-mono text-xs uppercase tracking-wider transition-all shrink-0",
              selectedDay === i
                ? "bg-primary text-primary-foreground"
                : "bg-background-secondary text-muted-foreground hover:text-foreground border border-primary/15"
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Macro bars */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: "Calorias", value: dayCalories, unit: "kcal", color: "bg-primary" },
          { label: "Proteína", value: dayProtein, unit: "g", color: "bg-blue-400" },
          { label: "Carbs", value: dayCarbs, unit: "g", color: "bg-amber-400" },
          { label: "Gordura", value: dayFat, unit: "g", color: "bg-rose-400" },
        ].map((macro) => (
          <div key={macro.label} className="bg-background-tertiary border border-primary/15 rounded-lg p-3 text-center">
            <p className="font-mono text-xs text-muted-foreground uppercase tracking-wider mb-1">{macro.label}</p>
            <p className="font-display text-xl text-foreground">{macro.value}</p>
            <p className="font-mono text-xs text-muted-foreground">{macro.unit}</p>
          </div>
        ))}
      </div>

      {/* Meal cards */}
      <div className="space-y-3">
        {dayMeals.length === 0 ? (
          <p className="text-muted-foreground text-sm text-center py-8">Nenhuma refeição para este dia.</p>
        ) : (
          dayMeals.map((meal) => (
            <div
              key={meal.id}
              className={cn(
                "rounded-lg border p-4 transition-all duration-300",
                meal.completed
                  ? "border-[#4CAF72]/30 bg-[#4CAF72]/5"
                  : "border-primary/15 bg-background-secondary"
              )}
            >
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-display text-lg text-foreground tracking-wider">
                  {MEAL_TYPE_LABELS[meal.meal_type] || meal.meal_type}
                </h3>
                <button
                  onClick={() => toggleMeal(meal)}
                  className={cn(
                    "flex items-center gap-1.5 font-mono text-xs uppercase tracking-wider transition-colors px-3 py-1.5 rounded-md border",
                    meal.completed
                      ? "border-[#4CAF72]/30 text-[#4CAF72] bg-[#4CAF72]/10"
                      : "border-primary/20 text-primary hover:bg-primary/10"
                  )}
                >
                  <Check className="h-3 w-3" />
                  {meal.completed ? "Feito" : "Marcar"}
                </button>
              </div>

              {/* Foods list */}
              <div className="space-y-1.5 mb-3">
                {(meal.foods as FoodItem[]).map((food, i) => (
                  <div key={i} className="flex items-center justify-between text-sm">
                    <span className={cn("text-foreground", meal.completed && "text-muted-foreground line-through")}>
                      {food.name}
                    </span>
                    <span className="font-mono text-xs text-muted-foreground shrink-0 ml-2">
                      {food.quantity} {food.unit}
                    </span>
                  </div>
                ))}
              </div>

              {/* Meal macros */}
              <div className="flex gap-4 font-mono text-xs text-muted-foreground">
                <span>{meal.total_calories} kcal</span>
                <span>{meal.total_protein}g P</span>
                <span>{meal.total_carbs}g C</span>
                <span>{meal.total_fat}g G</span>
              </div>
            </div>
          ))
        )}
      </div>

      <Disclaimer />
    </div>
  );
};

const Disclaimer = () => (
  <div className="bg-background-tertiary border border-primary/15 border-l-2 border-l-primary rounded-lg p-4">
    <p className="font-mono text-xs text-muted-foreground leading-relaxed">
      Este plano foi gerado por inteligência artificial com base nas suas informações. Não substitui consulta com nutricionista. O Distrito 1% recomenda acompanhamento profissional.
    </p>
  </div>
);

export default Dieta;

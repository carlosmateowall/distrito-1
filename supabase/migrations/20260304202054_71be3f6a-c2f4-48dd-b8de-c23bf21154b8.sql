
-- Meal plans table
CREATE TABLE public.meal_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  week_start DATE NOT NULL,
  reviewed_by_professional BOOLEAN NOT NULL DEFAULT false,
  professional_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (user_id, week_start)
);

ALTER TABLE public.meal_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own meal_plans" ON public.meal_plans FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users insert own meal_plans" ON public.meal_plans FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own meal_plans" ON public.meal_plans FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users delete own meal_plans" ON public.meal_plans FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Meals table
CREATE TABLE public.meals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meal_plan_id UUID NOT NULL REFERENCES public.meal_plans(id) ON DELETE CASCADE,
  day_of_week INT NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  meal_type TEXT NOT NULL CHECK (meal_type IN ('cafe_manha', 'pre_treino', 'almoco', 'lanche', 'jantar', 'ceia')),
  foods JSONB NOT NULL DEFAULT '[]'::jsonb,
  total_calories INT NOT NULL DEFAULT 0,
  total_protein INT NOT NULL DEFAULT 0,
  total_carbs INT NOT NULL DEFAULT 0,
  total_fat INT NOT NULL DEFAULT 0,
  completed BOOLEAN NOT NULL DEFAULT false
);

ALTER TABLE public.meals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own meals" ON public.meals FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.meal_plans mp WHERE mp.id = meal_plan_id AND mp.user_id = auth.uid()));
CREATE POLICY "Users insert own meals" ON public.meals FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.meal_plans mp WHERE mp.id = meal_plan_id AND mp.user_id = auth.uid()));
CREATE POLICY "Users update own meals" ON public.meals FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.meal_plans mp WHERE mp.id = meal_plan_id AND mp.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.meal_plans mp WHERE mp.id = meal_plan_id AND mp.user_id = auth.uid()));

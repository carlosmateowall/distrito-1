
-- Badges table
CREATE TABLE public.badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  badge_type TEXT NOT NULL,
  earned_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (user_id, badge_type)
);

ALTER TABLE public.badges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own badges" ON public.badges FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Anyone can read badges for ranking" ON public.badges FOR SELECT TO authenticated USING (true);
CREATE POLICY "System insert badges" ON public.badges FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- Weekly ranking view: counts completed checklist items per user for current ISO week
CREATE OR REPLACE VIEW public.weekly_ranking AS
SELECT
  dc.user_id,
  p.nome,
  COUNT(*) FILTER (WHERE dc.completed = true) AS score,
  EXTRACT(ISOYEAR FROM dc.date)::int AS year,
  EXTRACT(WEEK FROM dc.date)::int AS week
FROM public.daily_checklist dc
JOIN public.profiles p ON p.id = dc.user_id
WHERE dc.date >= date_trunc('week', CURRENT_DATE)
  AND dc.date < date_trunc('week', CURRENT_DATE) + INTERVAL '7 days'
GROUP BY dc.user_id, p.nome, EXTRACT(ISOYEAR FROM dc.date), EXTRACT(WEEK FROM dc.date)
ORDER BY score DESC
LIMIT 50;

-- Grant access to the view
GRANT SELECT ON public.weekly_ranking TO authenticated;
GRANT SELECT ON public.weekly_ranking TO anon;

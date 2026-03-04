
-- Create daily_checklist table
CREATE TABLE public.daily_checklist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  protocol TEXT NOT NULL CHECK (protocol IN ('corpo', 'mente', 'espirito')),
  item_key TEXT NOT NULL,
  completed BOOLEAN NOT NULL DEFAULT false,
  note TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (user_id, date, item_key)
);

-- RLS
ALTER TABLE public.daily_checklist ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own checklist"
  ON public.daily_checklist FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own checklist"
  ON public.daily_checklist FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own checklist"
  ON public.daily_checklist FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Index for fast lookups
CREATE INDEX idx_daily_checklist_user_date ON public.daily_checklist (user_id, date);

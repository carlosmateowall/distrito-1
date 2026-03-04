
-- Events table
CREATE TABLE public.events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  type TEXT NOT NULL CHECK (type IN ('treino_grupo', 'masterclass', 'retiro', 'devocional', 'online')),
  datetime TIMESTAMPTZ NOT NULL,
  location_name TEXT NOT NULL DEFAULT '',
  location_address TEXT NOT NULL DEFAULT '',
  location_lat NUMERIC,
  location_lng NUMERIC,
  max_capacity INT,
  is_public BOOLEAN NOT NULL DEFAULT true,
  cover_image_url TEXT,
  whatsapp_link TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

-- Public events visible to everyone (including anon)
CREATE POLICY "Public events visible to all" ON public.events
  FOR SELECT USING (is_public = true);

-- Event confirmations table
CREATE TABLE public.event_confirmations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  confirmed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (event_id, user_id)
);

ALTER TABLE public.event_confirmations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read all confirmations" ON public.event_confirmations
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users insert own confirmations" ON public.event_confirmations
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users delete own confirmations" ON public.event_confirmations
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Anon can also see confirmations count (for public events)
CREATE POLICY "Anon read confirmations" ON public.event_confirmations
  FOR SELECT TO anon USING (true);

CREATE INDEX idx_event_confirmations_event ON public.event_confirmations (event_id);
CREATE INDEX idx_events_datetime ON public.events (datetime);

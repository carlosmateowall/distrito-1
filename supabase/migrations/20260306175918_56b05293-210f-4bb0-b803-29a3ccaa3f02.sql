
-- Challenges table
CREATE TABLE public.challenges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text NOT NULL DEFAULT '',
  created_by uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  start_date date NOT NULL,
  end_date date NOT NULL,
  invite_code text NOT NULL UNIQUE,
  status text NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Challenge members table
CREATE TABLE public.challenge_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  challenge_id uuid NOT NULL REFERENCES public.challenges(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  joined_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(challenge_id, user_id)
);

-- Challenge posts table
CREATE TABLE public.challenge_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  challenge_id uuid NOT NULL REFERENCES public.challenges(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text NOT NULL DEFAULT '',
  photo_url text,
  points integer NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Storage bucket for challenge photos
INSERT INTO storage.buckets (id, name, public) VALUES ('challenge-photos', 'challenge-photos', true);

-- RLS for challenges: members can read, creator can manage
CREATE POLICY "Members can read challenges" ON public.challenges
  FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.challenge_members cm WHERE cm.challenge_id = challenges.id AND cm.user_id = auth.uid())
    OR created_by = auth.uid()
  );

CREATE POLICY "Authenticated users can create challenges" ON public.challenges
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Creator can update challenge" ON public.challenges
  FOR UPDATE TO authenticated
  USING (auth.uid() = created_by)
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Creator can delete challenge" ON public.challenges
  FOR DELETE TO authenticated
  USING (auth.uid() = created_by);

-- RLS for challenge_members
CREATE POLICY "Members can read members" ON public.challenge_members
  FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.challenge_members cm2 WHERE cm2.challenge_id = challenge_members.challenge_id AND cm2.user_id = auth.uid())
  );

CREATE POLICY "Users can join challenges" ON public.challenge_members
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can leave challenges" ON public.challenge_members
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- RLS for challenge_posts
CREATE POLICY "Members can read posts" ON public.challenge_posts
  FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.challenge_members cm WHERE cm.challenge_id = challenge_posts.challenge_id AND cm.user_id = auth.uid())
  );

CREATE POLICY "Members can create posts" ON public.challenge_posts
  FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (SELECT 1 FROM public.challenge_members cm WHERE cm.challenge_id = challenge_posts.challenge_id AND cm.user_id = auth.uid())
  );

-- Storage RLS for challenge-photos
CREATE POLICY "Authenticated users can upload challenge photos" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'challenge-photos');

CREATE POLICY "Anyone can view challenge photos" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'challenge-photos');

-- Allow reading challenges by invite code (for joining)
CREATE POLICY "Anyone can find challenge by invite code" ON public.challenges
  FOR SELECT TO authenticated
  USING (true);

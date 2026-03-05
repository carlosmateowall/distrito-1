CREATE POLICY "Authenticated users can read all profiles for community"
ON public.profiles
FOR SELECT
TO authenticated
USING (true);
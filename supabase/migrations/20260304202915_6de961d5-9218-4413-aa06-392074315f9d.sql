
-- Schedule nightly streak check at 23:59 BRT (02:59 UTC)
SELECT cron.schedule(
  'nightly-streak-check',
  '59 2 * * *',
  $$
  SELECT
    net.http_post(
        url:='https://yvvfyielofnqvufoguqj.supabase.co/functions/v1/streak-check',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl2dmZ5aWVsb2ZucXZ1Zm9ndXFqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI2NTQzODQsImV4cCI6MjA4ODIzMDM4NH0.mDbwmiPS-Z9V8utu6UqkCPv2AvrB6tDv1RLYyxcm7rI"}'::jsonb,
        body:=concat('{"time": "', now(), '"}')::jsonb
    ) as request_id;
  $$
);

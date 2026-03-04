import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const STREAK_MILESTONES = [7, 21, 30, 60, 100];
const TOTAL_CHECKLIST_ITEMS = 9;

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split("T")[0];

    // Get all profiles
    const { data: profiles, error: pErr } = await supabase
      .from("profiles")
      .select("id, streak_atual, streak_maximo");

    if (pErr) throw pErr;

    let updated = 0;
    let reset = 0;

    for (const profile of profiles || []) {
      // Count completed items for yesterday
      const { count } = await supabase
        .from("daily_checklist")
        .select("*", { count: "exact", head: true })
        .eq("user_id", profile.id)
        .eq("date", yesterdayStr)
        .eq("completed", true);

      const completedAll = (count || 0) >= TOTAL_CHECKLIST_ITEMS;

      if (completedAll) {
        const newStreak = (profile.streak_atual || 0) + 1;
        const newMax = Math.max(newStreak, profile.streak_maximo || 0);

        await supabase
          .from("profiles")
          .update({ streak_atual: newStreak, streak_maximo: newMax })
          .eq("id", profile.id);

        // Check milestones and award badges
        for (const milestone of STREAK_MILESTONES) {
          if (newStreak >= milestone) {
            await supabase
              .from("badges")
              .upsert(
                { user_id: profile.id, badge_type: `streak_${milestone}` },
                { onConflict: "user_id,badge_type" }
              );
          }
        }

        updated++;
      } else {
        // Only reset if they had a streak and didn't complete yesterday
        // Check if they had any checklist items at all (meaning the day existed)
        const { count: totalItems } = await supabase
          .from("daily_checklist")
          .select("*", { count: "exact", head: true })
          .eq("user_id", profile.id)
          .eq("date", yesterdayStr);

        if ((totalItems || 0) > 0 && profile.streak_atual > 0) {
          await supabase
            .from("profiles")
            .update({ streak_atual: 0 })
            .eq("id", profile.id);
          reset++;
        }
      }
    }

    return new Response(
      JSON.stringify({ success: true, updated, reset, processed: (profiles || []).length }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("streak-check error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

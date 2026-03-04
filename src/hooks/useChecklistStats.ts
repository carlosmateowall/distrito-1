import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface ChecklistStats {
  corpo: { done: number; total: number };
  mente: { done: number; total: number };
  espirito: { done: number; total: number };
}

const defaultStats: ChecklistStats = {
  corpo: { done: 0, total: 3 },
  mente: { done: 0, total: 3 },
  espirito: { done: 0, total: 3 },
};

export function useChecklistStats() {
  const { user } = useAuth();
  const [stats, setStats] = useState<ChecklistStats>(defaultStats);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!user) return;
    const date = new Date().toISOString().split("T")[0];

    const { data } = await supabase
      .from("daily_checklist")
      .select("protocol, completed")
      .eq("user_id", user.id)
      .eq("date", date);

    if (!data || data.length === 0) {
      setStats(defaultStats);
      setLoading(false);
      return;
    }

    const result = { ...defaultStats };
    data.forEach((r: any) => {
      const key = r.protocol as keyof ChecklistStats;
      if (result[key] && r.completed) {
        result[key] = { ...result[key], done: result[key].done + 1 };
      }
    });

    setStats(result);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    load();
  }, [load]);

  return { stats, loading };
}

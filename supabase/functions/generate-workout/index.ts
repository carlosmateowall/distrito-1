import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { objetivo, nivel, dias_treino, equipamento, restricoes_alimentares } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const systemPrompt = `Você é um personal trainer experiente. Gere um plano de treino semanal em JSON.

REGRAS:
- O treino deve ter exatamente 7 dias (0=Domingo a 6=Sábado)
- Os dias sem treino devem ter status "descanso" e exercises vazio
- Os dias com treino devem ter status "pendente"
- Adapte ao nível, objetivo, equipamento e dias disponíveis
- Cada exercício precisa de: name, muscle_groups, sets, reps (string ex: "8-12"), rest_seconds, order_index
- Retorne APENAS o JSON, sem markdown

FORMATO EXATO:
{
  "days": [
    {
      "day_of_week": 0,
      "day_name": "Descanso",
      "status": "descanso",
      "exercises": []
    },
    {
      "day_of_week": 1,
      "day_name": "Peito + Tríceps",
      "status": "pendente",
      "exercises": [
        {
          "name": "Supino Reto",
          "muscle_groups": "Peitoral, Tríceps",
          "sets": 4,
          "reps": "8-12",
          "rest_seconds": 90,
          "order_index": 0
        }
      ]
    }
  ]
}`;

    const userPrompt = `Perfil do aluno:
- Objetivo: ${objetivo || "saúde geral"}
- Nível: ${nivel || "iniciante"}
- Dias disponíveis para treino: ${dias_treino || 4}
- Equipamento: ${equipamento || "academia completa"}
- Restrições: ${restricoes_alimentares || "nenhuma"}

Gere o treino semanal completo.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const status = response.status;
      if (status === 429) {
        return new Response(JSON.stringify({ error: "Limite de requisições excedido. Tente novamente em alguns minutos." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (status === 402) {
        return new Response(JSON.stringify({ error: "Créditos de IA esgotados." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", status, t);
      return new Response(JSON.stringify({ error: "Erro ao gerar treino" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    let content = data.choices?.[0]?.message?.content || "";

    // Strip markdown code fences if present
    content = content.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();

    let plan;
    try {
      plan = JSON.parse(content);
    } catch {
      console.error("Failed to parse AI response:", content);
      return new Response(JSON.stringify({ error: "Erro ao processar resposta da IA" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify(plan), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-workout error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Erro desconhecido" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

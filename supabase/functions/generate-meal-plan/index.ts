import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { objetivo, nivel, dias_treino, equipamento, restricoes_alimentares, peso, altura, meta_calorica } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const systemPrompt = `Você é um nutricionista esportivo experiente. Gere um plano alimentar semanal em JSON.

REGRAS:
- 7 dias (0=Domingo a 6=Sábado)
- 6 refeições por dia: cafe_manha, pre_treino, almoco, lanche, jantar, ceia
- Cada refeição tem: meal_type, foods (array de objetos com name, quantity, unit, calories, protein, carbs, fat), total_calories, total_protein, total_carbs, total_fat
- Adapte ao objetivo, restrições alimentares e meta calórica
- Valores nutricionais devem ser realistas e somar corretamente
- Retorne APENAS o JSON, sem markdown

FORMATO EXATO:
{
  "days": [
    {
      "day_of_week": 0,
      "meals": [
        {
          "meal_type": "cafe_manha",
          "foods": [
            {"name": "Ovos mexidos", "quantity": "3", "unit": "unidades", "calories": 210, "protein": 18, "carbs": 1, "fat": 15}
          ],
          "total_calories": 210,
          "total_protein": 18,
          "total_carbs": 1,
          "total_fat": 15
        }
      ]
    }
  ]
}`;

    const userPrompt = `Perfil do aluno:
- Objetivo: ${objetivo || "saúde geral"}
- Nível de treino: ${nivel || "iniciante"}
- Dias de treino/semana: ${dias_treino || 4}
- Equipamento: ${equipamento || "academia completa"}
- Restrições alimentares: ${restricoes_alimentares || "nenhuma"}
- Peso atual: ${peso || "não informado"}
- Altura: ${altura || "não informada"}
- Meta calórica diária: ${meta_calorica || "calcule com base no perfil"}

Gere o plano alimentar semanal completo com 6 refeições por dia.`;

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
      return new Response(JSON.stringify({ error: "Erro ao gerar plano alimentar" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    let content = data.choices?.[0]?.message?.content || "";
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
    console.error("generate-meal-plan error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Erro desconhecido" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

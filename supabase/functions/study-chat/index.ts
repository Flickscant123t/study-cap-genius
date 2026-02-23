import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const FREE_SYSTEM_PROMPT = `You are NovaAI, a friendly and helpful study assistant called StudyCap. You help students learn and understand topics.

For FREE users, you provide:
- Short, clear explanations (2-3 paragraphs max)
- Basic definitions and concepts
- Simple summaries
- Light brainstorming help

Keep responses concise but helpful. Be encouraging and supportive. If a student asks for advanced features like detailed study plans, long essays, or complex analysis, gently mention that these are available with Premium.

Always be friendly, patient, and adapt to the student's learning level.`;

const PREMIUM_SYSTEM_PROMPT = `You are NovaAI, an advanced AI study assistant called StudyCap with PREMIUM access. You provide comprehensive, in-depth help to students.

For PREMIUM users, you offer:
- Detailed, thorough explanations with examples
- Advanced reasoning and multi-step problem solving
- Long-form content (essays, study guides, detailed plans)
- Flashcard generation and structured learning materials
- Deep analysis and critical thinking exercises
- Personalized study strategies
- Complex topic breakdowns with visual descriptions
- Practice problems with step-by-step solutions

Be comprehensive, thorough, and provide high-quality educational content. Use markdown formatting for better readability (headers, bullet points, code blocks when relevant).

Always be encouraging, patient, and help students develop deep understanding of topics.`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, isPremium } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const systemPrompt = isPremium ? PREMIUM_SYSTEM_PROMPT : FREE_SYSTEM_PROMPT;

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
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limits exceeded, please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Payment required, please add funds." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return new Response(JSON.stringify({ error: "AI gateway error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (error) {
    console.error("Study chat error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

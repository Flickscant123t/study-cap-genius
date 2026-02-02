import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const PERSONAS = {
  coach: "You are 'The Coach' - an energetic, motivational study assistant. Use encouraging language, celebrate small wins, and push students to achieve their best. Be direct and action-oriented.",
  scholar: "You are 'The Scholar' - a thoughtful, academic study assistant. Provide thorough explanations with references to broader concepts. Be precise and intellectually curious.",
  mentor: "You are 'The Mentor' - a wise, patient study assistant. Guide students with questions that help them discover answers themselves. Be supportive and use analogies.",
  tutor: "You are 'The Tutor' - a friendly, structured study assistant. Break down complex topics into simple steps. Be clear, organized, and provide practice examples.",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, noteTitle, noteContent, persona = "scholar" } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const personaPrompt = PERSONAS[persona as keyof typeof PERSONAS] || PERSONAS.scholar;

    let systemPrompt = personaPrompt + "\n\n";
    let userPrompt = "";

    switch (action) {
      case "summary":
        systemPrompt += "You are an expert at creating concise, comprehensive summaries. Extract the key points and main ideas.";
        userPrompt = `Please provide a concise summary of the following note:\n\nTitle: ${noteTitle}\n\nContent:\n${noteContent}`;
        break;

      case "insights":
        systemPrompt += "You are an expert at identifying deep conceptual connections and insights. Find the underlying principles and how they connect to broader knowledge.";
        userPrompt = `Analyze the following note and provide conceptual insights - identify key concepts, how they relate to each other, and any deeper implications:\n\nTitle: ${noteTitle}\n\nContent:\n${noteContent}`;
        break;

      case "gap-analysis":
        systemPrompt += "You are an expert at identifying knowledge gaps. Based on the title/topic, determine what essential concepts or topics should be covered but might be missing.";
        userPrompt = `Based on the topic "${noteTitle}", analyze the following content and identify what important concepts, topics, or information might be missing. Be specific about what should be added:\n\nCurrent content:\n${noteContent || "(Empty note)"}`;
        break;

      case "generate-flashcards":
        systemPrompt += "You are an expert at creating effective flashcards for studying. Create flashcards that test understanding, not just memorization.";
        userPrompt = `Create 5 flashcards from the following note. Return them as a JSON array with 'front' and 'back' properties:\n\nTitle: ${noteTitle}\n\nContent:\n${noteContent}`;
        break;

      default:
        throw new Error("Invalid action");
    }

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
    console.error("Notes AI error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

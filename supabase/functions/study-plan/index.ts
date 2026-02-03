import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { goal, durationDays, weakPoints, type, task, answer } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    let systemPrompt = "";
    let userPrompt = "";

    if (type === "generate_plan") {
      // Generate a structured study plan
      systemPrompt = `You are an expert study coach. Create structured, actionable study plans.
Always respond with valid JSON only, no markdown or explanations.`;

      userPrompt = `Create a ${durationDays}-day study plan for the goal: "${goal}"

${weakPoints && weakPoints.length > 0 ? `The student struggles with these topics, prioritize them: ${weakPoints.join(", ")}` : ""}

Return a JSON object with this exact structure:
{
  "plan": {
    "title": "Plan title",
    "overview": "Brief overview"
  },
  "tasks": [
    {
      "day": 1,
      "title": "Task title",
      "description": "What to do",
      "type": "active_recall" | "practice" | "review" | "spaced_review" | "deep_study",
      "timeMinutes": 30,
      "topic": "specific topic name"
    }
  ]
}

Create 3-5 tasks per day. Include variety: Active Recall, Practice Problems, Spaced Review, Deep Study sessions.`;

    } else if (type === "replan") {
      // Dynamic re-planning when user is struggling
      systemPrompt = `You are an adaptive study coach. Adjust study plans based on student struggles.
Always respond with valid JSON only.`;

      userPrompt = `The student is struggling with their study plan for: "${goal}"
Days remaining: ${durationDays}
${weakPoints && weakPoints.length > 0 ? `Weak areas: ${weakPoints.join(", ")}` : ""}

Create an adjusted plan that:
1. Extends time for difficult topics
2. Adds more practice problems
3. Includes shorter, more focused sessions

Return the same JSON structure as a regular plan.`;

    } else if (type === "tutor_question") {
      // Generate a question for the tutor overlay
      systemPrompt = `You are an expert tutor. Generate challenging but fair questions.
Respond with JSON only.`;

      userPrompt = `Generate a question to test understanding of:
Task: "${task.title}"
Topic: "${task.topic || task.description}"

Return JSON:
{
  "question": "The question to ask",
  "hints": ["hint 1", "hint 2"],
  "correctAnswer": "The correct answer",
  "explanation": "Brief explanation of the concept"
}`;

    } else if (type === "verify_answer") {
      // Verify student's answer
      systemPrompt = `You are an expert tutor verifying student answers. Be fair but thorough.
Respond with JSON only.`;

      userPrompt = `Task: "${task.title}"
Expected answer: "${task.correctAnswer}"
Student's answer: "${answer}"

Evaluate if the student understands the concept (not just exact wording).

Return JSON:
{
  "correct": true/false,
  "feedback": "Specific feedback",
  "masteryLevel": "needs_work" | "partial" | "mastered",
  "deepExplanation": "If wrong, provide a clear 1-2 sentence explanation of the correct concept"
}`;

    } else if (type === "generate_flashcards") {
      // Magic Paste: Generate flashcards from content
      systemPrompt = `You are an expert at creating effective flashcards for learning.
Analyze content complexity and create appropriate number of cards.
Respond with JSON only.`;

      const contentLength = goal.length;
      const estimatedCards = Math.max(3, Math.min(25, Math.ceil(contentLength / 200)));

      userPrompt = `Create flashcards from this content:
"${goal}"

Based on the content complexity and length, create approximately ${estimatedCards} flashcards.
Focus on key concepts, definitions, and important relationships.

Return JSON:
{
  "flashcards": [
    {
      "front": "Question or prompt",
      "back": "Answer or explanation"
    }
  ],
  "suggestedCount": ${estimatedCards}
}`;
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
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI API error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Credits required. Please add funds." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      
      throw new Error("AI API error");
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "";

    // Parse JSON from response
    let parsed;
    try {
      // Extract JSON from potential markdown code blocks
      const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/) || [null, content];
      parsed = JSON.parse(jsonMatch[1].trim());
    } catch (e) {
      console.error("Failed to parse AI response:", content);
      throw new Error("Failed to parse AI response");
    }

    return new Response(JSON.stringify(parsed), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Study plan error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

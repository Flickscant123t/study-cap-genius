import type { VercelRequest, VercelResponse } from "@vercel/node";

const SUPABASE_WEBHOOK =
  "https://pthlcyiiceyvpzkalwog.supabase.co/functions/v1/stripe-webhook";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const supabaseResponse = await fetch(SUPABASE_WEBHOOK, {
      method: req.method,
      headers: {
        "Content-Type": req.headers["content-type"] ?? "application/json",
        "stripe-signature": req.headers["stripe-signature"] ?? "",
      },
      body: req.rawBody && req.rawBody.length ? req.rawBody : undefined,
    });

    const text = await supabaseResponse.text();
    res.status(supabaseResponse.status).send(text || "ok");
  } catch (error) {
    console.error("Proxying to Supabase webhook failed:", error);
    res
      .status(500)
      .json({ error: "Unable to forward Stripe webhook to Supabase" });
  }
}

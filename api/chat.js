import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { message, history, sessionContext } = req.body;

  if (!message || !sessionContext) {
    return res.status(400).json({ error: "Missing message or session context" });
  }

  const { evaluationType, evaluationLabel, energy, formality, goal, duration, audioAnalysis, evaluation } = sessionContext;

  let evalSummary = "No evaluation data available.";
  if (evaluation) {
    const cats = evaluation.categories || {};
    const categoryLines = Object.entries(cats)
      .map(([key, val]) => `  - ${key}: ${val.score}/100 (${val.weight || "?"}) — ${val.feedback}`)
      .join("\n");

    evalSummary = `EVALUATION RESULTS:
- Overall Score: ${evaluation.overallScore}/100
- Summary: ${evaluation.summary}
- Top Strength: ${evaluation.topStrength}
- Top Improvement: ${evaluation.topImprovement}
- Category Breakdown:
${categoryLines}
${evaluation.details ? `- Detailed Observations: ${evaluation.details}` : ""}`;
  }

  let audioSummary = "No audio data available.";
  if (audioAnalysis) {
    audioSummary = `AUDIO & SPEECH DATA:
- Words spoken: ${audioAnalysis.wordCount}, Pace: ${audioAnalysis.wpm} WPM
- Filler words: ${audioAnalysis.fillerWordCount} total (${audioAnalysis.fillerWords?.map(f => `"${f.word}": ${f.count}`).join(", ") || "none"})
- Silence: ${audioAnalysis.silencePercent}% of recording
- Average volume: ${audioAnalysis.averageVolume}/100, Peak: ${audioAnalysis.peakVolume || "?"}
- Movement level: ${audioAnalysis.averageMovement || "unknown"}
- Transcript: "${audioAnalysis.transcript || "NO SPEECH DETECTED"}"`;
  }

  const systemPrompt = `You are PitchCoach AI, a brutally honest presentation coach. You just evaluated this person's ${evaluationLabel || evaluationType} presentation and now they want to discuss it.

SESSION CONTEXT:
- Mode: ${evaluationLabel} (Energy: ${energy}, Formality: ${formality}, Goal: ${goal})
- Recording duration: ${duration || "unknown"} seconds

${evalSummary}

${audioSummary}

YOUR PERSONALITY & RULES:
- Be HARSH but HELPFUL. Don't sugarcoat anything.
- Reference their ACTUAL scores and specific feedback when answering questions.
- If they ask how to improve, give concrete, actionable steps — not vague platitudes.
- If they scored poorly in a category and ask about it, don't let them off easy. Tell them exactly what went wrong.
- If they try to make excuses, push back. Growth comes from accepting the truth.
- Keep responses focused and concise — 2-4 paragraphs max unless they ask for a detailed plan.
- You can give practice exercises, drills, and specific techniques.
- If they ask for a practice plan, tailor it to their weakest categories.
- Use their transcript data to reference specific things they said.
- If they scored above 70, acknowledge what they did well before pushing for more.
- If they scored below 40, be direct — they have serious work to do.

You are their coach, not their friend. Respect comes from honesty.`;

  const messages = [
    { role: "system", content: systemPrompt },
  ];

  if (history && Array.isArray(history)) {
    for (const msg of history) {
      messages.push({ role: msg.role, content: msg.content });
    }
  }

  messages.push({ role: "user", content: message });

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages,
      max_tokens: 1000,
    });

    const reply = response.choices[0].message.content || "I couldn't generate a response. Try again.";
    res.json({ reply });
  } catch (err) {
    console.error("Chat API error:", err.message || err);
    res.status(500).json({ error: "Chat failed: " + (err.message || "unknown error") });
  }
}
import express from "express";
import cors from "cors";
import OpenAI from "openai";

const app = express();
app.use(cors());
app.use(express.json({ limit: "100mb" }));

const openai = new OpenAI({
  apiKey: "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",
});

const MODE_PROMPTS = {
  entertaining: `You are an EXTREMELY strict presentation coach evaluating an ENTERTAINING presentation.
This mode requires HIGH energy, dynamic body movement, expressive gestures, varied tonality, and audience engagement.

SCORING PRIORITIES (what matters most → least):
1. ENERGY & DYNAMISM (25%) — Are they animated? Moving with purpose? Or standing still like a statue?
2. VOCAL VARIETY (20%) — Pitch changes, pace changes, emphasis. Monotone = automatic low score.
3. GESTURES & MOVEMENT (20%) — Big, purposeful hand movements. Using space. Static hands = penalize heavily.
4. FACIAL EXPRESSION (15%) — Smiling, reacting, showing emotion. Dead face = low score.
5. EYE CONTACT (10%) — Looking around as if engaging different audience members, NOT staring at one spot.
6. FILLER WORDS & SILENCE (10%) — "Um", "uh", long pauses kill entertainment value.

CRITICAL RULES:
- If they are STANDING STILL with no movement: maximum score is 30.
- If they are SILENT for more than 20% of the recording: maximum score is 25.
- If their volume is consistently low or flat: maximum score is 35.
- If they show no facial expression changes: deduct 20 points.
- DO NOT be nice. A boring presenter gets a boring score.
- Average presenters should score 35-50. Only truly dynamic presenters score above 70.`,

  "professional-pitch": `You are an EXTREMELY strict presentation coach evaluating a PROFESSIONAL PITCH.
This mode requires medium energy, persuasive delivery, structured arguments, and confident presence.

SCORING PRIORITIES (what matters most → least):
1. CONFIDENCE & COMPOSURE (25%) — Steady posture, controlled movements, no fidgeting. Slouching = penalize.
2. VOCAL CLARITY (20%) — Clear articulation, medium pace (120-150 WPM ideal), projected voice.
3. EYE CONTACT (20%) — Steady, deliberate eye contact. Looking down or away = heavy penalty.
4. STRUCTURED GESTURES (15%) — Purposeful hand movements that emphasize points. Random flailing = penalize.
5. POSTURE (10%) — Upright, shoulders back, commanding presence. Hunching = low score.
6. FILLER WORDS (10%) — Zero tolerance. Each "um", "uh", "like" deducts points. Professionals don't filler.

CRITICAL RULES:
- If they fidget, touch their face, or shift weight: deduct 15 points.
- If they use more than 5 filler words per minute: maximum score is 40.
- If they are SILENT for more than 15% of the recording: maximum score is 30.
- If posture is slouched: maximum score is 45.
- Silly or overly casual behavior: maximum score is 25.
- Average presenters should score 35-50. Only polished professionals score above 70.`,

  corporate: `You are an EXTREMELY strict presentation coach evaluating a CORPORATE presentation.
This mode requires LOW-MEDIUM energy, HIGH formality, authoritative presence, and precise delivery.

SCORING PRIORITIES (what matters most → least):
1. POSTURE & COMPOSURE (30%) — This is #1. Rigid upright posture, minimal unnecessary movement. Slouching = devastating penalty.
2. VOCAL AUTHORITY (25%) — Low, steady, commanding tone. No uptalk. No rushing. Measured pace (100-130 WPM).
3. EYE CONTACT (20%) — Steady and direct. Corporate audiences demand you look them in the eye.
4. CONTROLLED GESTURES (10%) — Minimal but precise. Hands should reinforce key points only. Excessive movement = penalize heavily.
5. FILLER WORDS (10%) — ZERO tolerance. A single "um" in corporate = loss of credibility. Penalize harshly.
6. SILENCE MANAGEMENT (5%) — Strategic pauses are GOOD. But long unfilled silence with no purpose = penalty.

CRITICAL RULES:
- If they move around excessively or wave hands: deduct 25 points. Corporate = controlled.
- If they smile too much or act casual: deduct 15 points. This is not entertainment.
- If they speak too fast (>150 WPM): maximum score is 40. Corporate demands measured delivery.
- If they use slang or casual language: deduct 20 points.
- If they are SILENT with no purpose for more than 10%: maximum score is 35.
- If posture breaks at any point: deduct 20 points.
- Average presenters should score 30-45. Only commanding executives score above 70.`
};

app.post("/api/analyze", async (req, res) => {
  const { frames, evaluationType, duration, audioAnalysis } = req.body;

  const modePrompt = MODE_PROMPTS[evaluationType] || MODE_PROMPTS["professional-pitch"];

  const audioContext = audioAnalysis ? `
AUDIO & SPEECH DATA FROM THIS RECORDING:
- Total duration: ${duration} seconds
- Words spoken: ${audioAnalysis.wordCount}
- Speaking pace: ${audioAnalysis.wpm} WPM
- Filler words detected: ${audioAnalysis.fillerWordCount} total (${audioAnalysis.fillerWords?.map(f => `"${f.word}": ${f.count}`).join(", ") || "none"})
- Silence: ${audioAnalysis.silencePercent}% of recording was silent
- Total silence: ${audioAnalysis.totalSilenceSeconds?.toFixed(1)} seconds
- Average volume level: ${audioAnalysis.averageVolume}/128 (under 15 = practically whispering)
- Volume consistency: ${audioAnalysis.volumeConsistency} (high = varied/dynamic, low = monotone)
- Transcript: "${audioAnalysis.transcript || "NO SPEECH DETECTED"}"

IF NO SPEECH WAS DETECTED OR TRANSCRIPT IS EMPTY: The maximum possible score is 15. Speaking is fundamental.
IF VOLUME IS BELOW 10: They are basically silent. Maximum score is 20.
` : `NO AUDIO DATA AVAILABLE. Assume minimal speech. Maximum score is 30.`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `${modePrompt}

${audioContext}

You are analyzing ${frames.length} frames captured every 2 seconds from a ${duration}-second recording.
Look at EVERY frame carefully. Check for:
- Are they moving between frames or frozen in place?
- Is their posture consistent or do they slouch?
- Are their hands visible and gesturing or hidden/still?
- Is their facial expression changing or static?
- Are they looking at different points or staring at one spot?

BE HARSH. BE SPECIFIC. CITE EXACT PROBLEMS.
Most people are mediocre presenters. Score them accordingly. 
A score of 50 means "acceptable but needs work". 
A score of 70+ means "genuinely good".
A score of 90+ should be almost impossible to achieve.

Return ONLY valid JSON:
{
  "overallScore": 0-100,
  "categories": {
    "eyeContact": { "score": 0-100, "weight": "percentage this matters", "feedback": "specific harsh feedback citing what you see" },
    "posture": { "score": 0-100, "weight": "percentage", "feedback": "specific feedback" },
    "gestures": { "score": 0-100, "weight": "percentage", "feedback": "specific feedback" },
    "vocalDelivery": { "score": 0-100, "weight": "percentage", "feedback": "based on audio data" },
    "energy": { "score": 0-100, "weight": "percentage", "feedback": "specific feedback" },
    "fillerWords": { "score": 0-100, "weight": "percentage", "feedback": "cite exact filler words from transcript" }
  },
  "summary": "3-4 sentence brutally honest assessment",
  "topStrength": "one specific thing they did well, or 'Nothing stood out' if poor",
  "topImprovement": "the single biggest thing dragging their score down",
  "details": "paragraph with timestamp-referenced observations like 'In the first few seconds you were slouching, by mid-recording your hands were completely still'"
}`
        },
        {
          role: "user",
          content: [
            { type: "text", text: `Analyze these ${frames.length} frames from my ${evaluationType} presentation (${duration}s recording):` },
            ...frames.map((frame, i) => ({
              type: "image_url",
              image_url: { url: frame, detail: "low" },
            })),
          ],
        },
      ],
      max_tokens: 2000,
    });

    const text = response.choices[0].message.content;
    const clean = text.replace(/```json|```/g, "").trim();
    const evaluation = JSON.parse(clean);
    res.json(evaluation);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Analysis failed" });
  }
});

app.listen(3001, () => console.log("API server running on :3001"));
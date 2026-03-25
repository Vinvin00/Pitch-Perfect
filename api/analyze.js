import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
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

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { frames, frameUrls, evaluationType, duration, audioAnalysis } = req.body;

  const modePrompt = MODE_PROMPTS[evaluationType] || MODE_PROMPTS["professional-pitch"];

  let imageContent = [];
  if (frameUrls && frameUrls.length > 0) {
    const limitedUrls = frameUrls.slice(0, 8);
    imageContent = limitedUrls.map((url) => ({
      type: "image_url",
      image_url: { url, detail: "low" },
    }));
  } else if (frames && frames.length > 0) {
    const limitedFrames = frames.slice(0, 8);
    imageContent = limitedFrames.map((frame) => ({
      type: "image_url",
      image_url: { url: frame, detail: "low" },
    }));
  }

  const audioContext = audioAnalysis ? `
AUDIO & SPEECH DATA FROM THIS RECORDING:
- Total duration: ${duration} seconds
- Speaking time: ${audioAnalysis.speakingTimeSeconds || 0} seconds (rest was silence)
- Words spoken: ${audioAnalysis.wordCount}
- Speaking pace: ${audioAnalysis.wpm} WPM (while speaking), ${audioAnalysis.wpmOverall || audioAnalysis.wpm} WPM (overall including pauses)
- Filler words detected: ${audioAnalysis.fillerWordCount} total, ${audioAnalysis.fillerWordsPerMinute || 0}/min (${audioAnalysis.fillerWords?.map(f => `"${f.word}": ${f.count}`).join(", ") || "none"})
- Silence: ${audioAnalysis.silencePercent}% of recording was silent (${audioAnalysis.totalSilenceSeconds || 0}s)
- Average volume level: ${audioAnalysis.averageVolume}/100 (peak: ${audioAnalysis.peakVolume || "?"}/100)
- Volume consistency (std dev): ${audioAnalysis.volumeConsistency} (low = monotone, high = varied)
- Average body movement: ${audioAnalysis.averageMovement || "unknown"} (higher = more movement)
- Transcript: "${audioAnalysis.transcript || "NO SPEECH DETECTED"}"
${audioAnalysis.realtimeFeedbackLog?.length > 0 ? `
REAL-TIME ALERTS SHOWN TO USER DURING RECORDING:
${audioAnalysis.realtimeFeedbackLog.join("\n")}
Your evaluation should be CONSISTENT with these alerts. If the user was warned about silence or fillers during recording, your scores must reflect that.
` : ""}
IF NO SPEECH WAS DETECTED OR TRANSCRIPT IS EMPTY: The maximum possible score is 15. Speaking is fundamental.
IF VOLUME IS BELOW 5: They are basically silent. Maximum score is 20.
` : `NO AUDIO DATA AVAILABLE. Assume minimal speech. Maximum score is 30.`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `${modePrompt}

${audioContext}

You are analyzing ${imageContent.length} frames captured from a ${duration}-second recording.
Look at EVERY frame carefully. Check for:
- Are they moving between frames or frozen in place?
- Is their posture consistent or do they slouch?
- Are their hands visible and gesturing or hidden/still?
- Is their facial expression changing or static?
- Are they looking at different points or staring at one spot?

IMPORTANT: Your evaluation must be CONSISTENT with the audio data and real-time feedback the user already saw.
If the data shows they were speaking (wordCount > 0, transcript exists), do NOT say "no speech detected".
If the data shows low volume, score vocal delivery accordingly.
If movement data is low, score gestures/energy accordingly.

BE HARSH. BE SPECIFIC. CITE EXACT PROBLEMS.
Most people are mediocre presenters. Score them accordingly.
A score of 50 means "acceptable but needs work".
A score of 70+ means "genuinely good".
A score of 90+ should be almost impossible to achieve.

Return ONLY valid JSON with no markdown formatting, no backticks, no extra text:
{
  "overallScore": 0-100,
  "categories": {
    "eyeContact": { "score": 0-100, "weight": "percentage this matters", "feedback": "specific harsh feedback citing what you see" },
    "posture": { "score": 0-100, "weight": "percentage", "feedback": "specific feedback" },
    "gestures": { "score": 0-100, "weight": "percentage", "feedback": "specific feedback" },
    "vocalDelivery": { "score": 0-100, "weight": "percentage", "feedback": "based on audio data — cite WPM, volume, consistency" },
    "energy": { "score": 0-100, "weight": "percentage", "feedback": "specific feedback referencing movement and volume data" },
    "fillerWords": { "score": 0-100, "weight": "percentage", "feedback": "cite exact filler words and count from transcript" }
  },
  "summary": "3-4 sentence brutally honest assessment that references specific data points",
  "topStrength": "one specific thing they did well with data to back it up",
  "topImprovement": "the single biggest thing dragging their score down with specific numbers",
  "details": "paragraph with specific observations referencing the audio data and what you see in frames"
}`
        },
        {
          role: "user",
          content: [
            { type: "text", text: `Analyze these ${imageContent.length} frames from my ${evaluationType} presentation (${duration}s recording):` },
            ...imageContent,
          ],
        },
      ],
      max_tokens: 1200,
    });

    const text = response.choices[0].message.content;
    const clean = text.replace(/```json|```/g, "").trim();

    let evaluation;
    try {
      evaluation = JSON.parse(clean);
    } catch (parseErr) {
      evaluation = {
        overallScore: 30,
        categories: {
          eyeContact: { score: 30, weight: "20%", feedback: "Could not fully analyze eye contact from the provided frames." },
          posture: { score: 30, weight: "20%", feedback: "Could not fully analyze posture from the provided frames." },
          gestures: { score: 30, weight: "15%", feedback: "Could not fully analyze gestures from the provided frames." },
          vocalDelivery: { score: 30, weight: "20%", feedback: audioAnalysis?.transcript ? "Speech was detected but analysis was incomplete." : "No speech detected." },
          energy: { score: 30, weight: "15%", feedback: "Could not fully analyze energy from the provided frames." },
          fillerWords: { score: 50, weight: "10%", feedback: "Could not fully analyze filler words." },
        },
        summary: "The AI analysis encountered an issue processing the response. Try recording again with better lighting and clear speech.",
        topStrength: "Unable to determine",
        topImprovement: "Try recording again with better lighting and speak clearly",
        details: "The analysis could not be completed fully. Please try again.",
      };
    }

    res.json(evaluation);
  } catch (err) {
    console.error("OpenAI API error:", err.message || err);
    res.status(500).json({ error: "Analysis failed: " + (err.message || "unknown error") });
  }
}
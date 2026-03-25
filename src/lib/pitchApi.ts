import type { AudioAnalysisPayload, EvaluationPayload, PitchSessionStored } from './pitchSession'

export function getPitchApiBase(): string {
  return import.meta.env.VITE_API_URL?.replace(/\/$/, '') || 'http://localhost:3001'
}

export async function analyzePitch(body: {
  frames?: string[]
  frameUrls?: string[]
  evaluationType: string
  duration: number
  audioAnalysis: AudioAnalysisPayload
}): Promise<EvaluationPayload> {
  const res = await fetch(`${getPitchApiBase()}/api/analyze`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  const data = await res.json()
  if (!res.ok) {
    throw new Error(data?.error || `Analysis failed (${res.status})`)
  }
  if (data.error) throw new Error(data.error)
  return data as EvaluationPayload
}

export async function chatWithCoach(body: {
  message: string
  history: { role: string; content: string }[]
  sessionContext: {
    evaluationType: string
    evaluationLabel: string
    energy: string
    formality: string
    goal: string
    duration?: number
    audioAnalysis?: AudioAnalysisPayload
    evaluation?: EvaluationPayload
  }
}): Promise<string> {
  const res = await fetch(`${getPitchApiBase()}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  const data = await res.json()
  if (!res.ok || data.error) {
    throw new Error(data?.error || `Chat failed (${res.status})`)
  }
  return data.reply as string
}

export function sessionToChatContext(s: PitchSessionStored) {
  return {
    evaluationType: s.evaluationType,
    evaluationLabel: s.evaluationLabel,
    energy: s.energy,
    formality: s.formality,
    goal: s.goal,
    duration: s.duration,
    audioAnalysis: s.audioAnalysis,
    evaluation: s.evaluation,
  }
}

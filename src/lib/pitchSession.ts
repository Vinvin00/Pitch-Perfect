/** Client-side session payload aligned with pitch-bot Express API (`/api/analyze`, `/api/chat`). */

export const PITCH_SESSION_STORAGE_KEY = 'pitchcoach_pitch_session'
export const PITCH_CHAT_STORAGE_KEY = 'pitchcoach_coach_chat'

export type EvaluationModeId = 'entertaining' | 'professional-pitch' | 'corporate'

export type FillerWordStat = { word: string; count: number }

export type AudioAnalysisPayload = {
  transcript: string
  wordCount: number
  wpm: number
  wpmOverall: number
  fillerWordCount: number
  fillerWords: FillerWordStat[]
  fillerWordsPerMinute: number
  silencePeriods: { start: number; end: number }[]
  totalSilenceSeconds: number
  silencePercent: number
  speakingTimeSeconds: number
  averageVolume: number
  peakVolume: number
  volumeConsistency: number
  averageMovement: number
  realtimeFeedbackLog: string[]
}

export type CategoryScore = {
  score: number
  weight?: string
  feedback: string
}

export type EvaluationPayload = {
  overallScore: number
  categories?: {
    eyeContact?: CategoryScore
    posture?: CategoryScore
    gestures?: CategoryScore
    vocalDelivery?: CategoryScore
    energy?: CategoryScore
    fillerWords?: CategoryScore
  }
  summary: string
  topStrength: string
  topImprovement: string
  details?: string
}

export type PitchSessionDraft = {
  evaluationType: EvaluationModeId
  evaluationLabel: string
  energy: string
  formality: string
  goal: string
  audienceNote?: string
  folderLabel?: string
}

export type PitchSessionStored = PitchSessionDraft & {
  duration?: number
  audioAnalysis?: AudioAnalysisPayload
  evaluation?: EvaluationPayload
}

export const EVALUATION_MODES: {
  id: EvaluationModeId
  label: string
  energy: string
  formality: string
  goal: string
  description: string
}[] = [
  {
    id: 'entertaining',
    label: 'Entertaining',
    energy: 'High',
    formality: 'Low-Medium',
    goal: 'Engage',
    description: 'High energy, dynamic delivery, and audience engagement.',
  },
  {
    id: 'professional-pitch',
    label: 'Professional Pitch',
    energy: 'Medium',
    formality: 'Medium-High',
    goal: 'Persuade',
    description: 'Persuasive, structured delivery for stakeholders.',
  },
  {
    id: 'corporate',
    label: 'Corporate',
    energy: 'Low-Medium',
    formality: 'High',
    goal: 'Authority',
    description: 'Formal, composed, authoritative presence.',
  },
]

export function loadPitchSession(): PitchSessionStored | null {
  try {
    const raw = sessionStorage.getItem(PITCH_SESSION_STORAGE_KEY)
    if (!raw) return null
    return JSON.parse(raw) as PitchSessionStored
  } catch {
    return null
  }
}

export function savePitchSession(data: PitchSessionStored) {
  sessionStorage.setItem(PITCH_SESSION_STORAGE_KEY, JSON.stringify(data))
}

export function clearPitchSession() {
  sessionStorage.removeItem(PITCH_SESSION_STORAGE_KEY)
  sessionStorage.removeItem(PITCH_CHAT_STORAGE_KEY)
}

export type ChatTurn = { role: 'user' | 'assistant'; content: string }

export function loadChatHistory(): ChatTurn[] {
  try {
    const raw = sessionStorage.getItem(PITCH_CHAT_STORAGE_KEY)
    if (!raw) return []
    return JSON.parse(raw) as ChatTurn[]
  } catch {
    return []
  }
}

export function saveChatHistory(messages: ChatTurn[]) {
  sessionStorage.setItem(PITCH_CHAT_STORAGE_KEY, JSON.stringify(messages))
}

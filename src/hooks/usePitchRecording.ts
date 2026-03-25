import { useCallback, useEffect, useRef, useState } from 'react'
import { ref as storageRef, uploadString, getDownloadURL } from 'firebase/storage'
import { storage } from '../lib/firebase'
import type { AudioAnalysisPayload } from '../lib/pitchSession'

type ModeThresholds = {
  movementLow: number
  movementHigh: number
  volumeLow: number
  volumeHigh: number
  silenceWarnSec: number
  wpmLow: number
  wpmHigh: number
  movementLabel: [string, string, string]
}

const MODE_THRESHOLDS: Record<string, ModeThresholds> = {
  entertaining: {
    movementLow: 3,
    movementHigh: 50,
    volumeLow: 5,
    volumeHigh: 70,
    silenceWarnSec: 3,
    wpmLow: 120,
    wpmHigh: 200,
    movementLabel: ['Move more!', 'Great energy!', ''],
  },
  'professional-pitch': {
    movementLow: 1.5,
    movementHigh: 20,
    volumeLow: 4,
    volumeHigh: 60,
    silenceWarnSec: 4,
    wpmLow: 110,
    wpmHigh: 160,
    movementLabel: ['Too stiff', 'Good presence', 'Too fidgety'],
  },
  corporate: {
    movementLow: 0.5,
    movementHigh: 10,
    volumeLow: 3,
    volumeHigh: 55,
    silenceWarnSec: 5,
    wpmLow: 90,
    wpmHigh: 150,
    movementLabel: ['', 'Composed', 'Too much movement'],
  },
}

export type FeedbackState = {
  volume: number
  volumeStatus: 'low' | 'good' | 'high'
  silentSeconds: number
  showSilenceWarn: boolean
  movementLevel: number
  movementStatus: 'low' | 'good' | 'high'
  movementLabel: string
  wpm: number
  wpmStatus: 'low' | 'good' | 'high'
}

const initialFeedback: FeedbackState = {
  volume: 0,
  volumeStatus: 'low',
  silentSeconds: 0,
  showSilenceWarn: false,
  movementLevel: 0,
  movementStatus: 'good',
  movementLabel: '',
  wpm: 0,
  wpmStatus: 'good',
}

export function usePitchRecording(evaluationType: string) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const streamRef = useRef<MediaStream | null>(null)

  const [isRecording, setIsRecording] = useState(false)
  const [seconds, setSeconds] = useState(0)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const isRecordingRef = useRef(false)

  const [feedback, setFeedback] = useState<FeedbackState>(initialFeedback)

  const audioContextRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const volumeHistoryRef = useRef<number[]>([])
  const feedbackIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Web Speech API — not in all TS lib configs
  const recognitionRef = useRef<{ start: () => void; stop: () => void } | null>(null)
  const transcriptRef = useRef('')
  const finalTranscriptRef = useRef('')
  const wordTimestampsRef = useRef<{ word: string; time: number }[]>([])
  const silencePeriodsRef = useRef<{ start: number; end: number }[]>([])
  const lastSpeechTimeRef = useRef(0)
  const recordingStartRef = useRef(0)

  const isSpeakingByVolumeRef = useRef(false)
  const speakingStartRef = useRef(0)
  const totalSpeakingTimeRef = useRef(0)

  const framesRef = useRef<string[]>([])
  const frameUrlsRef = useRef<string[]>([])
  const sessionIdRef = useRef(`rec_${Date.now()}`)
  const frameIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const prevFrameDataRef = useRef<Uint8ClampedArray | null>(null)
  const movementRef = useRef(0)
  const movementHistoryRef = useRef<number[]>([])

  const feedbackLogRef = useRef<string[]>([])
  const realtimeWordsTimeRef = useRef<number[]>([])

  const secondsRef = useRef(0)
  useEffect(() => {
    secondsRef.current = seconds
  }, [seconds])

  const getThresholds = useCallback((): ModeThresholds => {
    return MODE_THRESHOLDS[evaluationType] || MODE_THRESHOLDS['professional-pitch']
  }, [evaluationType])

  useEffect(() => {
    canvasRef.current = document.createElement('canvas')
    canvasRef.current.width = 320
    canvasRef.current.height = 240
    void startCamera()
    return () => {
      stopCamera()
      stopAllTracking()
    }
  }, [])

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 1280, height: 720 },
        audio: true,
      })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
      }
    } catch {
      window.alert('Camera and microphone access are required. Please allow both.')
    }
  }

  const stopCamera = () => {
    streamRef.current?.getTracks().forEach((track) => track.stop())
  }

  const stopAllTracking = () => {
    if (timerRef.current) clearInterval(timerRef.current)
    if (feedbackIntervalRef.current) clearInterval(feedbackIntervalRef.current)
    if (frameIntervalRef.current) clearInterval(frameIntervalRef.current)
    try {
      recognitionRef.current?.stop()
    } catch {
      /* ignore */
    }
    try {
      if (audioContextRef.current?.state !== 'closed') {
        void audioContextRef.current?.close()
      }
    } catch {
      /* ignore */
    }
  }

  const startAudioAnalysis = () => {
    if (!streamRef.current) return
    const audioContext = new AudioContext()
    const source = audioContext.createMediaStreamSource(streamRef.current)
    const analyser = audioContext.createAnalyser()
    analyser.fftSize = 2048
    analyser.smoothingTimeConstant = 0.3
    source.connect(analyser)
    audioContextRef.current = audioContext
    analyserRef.current = analyser
  }

  const startFeedbackLoop = () => {
    const dataArray = new Float32Array(2048)

    feedbackIntervalRef.current = setInterval(() => {
      const t = getThresholds()
      const analyser = analyserRef.current

      let vol = 0
      if (analyser) {
        analyser.getFloatTimeDomainData(dataArray)
        let sumSquares = 0
        for (let i = 0; i < dataArray.length; i++) {
          sumSquares += dataArray[i] * dataArray[i]
        }
        const rms = Math.sqrt(sumSquares / dataArray.length)
        vol = Math.min(100, Math.round(rms * 500))
        volumeHistoryRef.current.push(vol)

        const volElapsed = (Date.now() - recordingStartRef.current) / 1000
        if (vol >= 5 && !isSpeakingByVolumeRef.current) {
          isSpeakingByVolumeRef.current = true
          speakingStartRef.current = volElapsed
        } else if (vol < 2 && isSpeakingByVolumeRef.current) {
          isSpeakingByVolumeRef.current = false
          const dur = volElapsed - speakingStartRef.current
          if (dur > 0.3) totalSpeakingTimeRef.current += dur
        }
      }

      let volumeStatus: FeedbackState['volumeStatus'] = 'good'
      if (vol < t.volumeLow) volumeStatus = 'low'
      else if (vol > t.volumeHigh) volumeStatus = 'high'

      const now = Date.now()
      const elapsed = (now - recordingStartRef.current) / 1000
      const silentFor =
        lastSpeechTimeRef.current > 0 ? elapsed - lastSpeechTimeRef.current : elapsed
      const showSilenceWarn = silentFor > t.silenceWarnSec && elapsed > 3

      if (showSilenceWarn && Math.round(silentFor) % 5 === 0) {
        feedbackLogRef.current.push(`${Math.round(elapsed)}s: Silent for ${Math.round(silentFor)}s`)
      }

      let movementStatus: FeedbackState['movementStatus'] = 'good'
      let movementLabel = t.movementLabel[1]
      const mv = movementRef.current
      if (mv < t.movementLow) {
        movementStatus = 'low'
        movementLabel = t.movementLabel[0]
      } else if (mv > t.movementHigh) {
        movementStatus = 'high'
        movementLabel = t.movementLabel[2]
      }

      const recentWordTimes = realtimeWordsTimeRef.current.filter((wt) => wt > elapsed - 5)
      const windowSec = Math.min(elapsed, 5)
      const rollingWpm =
        windowSec > 1 ? Math.round((recentWordTimes.length / windowSec) * 60) : 0

      let wpmStatus: FeedbackState['wpmStatus'] = 'good'
      if (rollingWpm > 0 && rollingWpm < t.wpmLow) wpmStatus = 'low'
      else if (rollingWpm > t.wpmHigh) wpmStatus = 'high'

      setFeedback((prev) => ({
        ...prev,
        volume: vol,
        volumeStatus,
        silentSeconds: Math.round(silentFor),
        showSilenceWarn,
        movementLevel: mv,
        movementStatus,
        movementLabel: movementLabel || '',
        wpm: rollingWpm,
        wpmStatus,
      }))
    }, 200)
  }

  const startSpeechRecognition = () => {
    const w = window as unknown as {
      SpeechRecognition?: new () => {
        continuous: boolean
        interimResults: boolean
        lang: string
        start: () => void
        stop: () => void
        onresult: ((e: { resultIndex: number; results: { length: number; [i: number]: { isFinal: boolean; [0]: { transcript: string } } } }) => void) | null
        onerror: ((e: { error: string }) => void) | null
        onend: (() => void) | null
      }
      webkitSpeechRecognition?: new () => {
        continuous: boolean
        interimResults: boolean
        lang: string
        start: () => void
        stop: () => void
        onresult: ((e: { resultIndex: number; results: { length: number; [i: number]: { isFinal: boolean; [0]: { transcript: string } } } }) => void) | null
        onerror: ((e: { error: string }) => void) | null
        onend: (() => void) | null
      }
    }
    const SR = w.SpeechRecognition || w.webkitSpeechRecognition
    if (!SR) return

    const recognition = new SR()
    recognition.continuous = true
    recognition.interimResults = true
    recognition.lang = 'en-US'
    recognitionRef.current = recognition

    let lastInterimWordCount = 0

    recognition.onresult = (event) => {
      const now = Date.now()
      const elapsed = (now - recordingStartRef.current) / 1000

      if (lastSpeechTimeRef.current > 0) {
        const gap = elapsed - lastSpeechTimeRef.current
        if (gap > 2) {
          silencePeriodsRef.current.push({
            start: lastSpeechTimeRef.current,
            end: elapsed,
          })
        }
      }
      lastSpeechTimeRef.current = elapsed

      let interim = ''
      let currentInterimWordCount = 0

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i]![0]!.transcript.trim()
        if (event.results[i]!.isFinal) {
          finalTranscriptRef.current += ` ${transcript}`
          const words = transcript.split(/\s+/).filter(Boolean)
          words.forEach((word: string) => {
            const lower = word.toLowerCase().replace(/[.,!?]/g, '')
            wordTimestampsRef.current.push({ word: lower, time: elapsed })
          })
          lastInterimWordCount = 0
        } else {
          interim += transcript
          currentInterimWordCount = transcript.split(/\s+/).filter(Boolean).length
        }
      }

      const newWords = currentInterimWordCount - lastInterimWordCount
      if (newWords > 0) {
        for (let i = 0; i < newWords; i++) {
          realtimeWordsTimeRef.current.push(elapsed)
        }
        lastInterimWordCount = currentInterimWordCount
      }

      const totalFinalWords = wordTimestampsRef.current.length
      while (realtimeWordsTimeRef.current.length < totalFinalWords) {
        realtimeWordsTimeRef.current.push(elapsed)
      }

      transcriptRef.current = `${finalTranscriptRef.current} ${interim}`.trim()
    }

    recognition.onerror = (e: { error: string }) => {
      if (e.error !== 'no-speech' && e.error !== 'aborted') {
        console.error('Speech error:', e.error)
      }
    }

    recognition.onend = () => {
      if (isRecordingRef.current) {
        try {
          recognition.start()
        } catch {
          /* ignore */
        }
      }
    }

    recognition.start()
  }

  const startFrameCapture = () => {
    framesRef.current = []
    prevFrameDataRef.current = null
    movementHistoryRef.current = []

    frameIntervalRef.current = setInterval(() => {
      if (!videoRef.current || !canvasRef.current) return
      const ctx = canvasRef.current.getContext('2d')!
      ctx.drawImage(videoRef.current, 0, 0, 320, 240)

      const currentData = ctx.getImageData(0, 0, 320, 240)
      if (prevFrameDataRef.current) {
        let diff = 0
        const curr = currentData.data
        const prev = prevFrameDataRef.current
        for (let i = 0; i < curr.length; i += 64) {
          diff +=
            Math.abs(curr[i]! - prev[i]!) +
            Math.abs(curr[i + 1]! - prev[i + 1]!) +
            Math.abs(curr[i + 2]! - prev[i + 2]!)
        }
        const totalSampled = curr.length / 64
        const mvLevel = diff / totalSampled / 3
        movementRef.current = mvLevel
        movementHistoryRef.current.push(mvLevel)
      }
      prevFrameDataRef.current = currentData.data

      if (framesRef.current.length === 0 || Date.now() % 2000 < 1100) {
        const hiRes = document.createElement('canvas')
        hiRes.width = 320
        hiRes.height = 240
        const hiCtx = hiRes.getContext('2d')!
        hiCtx.drawImage(videoRef.current, 0, 0, 320, 240)
        const dataUrl = hiRes.toDataURL('image/jpeg', 0.3)

        const frameIndex = framesRef.current.length
        framesRef.current.push('uploaded')

        const frameStorageRef = storageRef(storage, `sessions/${sessionIdRef.current}/frames/frame_${frameIndex}.jpg`)
        uploadString(frameStorageRef, dataUrl, 'data_url')
          .then(() => getDownloadURL(frameStorageRef))
          .then((url) => { frameUrlsRef.current.push(url) })
          .catch((err) => console.error('Frame upload failed:', err))
      }
    }, 1000)
  }

  const buildAudioAnalysis = (durationSecs: number): AudioAnalysisPayload => {
    const volumes = volumeHistoryRef.current
    const avgVolume =
      volumes.length > 0 ? Math.round(volumes.reduce((a, b) => a + b, 0) / volumes.length) : 0
    const peakVolume = volumes.length > 0 ? Math.max(...volumes) : 0

    const volumeStdDev =
      volumes.length > 1
        ? Math.round(
            Math.sqrt(
              volumes.reduce((acc, v) => acc + Math.pow(v - avgVolume, 2), 0) / volumes.length,
            ),
          )
        : 0

    const SILENCE_CUTOFF = 2
    const silentSamples = volumes.filter((v) => v < SILENCE_CUTOFF).length
    const silencePercent = volumes.length > 0 ? Math.round((silentSamples / volumes.length) * 100) : 100

    if (isSpeakingByVolumeRef.current) {
      const elapsed = (Date.now() - recordingStartRef.current) / 1000
      totalSpeakingTimeRef.current += elapsed - speakingStartRef.current
    }
    const speakingTimeSeconds = Math.round(totalSpeakingTimeRef.current)

    const words = wordTimestampsRef.current
    const totalMin = durationSecs / 60
    const speakingMin = speakingTimeSeconds / 60
    const wpm = speakingMin > 0.1 ? Math.round(words.length / speakingMin) : 0
    const wpmOverall = totalMin > 0.1 ? Math.round(words.length / totalMin) : 0

    const mvHistory = movementHistoryRef.current
    const avgMovement =
      mvHistory.length > 0
        ? Math.round((mvHistory.reduce((a, b) => a + b, 0) / mvHistory.length) * 10) / 10
        : 0

    const FILLER_WORDS = [
      'um',
      'uh',
      'like',
      'basically',
      'literally',
      'so',
      'right',
      'okay',
      'actually',
      'honestly',
    ]
    const fillerMap: Record<string, number> = {}
    let fillerCount = 0
    words.forEach((w) => {
      if (FILLER_WORDS.includes(w.word)) {
        fillerCount++
        fillerMap[w.word] = (fillerMap[w.word] || 0) + 1
      }
    })
    const fillerWordsPerMinute =
      totalMin > 0.1 ? Math.round((fillerCount / totalMin) * 10) / 10 : 0

    return {
      transcript: finalTranscriptRef.current.trim(),
      wordCount: words.length,
      wpm,
      wpmOverall,
      fillerWordCount: fillerCount,
      fillerWords: Object.entries(fillerMap)
        .map(([word, count]) => ({ word, count }))
        .sort((a, b) => b.count - a.count),
      fillerWordsPerMinute,
      silencePeriods: silencePeriodsRef.current,
      totalSilenceSeconds: Math.max(0, durationSecs - speakingTimeSeconds),
      silencePercent,
      speakingTimeSeconds,
      averageVolume: avgVolume,
      peakVolume,
      volumeConsistency: volumeStdDev,
      averageMovement: avgMovement,
      realtimeFeedbackLog: feedbackLogRef.current,
    }
  }

  const startRecording = () => {
    if (!streamRef.current) return
    chunksRef.current = []
    frameUrlsRef.current = []
    sessionIdRef.current = `rec_${Date.now()}`
    recordingStartRef.current = Date.now()
    lastSpeechTimeRef.current = 0
    transcriptRef.current = ''
    finalTranscriptRef.current = ''
    wordTimestampsRef.current = []
    silencePeriodsRef.current = []
    volumeHistoryRef.current = []
    movementRef.current = 0
    prevFrameDataRef.current = null
    movementHistoryRef.current = []
    totalSpeakingTimeRef.current = 0
    isSpeakingByVolumeRef.current = false
    feedbackLogRef.current = []
    realtimeWordsTimeRef.current = []
    setFeedback(initialFeedback)

    const recorder = new MediaRecorder(streamRef.current)
    mediaRecorderRef.current = recorder
    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data)
    }
    recorder.start()

    startAudioAnalysis()
    startSpeechRecognition()
    startFrameCapture()
    startFeedbackLoop()

    setIsRecording(true)
    isRecordingRef.current = true
    setSeconds(0)
    timerRef.current = setInterval(() => setSeconds((s) => s + 1), 1000)
  }

  const stopRecording = (): Promise<{ blob: Blob; durationSecs: number; frames: string[]; frameUrls: string[]; audioAnalysis: AudioAnalysisPayload }> => {
    return new Promise((resolve) => {
      const recorder = mediaRecorderRef.current
      const durationSecs = secondsRef.current
      if (!recorder) {
        resolve({
          blob: new Blob(),
          durationSecs,
          frames: [],
          frameUrls: [],
          audioAnalysis: buildAudioAnalysis(durationSecs),
        })
        return
      }

      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'video/webm' })
        const audioAnalysis = buildAudioAnalysis(durationSecs)

        const allUrls = [...frameUrlsRef.current]
        let selectedFrameUrls: string[] = []
        if (allUrls.length <= 15) {
          selectedFrameUrls = [...allUrls]
        } else {
          const step = allUrls.length / 15
          for (let i = 0; i < 15; i++) {
            selectedFrameUrls.push(allUrls[Math.floor(i * step)]!)
          }
        }

        resolve({ blob, durationSecs, frames: [], frameUrls: selectedFrameUrls, audioAnalysis })
      }

      recorder.stop()
      setIsRecording(false)
      isRecordingRef.current = false
      stopAllTracking()
    })
  }

  return {
    videoRef,
    feedback,
    isRecording,
    seconds,
    startRecording,
    stopRecording,
    stopCamera,
  }
}

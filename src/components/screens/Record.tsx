import { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { doc, updateDoc, getDoc } from "firebase/firestore";
import { storage, db } from "../firbaseconfig";

type ModeThresholds = {
  movementLow: number;
  movementHigh: number;
  volumeLow: number;
  volumeHigh: number;
  silenceWarnSec: number;
  wpmLow: number;
  wpmHigh: number;
  movementLabel: [string, string, string];
};

const MODE_THRESHOLDS: Record<string, ModeThresholds> = {
  entertaining: {
    movementLow: 3,
    movementHigh: 50,
    volumeLow: 5,
    volumeHigh: 70,
    silenceWarnSec: 3,
    wpmLow: 120,
    wpmHigh: 200,
    movementLabel: ["Move more!", "Great energy!", ""],
  },
  "professional-pitch": {
    movementLow: 1.5,
    movementHigh: 20,
    volumeLow: 4,
    volumeHigh: 60,
    silenceWarnSec: 4,
    wpmLow: 110,
    wpmHigh: 160,
    movementLabel: ["Too stiff", "Good presence", "Too fidgety"],
  },
  corporate: {
    movementLow: 0.5,
    movementHigh: 10,
    volumeLow: 3,
    volumeHigh: 55,
    silenceWarnSec: 5,
    wpmLow: 90,
    wpmHigh: 150,
    movementLabel: ["", "Composed", "Too much movement"],
  },
};

type FeedbackState = {
  volume: number;
  volumeStatus: "low" | "good" | "high";
  silentSeconds: number;
  showSilenceWarn: boolean;
  movementLevel: number;
  movementStatus: "low" | "good" | "high";
  movementLabel: string;
  wpm: number;
  wpmStatus: "low" | "good" | "high";
};

export default function Record() {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);

  const [isRecording, setIsRecording] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ★ FIX #1: ref mirror so callbacks never see stale isRecording
  const isRecordingRef = useRef(false);

  // Session mode
  const [evaluationType, setEvaluationType] = useState("professional-pitch");
  const [evaluationLabel, setEvaluationLabel] = useState("Professional Pitch");

  // Real-time feedback state
  const [feedback, setFeedback] = useState<FeedbackState>({
    volume: 0,
    volumeStatus: "low",
    silentSeconds: 0,
    showSilenceWarn: false,
    movementLevel: 0,
    movementStatus: "good",
    movementLabel: "",
    wpm: 0,
    wpmStatus: "good",
  });

  // Audio analysis refs
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const volumeHistoryRef = useRef<number[]>([]);
  const feedbackIntervalRef = useRef<ReturnType<typeof setInterval> | null>(
    null,
  );

  // Speech tracking
  const recognitionRef = useRef<any>(null);
  const transcriptRef = useRef("");
  const finalTranscriptRef = useRef("");
  const wordTimestampsRef = useRef<{ word: string; time: number }[]>([]);
  const silencePeriodsRef = useRef<{ start: number; end: number }[]>([]);
  const lastSpeechTimeRef = useRef(0);
  const recordingStartRef = useRef(0);

  // Volume-based speaking time tracking
  const isSpeakingByVolumeRef = useRef(false);
  const speakingStartRef = useRef(0);
  const totalSpeakingTimeRef = useRef(0);

  // Frame capture & movement detection
  const framesRef = useRef<string[]>([]);
  const frameIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const prevFrameDataRef = useRef<Uint8ClampedArray | null>(null);
  const movementRef = useRef(0);
  const movementHistoryRef = useRef<number[]>([]);

  // Real-time feedback log (what user saw during recording)
  const feedbackLogRef = useRef<string[]>([]);

  // ★ FIX: track word count from interim results for real-time WPM
  const realtimeWordCountRef = useRef(0);
  const realtimeWordsTimeRef = useRef<number[]>([]);

  // Load session mode
  useEffect(() => {
    const loadSession = async () => {
      if (!sessionId) return;
      try {
        const sessionDoc = await getDoc(doc(db, "sessions", sessionId));
        if (sessionDoc.exists()) {
          const data = sessionDoc.data();
          setEvaluationType(data.evaluationType || "professional-pitch");
          setEvaluationLabel(data.evaluationLabel || "Professional Pitch");
        }
      } catch (e) {
        console.error("Failed to load session:", e);
      }
    };
    loadSession();
  }, [sessionId]);

  useEffect(() => {
    canvasRef.current = document.createElement("canvas");
    canvasRef.current.width = 320;
    canvasRef.current.height = 240;
    startCamera();
    return () => {
      stopCamera();
      stopAllTracking();
    };
  }, []);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 1280, height: 720 },
        audio: true,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      alert("Camera and microphone access are required. Please allow both.");
    }
  };

  const stopCamera = () => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
  };

  const stopAllTracking = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (feedbackIntervalRef.current) clearInterval(feedbackIntervalRef.current);
    if (frameIntervalRef.current) clearInterval(frameIntervalRef.current);
    try {
      recognitionRef.current?.stop();
    } catch (e) {}
    try {
      if (audioContextRef.current?.state !== "closed") {
        audioContextRef.current?.close();
      }
    } catch (e) {}
  };

  const startAudioAnalysis = () => {
    if (!streamRef.current) return;
    const audioContext = new AudioContext();
    const source = audioContext.createMediaStreamSource(streamRef.current);
    const analyser = audioContext.createAnalyser();
    // ★ FIX #2: larger FFT + time domain for accurate RMS volume
    analyser.fftSize = 2048;
    analyser.smoothingTimeConstant = 0.3;
    source.connect(analyser);
    audioContextRef.current = audioContext;
    analyserRef.current = analyser;
  };

  const getThresholds = useCallback((): ModeThresholds => {
    return (
      MODE_THRESHOLDS[evaluationType] || MODE_THRESHOLDS["professional-pitch"]
    );
  }, [evaluationType]);

  // Unified feedback loop — runs every 200ms during recording
  const startFeedbackLoop = () => {
    const dataArray = new Float32Array(2048);

    feedbackIntervalRef.current = setInterval(() => {
      const t = getThresholds();
      const analyser = analyserRef.current;

      // --- Volume using RMS (Root Mean Square) for accurate amplitude ---
      let vol = 0;
      if (analyser) {
        analyser.getFloatTimeDomainData(dataArray);
        let sumSquares = 0;
        for (let i = 0; i < dataArray.length; i++) {
          sumSquares += dataArray[i] * dataArray[i];
        }
        const rms = Math.sqrt(sumSquares / dataArray.length);
        // Scale to 0-100 (high multiplier = very sensitive bar)
        vol = Math.min(100, Math.round(rms * 500));
        volumeHistoryRef.current.push(vol);

        // Track speaking time by volume
        const volElapsed = (Date.now() - recordingStartRef.current) / 1000;
        if (vol >= 5 && !isSpeakingByVolumeRef.current) {
          isSpeakingByVolumeRef.current = true;
          speakingStartRef.current = volElapsed;
        } else if (vol < 2 && isSpeakingByVolumeRef.current) {
          isSpeakingByVolumeRef.current = false;
          const dur = volElapsed - speakingStartRef.current;
          if (dur > 0.3) totalSpeakingTimeRef.current += dur;
        }
      }

      let volumeStatus: "low" | "good" | "high" = "good";
      if (vol < t.volumeLow) volumeStatus = "low";
      else if (vol > t.volumeHigh) volumeStatus = "high";

      // --- Silence (uses both speech API timing and volume) ---
      const now = Date.now();
      const elapsed = (now - recordingStartRef.current) / 1000;
      const silentFor =
        lastSpeechTimeRef.current > 0
          ? elapsed - lastSpeechTimeRef.current
          : elapsed;
      const showSilenceWarn = silentFor > t.silenceWarnSec && elapsed > 3;

      // Log significant feedback events
      if (showSilenceWarn && Math.round(silentFor) % 5 === 0) {
        feedbackLogRef.current.push(
          `${Math.round(elapsed)}s: Silent for ${Math.round(silentFor)}s`,
        );
      }

      // --- Movement ---
      let movementStatus: "low" | "good" | "high" = "good";
      let movementLabel = t.movementLabel[1];
      const mv = movementRef.current;
      if (mv < t.movementLow) {
        movementStatus = "low";
        movementLabel = t.movementLabel[0];
      } else if (mv > t.movementHigh) {
        movementStatus = "high";
        movementLabel = t.movementLabel[2];
      }

      // --- WPM (rolling 5s window for fast response) ---
      const recentWordTimes = realtimeWordsTimeRef.current.filter(
        (wt) => wt > elapsed - 5,
      );
      const windowSec = Math.min(elapsed, 5);
      const rollingWpm =
        windowSec > 1
          ? Math.round((recentWordTimes.length / windowSec) * 60)
          : 0;

      let wpmStatus: "low" | "good" | "high" = "good";
      if (rollingWpm > 0 && rollingWpm < t.wpmLow) wpmStatus = "low";
      else if (rollingWpm > t.wpmHigh) wpmStatus = "high";

      setFeedback((prev) => ({
        ...prev,
        volume: vol,
        volumeStatus,
        silentSeconds: Math.round(silentFor),
        showSilenceWarn,
        movementLevel: mv,
        movementStatus,
        movementLabel: movementLabel || "",
        wpm: rollingWpm,
        wpmStatus,
      }));
    }, 200);
  };

  const startSpeechRecognition = () => {
    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";
    recognitionRef.current = recognition;

    // Track the last interim word count so we only add new words
    let lastInterimWordCount = 0;

    recognition.onresult = (event: any) => {
      const now = Date.now();
      const elapsed = (now - recordingStartRef.current) / 1000;

      // Track silence gaps via speech events
      if (lastSpeechTimeRef.current > 0) {
        const gap = elapsed - lastSpeechTimeRef.current;
        if (gap > 2) {
          silencePeriodsRef.current.push({
            start: lastSpeechTimeRef.current,
            end: elapsed,
          });
        }
      }
      lastSpeechTimeRef.current = elapsed;

      let interim = "";
      let currentInterimWordCount = 0;

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript.trim();
        if (event.results[i].isFinal) {
          finalTranscriptRef.current += " " + transcript;

          const words = transcript.split(/\s+/).filter(Boolean);
          words.forEach((word: string) => {
            const lower = word.toLowerCase().replace(/[.,!?]/g, "");
            wordTimestampsRef.current.push({ word: lower, time: elapsed });
          });

          // Reset interim counter since this chunk is now final
          lastInterimWordCount = 0;
        } else {
          interim += transcript;
          // Count words in interim for real-time WPM
          currentInterimWordCount = transcript
            .split(/\s+/)
            .filter(Boolean).length;
        }
      }

      // Add new interim words to the real-time tracker
      const newWords = currentInterimWordCount - lastInterimWordCount;
      if (newWords > 0) {
        for (let i = 0; i < newWords; i++) {
          realtimeWordsTimeRef.current.push(elapsed);
        }
        lastInterimWordCount = currentInterimWordCount;
      }

      // Also sync final words to real-time tracker
      const totalFinalWords = wordTimestampsRef.current.length;
      while (realtimeWordsTimeRef.current.length < totalFinalWords) {
        realtimeWordsTimeRef.current.push(elapsed);
      }

      transcriptRef.current = (
        finalTranscriptRef.current +
        " " +
        interim
      ).trim();
    };

    recognition.onerror = (e: any) => {
      if (e.error !== "no-speech" && e.error !== "aborted") {
        console.error("Speech error:", e.error);
      }
    };

    // ★ FIX: use isRecordingRef instead of isRecording state
    recognition.onend = () => {
      if (isRecordingRef.current) {
        try {
          recognition.start();
        } catch (e) {}
      }
    };

    recognition.start();
  };

  const startFrameCapture = () => {
    framesRef.current = [];
    prevFrameDataRef.current = null;
    movementHistoryRef.current = [];

    frameIntervalRef.current = setInterval(() => {
      if (!videoRef.current || !canvasRef.current) return;
      const ctx = canvasRef.current.getContext("2d")!;
      ctx.drawImage(videoRef.current, 0, 0, 320, 240);

      // Movement detection
      const currentData = ctx.getImageData(0, 0, 320, 240);
      if (prevFrameDataRef.current) {
        let diff = 0;
        const curr = currentData.data;
        const prev = prevFrameDataRef.current;
        for (let i = 0; i < curr.length; i += 64) {
          diff +=
            Math.abs(curr[i] - prev[i]) +
            Math.abs(curr[i + 1] - prev[i + 1]) +
            Math.abs(curr[i + 2] - prev[i + 2]);
        }
        const totalSampled = curr.length / 64;
        const mvLevel = diff / totalSampled / 3;
        movementRef.current = mvLevel;
        movementHistoryRef.current.push(mvLevel);
      }
      prevFrameDataRef.current = currentData.data;

      // Save hi-res frame for evaluation every 2s
      if (framesRef.current.length === 0 || Date.now() % 2000 < 1100) {
        const hiRes = document.createElement("canvas");
        hiRes.width = 640;
        hiRes.height = 480;
        const hiCtx = hiRes.getContext("2d")!;
        hiCtx.drawImage(videoRef.current, 0, 0, 640, 480);
        framesRef.current.push(hiRes.toDataURL("image/jpeg", 0.6));
      }
    }, 1000);
  };

  const startRecording = () => {
    if (!streamRef.current) return;
    chunksRef.current = [];
    recordingStartRef.current = Date.now();
    lastSpeechTimeRef.current = 0;
    transcriptRef.current = "";
    finalTranscriptRef.current = "";
    wordTimestampsRef.current = [];
    silencePeriodsRef.current = [];
    volumeHistoryRef.current = [];
    movementRef.current = 0;
    prevFrameDataRef.current = null;
    movementHistoryRef.current = [];
    totalSpeakingTimeRef.current = 0;
    isSpeakingByVolumeRef.current = false;
    feedbackLogRef.current = [];
    realtimeWordCountRef.current = 0;
    realtimeWordsTimeRef.current = [];

    const recorder = new MediaRecorder(streamRef.current);
    mediaRecorderRef.current = recorder;
    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data);
    };
    recorder.start();

    startAudioAnalysis();
    startSpeechRecognition();
    startFrameCapture();
    startFeedbackLoop();

    setIsRecording(true);
    isRecordingRef.current = true;
    setSeconds(0);
    timerRef.current = setInterval(() => setSeconds((s) => s + 1), 1000);
  };

  const stopRecording = (): Promise<Blob> => {
    return new Promise((resolve) => {
      const recorder = mediaRecorderRef.current;
      if (!recorder) return;

      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "video/webm" });
        resolve(blob);
      };

      recorder.stop();
      setIsRecording(false);
      isRecordingRef.current = false;
      stopAllTracking();
    });
  };

  const buildAudioAnalysis = () => {
    const volumes = volumeHistoryRef.current;
    const avgVolume =
      volumes.length > 0
        ? Math.round(volumes.reduce((a, b) => a + b, 0) / volumes.length)
        : 0;
    const peakVolume = volumes.length > 0 ? Math.max(...volumes) : 0;

    // Volume std deviation
    const volumeStdDev =
      volumes.length > 1
        ? Math.round(
            Math.sqrt(
              volumes.reduce((acc, v) => acc + Math.pow(v - avgVolume, 2), 0) /
                volumes.length,
            ),
          )
        : 0;

    // Silence from volume data
    const SILENCE_CUTOFF = 2;
    const silentSamples = volumes.filter((v) => v < SILENCE_CUTOFF).length;
    const silencePercent =
      volumes.length > 0
        ? Math.round((silentSamples / volumes.length) * 100)
        : 100;

    // Finalize speaking time
    if (isSpeakingByVolumeRef.current) {
      const elapsed = (Date.now() - recordingStartRef.current) / 1000;
      totalSpeakingTimeRef.current += elapsed - speakingStartRef.current;
    }
    const speakingTimeSeconds = Math.round(totalSpeakingTimeRef.current);

    const words = wordTimestampsRef.current;
    const totalMin = seconds / 60;
    const speakingMin = speakingTimeSeconds / 60;
    const wpm = speakingMin > 0.1 ? Math.round(words.length / speakingMin) : 0;
    const wpmOverall = totalMin > 0.1 ? Math.round(words.length / totalMin) : 0;

    // Movement summary
    const mvHistory = movementHistoryRef.current;
    const avgMovement =
      mvHistory.length > 0
        ? Math.round(
            (mvHistory.reduce((a, b) => a + b, 0) / mvHistory.length) * 10,
          ) / 10
        : 0;

    // Filler word detection from final transcript (for evaluation data only)
    const FILLER_WORDS = [
      "um",
      "uh",
      "like",
      "basically",
      "literally",
      "so",
      "right",
      "okay",
      "actually",
      "honestly",
    ];
    const fillerMap: Record<string, number> = {};
    let fillerCount = 0;
    words.forEach((w) => {
      if (FILLER_WORDS.includes(w.word)) {
        fillerCount++;
        fillerMap[w.word] = (fillerMap[w.word] || 0) + 1;
      }
    });
    const fillerWordsPerMinute =
      totalMin > 0.1 ? Math.round((fillerCount / totalMin) * 10) / 10 : 0;

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
      totalSilenceSeconds: Math.max(0, seconds - speakingTimeSeconds),
      silencePercent,
      speakingTimeSeconds,
      averageVolume: avgVolume,
      peakVolume,
      volumeConsistency: volumeStdDev,
      averageMovement: avgMovement,
      // Pass the real-time feedback log so the AI knows what the user saw
      realtimeFeedbackLog: feedbackLogRef.current,
    };
  };

  const handleStop = async () => {
    const blob = await stopRecording();
    stopCamera();
    setUploading(true);

    try {
      const allFrames = framesRef.current;
      const selectedFrames: string[] = [];
      if (allFrames.length <= 15) {
        selectedFrames.push(...allFrames);
      } else {
        const step = allFrames.length / 15;
        for (let i = 0; i < 15; i++) {
          selectedFrames.push(allFrames[Math.floor(i * step)]);
        }
      }

      const audioAnalysis = buildAudioAnalysis();

      console.log("Audio analysis:", {
        wordCount: audioAnalysis.wordCount,
        wpm: audioAnalysis.wpm,
        avgVolume: audioAnalysis.averageVolume,
        peakVolume: audioAnalysis.peakVolume,
        silencePercent: audioAnalysis.silencePercent,
        speakingTime: audioAnalysis.speakingTimeSeconds,
        fillers: audioAnalysis.fillerWordCount,
        movement: audioAnalysis.averageMovement,
        transcript: audioAnalysis.transcript.substring(0, 100),
      });

      const videoRef2 = ref(storage, `sessions/${sessionId}/video.webm`);
      await uploadBytes(videoRef2, blob);
      const url = await getDownloadURL(videoRef2);

      await updateDoc(doc(db, "sessions", sessionId!), {
        videoURL: url,
        duration: seconds,
        audioAnalysis,
        status: "recorded",
      });

      navigate(`/evaluation/${sessionId}`, {
        state: { frames: selectedFrames, audioAnalysis },
      });
    } catch (err) {
      alert("Upload failed. Try again.");
      setUploading(false);
    }
  };

  const formatTime = (s: number) => {
    const mins = Math.floor(s / 60);
    const secs = s % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const statusColor = (status: "low" | "good" | "high") => {
    if (status === "good") return "#34d399";
    if (status === "high") return "#fbbf24";
    return "#f87171";
  };

  return (
    <div style={styles.container}>
      {uploading ? (
        <div style={styles.uploadingState}>
          <h2 style={styles.uploadingText}>Processing your recording...</h2>
          <p style={styles.uploadingSub}>Extracting frames and audio data</p>
        </div>
      ) : (
        <>
          <div style={styles.modeBadge}>{evaluationLabel} Mode</div>

          <div style={styles.videoWrapper}>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              style={styles.video}
            />

            {isRecording && (
              <div style={styles.timer}>
                <span style={styles.redDot} />
                {formatTime(seconds)}
              </div>
            )}

            {isRecording && (
              <>
                {/* Volume bar — left edge */}
                <div style={styles.volumeBarBg}>
                  <div
                    style={{
                      ...styles.volumeBarFill,
                      height: `${Math.min(100, feedback.volume)}%`,
                      background: statusColor(feedback.volumeStatus),
                    }}
                  />
                </div>
                <div style={styles.volumeLabel}>
                  {feedback.volumeStatus === "low" ? "🔇 Speak up" : ""}
                </div>

                {/* Silence warning — center */}
                {feedback.showSilenceWarn && (
                  <div style={styles.silenceWarn}>
                    ⚠️ Silent for {feedback.silentSeconds}s — keep talking!
                  </div>
                )}

                {/* Bottom overlay bar */}
                <div style={styles.overlayBar}>
                  {feedback.movementLabel && (
                    <div
                      style={{
                        ...styles.overlayPill,
                        background:
                          feedback.movementStatus === "good"
                            ? "rgba(52,211,153,0.2)"
                            : "rgba(248,113,113,0.2)",
                        color: statusColor(feedback.movementStatus),
                        borderColor:
                          feedback.movementStatus === "good"
                            ? "rgba(52,211,153,0.3)"
                            : "rgba(248,113,113,0.3)",
                      }}
                    >
                      {feedback.movementStatus === "good" ? "✓" : "!"}{" "}
                      {feedback.movementLabel}
                    </div>
                  )}

                  {feedback.wpm > 0 && (
                    <div
                      style={{
                        ...styles.overlayPill,
                        background:
                          feedback.wpmStatus === "good"
                            ? "rgba(52,211,153,0.2)"
                            : "rgba(251,191,36,0.2)",
                        color: statusColor(feedback.wpmStatus),
                        borderColor:
                          feedback.wpmStatus === "good"
                            ? "rgba(52,211,153,0.3)"
                            : "rgba(251,191,36,0.3)",
                      }}
                    >
                      {feedback.wpm} WPM
                      {feedback.wpmStatus === "high"
                        ? " — slow down"
                        : feedback.wpmStatus === "low"
                          ? " — speed up"
                          : ""}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>

          <div style={styles.controls}>
            {!isRecording ? (
              <button onClick={startRecording} style={styles.startBtn}>
                Start Recording
              </button>
            ) : (
              <button onClick={handleStop} style={styles.stopBtn}>
                Stop & Analyze
              </button>
            )}
          </div>

          <p style={styles.hint}>
            {isRecording
              ? "Watch the indicators — green is good, red needs fixing."
              : "Present naturally. Speak clearly, move with purpose, and maintain eye contact. Record at least 30 seconds."}
          </p>
        </>
      )}
    </div>
  );
}

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    minHeight: "100vh",
    background: "#0a0a0f",
    color: "#e8e6f0",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    padding: "32px 24px",
  },
  modeBadge: {
    fontSize: 12,
    fontWeight: 600,
    color: "#a78bfa",
    background: "rgba(124,111,247,0.1)",
    border: "1px solid rgba(124,111,247,0.2)",
    borderRadius: 8,
    padding: "6px 16px",
    marginBottom: 16,
    textTransform: "uppercase",
    letterSpacing: "0.05em",
  },
  videoWrapper: {
    position: "relative",
    width: "100%",
    maxWidth: 640,
    borderRadius: 16,
    overflow: "hidden",
    background: "#111118",
    border: "1px solid rgba(255,255,255,0.08)",
  },
  video: {
    width: "100%",
    display: "block",
    transform: "scaleX(-1)",
  },
  timer: {
    position: "absolute",
    top: 16,
    right: 16,
    background: "rgba(0,0,0,0.7)",
    borderRadius: 8,
    padding: "8px 14px",
    fontSize: 16,
    fontWeight: 600,
    display: "flex",
    alignItems: "center",
    gap: 8,
  },
  redDot: {
    width: 10,
    height: 10,
    borderRadius: "50%",
    background: "#f87171",
    display: "inline-block",
  },
  volumeBarBg: {
    position: "absolute",
    left: 12,
    bottom: 60,
    width: 6,
    height: 120,
    background: "rgba(255,255,255,0.1)",
    borderRadius: 3,
    overflow: "hidden",
    display: "flex",
    flexDirection: "column",
    justifyContent: "flex-end",
  },
  volumeBarFill: {
    width: "100%",
    borderRadius: 3,
    transition: "height 0.15s ease, background 0.15s ease",
  },
  volumeLabel: {
    position: "absolute",
    left: 24,
    bottom: 100,
    fontSize: 11,
    fontWeight: 600,
    color: "#f87171",
    textShadow: "0 1px 4px rgba(0,0,0,0.8)",
  },
  silenceWarn: {
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%)",
    background: "rgba(248,113,113,0.15)",
    border: "1px solid rgba(248,113,113,0.3)",
    borderRadius: 12,
    padding: "12px 20px",
    fontSize: 14,
    fontWeight: 600,
    color: "#f87171",
    textAlign: "center",
    backdropFilter: "blur(4px)",
  },
  overlayBar: {
    position: "absolute",
    bottom: 12,
    left: 12,
    right: 12,
    display: "flex",
    gap: 8,
    flexWrap: "wrap",
    justifyContent: "center",
  },
  overlayPill: {
    fontSize: 12,
    fontWeight: 600,
    padding: "5px 12px",
    borderRadius: 8,
    border: "1px solid",
    backdropFilter: "blur(4px)",
  },
  controls: {
    marginTop: 24,
    display: "flex",
    gap: 16,
  },
  startBtn: {
    background: "#7c6ff7",
    color: "white",
    border: "none",
    borderRadius: 12,
    padding: "16px 48px",
    fontSize: 16,
    fontWeight: 600,
    cursor: "pointer",
  },
  stopBtn: {
    background: "#f87171",
    color: "white",
    border: "none",
    borderRadius: 12,
    padding: "16px 48px",
    fontSize: 16,
    fontWeight: 600,
    cursor: "pointer",
  },
  hint: {
    color: "#8884a0",
    fontSize: 13,
    marginTop: 20,
    textAlign: "center",
    maxWidth: 400,
  },
  uploadingState: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
  },
  uploadingText: {
    fontSize: 22,
    fontWeight: 600,
    marginBottom: 8,
  },
  uploadingSub: {
    color: "#8884a0",
    fontSize: 14,
  },
};

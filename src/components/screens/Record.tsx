import { useState, useRef, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { doc, updateDoc } from "firebase/firestore";
import { storage, db } from "../firbaseconfig";

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

  // Audio analysis refs
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const volumeHistoryRef = useRef<number[]>([]);
  const volumeIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Speech tracking
  const recognitionRef = useRef<any>(null);
  const transcriptRef = useRef("");
  const wordTimestampsRef = useRef<{ word: string; time: number }[]>([]);
  const silencePeriodsRef = useRef<{ start: number; end: number }[]>([]);
  const lastSpeechTimeRef = useRef(0);
  const recordingStartRef = useRef(0);

  // Frame capture
  const framesRef = useRef<string[]>([]);
  const frameIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    canvasRef.current = document.createElement("canvas");
    canvasRef.current.width = 640;
    canvasRef.current.height = 480;
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
    if (volumeIntervalRef.current) clearInterval(volumeIntervalRef.current);
    if (frameIntervalRef.current) clearInterval(frameIntervalRef.current);
    recognitionRef.current?.stop();
    audioContextRef.current?.close();
  };

  const startAudioAnalysis = () => {
    if (!streamRef.current) return;
    const audioContext = new AudioContext();
    const source = audioContext.createMediaStreamSource(streamRef.current);
    const analyser = audioContext.createAnalyser();
    analyser.fftSize = 256;
    source.connect(analyser);
    audioContextRef.current = audioContext;
    analyserRef.current = analyser;

    // Sample volume every 200ms
    volumeIntervalRef.current = setInterval(() => {
      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      analyser.getByteFrequencyData(dataArray);
      const avg = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
      volumeHistoryRef.current.push(avg);
    }, 200);
  };

  const startSpeechRecognition = () => {
    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = false;
    recognition.lang = "en-US";
    recognitionRef.current = recognition;

    recognition.onresult = (event: any) => {
      const now = Date.now();
      const elapsed = (now - recordingStartRef.current) / 1000;

      // Track silence gaps
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

      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) {
          const text = event.results[i][0].transcript.trim();
          transcriptRef.current += " " + text;
          text
            .split(" ")
            .filter(Boolean)
            .forEach((word: string) => {
              wordTimestampsRef.current.push({
                word: word.toLowerCase(),
                time: elapsed,
              });
            });
        }
      }
    };

    recognition.onerror = (e: any) => {
      if (e.error !== "no-speech") console.error("Speech error:", e.error);
    };

    recognition.onend = () => {
      // Restart if still recording
      if (isRecording) {
        try {
          recognition.start();
        } catch (e) {}
      }
    };

    recognition.start();
  };

  const startFrameCapture = () => {
    framesRef.current = [];
    // Capture a frame every 2 seconds
    frameIntervalRef.current = setInterval(() => {
      if (!videoRef.current || !canvasRef.current) return;
      const ctx = canvasRef.current.getContext("2d")!;
      ctx.drawImage(videoRef.current, 0, 0, 640, 480);
      framesRef.current.push(canvasRef.current.toDataURL("image/jpeg", 0.6));
    }, 2000);
  };

  const startRecording = () => {
    if (!streamRef.current) return;
    chunksRef.current = [];
    recordingStartRef.current = Date.now();
    lastSpeechTimeRef.current = 0;
    transcriptRef.current = "";
    wordTimestampsRef.current = [];
    silencePeriodsRef.current = [];
    volumeHistoryRef.current = [];

    const recorder = new MediaRecorder(streamRef.current);
    mediaRecorderRef.current = recorder;
    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data);
    };
    recorder.start();

    startAudioAnalysis();
    startSpeechRecognition();
    startFrameCapture();

    setIsRecording(true);
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
      stopAllTracking();
    });
  };

  const buildAudioAnalysis = () => {
    const volumes = volumeHistoryRef.current;
    const avgVolume =
      volumes.length > 0
        ? volumes.reduce((a, b) => a + b, 0) / volumes.length
        : 0;
    const silentSamples = volumes.filter((v) => v < 5).length;
    const silencePercent =
      volumes.length > 0
        ? Math.round((silentSamples / volumes.length) * 100)
        : 0;

    const words = wordTimestampsRef.current;
    const fillerWords = [
      "um",
      "uh",
      "like",
      "you know",
      "basically",
      "literally",
      "so",
      "right",
      "okay",
    ];
    const fillerCount = words.filter((w) =>
      fillerWords.includes(w.word),
    ).length;

    const durationMin = seconds / 60;
    const wpm = durationMin > 0.1 ? Math.round(words.length / durationMin) : 0;

    return {
      transcript: transcriptRef.current.trim(),
      wordCount: words.length,
      wpm,
      fillerWordCount: fillerCount,
      fillerWords: fillerWords
        .map((f) => ({
          word: f,
          count: words.filter((w) => w.word === f).length,
        }))
        .filter((f) => f.count > 0),
      silencePeriods: silencePeriodsRef.current,
      totalSilenceSeconds: silencePeriodsRef.current.reduce(
        (acc, p) => acc + (p.end - p.start),
        0,
      ),
      silencePercent,
      averageVolume: Math.round(avgVolume),
      volumeConsistency:
        volumes.length > 1
          ? Math.round(
              Math.sqrt(
                volumes.reduce(
                  (acc, v) => acc + Math.pow(v - avgVolume, 2),
                  0,
                ) / volumes.length,
              ),
            )
          : 0,
    };
  };

  const handleStop = async () => {
    const blob = await stopRecording();
    stopCamera();
    setUploading(true);

    try {
      // Pick 15 evenly spaced frames from all captured
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

      // Upload video
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

  return (
    <div style={styles.container}>
      {uploading ? (
        <div style={styles.uploadingState}>
          <h2 style={styles.uploadingText}>Processing your recording...</h2>
          <p style={styles.uploadingSub}>Extracting frames and audio data</p>
        </div>
      ) : (
        <>
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
            Present naturally. Speak clearly, move with purpose, and maintain
            eye contact. Record at least 30 seconds for a good evaluation.
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

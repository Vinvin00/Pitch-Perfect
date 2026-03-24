import { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "../firbaseconfig";

type MetricScore = { score: number; feedback: string; weight?: string };

type EvaluationData = {
  overallScore: number;
  categories?: {
    eyeContact?: MetricScore;
    posture?: MetricScore;
    gestures?: MetricScore;
    vocalDelivery?: MetricScore;
    energy?: MetricScore;
    fillerWords?: MetricScore;
  };
  eyeContact?: MetricScore;
  posture?: MetricScore;
  gestures?: MetricScore;
  energy?: MetricScore;
  presence?: MetricScore;
  summary: string;
  topStrength: string;
  topImprovement: string;
  details?: string;
};

export default function Evaluation() {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [evaluation, setEvaluation] = useState<EvaluationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    analyzeSession();
  }, []);

  const analyzeSession = async () => {
    try {
      const sessionDoc = await getDoc(doc(db, "sessions", sessionId!));
      if (!sessionDoc.exists()) {
        setError("Session not found");
        return;
      }

      const session = sessionDoc.data();

      if (session.evaluation) {
        setEvaluation(session.evaluation);
        setLoading(false);
        return;
      }

      const frames = location.state?.frames;
      const audioAnalysis = location.state?.audioAnalysis;

      if (!frames) {
        setError("No video frames found. Try recording again.");
        return;
      }

      const res = await fetch("http://localhost:3001/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          frames,
          evaluationType: session.evaluationType,
          duration: session.duration,
          audioAnalysis,
        }),
      });

      const data = await res.json();

      await updateDoc(doc(db, "sessions", sessionId!), {
        evaluation: data,
        status: "evaluated",
      });

      setEvaluation(data);
    } catch (err) {
      setError("Analysis failed. Make sure the API server is running.");
    } finally {
      setLoading(false);
    }
  };

  const scoreColor = (score: number) => {
    if (score >= 75) return "#34d399";
    if (score >= 50) return "#fbbf24";
    return "#f87171";
  };

  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <h2 style={styles.loadingTitle}>Analyzing your presentation...</h2>
        <p style={styles.loadingSub}>
          AI is reviewing your eye contact, posture, gestures, voice, and more
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={styles.loadingContainer}>
        <h2 style={{ ...styles.loadingTitle, color: "#f87171" }}>{error}</h2>
        <button onClick={() => navigate("/home")} style={styles.homeBtn}>
          Back to Home
        </button>
      </div>
    );
  }

  if (!evaluation) return null;

  const defaultMetric = {
    score: 0,
    feedback: "No data available",
    weight: "0%",
  };

  const metrics = evaluation.categories
    ? [
        {
          label: "Eye Contact",
          data: evaluation.categories.eyeContact || defaultMetric,
        },
        {
          label: "Posture",
          data: evaluation.categories.posture || defaultMetric,
        },
        {
          label: "Gestures",
          data: evaluation.categories.gestures || defaultMetric,
        },
        {
          label: "Vocal Delivery",
          data: evaluation.categories.vocalDelivery || defaultMetric,
        },
        {
          label: "Energy",
          data: evaluation.categories.energy || defaultMetric,
        },
        {
          label: "Filler Words",
          data: evaluation.categories.fillerWords || defaultMetric,
        },
      ]
    : [
        { label: "Eye Contact", data: evaluation.eyeContact || defaultMetric },
        { label: "Posture", data: evaluation.posture || defaultMetric },
        { label: "Gestures", data: evaluation.gestures || defaultMetric },
        { label: "Energy", data: evaluation.energy || defaultMetric },
        { label: "Presence", data: evaluation.presence || defaultMetric },
      ];

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>Your Evaluation</h1>
      </div>

      <div style={styles.scoreCard}>
        <div
          style={{
            ...styles.bigScore,
            color: scoreColor(evaluation.overallScore),
          }}
        >
          {evaluation.overallScore}
        </div>
        <p style={styles.scoreLabel}>Overall Score</p>
        <p style={styles.summary}>{evaluation.summary}</p>
      </div>

      <div style={styles.highlights}>
        <div style={styles.highlightCard}>
          <span style={{ color: "#34d399", fontSize: 18 }}>★</span>
          <div>
            <p style={styles.highlightLabel}>Top Strength</p>
            <p style={styles.highlightText}>
              {evaluation.topStrength || "N/A"}
            </p>
          </div>
        </div>
        <div style={styles.highlightCard}>
          <span style={{ color: "#fbbf24", fontSize: 18 }}>↑</span>
          <div>
            <p style={styles.highlightLabel}>Top Improvement</p>
            <p style={styles.highlightText}>
              {evaluation.topImprovement || "N/A"}
            </p>
          </div>
        </div>
      </div>

      <div style={styles.metricsGrid}>
        {metrics.map((m) => (
          <div key={m.label} style={styles.metricCard}>
            <div style={styles.metricTop}>
              <span style={styles.metricLabel}>
                {m.label}
                {m.data.weight && (
                  <span style={styles.weightBadge}>{m.data.weight}</span>
                )}
              </span>
              <span
                style={{
                  ...styles.metricScore,
                  color: scoreColor(m.data.score),
                }}
              >
                {m.data.score}
              </span>
            </div>
            <div style={styles.barBg}>
              <div
                style={{
                  ...styles.barFill,
                  width: `${m.data.score}%`,
                  background: scoreColor(m.data.score),
                }}
              />
            </div>
            <p style={styles.metricFeedback}>{m.data.feedback}</p>
          </div>
        ))}
      </div>

      {evaluation.details && (
        <div style={styles.detailsCard}>
          <h3 style={styles.detailsTitle}>Detailed Observations</h3>
          <p style={styles.detailsText}>{evaluation.details}</p>
        </div>
      )}

      <div style={styles.actions}>
        <button
          onClick={() => navigate(`/chat/${sessionId}`)}
          style={styles.chatBtn}
        >
          Chat About This Evaluation
        </button>
        <button onClick={() => navigate("/home")} style={styles.homeBtn}>
          Back to Home
        </button>
      </div>
    </div>
  );
}

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    minHeight: "100vh",
    background: "#0a0a0f",
    color: "#e8e6f0",
    padding: "32px 24px",
    maxWidth: 700,
    margin: "0 auto",
  },
  header: {
    marginBottom: 32,
  },
  title: {
    fontSize: 24,
    fontWeight: 700,
  },
  scoreCard: {
    background: "#111118",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: 16,
    padding: "36px 24px",
    textAlign: "center",
    marginBottom: 20,
  },
  bigScore: {
    fontSize: 64,
    fontWeight: 800,
    lineHeight: 1,
  },
  scoreLabel: {
    color: "#8884a0",
    fontSize: 14,
    marginTop: 8,
    marginBottom: 16,
  },
  summary: {
    color: "#c4c2d4",
    fontSize: 14,
    lineHeight: 1.6,
    maxWidth: 500,
    margin: "0 auto",
  },
  highlights: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 12,
    marginBottom: 20,
  },
  highlightCard: {
    background: "#111118",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: 12,
    padding: "16px 18px",
    display: "flex",
    gap: 12,
    alignItems: "flex-start",
  },
  highlightLabel: {
    fontSize: 11,
    color: "#8884a0",
    textTransform: "uppercase",
    letterSpacing: "0.05em",
    fontWeight: 600,
    marginBottom: 4,
  },
  highlightText: {
    fontSize: 13,
    color: "#c4c2d4",
    lineHeight: 1.5,
  },
  metricsGrid: {
    display: "flex",
    flexDirection: "column",
    gap: 12,
    marginBottom: 24,
  },
  metricCard: {
    background: "#111118",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: 12,
    padding: "16px 20px",
  },
  metricTop: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  metricLabel: {
    fontSize: 14,
    fontWeight: 600,
    display: "flex",
    alignItems: "center",
    gap: 8,
  },
  weightBadge: {
    fontSize: 11,
    color: "#8884a0",
    background: "#1a1a24",
    padding: "2px 8px",
    borderRadius: 4,
    fontWeight: 500,
  },
  metricScore: {
    fontSize: 18,
    fontWeight: 700,
  },
  barBg: {
    height: 6,
    background: "#1a1a24",
    borderRadius: 3,
    marginBottom: 10,
    overflow: "hidden",
  },
  barFill: {
    height: "100%",
    borderRadius: 3,
    transition: "width 0.5s ease",
  },
  metricFeedback: {
    fontSize: 13,
    color: "#8884a0",
    lineHeight: 1.5,
  },
  detailsCard: {
    background: "#111118",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: 12,
    padding: "20px 24px",
    marginBottom: 24,
  },
  detailsTitle: {
    fontSize: 15,
    fontWeight: 600,
    marginBottom: 12,
  },
  detailsText: {
    fontSize: 13,
    color: "#8884a0",
    lineHeight: 1.7,
  },
  actions: {
    display: "flex",
    flexDirection: "column",
    gap: 12,
  },
  chatBtn: {
    background: "#7c6ff7",
    color: "white",
    border: "none",
    borderRadius: 12,
    padding: 16,
    fontSize: 15,
    fontWeight: 600,
    cursor: "pointer",
  },
  homeBtn: {
    background: "transparent",
    border: "1px solid rgba(255,255,255,0.1)",
    color: "#8884a0",
    borderRadius: 12,
    padding: 16,
    fontSize: 15,
    cursor: "pointer",
  },
  loadingContainer: {
    minHeight: "100vh",
    background: "#0a0a0f",
    color: "#e8e6f0",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
  },
  loadingTitle: {
    fontSize: 22,
    fontWeight: 600,
    marginBottom: 8,
  },
  loadingSub: {
    color: "#8884a0",
    fontSize: 14,
  },
};

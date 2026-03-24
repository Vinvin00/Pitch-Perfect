import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { auth, db } from "../firbaseconfig";
import { signOut } from "firebase/auth";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { useAuth } from "../useAuth";

type SessionDoc = {
  id: string;
  evaluationType: string;
  evaluationLabel: string;
  createdAt: any;
  status: string;
  duration?: number;
  evaluation?: {
    overallScore: number;
    topImprovement?: string;
    topStrength?: string;
    summary?: string;
  };
};

export default function Home() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [sessions, setSessions] = useState<SessionDoc[]>([]);
  const [loadingSessions, setLoadingSessions] = useState(true);

  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, "sessions"),
      where("userId", "==", user.uid),
    );

    const unsub = onSnapshot(
      q,
      (snapshot) => {
        const docs = snapshot.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        })) as SessionDoc[];
        // Sort client-side to avoid needing a Firestore composite index
        docs.sort((a, b) => {
          const aTime = a.createdAt?.toMillis?.() || 0;
          const bTime = b.createdAt?.toMillis?.() || 0;
          return bTime - aTime;
        });
        setSessions(docs);
        setLoadingSessions(false);
      },
      (err) => {
        console.error("Failed to fetch sessions:", err);
        setLoadingSessions(false);
      },
    );

    return () => unsub();
  }, [user]);

  const handleLogout = async () => {
    await signOut(auth);
    navigate("/");
  };

  const scoreColor = (score: number) => {
    if (score >= 75) return "#34d399";
    if (score >= 50) return "#fbbf24";
    return "#f87171";
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return "Just now";
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  };

  const formatDuration = (secs?: number) => {
    if (!secs) return "";
    const mins = Math.floor(secs / 60);
    const s = secs % 60;
    return `${mins}:${s.toString().padStart(2, "0")}`;
  };

  const modeIcon = (type: string) => {
    switch (type) {
      case "entertaining":
        return "🎤";
      case "professional-pitch":
        return "📊";
      case "corporate":
        return "🏢";
      default:
        return "🎯";
    }
  };

  const statusLabel = (status: string) => {
    switch (status) {
      case "recording":
        return { text: "In Progress", color: "#fbbf24" };
      case "recorded":
        return { text: "Awaiting Eval", color: "#8884a0" };
      case "evaluated":
        return { text: "Evaluated", color: "#34d399" };
      default:
        return { text: status, color: "#8884a0" };
    }
  };

  const handleCardClick = (session: SessionDoc) => {
    if (session.status === "evaluated" && session.evaluation) {
      navigate(`/evaluation/${session.id}`);
    } else if (session.status === "recording") {
      navigate(`/record/${session.id}`);
    } else {
      navigate(`/evaluation/${session.id}`);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>PitchCoach AI</h1>
        <div style={styles.headerRight}>
          <span style={styles.email}>{user?.email}</span>
          <button onClick={handleLogout} style={styles.logoutBtn}>
            Log Out
          </button>
        </div>
      </div>

      <div style={styles.content}>
        <div style={styles.sectionHeader}>
          <h2 style={styles.sectionTitle}>Your Sessions</h2>
          {sessions.length > 0 && (
            <span style={styles.sessionCount}>{sessions.length}</span>
          )}
        </div>

        {loadingSessions ? (
          <div style={styles.emptyState}>
            <p style={styles.emptyText}>Loading sessions...</p>
          </div>
        ) : sessions.length === 0 ? (
          <div style={styles.emptyState}>
            <p style={styles.emptyEmoji}>🎯</p>
            <p style={styles.emptyText}>No sessions yet. Start practicing!</p>
            <p style={styles.emptySubtext}>
              Record yourself presenting and get AI feedback
            </p>
          </div>
        ) : (
          <div style={styles.sessionsGrid}>
            {sessions.map((session) => {
              const status = statusLabel(session.status);
              const hasScore =
                session.status === "evaluated" && session.evaluation;
              return (
                <div
                  key={session.id}
                  style={styles.sessionCard}
                  onClick={() => handleCardClick(session)}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = "#7c6ff7";
                    e.currentTarget.style.transform = "translateY(-2px)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor =
                      "rgba(255,255,255,0.08)";
                    e.currentTarget.style.transform = "translateY(0)";
                  }}
                >
                  <div style={styles.cardTop}>
                    <div style={styles.cardLeft}>
                      <span style={styles.modeIcon}>
                        {modeIcon(session.evaluationType)}
                      </span>
                      <div>
                        <p style={styles.cardLabel}>
                          {session.evaluationLabel || session.evaluationType}
                        </p>
                        <div style={styles.cardMeta}>
                          <span style={styles.cardDate}>
                            {formatDate(session.createdAt)}
                          </span>
                          {session.duration ? (
                            <span style={styles.cardDuration}>
                              {formatDuration(session.duration)}
                            </span>
                          ) : null}
                        </div>
                      </div>
                    </div>

                    {hasScore ? (
                      <div style={styles.scoreCircle}>
                        <span
                          style={{
                            ...styles.scoreNum,
                            color: scoreColor(session.evaluation!.overallScore),
                          }}
                        >
                          {session.evaluation!.overallScore}
                        </span>
                      </div>
                    ) : (
                      <span
                        style={{
                          ...styles.statusBadge,
                          color: status.color,
                          borderColor: status.color,
                        }}
                      >
                        {status.text}
                      </span>
                    )}
                  </div>

                  {hasScore && session.evaluation!.topImprovement && (
                    <div style={styles.cardBottom}>
                      <span style={styles.improvementIcon}>↑</span>
                      <p style={styles.improvementText}>
                        {session.evaluation!.topImprovement}
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        <button
          onClick={() => navigate("/new-session")}
          style={styles.newButton}
        >
          + New Session
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
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "20px 32px",
    borderBottom: "1px solid rgba(255,255,255,0.08)",
  },
  title: {
    fontSize: 20,
    fontWeight: 700,
    color: "#a78bfa",
  },
  headerRight: {
    display: "flex",
    alignItems: "center",
    gap: 16,
  },
  email: {
    fontSize: 13,
    color: "#8884a0",
  },
  logoutBtn: {
    background: "transparent",
    border: "1px solid rgba(255,255,255,0.1)",
    color: "#8884a0",
    borderRadius: 8,
    padding: "8px 16px",
    fontSize: 13,
    cursor: "pointer",
  },
  content: {
    padding: "40px 32px",
    maxWidth: 800,
    margin: "0 auto",
  },
  sectionHeader: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 600,
  },
  sessionCount: {
    fontSize: 12,
    color: "#8884a0",
    background: "#1a1a24",
    padding: "2px 10px",
    borderRadius: 10,
    fontWeight: 600,
  },
  emptyState: {
    background: "#111118",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: 12,
    padding: "48px 24px",
    textAlign: "center",
    marginBottom: 24,
  },
  emptyEmoji: {
    fontSize: 32,
    marginBottom: 12,
  },
  emptyText: {
    color: "#8884a0",
    fontSize: 14,
    marginBottom: 4,
  },
  emptySubtext: {
    color: "#5a576e",
    fontSize: 13,
  },
  sessionsGrid: {
    display: "flex",
    flexDirection: "column",
    gap: 12,
    marginBottom: 24,
  },
  sessionCard: {
    background: "#111118",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: 12,
    padding: "18px 20px",
    cursor: "pointer",
    transition: "border-color 0.2s, transform 0.2s",
  },
  cardTop: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  cardLeft: {
    display: "flex",
    alignItems: "center",
    gap: 14,
  },
  modeIcon: {
    fontSize: 24,
    width: 44,
    height: 44,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "#1a1a24",
    borderRadius: 10,
  },
  cardLabel: {
    fontSize: 15,
    fontWeight: 600,
    marginBottom: 4,
  },
  cardMeta: {
    display: "flex",
    alignItems: "center",
    gap: 10,
  },
  cardDate: {
    fontSize: 12,
    color: "#8884a0",
  },
  cardDuration: {
    fontSize: 12,
    color: "#5a576e",
  },
  scoreCircle: {
    width: 48,
    height: 48,
    borderRadius: 12,
    background: "#1a1a24",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  scoreNum: {
    fontSize: 20,
    fontWeight: 800,
  },
  statusBadge: {
    fontSize: 11,
    fontWeight: 600,
    padding: "4px 12px",
    borderRadius: 6,
    border: "1px solid",
    textTransform: "uppercase",
    letterSpacing: "0.03em",
  },
  cardBottom: {
    display: "flex",
    alignItems: "flex-start",
    gap: 8,
    marginTop: 12,
    paddingTop: 12,
    borderTop: "1px solid rgba(255,255,255,0.05)",
  },
  improvementIcon: {
    color: "#fbbf24",
    fontSize: 13,
    fontWeight: 700,
    flexShrink: 0,
    marginTop: 1,
  },
  improvementText: {
    fontSize: 12,
    color: "#8884a0",
    lineHeight: 1.5,
  },
  newButton: {
    width: "100%",
    background: "#7c6ff7",
    color: "white",
    border: "none",
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    fontWeight: 600,
    cursor: "pointer",
  },
};

import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  doc,
  getDoc,
  collection,
  addDoc,
  query,
  orderBy,
  onSnapshot,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../firbaseconfig";

type Message = {
  id?: string;
  role: "user" | "assistant";
  content: string;
  createdAt?: any;
};

type SessionData = {
  evaluationType: string;
  evaluationLabel: string;
  energy: string;
  formality: string;
  goal: string;
  duration?: number;
  audioAnalysis?: any;
  evaluation?: any;
};

export default function Chat() {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [session, setSession] = useState<SessionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Load session data
  useEffect(() => {
    loadSession();
  }, []);

  // Subscribe to messages
  useEffect(() => {
    if (!sessionId) return;

    const messagesRef = collection(db, "sessions", sessionId, "messages");
    const q = query(messagesRef, orderBy("createdAt", "asc"));

    const unsub = onSnapshot(
      q,
      (snapshot) => {
        const msgs = snapshot.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        })) as Message[];
        setMessages(msgs);
      },
      (err) => {
        console.error("Messages listener error:", err);
      },
    );

    return () => unsub();
  }, [sessionId]);

  // Auto-scroll on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const loadSession = async () => {
    try {
      const sessionDoc = await getDoc(doc(db, "sessions", sessionId!));
      if (!sessionDoc.exists()) {
        setError("Session not found");
        setLoading(false);
        return;
      }
      setSession(sessionDoc.data() as SessionData);
    } catch (err) {
      setError("Failed to load session");
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || sending || !session) return;

    setInput("");
    setSending(true);

    // Save user message to Firestore
    const messagesRef = collection(db, "sessions", sessionId!, "messages");
    await addDoc(messagesRef, {
      role: "user",
      content: text,
      createdAt: serverTimestamp(),
    });

    try {
      // Build message history for context (last 20 messages)
      const history = messages.slice(-20).map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const res = await fetch("http://localhost:3001/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text,
          history,
          sessionContext: {
            evaluationType: session.evaluationType,
            evaluationLabel: session.evaluationLabel,
            energy: session.energy,
            formality: session.formality,
            goal: session.goal,
            duration: session.duration,
            audioAnalysis: session.audioAnalysis,
            evaluation: session.evaluation,
          },
        }),
      });

      const data = await res.json();

      if (data.error) {
        throw new Error(data.error);
      }

      // Save assistant message to Firestore
      await addDoc(messagesRef, {
        role: "assistant",
        content: data.reply,
        createdAt: serverTimestamp(),
      });
    } catch (err) {
      // Save error as assistant message so user sees it
      await addDoc(messagesRef, {
        role: "assistant",
        content:
          "Sorry, I couldn't process that. Make sure the API server is running and try again.",
        createdAt: serverTimestamp(),
      });
    } finally {
      setSending(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  if (loading) {
    return (
      <div style={styles.centered}>
        <p style={styles.loadingText}>Loading chat...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={styles.centered}>
        <p style={{ ...styles.loadingText, color: "#f87171" }}>{error}</p>
        <button onClick={() => navigate("/home")} style={styles.backBtn}>
          Back to Home
        </button>
      </div>
    );
  }

  const scoreColor = (score: number) => {
    if (score >= 75) return "#34d399";
    if (score >= 50) return "#fbbf24";
    return "#f87171";
  };

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <button
          onClick={() => navigate(`/evaluation/${sessionId}`)}
          style={styles.headerBack}
        >
          ← Evaluation
        </button>
        <div style={styles.headerCenter}>
          <p style={styles.headerTitle}>Chat with Coach</p>
          <p style={styles.headerSub}>
            {session?.evaluationLabel || "Session"}
            {session?.evaluation?.overallScore !== undefined && (
              <span
                style={{
                  color: scoreColor(session.evaluation.overallScore),
                  fontWeight: 700,
                  marginLeft: 8,
                }}
              >
                Score: {session.evaluation.overallScore}
              </span>
            )}
          </p>
        </div>
        <button onClick={() => navigate("/home")} style={styles.headerHome}>
          Home
        </button>
      </div>

      {/* Messages */}
      <div style={styles.messagesArea}>
        {messages.length === 0 && !sending && (
          <div style={styles.emptyChat}>
            <p style={styles.emptyChatTitle}>Ask about your evaluation</p>
            <p style={styles.emptyChatSub}>
              Get specific advice on how to improve your presentation skills.
            </p>
            <div style={styles.suggestions}>
              {[
                "What's the fastest way to improve my score?",
                "How do I fix my posture?",
                "Give me a 1-week practice plan",
                "What did I do well?",
              ].map((s) => (
                <button
                  key={s}
                  style={styles.suggestionBtn}
                  onClick={() => {
                    setInput(s);
                    inputRef.current?.focus();
                  }}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <div
            key={msg.id || i}
            style={
              msg.role === "user"
                ? styles.userBubbleRow
                : styles.assistantBubbleRow
            }
          >
            {msg.role === "assistant" && <div style={styles.avatar}>AI</div>}
            <div
              style={
                msg.role === "user" ? styles.userBubble : styles.assistantBubble
              }
            >
              <p style={styles.bubbleText}>{msg.content}</p>
            </div>
          </div>
        ))}

        {sending && (
          <div style={styles.assistantBubbleRow}>
            <div style={styles.avatar}>AI</div>
            <div style={styles.assistantBubble}>
              <p style={styles.typingDots}>Thinking...</p>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div style={styles.inputArea}>
        <div style={styles.inputRow}>
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask about your evaluation..."
            style={styles.textInput}
            rows={1}
            disabled={sending}
          />
          <button
            onClick={sendMessage}
            disabled={!input.trim() || sending}
            style={{
              ...styles.sendBtn,
              opacity: !input.trim() || sending ? 0.4 : 1,
            }}
          >
            ↑
          </button>
        </div>
      </div>
    </div>
  );
}

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    height: "100vh",
    background: "#0a0a0f",
    color: "#e8e6f0",
    display: "flex",
    flexDirection: "column",
  },
  centered: {
    minHeight: "100vh",
    background: "#0a0a0f",
    color: "#e8e6f0",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    color: "#8884a0",
  },

  // Header
  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "14px 20px",
    borderBottom: "1px solid rgba(255,255,255,0.08)",
    flexShrink: 0,
  },
  headerBack: {
    background: "transparent",
    border: "none",
    color: "#8884a0",
    fontSize: 13,
    cursor: "pointer",
    padding: "6px 0",
  },
  headerCenter: {
    textAlign: "center",
  },
  headerTitle: {
    fontSize: 15,
    fontWeight: 700,
    color: "#e8e6f0",
    marginBottom: 2,
  },
  headerSub: {
    fontSize: 12,
    color: "#8884a0",
  },
  headerHome: {
    background: "transparent",
    border: "none",
    color: "#8884a0",
    fontSize: 13,
    cursor: "pointer",
    padding: "6px 0",
  },

  // Messages area
  messagesArea: {
    flex: 1,
    overflowY: "auto",
    padding: "20px 20px 8px",
    display: "flex",
    flexDirection: "column",
    gap: 16,
  },

  // Empty state
  emptyChat: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    textAlign: "center",
    padding: "40px 20px",
  },
  emptyChatTitle: {
    fontSize: 18,
    fontWeight: 600,
    marginBottom: 8,
  },
  emptyChatSub: {
    fontSize: 13,
    color: "#8884a0",
    marginBottom: 24,
    maxWidth: 300,
  },
  suggestions: {
    display: "flex",
    flexWrap: "wrap",
    gap: 8,
    justifyContent: "center",
    maxWidth: 500,
  },
  suggestionBtn: {
    background: "#111118",
    border: "1px solid rgba(255,255,255,0.08)",
    color: "#c4c2d4",
    borderRadius: 10,
    padding: "10px 16px",
    fontSize: 13,
    cursor: "pointer",
    transition: "border-color 0.2s",
  },

  // Bubbles
  userBubbleRow: {
    display: "flex",
    justifyContent: "flex-end",
  },
  assistantBubbleRow: {
    display: "flex",
    justifyContent: "flex-start",
    gap: 10,
    alignItems: "flex-start",
  },
  avatar: {
    width: 30,
    height: 30,
    borderRadius: 8,
    background: "#7c6ff7",
    color: "white",
    fontSize: 11,
    fontWeight: 700,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    marginTop: 2,
  },
  userBubble: {
    background: "#7c6ff7",
    borderRadius: "16px 16px 4px 16px",
    padding: "12px 16px",
    maxWidth: "75%",
  },
  assistantBubble: {
    background: "#111118",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: "16px 16px 16px 4px",
    padding: "12px 16px",
    maxWidth: "75%",
  },
  bubbleText: {
    fontSize: 14,
    lineHeight: 1.6,
    whiteSpace: "pre-wrap",
    wordBreak: "break-word",
  },
  typingDots: {
    fontSize: 14,
    color: "#8884a0",
    fontStyle: "italic",
  },

  // Input area
  inputArea: {
    padding: "12px 20px 20px",
    borderTop: "1px solid rgba(255,255,255,0.08)",
    flexShrink: 0,
  },
  inputRow: {
    display: "flex",
    gap: 10,
    alignItems: "flex-end",
    maxWidth: 700,
    margin: "0 auto",
  },
  textInput: {
    flex: 1,
    background: "#111118",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: 12,
    padding: "12px 16px",
    color: "#e8e6f0",
    fontSize: 14,
    resize: "none",
    outline: "none",
    fontFamily: "inherit",
    lineHeight: 1.5,
    maxHeight: 120,
    overflowY: "auto",
  },
  sendBtn: {
    width: 42,
    height: 42,
    borderRadius: 12,
    background: "#7c6ff7",
    color: "white",
    border: "none",
    fontSize: 18,
    fontWeight: 700,
    cursor: "pointer",
    flexShrink: 0,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  backBtn: {
    background: "transparent",
    border: "1px solid rgba(255,255,255,0.1)",
    color: "#8884a0",
    borderRadius: 12,
    padding: "12px 24px",
    fontSize: 14,
    cursor: "pointer",
  },
};

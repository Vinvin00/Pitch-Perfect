import { useNavigate } from "react-router-dom";
import { auth } from "../firbaseconfig";
import { signOut } from "firebase/auth";
import { useAuth } from "../useAuth";

export default function Home() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleLogout = async () => {
    await signOut(auth);
    navigate("/");
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
        <h2 style={styles.sectionTitle}>Your Sessions</h2>

        <div style={styles.emptyState}>
          <p style={styles.emptyText}>No sessions yet. Start practicing!</p>
        </div>

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
  sectionTitle: {
    fontSize: 18,
    fontWeight: 600,
    marginBottom: 24,
  },
  emptyState: {
    background: "#111118",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: 12,
    padding: "48px 24px",
    textAlign: "center",
    marginBottom: 24,
  },
  emptyText: {
    color: "#8884a0",
    fontSize: 14,
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

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { auth } from "../firbaseconfig";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
} from "firebase/auth";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (isSignUp) {
        await createUserWithEmailAndPassword(auth, email, password);
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
      navigate("/home");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1 style={styles.title}>PitchCoach AI</h1>
        <p style={styles.subtitle}>Practice presenting. Get AI feedback.</p>

        <form onSubmit={handleSubmit} style={styles.form}>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={styles.input}
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            style={styles.input}
          />

          {error && <p style={styles.error}>{error}</p>}

          <button type="submit" style={styles.button} disabled={loading}>
            {loading ? "Loading..." : isSignUp ? "Sign Up" : "Log In"}
          </button>
        </form>

        <p style={styles.toggle}>
          {isSignUp ? "Already have an account?" : "Don't have an account?"}{" "}
          <span
            onClick={() => setIsSignUp(!isSignUp)}
            style={styles.toggleLink}
          >
            {isSignUp ? "Log In" : "Sign Up"}
          </span>
        </p>
      </div>
    </div>
  );
}

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "#0a0a0f",
  },
  card: {
    background: "#111118",
    border: "1px solid rgba(255, 255, 255, 0.08)",
    borderRadius: 16,
    padding: "48px 40px",
    width: "100%",
    maxWidth: 400,
    textAlign: "center",
  },
  title: {
    fontSize: 28,
    fontWeight: 700,
    color: "#a78bfa",
    marginBottom: 8,
  },
  subtitle: {
    color: "#8884a0",
    fontSize: 14,
    marginBottom: 32,
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: 14,
  },
  input: {
    background: "#1a1a24",
    border: "1px solid rgba(255, 255, 255, 0.1)",
    borderRadius: 10,
    padding: "14px 16px",
    color: "#e8e6f0",
    fontSize: 14,
    outline: "none",
  },
  button: {
    background: "#7c6ff7",
    color: "white",
    border: "none",
    borderRadius: 10,
    padding: 14,
    fontSize: 15,
    fontWeight: 600,
    cursor: "pointer",
    marginTop: 8,
  },
  error: {
    color: "#f87171",
    fontSize: 13,
  },
  toggle: {
    color: "#8884a0",
    fontSize: 13,
    marginTop: 24,
  },
  toggleLink: {
    color: "#a78bfa",
    cursor: "pointer",
    fontWeight: 600,
  },
};

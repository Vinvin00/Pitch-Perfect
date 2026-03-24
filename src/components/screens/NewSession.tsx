import { useNavigate } from "react-router-dom";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../firbaseconfig";
import { useAuth } from "../useAuth";

const EVALUATION_TYPES = [
  {
    id: "entertaining",
    label: "Entertaining",
    energy: "High",
    formality: "Low-Medium",
    goal: "Engage",
    description:
      "Engaging an audience with energy, humor, and dynamic delivery",
  },
  {
    id: "professional-pitch",
    label: "Professional Pitch",
    energy: "Medium",
    formality: "Medium-High",
    goal: "Persuade",
    description:
      "Persuading stakeholders with clarity, confidence, and structure",
  },
  {
    id: "corporate",
    label: "Corporate",
    energy: "Low-Medium",
    formality: "High",
    goal: "Authority",
    description:
      "Commanding authority with composure, posture, and precise delivery",
  },
];
export default function NewSession() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleSelect = async (type: (typeof EVALUATION_TYPES)[0]) => {
    const docRef = await addDoc(collection(db, "sessions"), {
      userId: user?.uid,
      evaluationType: type.id,
      evaluationLabel: type.label,
      energy: type.energy,
      formality: type.formality,
      goal: type.goal,
      createdAt: serverTimestamp(),
      status: "recording",
    });
    navigate(`/record/${docRef.id}`);
  };

  return (
    <div style={styles.container}>
      <button onClick={() => navigate("/home")} style={styles.backBtn}>
        ← Back
      </button>

      <h1 style={styles.title}>What are you presenting?</h1>
      <p style={styles.subtitle}>Pick the scenario closest to yours</p>

      <div style={styles.grid}>
        {EVALUATION_TYPES.map((type) => (
          <div
            key={type.id}
            style={styles.card}
            onClick={() => handleSelect(type)}
            onMouseEnter={(e) =>
              (e.currentTarget.style.borderColor = "#7c6ff7")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)")
            }
          >
            <h3 style={styles.cardTitle}>{type.label}</h3>
            <p style={styles.cardDesc}>{type.description}</p>
            <div style={styles.cardTags}>
              <span style={styles.tag}>Energy: {type.energy}</span>
              <span style={styles.tag}>Formality: {type.formality}</span>
              <span style={styles.tag}>Goal: {type.goal}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    minHeight: "100vh",
    background: "#0a0a0f",
    color: "#e8e6f0",
    padding: "40px 32px",
    maxWidth: 700,
    margin: "0 auto",
  },
  backBtn: {
    background: "transparent",
    border: "none",
    color: "#8884a0",
    fontSize: 14,
    cursor: "pointer",
    marginBottom: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: 700,
    marginBottom: 8,
  },
  subtitle: {
    color: "#8884a0",
    fontSize: 14,
    marginBottom: 32,
  },
  grid: {
    display: "flex",
    flexDirection: "column",
    gap: 16,
  },
  card: {
    background: "#111118",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: 12,
    padding: "24px 20px",
    cursor: "pointer",
    transition: "border-color 0.2s",
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 600,
    marginBottom: 8,
  },
  cardDesc: {
    fontSize: 13,
    color: "#8884a0",
    lineHeight: 1.5,
  },
  cardTags: {
    display: "flex",
    gap: 8,
    marginTop: 12,
    flexWrap: "wrap" as const,
  },
  tag: {
    background: "#1a1a24",
    color: "#8884a0",
    fontSize: 11,
    padding: "4px 10px",
    borderRadius: 6,
    fontWeight: 600,
  },
};

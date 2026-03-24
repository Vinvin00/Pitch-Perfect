import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "./components/screens/Login";
import Home from "./components/screens/Home";
import NewSession from "./components/screens/NewSession";
import Record from "./components/screens/Record";
import Evaluation from "./components/screens/Evaluation";
import Chat from "./components/screens/Chat";
import { useAuth } from "./components/useAuth";

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading)
    return (
      <div style={{ color: "#fff", background: "#0a0a0f", minHeight: "100vh" }}>
        Loading...
      </div>
    );
  if (!user) return <Navigate to="/" />;
  return <>{children}</>;
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route
          path="/home"
          element={
            <ProtectedRoute>
              <Home />
            </ProtectedRoute>
          }
        />
        <Route path="/new-session" element={<NewSession />} />
        <Route path="/record/:sessionId" element={<Record />} />
        <Route path="/evaluation/:sessionId" element={<Evaluation />} />
        <Route path="/chat/:sessionId" element={<Chat />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;

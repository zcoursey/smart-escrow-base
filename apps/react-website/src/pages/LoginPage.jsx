import { useState } from "react";
import { useNavigate } from "react-router-dom";
import LoginForm from "../components/LoginForm";

const LoginPage = ({ setUser }) => {
  const navigate = useNavigate();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("client");
  const [isRegistering, setIsRegistering] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const API_URL = "https://smart-escrow-base-testing.onrender.com";

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    const endpoint = isRegistering ? "/auth/register" : "/auth/login";
    const payload = isRegistering
      ? { username, password, role }
      : { username, password };

    try {
      const res = await fetch(`${API_URL}${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        credentials: "include",
      });

      const data = await res.json();

      if (!res.ok || !data.ok) {
        throw new Error(data.error || "Authentication failed");
      }

      setUser(data.user);
      navigate("/profile");
    } catch (err) {
      setError(err.message || "Network error. Is the server running?");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section className="bg-indigo-50 min-h-screen flex items-center justify-center py-10">
      <LoginForm
        username={username}
        setUsername={setUsername}
        password={password}
        setPassword={setPassword}
        role={role}
        setRole={setRole}
        handleLogin={handleLogin}
        error={error}
        isLoading={isLoading}
        isRegistering={isRegistering}
        setIsRegistering={setIsRegistering}
      />
    </section>
  );
};

export default LoginPage;

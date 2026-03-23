import { useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import LoginForm from "../components/LoginForm";

const LoginPage = ({ setUser }) => {
  const navigate = useNavigate();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("client");
  const [isRegistering, setIsRegistering] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const API_URL = "https://smart-escrow-base-testing.onrender.com";

  const successToast = (message) =>
    toast.success(message, {
      style: { background: "#16a34a", color: "#fff" },
    });

  const errorToast = (message) =>
    toast.error(message, {
      style: { background: "#dc2626", color: "#fff" },
    });

  const handleLogin = async (e) => {
    e.preventDefault();

    // ======================
    // VALIDATION
    // ======================
    if (!username.trim() || !password.trim()) {
      errorToast("Please fill out all fields");
      return;
    }

    if (isRegistering) {
      const isComplex = (str) =>
        str.length >= 6 &&
        /[A-Z]/.test(str) &&
        /[a-z]/.test(str) &&
        /[^A-Za-z]/.test(str);

      if (!isComplex(username)) {
        errorToast(
          "Username must be 6+ chars, include upper, lower, and number/symbol"
        );
        return;
      }

      if (!isComplex(password)) {
        errorToast(
          "Password must be 6+ chars, include upper, lower, and number/symbol"
        );
        return;
      }

      // Validation complete
    }

    // ======================
    // REQUEST
    // ======================
    setIsLoading(true);

    const loadingToast = toast.loading(
      isRegistering ? "Creating account..." : "Logging in..."
    );

    const endpoint = isRegistering ? "/auth/register" : "/auth/login";

    const payload = isRegistering
      ? { username: username.trim(), password, role }
      : { username: username.trim(), password };

    try {
      const res = await fetch(`${API_URL}${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        credentials: "include",
      });

      const data = await res.json();

      toast.dismiss(loadingToast);

      if (data.ok) {
        try {
          const meRes = await fetch(`${API_URL}/auth/me`, { credentials: "include" });
          const meData = await meRes.json();
          if (meData.ok && meData.user) {
            setUser(meData.user);
          } else {
            setUser(data.user);
          }
        } catch (err) {
          setUser(data.user);
        }

        successToast(
          isRegistering ? "Account created!" : "Logged in successfully!"
        );

        navigate("/");
      } else {
        errorToast(data.error || "Authentication failed");
      }
    } catch (err) {
      toast.dismiss(loadingToast);
      errorToast("Network error. Is the server running?");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section className="bg-indigo-50 min-h-screen flex flex-col items-center justify-center py-10">
      <LoginForm
        username={username}
        setUsername={setUsername}
        password={password}
        setPassword={setPassword}
        role={role}
        setRole={setRole}
        handleLogin={handleLogin}
        isLoading={isLoading}
        isRegistering={isRegistering}
        setIsRegistering={setIsRegistering}
      />
    </section>
  );
};

export default LoginPage;

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import LoginForm from '../components/LoginForm';

const LoginPage = ({ setUser }) => {
    const navigate = useNavigate();
    
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState('client');
    const [isRegistering, setIsRegistering] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const API_URL = "https://smart-escrow-base-testing.onrender.com";

    const handleLogin = async (e) => {
        e.preventDefault();

        if (!username.trim() || !password.trim()) {
            toast.error("Please fill out all fields", {
                style: { background: "#dc2626", color: "#fff" },
            });
            return;
        }

        if (isRegistering && password.length < 6) {
            toast.error("Password must be at least 6 characters", {
                style: { background: "#dc2626", color: "#fff" },
            });
            return;
        }

        setIsLoading(true);

        const loadingToast = toast.loading(
            isRegistering ? "Creating account..." : "Logging in..."
        );

        const endpoint = isRegistering ? '/auth/register' : '/auth/login';

        const payload = isRegistering 
            ? { username, password, role } 
            : { username, password };

        try {
            const res = await fetch(`${API_URL}${endpoint}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
                credentials: "include"
            });

            const data = await res.json();

            if (data.ok) {
                setUser(data.user);
                toast.dismiss(loadingToast);

                toast.success(
                    isRegistering ? "Account created!" : "Logged in!",
                    { style: { background: "#16a34a", color: "#fff" } }
                );

                navigate('/profile');
            } else {
                toast.dismiss(loadingToast);
                toast.error(data.error || 'Authentication failed', {
                    style: { background: "#dc2626", color: "#fff" },
                });
            }
        } catch (err) {
            toast.dismiss(loadingToast);
            toast.error('Network error. Is the server running?', {
                style: { background: "#dc2626", color: "#fff" },
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <section className="bg-indigo-50 min-h-screen flex flex-col items-center justify-center py-10">

            <LoginForm 
                username={username} setUsername={setUsername}
                password={password} setPassword={setPassword}
                role ={role} setRole={setRole}
                handleLogin={handleLogin}
                isLoading={isLoading}
                isRegistering={isRegistering}
                setIsRegistering={setIsRegistering}
            />

        </section>
    );
};

export default LoginPage;

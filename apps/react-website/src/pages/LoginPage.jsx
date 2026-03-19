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
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [authStatus, setAuthStatus] = useState(null);

  const API_URL = 'https://smart-escrow-base-testing.onrender.com';

  const successToast = (message) =>
    toast.success(message, {
      style: { background: '#16a34a', color: '#fff' },
    });

  const errorToast = (message) =>
    toast.error(message, {
      style: { background: '#dc2626', color: '#fff' },
    });

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');

    if (!username.trim() || !password.trim()) {
      errorToast('Please enter a username and password');
      return;
    }

    if (isRegistering && password.length < 6) {
      errorToast('Password must be at least 6 characters');
      return;
    }

    setIsLoading(true);

    const loadingToast = toast.loading(
      isRegistering ? 'Creating account...' : 'Logging in...'
    );

    const endpoint = isRegistering ? '/auth/register' : '/auth/login';

    const payload = isRegistering
      ? { username: username.trim(), password, role }
      : { username: username.trim(), password };

    try {
      const res = await fetch(`${API_URL}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        credentials: 'include',
      });

      const data = await res.json();

      if (data.ok) {
        setUser(data.user);
        setAuthStatus('authenticated');
        toast.dismiss(loadingToast);
        successToast(isRegistering ? 'Account created successfully!' : 'Logged in successfully!');
        navigate('/profile');
      } else {
        toast.dismiss(loadingToast);
        setError(data.error || 'Authentication failed');
        errorToast(data.error || 'Authentication failed');
      }
    } catch (err) {
      toast.dismiss(loadingToast);
      setError('Network error. Is the server running?');
      errorToast('Network error. Is the server running?');
    } finally {
      setIsLoading(false);
    }
  };

  const checkAuth = async () => {
    const loadingToast = toast.loading('Checking authentication...');

    try {
      const res = await fetch(`${API_URL}/auth/debug`, {
        credentials: 'include',
      });

      const data = await res.json();

      if (data.ok) {
        setAuthStatus('authenticated');
        toast.dismiss(loadingToast);
        successToast('You are authenticated');
      } else {
        setAuthStatus('not authenticated');
        toast.dismiss(loadingToast);
        errorToast('You are not authenticated');
      }
    } catch (err) {
      setAuthStatus('error');
      toast.dismiss(loadingToast);
      errorToast('Could not reach server');
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
        error={error}
        isLoading={isLoading}
        isRegistering={isRegistering}
        setIsRegistering={setIsRegistering}
      />

      <div className="mt-8 text-center">
        <button
          onClick={checkAuth}
          className="bg-indigo-500 text-white px-6 py-2 rounded hover:bg-indigo-600"
        >
          Check Authentication
        </button>

        {authStatus === 'authenticated' && (
          <p className="mt-4 text-green-600 font-semibold">
            ✅ You are authenticated
          </p>
        )}

        {authStatus === 'not authenticated' && (
          <p className="mt-4 text-red-600 font-semibold">
            ❌ You are NOT authenticated
          </p>
        )}

        {authStatus === 'error' && (
          <p className="mt-4 text-yellow-600 font-semibold">
            ⚠️ Could not reach server
          </p>
        )}
      </div>
    </section>
  );
};

export default LoginPage;

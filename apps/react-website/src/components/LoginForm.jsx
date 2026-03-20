const getPasswordStrength = (pwd) => {
  if (!pwd) return null;
  let score = 0;
  if (pwd.length >= 6) score += 1;
  if (pwd.length >= 8) score += 1;
  if (/[A-Z]/.test(pwd)) score += 1;
  if (/[0-9]/.test(pwd)) score += 1;
  if (/[^A-Za-z0-9]/.test(pwd)) score += 1;

  if (score <= 2) return { label: "Weak", color: "bg-red-500", width: "25%", textColor: "text-red-500" };
  if (score <= 3) return { label: "Fair", color: "bg-yellow-500", width: "50%", textColor: "text-yellow-600" };
  if (score === 4) return { label: "Good", color: "bg-blue-500", width: "75%", textColor: "text-blue-500" };
  return { label: "Strong", color: "bg-green-500", width: "100%", textColor: "text-green-500" };
};

const LoginForm = ({
  username,
  setUsername,
  password,
  setPassword,
  handleLogin,
  isLoading,
  isRegistering,
  setIsRegistering,
  role,
  setRole,
}) => {
  const strength = isRegistering ? getPasswordStrength(password) : null;

  return (
    <form
      onSubmit={handleLogin}
      className="bg-white p-8 rounded-lg shadow-md w-full max-w-md border border-gray-200"
    >
      <h2 className="text-3xl font-bold mb-6 text-center text-gray-800">
        {isRegistering ? "Create Account" : "Welcome Back"}
      </h2>

      {/* ROLE TOGGLE (UNCHANGED) */}
      {isRegistering && (
        <div className="mb-6">
          <label className="block text-gray-700 font-bold mb-3 text-center">
            I am a...
          </label>
          <div className="flex bg-gray-100 p-1 rounded-full w-full max-w-[250px] mx-auto relative">
            <button
              type="button"
              onClick={() => setRole("client")}
              className={`flex-1 py-2 px-4 rounded-full font-bold text-sm transition-all duration-200 ${
                role === "client"
                  ? "bg-indigo-600 text-white shadow-md"
                  : "text-gray-500 hover:bg-gray-200"
              }`}
            >
              Client
            </button>
            <button
              type="button"
              onClick={() => setRole("contractor")}
              className={`flex-1 py-2 px-4 rounded-full font-bold text-sm transition-all duration-200 ${
                role === "contractor"
                  ? "bg-indigo-600 text-white shadow-md"
                  : "text-gray-500 hover:bg-gray-200"
              }`}
            >
              Contractor
            </button>
          </div>
        </div>
      )}

      {/* USERNAME */}
      <div className="mb-4">
        <label className="block text-gray-700 font-bold mb-2">Username</label>
        <input
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="w-full p-3 border rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
          required
        />
      </div>

      {/* PASSWORD */}
      <div className="mb-6">
        <label className="block text-gray-700 font-bold mb-2">Password</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full p-3 border rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
          required
        />
        {isRegistering && password && strength && (
          <div className="mt-2 text-sm">
            <div className="flex justify-between mb-1">
              <span className="text-gray-600">Password Strength:</span>
              <span className={`font-bold ${strength.textColor}`}>{strength.label}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-1.5">
              <div
                className={`${strength.color} h-1.5 rounded-full transition-all duration-300`}
                style={{ width: strength.width }}
              ></div>
            </div>
          </div>
        )}
      </div>

      {/* SUBMIT */}
      <button
        type="submit"
        disabled={isLoading}
        className="w-full bg-indigo-600 text-white font-bold py-3 px-4 rounded hover:bg-indigo-700 transition disabled:opacity-50"
      >
        {isLoading ? "Processing..." : isRegistering ? "Sign Up" : "Log In"}
      </button>

      {/* TOGGLE */}
      <div className="mt-4 text-center">
        <button
          type="button"
          onClick={() => {
            setIsRegistering(!isRegistering);
            setRole("client");
          }}
          className="text-indigo-600 hover:underline text-sm font-semibold"
        >
          {isRegistering
            ? "Already have an account? Log in"
            : "Need an account? Sign up"}
        </button>
      </div>
    </form>
  );
};

export default LoginForm;

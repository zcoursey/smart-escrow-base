const LoginForm = ({
  username,
  setUsername,
  password,
  setPassword,
  role,
  setRole,
  handleLogin,
  isLoading,
  isRegistering,
  setIsRegistering,
}) => {
  return (
    <div className="bg-white w-full max-w-md px-6 py-8 shadow-md rounded-md">
      <h2 className="text-3xl text-center font-semibold mb-6">
        {isRegistering ? 'Create an Account' : 'Login'}
      </h2>

      <form onSubmit={handleLogin}>
        <div className="mb-4">
          <label className="block text-gray-700 font-bold mb-2">Username</label>
          <input
            type="text"
            placeholder="Enter username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="border rounded w-full py-2 px-3 focus:outline-none focus:border-indigo-500"
            required
          />
        </div>

        <div className="mb-4">
          <label className="block text-gray-700 font-bold mb-2">Password</label>
          <input
            type="password"
            placeholder="Enter password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="border rounded w-full py-2 px-3 focus:outline-none focus:border-indigo-500"
            required
          />
        </div>

        {isRegistering && (
          <div className="mb-6">
            <label className="block text-gray-700 font-bold mb-2">Role</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="border rounded w-full py-2 px-3 focus:outline-none focus:border-indigo-500"
            >
              <option value="client">Client</option>
              <option value="contractor">Contractor</option>
            </select>
          </div>
        )}

        <button
          type="submit"
          disabled={isLoading}
          className="bg-indigo-500 hover:bg-indigo-600 text-white font-bold py-3 px-4 rounded-full w-full focus:outline-none disabled:opacity-50 transition-colors"
        >
          {isLoading
            ? isRegistering
              ? 'Creating Account...'
              : 'Logging in...'
            : isRegistering
            ? 'Register'
            : 'Login'}
        </button>
      </form>

      <p className="text-center mt-4 text-sm">
        {isRegistering ? 'Already have an account?' : "Don't have an account?"}{' '}
        <button
          type="button"
          onClick={() => setIsRegistering(!isRegistering)}
          className="text-indigo-600 font-semibold hover:underline"
        >
          {isRegistering ? 'Login here' : 'Register here'}
        </button>
      </p>
    </div>
  );
};

export default LoginForm;

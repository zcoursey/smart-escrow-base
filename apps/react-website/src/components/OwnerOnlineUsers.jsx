import { useEffect, useState } from "react";

const API_BASE =
  import.meta.env.VITE_API_URL || "https://smart-escrow-base-testing.onrender.com";

import GlowCard from './GlowCard';

export default function OwnerOnlineUsers() {
  const [users, setUsers] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOnlineUsers = async () => {
      try {
        setLoading(true);

        const res = await fetch(`${API_BASE}/api/owner/online-users`, {
          credentials: "include",
        });

        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || "Failed to fetch online users");
        }

        setUsers(data.users || []);
        setError("");
      } catch (err) {
        console.error("OwnerOnlineUsers error:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchOnlineUsers();
    const interval = setInterval(fetchOnlineUsers, 15000);

    return () => clearInterval(interval);
  }, []);

  return (
    <GlowCard innerClassName="p-6 mt-6">
      <h2 className="text-xl font-bold mb-3 text-white">Active Users</h2>

      {loading && <p className="text-gray-400">Loading...</p>}

      {!loading && error && (
        <p className="text-red-500">{error}</p>
      )}

      {!loading && !error && users.length === 0 && (
        <p className="text-gray-400">No active users right now.</p>
      )}

      {!loading && !error && users.length > 0 && (
        <div className="space-y-3">
          {users.map((user) => (
            <div key={user.id} className="border border-white/10 bg-white/5 rounded-lg p-3">
              <p className="font-semibold text-gray-100">{user.username}</p>
              <p className="text-sm text-gray-400">Role: {user.role}</p>
              <p className="text-sm text-gray-400">
                Last seen: {new Date(user.last_seen).toLocaleString()}
              </p>
            </div>
          ))}
        </div>
      )}
    </GlowCard>
  );
}

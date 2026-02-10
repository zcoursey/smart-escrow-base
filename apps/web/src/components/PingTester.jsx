import { useEffect, useState } from "react";

export default function PingTester() {
  const API = import.meta.env.VITE_API_URL;
  const [message, setMessage] = useState("");
  const [pings, setPings] = useState([]);
  const [err, setErr] = useState("");

  async function load() {
    setErr("");
    const r = await fetch(`${API}/pings`);
    const d = await r.json();
    if (!d.ok) throw new Error(d.error || "Failed to load");
    setPings(d.pings);
  }

  async function send() {
    setErr("");
    const r = await fetch(`${API}/pings`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message }),
    });
    const d = await r.json();
    if (!d.ok) throw new Error(d.error || "Failed to send");
    setMessage("");
    await load();
  }

  useEffect(() => { load().catch(e => setErr(String(e))); }, []);

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-2">Ping Tester</h2>

      <div className="flex gap-2 mb-3">
        <input
          className="border p-2 rounded w-80"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="type a message"
        />
        <button className="border px-3 rounded" onClick={() => send().catch(e => setErr(String(e)))}>
          Send
        </button>
        <button className="border px-3 rounded" onClick={() => load().catch(e => setErr(String(e)))}>
          Refresh
        </button>
      </div>

      {err && <div className="text-red-600 mb-2">{err}</div>}

      <ul className="list-disc pl-6">
        {pings.map(p => (
          <li key={p.id}>
            {p.message} <span className="text-gray-500">({new Date(p.created_at).toLocaleString()})</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

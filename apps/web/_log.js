import fetch from "node-fetch";

export async function logEvent(contractAddress, body) {
  const API = "https://smart-escrow-base-1.onrender.com";
  const r = await fetch(`${API}/escrows/${contractAddress}/events`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return r.json();
}

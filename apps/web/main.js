import { ethers } from "ethers";

const API = import.meta.env.VITE_API_URL || "https://smart-escrow-base-1.onrender.com";

const ABI = [
  "function realtor() view returns (address)",
  "function contractor() view returns (address)",
  "function escrowAmount() view returns (uint256)",
  "function status() view returns (uint8)",
  "function getBalance() view returns (uint256)",
  "function fund() payable",
  "function approve()",
  "function withdraw()",
  "function refund()",
  "function openDispute()",
  "function agreePayContractor()",
  "function agreeRefundRealtor()"
];

const STATUS = {
  0: "Created",
  1: "Funded",
  2: "Approved",
  3: "Paid (closed)",
  4: "Refunded (closed)",
  5: "Disputed (frozen)"
};

const app = document.getElementById("app");

app.innerHTML = `
  <div style="font-family:system-ui;padding:16px;max-width:900px;margin:0 auto">
    <h1>Smart Escrow Demo</h1>

    <button id="connectBtn">Connect MetaMask</button>
    <div style="margin-top:8px">
      <div><b>Account:</b> <span id="acct">not connected</span></div>
      <div><b>Chain ID:</b> <span id="chain">-</span></div>
    </div>

    <hr/>

    <div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center">
      <input id="addr" style="width:520px;padding:8px" placeholder="Escrow contract address (0x...)" />
      <button id="loadBtn">Load</button>
    </div>

    <div id="info" style="margin-top:12px;line-height:1.6"></div>

    <hr/>
    <h2>Actions</h2>
    <div style="display:flex;gap:8px;flex-wrap:wrap">
      <button id="fundBtn">Fund (realtor)</button>
      <button id="approveBtn">Approve (realtor)</button>
      <button id="withdrawBtn">Withdraw (contractor)</button>
      <button id="refundBtn">Refund (realtor)</button>
      <button id="disputeBtn">Open Dispute</button>
    </div>

    <div id="msg" style="margin-top:12px;color:green"></div>
    <div id="err" style="margin-top:12px;color:crimson"></div>

    <hr/>
    <h2>Neon Event Log</h2>
    <button id="refreshEventsBtn">Refresh Events</button>
    <ul id="events"></ul>
  </div>
`;

const $ = (id) => document.getElementById(id);

let provider, signer, account, chainId, contract, escrowAddress;

async function apiGet(path) {
  const r = await fetch(`${API}${path}`);
  const d = await r.json();
  if (!d.ok) throw new Error(d.error || "API error");
  return d;
}

async function apiPost(path, body) {
  const r = await fetch(`${API}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });
  const d = await r.json();
  if (!d.ok) throw new Error(d.error || "API error");
  return d;
}

function setMsg(t="") { $("msg").textContent = t; }
function setErr(t="") { $("err").textContent = t; }

async function connect() {
  setErr("");
  if (!window.ethereum) return setErr("MetaMask not found.");
  provider = new ethers.BrowserProvider(window.ethereum);
  await provider.send("eth_requestAccounts", []);
  signer = await provider.getSigner();
  account = await signer.getAddress();
  const net = await provider.getNetwork();
  chainId = Number(net.chainId);

  $("acct").textContent = account;
  $("chain").textContent = chainId;
}

async function load() {
  setErr(""); setMsg("");
  escrowAddress = $("addr").value.trim();
  if (!escrowAddress) return setErr("Enter contract address");

  if (!signer) return setErr("Connect MetaMask first");
  contract = new ethers.Contract(escrowAddress, ABI, signer);

  const [r, c, amt, st, bal] = await Promise.all([
    contract.realtor(),
    contract.contractor(),
    contract.escrowAmount(),
    contract.status(),
    contract.getBalance()
  ]);

  $("info").innerHTML = `
    <div><b>Realtor:</b> ${r}</div>
    <div><b>Contractor:</b> ${c}</div>
    <div><b>Escrow Amount (wei):</b> ${amt.toString()}</div>
    <div><b>Balance (wei):</b> ${bal.toString()}</div>
    <div><b>Status:</b> ${Number(st)} — ${STATUS[Number(st)]}</div>
  `;

  // register escrow in Neon
  await apiPost("/escrows", {
    chain_id: chainId,
    contract_address: escrowAddress,
    realtor_address: r,
    contractor_address: c,
    escrow_amount_wei: amt.toString()
  });

  await refreshEvents();
}

async function logEvent(event_name, tx_hash, payload={}) {
  await apiPost(`/escrows/${escrowAddress}/events`, {
    event_name,
    tx_hash,
    actor_address: account,
    payload
  });
}

async function refreshEvents() {
  if (!escrowAddress) return;
  const d = await apiGet(`/escrows/${escrowAddress}/events`);
  const ul = $("events");
  ul.innerHTML = "";
  for (const ev of d.events || []) {
    const li = document.createElement("li");
    li.textContent = `${ev.event_name} — ${ev.tx_hash ? ev.tx_hash.slice(0,10)+"..." : ""} — ${ev.created_at ? new Date(ev.created_at).toLocaleString() : ""}`;
    ul.appendChild(li);
  }
}

async function runTx(label, fn, logName, payload) {
  setErr(""); setMsg("");
  try {
    const tx = await fn();
    setMsg(`${label} submitted: ${tx.hash}`);
    await logEvent(logName, tx.hash, payload || {});
    await tx.wait();
    setMsg(`${label} confirmed`);
    await load();
  } catch (e) {
    setErr(String(e?.reason || e?.message || e));
  }
}

$("connectBtn").onclick = () => connect();
$("loadBtn").onclick = () => load().catch(e => setErr(String(e?.message || e)));

$("refreshEventsBtn").onclick = () => refreshEvents().catch(e => setErr(String(e?.message || e)));

$("fundBtn").onclick = () => runTx("Fund", async () => {
  const amt = await contract.escrowAmount();
  return contract.fund({ value: amt });
}, "Funded", {});

$("approveBtn").onclick = () => runTx("Approve", () => contract.approve(), "Approved", {});
$("withdrawBtn").onclick = () => runTx("Withdraw", () => contract.withdraw(), "Paid", {});
$("refundBtn").onclick = () => runTx("Refund", () => contract.refund(), "Refunded", {});
$("disputeBtn").onclick = () => runTx("OpenDispute", () => contract.openDispute(), "DisputeOpened", {});

"use client";

import { useState, useEffect } from "react";
import { ethers } from "ethers";
import { escrowABI } from "../utils/escrowABI";

const STATUS_MAP = {
    0: "Created",
    1: "Funded",
    2: "Approved",
    3: "Paid",
    4: "Refunded",
    5: "Disputed",
};

export default function EscrowComponent() {
    const [contractAddress, setContractAddress] = useState("");
    const [provider, setProvider] = useState(null);
    const [signer, setSigner] = useState(null);
    const [contract, setContract] = useState(null);
    const [role, setRole] = useState("Viewer"); // Realtor, Contractor, Viewer

    // Contract State
    const [data, setData] = useState({
        realtor: "",
        contractor: "",
        escrowAmount: "0",
        status: 0,
        balance: "0",
    });

    // Photo Upload State
    const [photos, setPhotos] = useState([]);
    const [uploading, setUploading] = useState(false);

    useEffect(() => {
        if (window.ethereum) {
            const newProvider = new ethers.BrowserProvider(window.ethereum);
            setProvider(newProvider);
        }
    }, []);

    const connectWallet = async () => {
        if (!provider) return alert("Please install MetaMask!");
        const accounts = await provider.send("eth_requestAccounts", []);
        const newSigner = await provider.getSigner();
        setSigner(newSigner);
        // Auto-detect role if contract is loaded
        if (contract) checkRole(newSigner, data.realtor, data.contractor);
    };

    const loadContract = async () => {
        if (!contractAddress || !ethers.isAddress(contractAddress)) {
            return alert("Invalid contract address");
        }
        const contractInstance = new ethers.Contract(contractAddress, escrowABI, provider);
        setContract(contractInstance);
        fetchData(contractInstance);
    };

    const fetchData = async (contractInstance) => {
        if (!contractInstance) return;
        try {
            const realtor = await contractInstance.realtor();
            const contractor = await contractInstance.contractor();
            const amount = await contractInstance.escrowAmount();
            const statusRaw = await contractInstance.status();
            const balance = await contractInstance.getBalance();

            const newData = {
                realtor,
                contractor,
                escrowAmount: ethers.formatEther(amount),
                status: Number(statusRaw),
                balance: ethers.formatEther(balance),
            };
            setData(newData);

            if (signer) checkRole(signer, realtor, contractor);
        } catch (error) {
            console.error("Error fetching data:", error);
            alert("Failed to fetch contract data. Check address and network.");
        }
    };

    const checkRole = async (signerObj, realtor, contractor) => {
        const address = await signerObj.getAddress();
        if (address.toLowerCase() === realtor.toLowerCase()) setRole("Realtor");
        else if (address.toLowerCase() === contractor.toLowerCase()) setRole("Contractor");
        else setRole("Viewer");
    };

    // Actions
    const fund = async () => {
        if (!contract || !signer) return;
        try {
            const tx = await contract.connect(signer).fund({ value: ethers.parseEther(data.escrowAmount) });
            await tx.wait();
            fetchData(contract);
            alert("Funded successfully!");
        } catch (e) {
            console.error(e);
            alert(e.message);
        }
    };

    const approve = async () => {
        if (!contract || !signer) return;
        try {
            const tx = await contract.connect(signer).approve();
            await tx.wait();
            fetchData(contract);
            alert("Approved!");
        } catch (e) {
            console.error(e);
            alert(e.message);
        }
    };

    const withdraw = async () => {
        if (!contract || !signer) return;
        try {
            const tx = await contract.connect(signer).withdraw();
            await tx.wait();
            fetchData(contract);
            alert("Withdrawn!");
        } catch (e) {
            console.error(e);
            alert(e.message);
        }
    };

    const refund = async () => {
        if (!contract || !signer) return;
        try {
            const tx = await contract.connect(signer).refund();
            await tx.wait();
            fetchData(contract);
            alert("Refunded!");
        } catch (e) {
            console.error(e);
            alert(e.message);
        }
    };

    const handlePhotoUpload = (e) => {
        const files = Array.from(e.target.files);
        const newPhotos = files.map(file => URL.createObjectURL(file));
        setPhotos([...photos, ...newPhotos]);
    };

    // Mock Data for Demo if no contract
    const loadDemo = () => {
        setData({
            realtor: "0x123...abc",
            contractor: "0x456...def",
            escrowAmount: "1.5",
            status: 1, // Funded
            balance: "1.5",
        });
        setRole("Contractor"); // Demo as contractor
        setContractAddress("0xDemoAddress...");
    };

    return (
        <div className="max-w-4xl mx-auto p-6 space-y-8 bg-black/40 backdrop-blur-md rounded-2xl border border-white/10 shadow-2xl">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                <h2 className="text-3xl font-bold bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent">
                    Escrow Dashboard
                </h2>
                <div className="flex gap-2">
                    {!signer ? (
                        <button
                            onClick={connectWallet}
                            className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 rounded-full font-medium transition-all shadow-[0_0_15px_rgba(79,70,229,0.5)]"
                        >
                            Connect Wallet
                        </button>
                    ) : (
                        <span className="px-4 py-2 bg-green-500/20 text-green-400 rounded-full border border-green-500/30">
                            Wait Connected
                        </span>
                    )}
                    <button onClick={loadDemo} className="text-xs text-white/50 underline">
                        Load Demo
                    </button>
                </div>

            </div>

            {/* Contract Input */}
            <div className="flex gap-2 bg-white/5 p-2 rounded-xl border border-white/10">
                <input
                    type="text"
                    placeholder="Contract Address (0x...)"
                    value={contractAddress}
                    onChange={(e) => setContractAddress(e.target.value)}
                    className="flex-1 bg-transparent border-none outline-none text-white placeholder-white/30 px-2"
                />
                <button
                    onClick={loadContract}
                    className="px-4 py-1.5 bg-white/10 hover:bg-white/20 rounded-lg text-sm transition-colors"
                >
                    Load
                </button>
            </div>

            {/* Status Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 bg-white/5 rounded-xl border border-white/10">
                    <p className="text-sm text-white/50 mb-1">Status</p>
                    <p className="text-2xl font-bold text-white mb-2">{STATUS_MAP[data.status] || "Unknown"}</p>
                    <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-indigo-500 transition-all duration-500"
                            style={{ width: `${(data.status / 5) * 100}%` }}
                        />
                    </div>
                </div>
                <div className="p-4 bg-white/5 rounded-xl border border-white/10">
                    <p className="text-sm text-white/50 mb-1">Escrow Amount</p>
                    <p className="text-2xl font-bold text-emerald-400">{data.escrowAmount} ETH</p>
                </div>
                <div className="p-4 bg-white/5 rounded-xl border border-white/10">
                    <p className="text-sm text-white/50 mb-1">Your Role</p>
                    <p className="text-2xl font-bold text-purple-400">{role}</p>
                </div>
            </div>

            {/* Details Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm bg-white/5 p-4 rounded-xl">
                <div>
                    <span className="text-white/50 block">Realtor Address</span>
                    <span className="font-mono text-white/80">{data.realtor || "---"}</span>
                </div>
                <div>
                    <span className="text-white/50 block">Contractor Address</span>
                    <span className="font-mono text-white/80">{data.contractor || "---"}</span>
                </div>
            </div>

            {/* Photo Upload Section (Contractor) */}
            <div className="space-y-4">
                <h3 className="text-xl font-semibold flex items-center gap-2">
                    <span className="text-2xl">📸</span> Work Evidence
                </h3>

                <div className="border-2 border-dashed border-white/20 rounded-xl p-8 text-center hover:border-indigo-500/50 transition-colors bg-white/5 group">
                    <input
                        type="file"
                        multiple
                        accept="image/*"
                        onChange={handlePhotoUpload}
                        className="hidden"
                        id="photo-upload"
                    />
                    <label htmlFor="photo-upload" className="cursor-pointer block space-y-2">
                        <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center mx-auto group-hover:bg-indigo-500/20 transition-colors">
                            <svg className="w-6 h-6 text-white/70" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>
                        </div>
                        <p className="text-white/70">Click to upload photos of completed work</p>
                        <p className="text-xs text-white/40">Visible to Realtor for approval</p>
                    </label>
                </div>

                {/* Photo Grid */}
                {photos.length > 0 && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                        {photos.map((src, idx) => (
                            <div key={idx} className="relative aspect-square rounded-lg overflow-hidden border border-white/10 group">
                                <img src={src} alt="Evidence" className="w-full h-full object-cover" />
                                <button
                                    onClick={() => setPhotos(photos.filter((_, i) => i !== idx))}
                                    className="absolute top-1 right-1 bg-red-500/80 p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                    <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Actions */}
            <div className="pt-4 border-t border-white/10">
                <h3 className="text-sm text-white/50 mb-3 uppercase tracking-wider font-semibold">Available Actions</h3>
                <div className="flex flex-wrap gap-4">
                    {/* Realtor Actions */}
                    {role === "Realtor" && data.status === 0 && (
                        <button onClick={fund} className="btn-primary bg-emerald-600 hover:bg-emerald-500 py-3 px-8 rounded-xl font-bold shadow-lg shadow-emerald-900/20">
                            💸 Fund Escrow ({data.escrowAmount} ETH)
                        </button>
                    )}
                    {role === "Realtor" && data.status === 1 && (
                        <>
                            <button onClick={approve} className="btn-primary bg-indigo-600 hover:bg-indigo-500 py-3 px-8 rounded-xl font-bold shadow-lg shadow-indigo-900/20">
                                ✅ Approve Work
                            </button>
                            <button onClick={refund} className="px-6 py-3 rounded-xl font-medium border border-white/10 hover:bg-white/5 text-red-400">
                                Refund
                            </button>
                        </>
                    )}

                    {/* Contractor Actions */}
                    {role === "Contractor" && data.status === 2 && (
                        <button onClick={withdraw} className="btn-primary bg-emerald-600 hover:bg-emerald-500 py-3 px-8 rounded-xl font-bold shadow-lg shadow-emerald-900/20 glow">
                            💰 Withdraw Funds
                        </button>
                    )}

                    {/* Dispute - Available to both if Active */}
                    {(data.status === 1 || data.status === 2) && (role === "Realtor" || role === "Contractor") && (
                        <button className="px-6 py-3 rounded-xl font-medium border border-white/10 hover:bg-white/5 text-orange-400 ml-auto">
                            ⚠️ Open Dispute
                        </button>
                    )}

                    {/* Read-only feedback */}
                    {data.status === 3 && <p className="text-emerald-400 font-mono">Contract is Closed (Paid)</p>}
                    {data.status === 4 && <p className="text-red-400 font-mono">Contract is Closed (Refunded)</p>}
                </div>
            </div>
        </div>
    );
}

"use client";

import { useState, useEffect } from "react";
import { ethers } from "ethers";
import { escrowABI, factoryABI } from "../utils/escrowABI";

const STATUS_MAP = {
    0: "Created",
    1: "Funded",
    2: "Approved",
    3: "Paid",
    4: "Refunded",
    5: "Disputed",
};

export default function EscrowComponent() {
    // Factory State
    const [factoryAddress, setFactoryAddress] = useState("");
    const [factoryContract, setFactoryContract] = useState(null);
    const [createdEscrows, setCreatedEscrows] = useState([]);

    // Creation Form State
    const [newAmount, setNewAmount] = useState("");
    const [newLocation, setNewLocation] = useState("");
    const [newDescription, setNewDescription] = useState("");
    const [isCreating, setIsCreating] = useState(false);

    // Existing Escrow State
    const [contractAddress, setContractAddress] = useState("");
    const [provider, setProvider] = useState(null);
    const [signer, setSigner] = useState(null);
    const [contract, setContract] = useState(null);
    const [role, setRole] = useState("Viewer"); // Realtor, Contractor, Viewer

    // Contract Data
    const [data, setData] = useState({
        realtor: "",
        contractor: "",
        escrowAmount: "0",
        status: 0,
        balance: "0",
        workLocation: "",
        description: "",
    });

    // Photo Upload State
    const [photos, setPhotos] = useState([]);

    useEffect(() => {
        if (window.ethereum) {
            const newProvider = new ethers.BrowserProvider(window.ethereum);
            setProvider(newProvider);
        }
    }, []);

    const checkNetwork = async () => {
        if (!window.ethereum) return;
        try {
            const chainId = await window.ethereum.request({ method: 'eth_chainId' });
            if (chainId !== '0x7a69') { // 31337
                try {
                    await window.ethereum.request({
                        method: 'wallet_switchEthereumChain',
                        params: [{ chainId: '0x7a69' }],
                    });
                } catch (switchError) {
                    // This error code indicates that the chain has not been added to MetaMask.
                    if (switchError.code === 4902) {
                        try {
                            await window.ethereum.request({
                                method: 'wallet_addEthereumChain',
                                params: [
                                    {
                                        chainId: '0x7a69',
                                        chainName: 'Localhost 8545',
                                        rpcUrls: ['http://127.0.0.1:8545'],
                                        nativeCurrency: {
                                            name: 'ETH',
                                            symbol: 'ETH',
                                            decimals: 18,
                                        },
                                    },
                                ],
                            });
                        } catch (addError) {
                            console.error(addError);
                        }
                    }
                }
            }
        } catch (error) {
            console.error("Network check failed", error);
        }
    };

    const connectWallet = async () => {
        if (!provider) return alert("Please install MetaMask!");
        try {
            await checkNetwork(); // Force network check
            const accounts = await provider.send("eth_requestAccounts", []);
            const newSigner = await provider.getSigner();
            setSigner(newSigner);

            // If factory is loaded, fetch user's escrows
            if (factoryContract) {
                fetchUserEscrows(factoryContract, newSigner);
            }

            // Auto-detect role if contract is loaded
            if (contract) {
                checkRole(newSigner, data.realtor, data.contractor);
            }
        } catch (err) {
            console.error(err);
            alert("Failed to connect wallet");
        }
    };

    // --- Factory Functions ---

    const loadFactory = async () => {
        if (!factoryAddress || !ethers.isAddress(factoryAddress)) return alert("Invalid Factory Address");
        try {
            const factory = new ethers.Contract(factoryAddress, factoryABI, provider);
            setFactoryContract(factory);

            if (signer) {
                fetchUserEscrows(factory, signer);
            }
        } catch (e) {
            console.error("Error loading factory:", e);
        }
    };

    const fetchUserEscrows = async (factoryCtx, signerCtx) => {
        try {
            const allEscrows = await factoryCtx.getEscrows();
            const userAddress = await signerCtx.getAddress();

            // Filter escrows where user is realtor or contractor
            // For now, list all relevant ones or just all of them for visibility in this demo
            const relevantEscrows = [];

            await Promise.all(allEscrows.map(async (addr) => {
                try {
                    const esc = new ethers.Contract(addr, escrowABI, provider);
                    const r = await esc.realtor();
                    const c = await esc.contractor();

                    // If user is realtor, contractor, OR if contractor is open (address(0))
                    // Ideally we might want to see open jobs too.
                    const isOpen = c === ethers.ZeroAddress;
                    const isParticipant = r.toLowerCase() === userAddress.toLowerCase() || c.toLowerCase() === userAddress.toLowerCase();

                    if (isParticipant || isOpen) {
                        const loc = await esc.workLocation();
                        relevantEscrows.push({
                            address: addr,
                            realtor: r,
                            contractor: c,
                            location: loc,
                            userRole: isParticipant ? (r.toLowerCase() === userAddress.toLowerCase() ? "Realtor" : "Contractor") : "Open"
                        });
                    }
                } catch (e) {
                    console.warn("Failed to fetch escrow data for", addr, e);
                }
            }));

            setCreatedEscrows(relevantEscrows);
        } catch (e) {
            console.error("Error fetching escrows:", e);
        }
    };

    const createEscrow = async () => {
        if (!factoryContract || !signer) return alert("Connect wallet and load factory first");
        if (!newAmount || parseFloat(newAmount) <= 0) return alert("Invalid amount");
        if (!newLocation || !newDescription) return alert("Fill in location and description");

        setIsCreating(true);
        try {
            const amountWei = ethers.parseEther(newAmount);
            // Factory.createEscrow(amount, location, description)
            // Contractor is NOT passed anymore
            const tx = await factoryContract.connect(signer).createEscrow(
                amountWei,
                newLocation,
                newDescription
            );
            await tx.wait();
            alert("Escrow Created Successfully! Waiting for a contractor to accept.");

            // Refresh list
            fetchUserEscrows(factoryContract, signer);

            // Clear form
            setNewAmount("");
            setNewLocation("");
            setNewDescription("");
        } catch (e) {
            console.error(e);
            alert("Creation failed: " + (e.reason || e.message || e));
        } finally {
            setIsCreating(false);
        }
    };

    // --- Escrow Functions ---

    const loadContract = async (addr) => {
        if (!addr || !ethers.isAddress(addr)) return alert("Invalid contract address");
        setContractAddress(addr);

        try {
            const contractInstance = new ethers.Contract(addr, escrowABI, provider);
            setContract(contractInstance);
            // Must pass signer if connected to detect role properly immediately
            if (signer) {
                // Re-connect with signer for actions
                const signedContract = contractInstance.connect(signer);
                setContract(signedContract);
                fetchData(signedContract);
            } else {
                fetchData(contractInstance);
            }
        } catch (e) {
            console.error(e);
            alert("Failed to load contract");
        }
    };

    const fetchData = async (contractInstance) => {
        if (!contractInstance) return;
        try {
            const realtor = await contractInstance.realtor();
            const contractor = await contractInstance.contractor();
            const amount = await contractInstance.escrowAmount();
            const statusRaw = await contractInstance.status();
            const balance = await contractInstance.getBalance();
            const loc = await contractInstance.workLocation();
            const desc = await contractInstance.description();

            const newData = {
                realtor,
                contractor,
                escrowAmount: ethers.formatEther(amount),
                status: Number(statusRaw),
                balance: ethers.formatEther(balance),
                workLocation: loc,
                description: desc
            };
            setData(newData);

            if (signer) checkRole(signer, realtor, contractor);
        } catch (error) {
            console.error("Error fetching data:", error);
            // alert("Failed to fetch contract data.");
        }
    };

    const checkRole = async (signerObj, realtorAddress, contractorAddress) => {
        const address = await signerObj.getAddress();
        const lowerAddr = address.toLowerCase();

        if (lowerAddr === realtorAddress.toLowerCase()) {
            setRole("Realtor");
        } else if (contractorAddress !== ethers.ZeroAddress && lowerAddr === contractorAddress.toLowerCase()) {
            setRole("Contractor");
        } else {
            setRole("Viewer");
        }
    };

    // Actions
    const acceptEscrow = async () => {
        if (!contract || !signer) return;
        try {
            const tx = await contract.accept();
            await tx.wait();
            fetchData(contract);
            // Update role immediately since we are now the contractor
            setRole("Contractor");
            alert("Accepted! You are now the contractor.");
        } catch (e) {
            console.error(e);
            alert(e.reason || e.message);
        }
    };

    const fund = async () => {
        if (!contract || !signer) return;
        if (data.contractor === ethers.ZeroAddress) return alert("Wait for a contractor to accept first.");

        try {
            const tx = await contract.fund({ value: ethers.parseEther(data.escrowAmount) });
            await tx.wait();
            fetchData(contract);
            alert("Funded successfully!");
        } catch (e) {
            console.error(e);
            alert(e.reason || e.message);
        }
    };

    const approve = async () => {
        if (!contract || !signer) return;
        try {
            const tx = await contract.approve();
            await tx.wait();
            fetchData(contract);
            alert("Approved!");
        } catch (e) {
            console.error(e);
            alert(e.reason || e.message);
        }
    };

    const withdraw = async () => {
        if (!contract || !signer) return;
        try {
            const tx = await contract.withdraw();
            await tx.wait();
            fetchData(contract);
            alert("Withdrawn!");
        } catch (e) {
            console.error(e);
            alert(e.reason || e.message);
        }
    };

    const refund = async () => {
        if (!contract || !signer) return;
        try {
            const tx = await contract.refund();
            await tx.wait();
            fetchData(contract);
            alert("Refunded!");
        } catch (e) {
            console.error(e);
            alert(e.reason || e.message);
        }
    };

    const handlePhotoUpload = (e) => {
        const files = Array.from(e.target.files);
        const newPhotos = files.map(file => URL.createObjectURL(file));
        setPhotos([...photos, ...newPhotos]);
    };

    const isContractorSet = data.contractor && data.contractor !== ethers.ZeroAddress;

    return (
        <div className="max-w-6xl mx-auto p-6 space-y-8 bg-black/40 backdrop-blur-md rounded-2xl border border-white/10 shadow-2xl">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                <h2 className="text-3xl font-bold bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent">
                    Escrow Dashboard
                </h2>
                <div className="flex gap-2 items-center">
                    {!signer ? (
                        <button
                            onClick={connectWallet}
                            className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 rounded-full font-medium transition-all shadow-[0_0_15px_rgba(79,70,229,0.5)] text-white"
                        >
                            Connect Wallet
                        </button>
                    ) : (
                        <span className="px-4 py-2 bg-green-500/20 text-green-400 rounded-full border border-green-500/30">
                            Connected
                        </span>
                    )}
                </div>
            </div>

            {/* Factory & Creation Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Left: Create New */}
                <div className="p-6 bg-white/5 rounded-xl border border-white/10 space-y-4">
                    <div className="flex justify-between items-center">
                        <h3 className="text-xl font-semibold text-white">Create New Job</h3>
                        <div className="text-xs text-white/40">Only Realtors</div>
                    </div>

                    {/* Factory Address Input (Temporary for Dev) */}
                    <div className="flex gap-2">
                        <input
                            type="text" placeholder="Factory Address (0x...)"
                            value={factoryAddress} onChange={e => setFactoryAddress(e.target.value)}
                            className="flex-1 bg-black/20 border border-white/10 rounded-lg px-3 py-2 text-white text-sm font-mono"
                        />
                        <button onClick={loadFactory} className="px-3 py-1 bg-white/10 hover:bg-white/20 rounded-lg text-white text-xs">Load</button>
                    </div>

                    <div className="space-y-3">
                        <div className="flex gap-2">
                            <input
                                type="number" placeholder="Amount (ETH)"
                                value={newAmount} onChange={(e) => setNewAmount(e.target.value)}
                                className="w-1/3 bg-black/20 border border-white/10 rounded-lg px-3 py-2 text-white"
                            />
                            <input
                                type="text" placeholder="Work Location"
                                value={newLocation} onChange={(e) => setNewLocation(e.target.value)}
                                className="flex-1 bg-black/20 border border-white/10 rounded-lg px-3 py-2 text-white"
                            />
                        </div>
                        <textarea
                            placeholder="Description of work required..."
                            value={newDescription} onChange={(e) => setNewDescription(e.target.value)}
                            className="w-full bg-black/20 border border-white/10 rounded-lg px-3 py-2 text-white h-24 resize-none"
                        />
                        <button
                            onClick={createEscrow}
                            disabled={isCreating}
                            className="w-full py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 rounded-lg font-bold text-white shadow-lg disabled:opacity-50 transition-all transform hover:scale-[1.02]"
                        >
                            {isCreating ? "Creating..." : "🚀 Post Job (Create Escrow)"}
                        </button>
                    </div>
                </div>

                {/* Right: Escrow List */}
                <div className="p-6 bg-white/5 rounded-xl border border-white/10 flex flex-col h-full">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-xl font-semibold text-white">Find or Manage Jobs</h3>
                        <button onClick={() => factoryContract && signer && fetchUserEscrows(factoryContract, signer)} className="text-xs text-indigo-400 hover:text-indigo-300">Refresh</button>
                    </div>

                    <div className="flex-1 overflow-y-auto space-y-3 max-h-[350px] pr-2 custom-scrollbar">
                        {createdEscrows.length === 0 ? (
                            <p className="text-white/30 text-center py-12 italic">No escrows found. Post a job!</p>
                        ) : (
                            createdEscrows.map((esc, idx) => (
                                <div
                                    key={idx}
                                    onClick={() => loadContract(esc.address)}
                                    className={`p-4 rounded-xl border cursor-pointer transition-all group relative overflow-hidden ${contractAddress === esc.address
                                        ? 'bg-indigo-500/20 border-indigo-500/50 shadow-[0_0_20px_rgba(99,102,241,0.2)]'
                                        : 'bg-black/20 border-white/5 hover:border-white/20 hover:bg-white/5'
                                        }`}
                                >
                                    <div className="flex justify-between items-start mb-2">
                                        <h4 className="font-bold text-white group-hover:text-indigo-300 transition-colors">{esc.location || "Unknown Location"}</h4>
                                        <span className={`text-[10px] px-2 py-1 rounded-full uppercase tracking-wider font-bold ${esc.contractor === ethers.ZeroAddress
                                            ? "bg-green-500/20 text-green-400"
                                            : "bg-blue-500/20 text-blue-400"
                                            }`}>
                                            {esc.contractor === ethers.ZeroAddress ? "Open" : "Taken"}
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center text-xs text-white/50">
                                        <span className="font-mono">{esc.address.slice(0, 6)}...{esc.address.slice(-4)}</span>
                                        <span>{esc.userRole}</span>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>

            {/* Selected Contract View */}
            {contractAddress && (
                <div className="animate-fade-in pt-8 border-t border-white/10">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                        <div>
                            <h2 className="text-3xl font-bold text-white mb-2">Contract Details</h2>
                            <div className="flex items-center gap-2">
                                <span className="font-mono text-sm bg-black/40 px-3 py-1 rounded text-white/50 border border-white/5">{contractAddress}</span>
                                <button
                                    onClick={() => navigator.clipboard.writeText(contractAddress)}
                                    className="p-1 hover:text-white text-white/30 transition-colors"
                                    title="Copy Address"
                                >
                                    📋
                                </button>
                            </div>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="text-right">
                                <p className="text-sm text-white/50 uppercase tracking-widest">Status</p>
                                <p className={`text-2xl font-black ${data.status === 0 ? "text-blue-400" :
                                    data.status === 1 ? "text-yellow-400" :
                                        data.status === 2 ? "text-indigo-400" :
                                            data.status === 3 ? "text-green-400" : "text-red-400"
                                    }`}>
                                    {STATUS_MAP[data.status] || "Unknown"}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                        {/* Info Card */}
                        <div className="col-span-2 p-6 bg-white/5 rounded-2xl border border-white/10 relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 blur-[50px] -z-10 rounded-full pointer-events-none"></div>

                            <h3 className="text-lg font-semibold text-white mb-4">Job Information</h3>

                            <div className="grid grid-cols-2 gap-y-6 gap-x-4">
                                <div>
                                    <p className="text-sm text-white/40 mb-1">Budget</p>
                                    <p className="text-2xl font-bold text-emerald-400">{data.escrowAmount} ETH</p>
                                </div>
                                <div>
                                    <p className="text-sm text-white/40 mb-1">Balance</p>
                                    <p className="text-2xl font-bold text-white">{data.balance} ETH</p>
                                </div>
                                <div className="col-span-2">
                                    <p className="text-sm text-white/40 mb-2">Description</p>
                                    <p className="text-white/90 leading-relaxed bg-black/20 p-4 rounded-lg border border-white/5">
                                        {data.description || "No description provided."}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-sm text-white/40 mb-1">Realtor</p>
                                    <p className="text-sm font-mono text-white/70 truncate">{data.realtor}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-white/40 mb-1">Contractor</p>
                                    <p className={`text-sm font-mono truncate ${!isContractorSet ? "text-yellow-500 italic" : "text-white/70"}`}>
                                        {isContractorSet ? data.contractor : "Waiting for contractor..."}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Actions Card */}
                        <div className="p-6 bg-gradient-to-b from-indigo-900/20 to-black/40 rounded-2xl border border-white/10 flex flex-col">
                            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                                <span>⚡</span> Actions
                            </h3>

                            <div className="flex-1 flex flex-col justify-center space-y-3">
                                {/* Accept Button for Viewers */}
                                {role === "Viewer" && data.status === 0 && !isContractorSet && (
                                    <div className="text-center space-y-2">
                                        <p className="text-sm text-white/60">This job is open!</p>
                                        <button
                                            onClick={acceptEscrow}
                                            className="w-full py-3 bg-blue-600 hover:bg-blue-500 rounded-xl font-bold text-white shadow-lg shadow-blue-900/30 transition-all transform hover:scale-105"
                                        >
                                            🤝 Accept Job
                                        </button>
                                    </div>
                                )}

                                {/* Fund Button for Realtor */}
                                {role === "Realtor" && data.status === 0 && (
                                    <div className="space-y-2">
                                        <button
                                            onClick={fund}
                                            disabled={!isContractorSet}
                                            className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:bg-gray-600 rounded-xl font-bold text-white shadow-lg"
                                        >
                                            {!isContractorSet ? "Waiting for Contractor..." : `💸 Fund (${data.escrowAmount} ETH)`}
                                        </button>
                                        {!isContractorSet && <p className="text-xs text-center text-yellow-500/80">Contractor must accept first</p>}
                                    </div>
                                )}

                                {role === "Realtor" && data.status === 1 && (
                                    <>
                                        <button onClick={approve} className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 rounded-xl font-bold text-white shadow-lg">
                                            ✅ Approve Work
                                        </button>
                                        <button onClick={refund} className="w-full py-2 bg-transparent border border-red-500/30 text-red-400 hover:bg-red-500/10 rounded-xl font-medium">
                                            Request Refund
                                        </button>
                                    </>
                                )}

                                {role === "Contractor" && data.status === 2 && (
                                    <button onClick={withdraw} className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 rounded-xl font-bold text-white shadow-lg animate-pulse">
                                        💰 Withdraw Payment
                                    </button>
                                )}

                                {role === "Viewer" && isContractorSet && <p className="text-center text-white/30 italic">You are viewing this contract</p>}
                            </div>
                        </div>
                    </div>

                    {/* Photo Upload Section (Contractor) */}
                    {role === "Contractor" && (
                        <div className="bg-white/5 p-6 rounded-2xl border border-white/10">
                            <h3 className="text-lg font-semibold flex items-center gap-2 text-white mb-4">
                                <span className="text-xl">📸</span> Work Evidence
                            </h3>

                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
                                {photos.map((src, idx) => (
                                    <div key={idx} className="relative aspect-square rounded-lg overflow-hidden border border-white/10 group">
                                        <img src={src} alt="Evidence" className="w-full h-full object-cover" />
                                    </div>
                                ))}
                                <label className="cursor-pointer aspect-square bg-white/5 hover:bg-indigo-500/10 border-2 border-dashed border-white/10 hover:border-indigo-500/50 rounded-lg flex flex-col items-center justify-center transition-all">
                                    <input type="file" multiple accept="image/*" onChange={handlePhotoUpload} className="hidden" />
                                    <span className="text-2xl mb-1">+</span>
                                    <span className="text-xs text-white/50">Add Photo</span>
                                </label>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

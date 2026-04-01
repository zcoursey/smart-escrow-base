import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { escrowABI } from '../utils/escrowABI';
import GlowCard from './GlowCard';
import ImageViewer from './ImageViewer';

const EscrowPanel = ({ contractAddress, isClient, isWinningContractor, jobBudget, expectedWallet, jobId, dbCompletedPhotos = [], currentDbStatus, onStatusUpdate }) => {

    const [balance, setBalance] = useState("0");
    const [contractStatus, setContractStatus] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [txMessage, setTxMessage] = useState('');

    const [completedPhotos, setCompletedPhotos] = useState([]);
    const [photoError, setPhotoError] = useState('');
    const [isUploading, setIsUploading] = useState(false);
    const [selectedImage, setSelectedImage] = useState(null);

    const API_URL = "https://smart-escrow-base-testing.onrender.com";

    const statusMap = {
        0: "Created (Awaiting Contractor)",
        1: "Accepted (Awaiting Funds)",
        2: "Funded (Work in Progress)",
        3: "Waiting Approval (Pending Client Review)",
        4: "Approved (Ready for Withdrawal)",
        5: "Paid",
        6: "Refunded",
        7: "Disputed"
    };

    const dbStatusMap = {
        0: 'awaiting_contractor',
        1: 'awaiting_funds',
        2: 'funded',
        3: 'waiting_approval',
        4: 'approved',
        5: 'paid',
        6: 'refunded',
        7: 'disputed'
    };

    const getContract = async (withSigner = false) => {
        if (!window.ethereum) throw new Error("Please install MetaMask!");
        const provider = new ethers.BrowserProvider(window.ethereum);
        
        if (withSigner) {
            const signer = await provider.getSigner();
            return new ethers.Contract(contractAddress, escrowABI, signer);
        }
        return new ethers.Contract(contractAddress, escrowABI, provider);
    };

    const fetchContractData = async () => {
        try {
            const contract = await getContract(false); 
            const bal = await contract.getBalance();
            setBalance(ethers.formatEther(bal));
            
            const stat = await contract.status();
            const currentStatNum = Number(stat);
            setContractStatus(currentStatNum);

            // --- NEW: AUTO-SYNC ENGINE ---
            const mappedDbStatus = dbStatusMap[currentStatNum];
            
            // If the blockchain status doesn't match the database status, fix it!
            if (mappedDbStatus && mappedDbStatus !== currentDbStatus) {
                
                // 1. Instantly update the parent UI badge (JobInfoCard)
                if (onStatusUpdate) onStatusUpdate(mappedDbStatus);

                // 2. Silently patch the database in the background so the main Jobs Board stays accurate
                fetch(`${API_URL}/api/jobs/${jobId}/status`, {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ status: mappedDbStatus }),
                    credentials: "include"
                }).catch(err => console.error("Failed to sync DB status", err));
            }
            // -----------------------------

        } catch (err) {
            console.error("Failed to read contract:", err);
        }
    };

    useEffect(() => {
        fetchContractData();

        let contractRef;
        const setupListeners = async () => {
            try {
                contractRef = await getContract(false);
                contractRef.on("Funded", fetchContractData);
                contractRef.on("Accepted", fetchContractData);
                contractRef.on("Approved", fetchContractData);
                contractRef.on("Paid", fetchContractData);
            }
            catch(err) {
                console.error("Could not set up contract listeners:", err);
            }
        };

        setupListeners();

        // Listen for the user manually changing accounts in MetaMask
        const handleAccountsChanged = (accounts) => {
            console.log("MetaMask account changed to:", accounts[0]);
            window.location.reload(); 
        };
        
        if (window.ethereum) {
            window.ethereum.on('accountsChanged', handleAccountsChanged);
        }

        return () => {
            if(contractRef){
                contractRef.removeAllListeners();
            }
            if (window.ethereum) {
                window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
            }
        }
    }, [contractAddress]);

    const handlePhotoChange = (e) => {
        const files = Array.from(e.target.files);
        
        if (files.length > 5) {
            setPhotoError("You can only upload up to 5 photos.");
            return;
        }
        
        setPhotoError("");
        
        const promises = files.map(file => {
            return new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = (event) => resolve(event.target.result);
                reader.onerror = (error) => reject(error);
                reader.readAsDataURL(file);
            });
        });

        Promise.all(promises)
            .then(base64Images => {
                setCompletedPhotos(base64Images);
            })
            .catch(err => {
                setPhotoError("Error reading files. Please try again.");
                console.error(err);
            });
    };

    const validateAccount = async () => {
        if (!expectedWallet) {
            setTxMessage("⚠️ Please go to your Profile and link your wallet address first!");
            return false;
        }

        const provider = new ethers.BrowserProvider(window.ethereum);
        const signer = await provider.getSigner();
        const currentAddress = await signer.getAddress();

        if (currentAddress.toLowerCase() !== expectedWallet.toLowerCase()) {
            setTxMessage(`Requesting MetaMask to switch to account ending in ${expectedWallet.slice(-4)}...`);
            
            try {
                // Force the MetaMask Account Selection Pop-up
                await window.ethereum.request({
                    method: 'wallet_requestPermissions',
                    params: [{ eth_accounts: {} }]
                });

                // Grab the fresh data after they interact with the pop-up
                const newProvider = new ethers.BrowserProvider(window.ethereum);
                const newSigner = await newProvider.getSigner();
                const newAddress = await newSigner.getAddress();

                if (newAddress.toLowerCase() !== expectedWallet.toLowerCase()) {
                    setTxMessage(`❌ Still using the wrong wallet. Please select the correct account.`);
                    return false;
                }
                
                return true; // They successfully switched!
                
            } catch (err) {
                if (err.code === -32002) {
                    setTxMessage("⚠️ MetaMask is waiting! Click the Fox icon in your browser toolbar.");
                } else if (err.code === 4001) {
                    setTxMessage("❌ Wallet switch cancelled.");
                } else {
                    console.error(err);
                }
                return false;
            }
        }
        
        return true;
    };

    const handleTransaction = async (actionName, contractCall) => {
        setIsLoading(true);
        setTxMessage('Verifying correct MetaMask account...');
        
        try {
            // 1. Run the strict manual check
            const isValid = await validateAccount();
            if (!isValid) {
                setIsLoading(false);
                return; // Stop the function completely if wallets don't match
            }

            // 2. If wallets match, proceed with the transaction
            setTxMessage(`Please confirm the ${actionName} transaction in MetaMask...`);
            const tx = await contractCall();
            
            setTxMessage(`Transaction sent! Waiting for confirmation...`);
            await tx.wait();
            
            setTxMessage(`✅ ${actionName} successful!`);
            fetchContractData(); 
        } catch (err) {
            console.error(err);
            if (err.code === 4001 || err.info?.error?.code === 4001) {
                setTxMessage("❌ Transaction rejected by user.");
            } else {
                setTxMessage(`❌ Transaction failed. Check console.`);
            }
        } finally {
            // Only clear the message if it was a success or a user rejection. 
            // If it's a wrong wallet warning, keep it on screen so they can read it!
            setTimeout(() => {
                setTxMessage(prev => prev.includes('Wrong Wallet') ? prev : '');
            }, 5000); 
            setIsLoading(false);
        }
    };

    const fundEscrow = async () => {
        const contract = await getContract(true);
        handleTransaction("Funding Escrow", () => contract.fund({ value: ethers.parseEther(jobBudget.toString()) }));
    };

    const acceptJob = async () => {
        const contract = await getContract(true);
        handleTransaction("Accepting Job", () => contract.accept());
    };

    const requestApproval = async () => {
        if (completedPhotos.length === 0) {
            setPhotoError("Please upload at least one photo of the completed work.");
            return;
        }
        setIsUploading(true);
        setTxMessage('Uploading proof of work to database...');
        
        try {
            // 1. Send photos to your Neon DB backend
            if (completedPhotos.length > 0) {
                const res = await fetch(`${API_URL}/api/jobs/${jobId}/submit-work`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ completed_photos: completedPhotos }),
                    credentials: "include"
                });

                const data = await res.json();
                if (!data.ok) throw new Error(data.error || "Failed to upload photos");
            }

            const contract = await getContract(true);
            handleTransaction("Requesting Approval", () => contract.requestApproval());
        } catch (error) {
            console.error(error);
            setTxMessage(`❌ Error: ${error.message}`);
        } finally {
            setIsUploading(false);
        }
    };

    const approveWork = async () => {
        const contract = await getContract(true);
        handleTransaction("Approving Work", () => contract.approve());
    };

    const withdrawFunds = async () => {
        const contract = await getContract(true);
        handleTransaction("Withdrawing Funds", () => contract.withdraw());
    };

    // We removed the restriction so all users can see the Escrow Panel Information

    return (
        <div className="mt-12 mb-12">
        <GlowCard innerClassName="p-8">
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center justify-between">
                Live Escrow Status
                <span className={`text-sm px-3 py-1 rounded-full text-white border ${contractStatus === 0 ? 'bg-yellow-900/50 border-yellow-500/50' : contractStatus === 1 ? 'bg-blue-900/50 border-blue-500/50' : 'bg-green-900/50 border-green-500/50'}`}>
                    {contractStatus !== null ? statusMap[contractStatus] : "Loading..."}
                </span>
            </h2>

            <div className="grid grid-cols-2 gap-4 mb-6 bg-[#120a2b]/50 p-4 rounded-md border border-white/10">
                <div>
                    <p className="text-xs text-indigo-300 uppercase font-bold tracking-wider">Contract Address</p>
                    <p className="text-sm font-mono text-gray-300 truncate" title={contractAddress}>{contractAddress}</p>
                </div>
                <div>
                    <p className="text-xs text-indigo-300 uppercase font-bold tracking-wider">Current Balance</p>
                    <p className="text-xl font-bold text-green-400">{balance} ETH</p>
                </div>
            </div>

            {txMessage && (
                <div className={`mb-4 p-3 border rounded font-semibold text-center ${txMessage.includes('❌') ? 'bg-red-900/30 text-red-300 border-red-500/30' : 'bg-indigo-900/30 text-indigo-300 border-indigo-500/30'}`}>
                    {txMessage}
                </div>
            )}

            {/* NEW: PHOTO UPLOAD UI FOR CONTRACTOR (Only visible when status is 'Funded') */}
            {isWinningContractor && contractStatus === 2 && (
                <div className="mb-6 p-4 border border-fuchsia-500/30 bg-fuchsia-950/30 rounded-lg">
                    <label className="block text-fuchsia-300 font-bold mb-2">Upload Proof of Completed Work (Max 5)</label>
                    <input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handlePhotoChange}
                        disabled={isUploading || isLoading}
                        className="border border-white/20 bg-white/5 text-gray-300 rounded w-full py-2 px-3 focus:outline-none focus:ring-2 focus:ring-fuchsia-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-fuchsia-600 file:text-white hover:file:bg-fuchsia-700"
                    />
                    
                    {photoError && <p className="text-red-400 text-sm mt-2 font-semibold">{photoError}</p>}

                    {/* Image Previewer */}
                    {completedPhotos.length > 0 && (
                        <div className="grid grid-cols-3 gap-3 mt-4">
                            {completedPhotos.map((photo, index) => (
                                <img
                                    key={index}
                                    src={photo}
                                    alt={`Preview ${index + 1}`}
                                    className="w-full h-24 object-cover rounded-md border border-fuchsia-500/50 shadow-sm cursor-pointer hover:opacity-80 transition-opacity"
                                    onClick={() => setSelectedImage(photo)}
                                />
                            ))}
                        </div>
                    )}
                </div>
            )}

            {dbCompletedPhotos && dbCompletedPhotos.length > 0 && contractStatus >= 3 && (
                <div className="mb-6 p-5 border border-indigo-500/30 bg-indigo-950/30 rounded-lg">
                    <h3 className="text-lg font-bold text-indigo-300 mb-3 flex items-center gap-2">
                        📸 Proof of Completed Work
                    </h3>
                    
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {dbCompletedPhotos.map((photo, index) => (
                            <img
                                key={index}
                                src={photo}
                                alt={`Completed Work ${index + 1}`}
                                className="w-full h-32 object-cover rounded-md border-2 border-indigo-400/50 shadow-sm hover:scale-105 transition-transform cursor-pointer"
                                onClick={() => setSelectedImage(photo)}
                            />
                        ))}
                    </div>

                    {isClient && contractStatus === 3 && (
                        <p className="mt-4 text-sm text-indigo-200 font-semibold bg-indigo-900/50 p-3 rounded border border-indigo-500/50">
                            Please review the photos above. If the work meets your expectations, click "Approve Work" below to release the funds to the contractor.
                        </p>
                    )}
                </div>
            )}

            {/* CLIENT CONTROLS */}
            {isClient && (
                <div className="flex gap-4">
                    <button 
                        onClick={fundEscrow} 
                        disabled={isLoading || contractStatus !== 1}
                        className="flex-1 bg-blue-600 text-white font-bold py-3 px-4 rounded hover:bg-blue-700 disabled:opacity-50 transition"
                    >
                        1. Fund Escrow
                    </button>
                    <button 
                        onClick={approveWork} 
                        disabled={isLoading || contractStatus !== 3}
                        className="flex-1 bg-green-600 text-white font-bold py-3 px-4 rounded hover:bg-green-700 disabled:opacity-50 transition"
                    >
                        2. Approve Work
                    </button>
                </div>
            )}

            {/* CONTRACTOR CONTROLS */}
            {isWinningContractor && (
                <div className="flex gap-4">
                    <button 
                        onClick={acceptJob} 
                        disabled={isLoading || contractStatus !== 0} 
                        className="flex-1 bg-indigo-600 text-white font-bold py-3 px-4 rounded hover:bg-indigo-700 disabled:opacity-50 transition"
                    >
                        1. Sign & Accept
                    </button>
                    <button 
                        onClick={requestApproval} 
                        disabled={isLoading || contractStatus !== 2} 
                        className="flex-1 bg-yellow-500 text-white font-bold py-3 px-4 rounded hover:bg-yellow-600 disabled:opacity-50 transition"
                    >
                        2. Request Approval
                    </button>
                    <button 
                        onClick={withdrawFunds} 
                        disabled={isLoading || contractStatus !== 4} 
                        className="flex-1 bg-green-600 text-white font-bold py-3 px-4 rounded hover:bg-green-700 disabled:opacity-50 transition"
                    >
                        3. Withdraw Funds
                    </button>
                </div>
            )}

            {selectedImage && (
                <ImageViewer photo={selectedImage} onClose={() => setSelectedImage(null)} />
            )}
        </GlowCard>
        </div>
    );
};

export default EscrowPanel;
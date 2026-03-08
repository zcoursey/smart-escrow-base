import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { escrowABI } from '../utils/escrowABI';

const EscrowPanel = ({ contractAddress, isClient, isWinningContractor, jobBudget, expectedWallet }) => {
    const [balance, setBalance] = useState("0");
    const [contractStatus, setContractStatus] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [txMessage, setTxMessage] = useState('');

    const statusMap = {
        0: "Created (Awaiting Contractor)",
        1: "Accepted (Awaiting Funds)",
        2: "Funded (Work in Progress)",
        3: "Approved (Ready for Withdrawal)",
        4: "Paid",
        5: "Refunded",
        6: "Disputed"
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
            setContractStatus(Number(stat));
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

    const approveWork = async () => {
        const contract = await getContract(true);
        handleTransaction("Approving Work", () => contract.approve());
    };

    const withdrawFunds = async () => {
        const contract = await getContract(true);
        handleTransaction("Withdrawing Funds", () => contract.withdraw());
    };

    if (!isClient && !isWinningContractor) return null;

    return (
        <div className="bg-white rounded-lg shadow-md p-8 mt-8 border-2 border-indigo-500">
            <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center justify-between">
                Live Escrow Status
                <span className={`text-sm px-3 py-1 rounded-full text-white ${contractStatus === 0 ? 'bg-yellow-500' : contractStatus === 1 ? 'bg-blue-500' : 'bg-green-500'}`}>
                    {contractStatus !== null ? statusMap[contractStatus] : "Loading..."}
                </span>
            </h2>

            <div className="grid grid-cols-2 gap-4 mb-6 bg-gray-50 p-4 rounded-md border border-gray-200">
                <div>
                    <p className="text-xs text-gray-500 uppercase font-bold tracking-wider">Contract Address</p>
                    <p className="text-sm font-mono text-gray-700 truncate" title={contractAddress}>{contractAddress}</p>
                </div>
                <div>
                    <p className="text-xs text-gray-500 uppercase font-bold tracking-wider">Current Balance</p>
                    <p className="text-xl font-bold text-green-600">{balance} ETH</p>
                </div>
            </div>

            {txMessage && (
                <div className={`mb-4 p-3 border rounded font-semibold text-center ${txMessage.includes('❌') ? 'bg-red-50 text-red-800 border-red-200' : 'bg-indigo-50 text-indigo-800 border-indigo-200'}`}>
                    {txMessage}
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
                        disabled={isLoading || contractStatus !== 2}
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
                        onClick={withdrawFunds} 
                        disabled={isLoading || contractStatus !== 3} 
                        className="flex-1 bg-green-600 text-white font-bold py-3 px-4 rounded hover:bg-green-700 disabled:opacity-50 transition"
                    >
                        2. Withdraw Funds
                    </button>
                </div>
            )}
        </div>
    );
};

export default EscrowPanel;
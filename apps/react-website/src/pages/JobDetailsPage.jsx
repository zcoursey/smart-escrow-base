import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ethers } from 'ethers';
import { FACTORY_ABI } from '../utils/factoryABI'; 
import JobInfoCard from '../components/JobInfoCard';
import ApplicantsList from '../components/ApplicantsList';

const FACTORY_ADDRESS = "0x5F9cC89350A4aEF28F29B456B09577321cbcBdB0";

const JobDetailsPage = ({ user }) => {
    const { id } = useParams(); 
    const navigate = useNavigate();
    
    const [job, setJob] = useState(null);
    const [applications, setApplications] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [applyStatus, setApplyStatus] = useState({ loading: false, message: '', type: '' });

    const API_URL = "https://smart-escrow-base-testing.onrender.com";

    // 1. Fetch Job and Applications on Load
    useEffect(() => {
        const fetchJobDetails = async () => {
            try {
                const res = await fetch(`${API_URL}/api/jobs/${id}`);
                const data = await res.json();

                if (data.ok) {
                    setJob(data.job);
                    setApplications(data.applications || []);
                } else {
                    setError(data.error || "Failed to fetch job.");
                }
            } catch (err) {
                setError("Network error. Could not load job details.");
            } finally {
                setIsLoading(false);
            }
        };

        fetchJobDetails();
    }, [id]);

    // 2. Handle Contractor Applying
    const handleApply = async () => {
        if (!user) {
            navigate('/login');
            return;
        }

        setApplyStatus({ loading: true, message: '', type: '' });

        try {
            const res = await fetch(`${API_URL}/api/jobs/${id}/apply`, {
                method: "POST",
                credentials: "include" // Must send the secure cookie!
            });
            const data = await res.json();

            if (data.ok) {
                setApplyStatus({ loading: false, message: 'Application submitted successfully!', type: 'success' });
                // Optimistically update the UI to show they applied
                setApplications([...applications, { contractor_id: user.id, status: 'pending', username: user.username }]);
            } else {
                throw new Error(data.error || "Failed to apply.");
            }
        } catch (err) {
            setApplyStatus({ loading: false, message: err.message, type: 'error' });
        }
    };

    const handleAcceptContractor = async (application) => {
        try {
            if (!window.ethereum) {
                alert("Please install MetaMask to deploy the escrow!");
                return;
            }
            const targetChainId = '0x14a34'; // This is 84532 (Base Sepolia) in Hexadecimal
            const currentChainId = await window.ethereum.request({ method: 'eth_chainId' });
            
            if (currentChainId !== targetChainId) {
                console.log("Wrong network detected. Prompting switch to Base Sepolia...");
                try {
                    await window.ethereum.request({
                        method: 'wallet_switchEthereumChain',
                        params: [{ chainId: targetChainId }],
                    });
                } catch (switchError) {
                    // This error code means the user doesn't have Base Sepolia added to their wallet yet
                    if (switchError.code === 4902) {
                        alert("Please add the Base Sepolia network to MetaMask first!");
                    } else {
                        console.error("User rejected network switch:", switchError);
                    }
                    return; // Stop the function if they don't switch
                }
            }
            // 1. Prompt MetaMask to connect
            const provider = new ethers.BrowserProvider(window.ethereum, "any");
            provider.pollingInterval=15000;

            const signer = await provider.getSigner();

            // 2. Connect to your live Factory Contract
            const factoryContract = new ethers.Contract(FACTORY_ADDRESS, FACTORY_ABI, signer);

            console.log("Waiting for user to sign the transaction...");

            console.log("Budget string:", job.budget);

            // 3. Format the data (Convert ETH budget to Wei)
            const budgetInWei = ethers.parseEther(job.budget.toString());
            const location = job.location || "Remote";
            
            console.log("Sending to contract:", { budgetInWei, location, desc: job.description });

            // 4. Send the transaction to the blockchain!
            const tx = await factoryContract.createEscrow(
                budgetInWei,
                location,
                job.description
            );

            console.log("Transaction sent! Hash:", tx.hash);
            alert("Transaction submitted! Waiting for the blockchain to confirm...");

            // 5. Wait for the block to be mined
            const receipt = await tx.wait();
            console.log("✅ Escrow successfully deployed!", receipt);
            
            alert("Smart Contract Deployed Successfully!");

            let deployedEscrowAddress = null;
            for (const log of receipt.logs) {
                try {
                    const parsedLog = factoryContract.interface.parseLog(log);
                    if (parsedLog && parsedLog.name === 'EscrowCreated') {
                        deployedEscrowAddress = parsedLog.args[0]; // Grabs the first argument: escrowAddress
                        break;
                    }
                } catch (e) {
                    // Ignore logs from other contracts
                }
            }

            console.log("✅ New Escrow Address:", deployedEscrowAddress);

            // --- NEW: TELL THE BACKEND TO UPDATE THE DATABASE ---
            const acceptRes = await fetch(`${API_URL}/api/applications/${application.id}/accept`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ escrow_address: deployedEscrowAddress }),
                credentials: "include"
            });

            const acceptData = await acceptRes.json();

            if (acceptData.ok) {
                alert("Success! Escrow deployed and contractor accepted.");
                
                // Update the UI instantly without needing a page refresh!
                setApplications(prevApps => 
                    prevApps.map(app => app.id === application.id ? { ...app, status: 'accepted' } : app)
                );
                setJob({ ...job, status: 'in_progress' });
            } else {
                throw new Error(acceptData.error || "Failed to update database.");
            }

        } catch (error) {
            console.error("Contract deployment failed:", error);
            alert("Transaction failed. Did you reject it in MetaMask?");
        }
    };

   if (isLoading) return <div className="text-center py-20 text-xl font-bold">Loading Job Details...</div>;
    if (error) return <div className="text-center py-20 text-xl font-bold text-red-600">{error}</div>;
    if (!job) return <div className="text-center py-20 text-xl font-bold">Job not found.</div>;

    const isMyJob = user && user.id === job.client_id;
    const hasApplied = user && applications.some(app => app.contractor_id === user.id);

    return (
        <section className="bg-indigo-50 min-h-screen py-10">
            <div className="container mx-auto px-4 max-w-4xl">
                
                <JobInfoCard 
                    job={job} 
                    isMyJob={isMyJob} 
                    hasApplied={hasApplied} 
                    applyStatus={applyStatus} 
                    handleApply={handleApply} 
                />

                {isMyJob && (
                    <ApplicantsList 
                        applications={applications} 
                        handleAcceptContractor={handleAcceptContractor} 
                    />
                )}

            </div>
        </section>
    );
};

export default JobDetailsPage;
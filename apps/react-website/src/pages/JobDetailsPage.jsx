import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ethers } from 'ethers';
import { FACTORY_ABI } from '../utils/factoryABI';
import JobInfoCard from '../components/JobInfoCard';
import ApplicantsList from '../components/ApplicantsList';
import EscrowPanel from '../components/EscrowPanel';

// Connected to the newly deployed EscrowFactory featuring WaitingApproval status!
const FACTORY_ADDRESS = "0xdE8db71b62f763772521Fb670c84bB2d1e964465";

const JobDetailsPage = ({ user }) => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [expectedWallet, setExpectedWallet] = useState(null);
  const [job, setJob] = useState(null);
  const [applications, setApplications] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [applyStatus, setApplyStatus] = useState({ loading: false, message: '', type: '' });

  const API_URL = "https://smart-escrow-base-testing.onrender.com";

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

    if (user) {
      const fetchProfile = async () => {
        try {
          const res = await fetch(`${API_URL}/api/users/profile`, {
            credentials: "include"
          });
          const data = await res.json();
          if (data.ok && data.profile) {
            setExpectedWallet(data.profile.wallet_address);
          }
        } catch (err) {
          console.error("Failed to fetch profile for wallet check", err);
        }
      };
      fetchProfile();
    }
  }, [id, user]);

  const handleApply = async () => {
    if (!user) {
      navigate('/login');
      return;
    }

    setApplyStatus({ loading: true, message: '', type: '' });

    try {
      const res = await fetch(`${API_URL}/api/jobs/${id}/apply`, {
        method: "POST",
        credentials: "include"
      });
      const data = await res.json();

      if (data.ok) {
        setApplyStatus({
          loading: false,
          message: 'Application submitted successfully!',
          type: 'success'
        });

        setApplications([
          ...applications,
          { contractor_id: user.id, status: 'pending', username: user.username }
        ]);
      } else {
        throw new Error(data.error || "Failed to apply.");
      }
    } catch (err) {
      setApplyStatus({
        loading: false,
        message: err.message,
        type: 'error'
      });
    }
  };

  const handleAcceptContractor = async (application) => {
    try {
      if (!window.ethereum) {
        alert("Please install MetaMask to deploy the escrow!");
        return;
      }

      const targetChainId = '0x14a34';
      const currentChainId = await window.ethereum.request({ method: 'eth_chainId' });

      if (currentChainId !== targetChainId) {
        try {
          await window.ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: targetChainId }],
          });
        } catch (switchError) {
          if (switchError.code === 4902) {
            alert("Please add the Base Sepolia network to MetaMask first!");
          } else {
            console.error("User rejected network switch:", switchError);
          }
          return;
        }
      }

      const provider = new ethers.BrowserProvider(window.ethereum, "any");
      provider.pollingInterval = 15000;
      const signer = await provider.getSigner();
      const currentAddress = await signer.getAddress();

      if (!expectedWallet) {
        alert("⚠️ Please go to your Profile and link your Client wallet address before accepting a contractor!");
        return;
      }

      let finalAddress = currentAddress;

      if (currentAddress.toLowerCase() !== expectedWallet.toLowerCase()) {
        const wantsToSwitch = window.confirm(
          `🚨 WRONG WALLET ACTIVE 🚨\n\nExpected: ${expectedWallet}\nActive: ${currentAddress}\n\nClick OK to open MetaMask and select the correct account.`
        );

        if (!wantsToSwitch) return;

        try {
          await window.ethereum.request({
            method: 'wallet_requestPermissions',
            params: [{ eth_accounts: {} }]
          });

          const newProvider = new ethers.BrowserProvider(window.ethereum);
          const newSigner = await newProvider.getSigner();
          finalAddress = await newSigner.getAddress();

          if (finalAddress.toLowerCase() !== expectedWallet.toLowerCase()) {
            alert("The selected account still does not match your profile. Transaction cancelled.");
            return;
          }
        } catch (err) {
          if (err.code === -32002) {
            alert("MetaMask is already waiting for you! Please click the Fox icon in your browser toolbar to select your account.");
          } else {
            console.error("MetaMask prompt error:", err);
          }
          return;
        }
      }

      const factoryContract = new ethers.Contract(FACTORY_ADDRESS, FACTORY_ABI, signer);
      const budgetInWei = ethers.parseEther(job.budget.toString());
      const location = job.location || "Remote";

      const tx = await factoryContract.createEscrow(
        budgetInWei,
        location,
        job.description
      );

      alert("Transaction submitted! Waiting for the blockchain to confirm...");
      const receipt = await tx.wait();
      alert("Smart Contract Deployed Successfully!");

      let deployedEscrowAddress = null;
      for (const log of receipt.logs) {
        try {
          const parsedLog = factoryContract.interface.parseLog(log);
          if (parsedLog && parsedLog.name === 'EscrowCreated') {
            deployedEscrowAddress = parsedLog.args[0];
            break;
          }
        } catch (e) {}
      }

      const acceptRes = await fetch(`${API_URL}/api/applications/${application.id}/accept`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ escrow_address: deployedEscrowAddress }),
        credentials: "include"
      });

      const acceptData = await acceptRes.json();

      if (acceptData.ok) {
        alert("Success! Escrow deployed and contractor accepted.");

        setJob(prevJob => ({
          ...prevJob,
          status: 'in_progress',
          contract_address: deployedEscrowAddress
        }));

        setApplications(prevApps =>
          prevApps.map(app =>
            app.id === application.id
              ? { ...app, status: 'accepted' }
              : { ...app, status: 'rejected' }
          )
        );
      } else {
        throw new Error(acceptData.error || "Failed to update database.");
      }
    } catch (error) {
      console.error("Contract deployment or DB update failed:", error);
      alert(error.message || "Transaction failed. Did you reject it in MetaMask?");
    }
  };

  if (isLoading) {
    return <div className="text-center py-20 text-xl font-bold">Loading Job Details...</div>;
  }

  if (error) {
    return <div className="text-center py-20 text-xl font-bold text-red-600">{error}</div>;
  }

  if (!job) {
    return <div className="text-center py-20 text-xl font-bold">Job not found.</div>;
  }

  const isMyJob = user && user.id === job.client_id;
  const hasApplied = user && applications.some(app => app.contractor_id === user.id);
  const isWinningContractor =
    user && applications.some(app => app.contractor_id === user.id && app.status === 'accepted');

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

        {job.photos && job.photos.length > 0 && (
          <div className="bg-white rounded-xl shadow-md p-6 mb-6">
            <h3 className="text-2xl font-bold mb-4">Job Photos</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {job.photos.map((photo, index) => (
                <img
                  key={index}
                  src={photo}
                  alt={`Job photo ${index + 1}`}
                  className="w-full h-48 object-cover rounded-lg border"
                />
              ))}
            </div>
          </div>
        )}

        {job.contract_address && (
          <EscrowPanel
            contractAddress={job.contract_address}
            isClient={isMyJob}
            isWinningContractor={isWinningContractor}
            jobBudget={job.budget}
            expectedWallet={expectedWallet}
          />
        )}

        {isMyJob && (
          <ApplicantsList
            applications={applications}
            jobStatus={job.status}
            handleAcceptContractor={handleAcceptContractor}
          />
        )}
      </div>
    </section>
  );
};

export default JobDetailsPage;

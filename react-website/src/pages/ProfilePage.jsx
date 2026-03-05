import { useState, useEffect } from 'react';
import ProfileHeader from '../components/ProfileHeader';
import ClientDashboard from '../components/ClientDashboard';
import ContractorDashboard from '../components/ContractorDashboard';

const ProfilePage = ({ user, signerAddress, connectWallet }) => {
    const [profile, setProfile] = useState(null);
    const [myJobs, setMyJobs] = useState([]);
    const [myApplications, setMyApplications] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [message, setMessage] = useState({ type: '', text: '' });

    const API_URL = "https://smart-escrow-base-testing.onrender.com/api/users/profile";

    // Fetch Data
    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                const profileRes = await fetch(API_URL, { credentials: "include" });
                const profileData = await profileRes.json();
                
                if (profileData.ok) {
                    const p = profileData.profile;
                    setProfile(p);

                    if (p.role === 'client') {
                        const jobsRes = await fetch("https://smart-escrow-base-testing.onrender.com/api/users/me/jobs", {credentials:"include"});
                        const jobsData = await jobsRes.json();
                        if (jobsData.ok) setMyJobs(jobsData.jobs);
                    } else {
                        const appsRes = await fetch("https://smart-escrow-base-testing.onrender.com/api/users/me/applications", {credentials: "include"});
                        const appsData = await appsRes.json();
                        if(appsData.ok) setMyApplications(appsData.applications);
                    }
                }
            } catch (err) {
                console.error("Failed to fetch dashboard", err);
            } finally {
                setIsLoading(false);
            }
        };

        if (user) fetchDashboardData();
    }, [user]);

    // Save Data (Passed down to ProfileHeader)
    const handleSaveProfile = async (updates) => {
        setMessage({ type: '', text: '' });
        try {
            const res = await fetch(API_URL, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(updates),
                credentials: "include"
            });
            
            const data = await res.json();
            if (data.ok) {
                setProfile(data.profile);
                setMessage({ type: 'success', text: 'Profile updated successfully!' });
                
                // Refresh if role changed to load the new dashboard
                if (updates.role && updates.role !== profile.role) {
                    window.location.reload(); 
                }
            } else {
                throw new Error(data.error);
            }
        } catch (err) {
            setMessage({ type: 'error', text: err.message || "Failed to update profile." });
        }
    };

    if (isLoading) return <div className="text-center py-20 text-xl font-semibold">Loading profile...</div>;
    if (!user) return <div className="text-center py-20 text-xl font-bold text-red-600">Please log in to view your profile.</div>;

    const isClient = profile?.role === 'client';

    return (
        <section className="bg-indigo-50 min-h-screen py-10">
            <div className="container mx-auto px-4 max-w-4xl">
                
                {message.text && (
                    <div className={`p-4 mb-6 rounded text-center font-bold ${message.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {message.text}
                    </div>
                )}

                {/* 1. Header Component */}
                <ProfileHeader 
                    user={user} 
                    profile={profile} 
                    signerAddress={signerAddress} 
                    connectWallet={connectWallet}
                    onSaveProfile={handleSaveProfile} 
                />

                {/* 2. Dashboard Component */}
                <div className="w-full">
                    {isClient ? (
                        <ClientDashboard jobs={myJobs} />
                    ) : (
                        <ContractorDashboard applications={myApplications} />
                    )}
                </div>

            </div>
        </section>
    );
};

export default ProfilePage;
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



    const API_BASE = "https://smart-escrow-base-testing.onrender.com";
    const PROFILE_URL = `${API_BASE}/api/users/profile`;

    // Fetch dashboard data
    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                const profileRes = await fetch(PROFILE_URL, { credentials: "include" });
                const profileData = await profileRes.json();
                
                if (profileData.ok) {
                    const p = profileData.profile;
                    setProfile(p);

                    if (p.role === 'client') {
                        const jobsRes = await fetch(`${API_BASE}/api/users/me/jobs`, { credentials:"include" });
                        const jobsData = await jobsRes.json();
                        if (jobsData.ok) setMyJobs(jobsData.jobs);
                    } else {
                        const appsRes = await fetch(`${API_BASE}/api/users/me/applications`, { credentials:"include" });
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

    // Save profile updates
    const handleSaveProfile = async (updates) => {
        setMessage({ type: '', text: '' });

        try {
            const res = await fetch(PROFILE_URL, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(updates),
                credentials: "include"
            });
            
            const data = await res.json();

            if (data.ok) {
                setProfile(prev => ({ ...prev, ...data.profile }));
                setMessage({ type: 'success', text: 'Profile updated successfully!' });
            } else {
                throw new Error(data.error);
            }
        } catch (err) {
            setMessage({ type: 'error', text: err.message || "Failed to update profile." });
        }
    };



    if (isLoading) {
        return (
            <div className="text-center py-20 text-xl font-semibold text-white bg-white/5 rounded-xl shadow-md mx-4 my-10 border border-white/10">
                Loading profile...
            </div>
        );
    }

    if (!user) {
        return (
            <div className="text-center py-20 text-xl font-bold text-red-500 bg-white/5 rounded-xl shadow-md mx-4 my-10 border border-white/10">
                Please log in to view your profile.
            </div>
        );
    }

    const isClient = profile?.role === 'client';

    return (
        <section className="bg-transparent min-h-screen py-10">
            <div className="container mx-auto px-4 max-w-4xl">

                {message.text && (
                    <div className={`p-4 mb-6 rounded text-center font-bold ${
                        message.type === 'success'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-red-100 text-red-700'
                    }`}>
                        {message.text}
                    </div>
                )}

                {/* Profile Header */}
                <ProfileHeader 
                    user={user}
                    profile={profile}
                    signerAddress={signerAddress}
                    connectWallet={connectWallet}
                    onSaveProfile={handleSaveProfile}
                />



                {/* Dashboard */}
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

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

    const [authStatus, setAuthStatus] = useState('');
    const [authUser, setAuthUser] = useState(null);
    const [authLoading, setAuthLoading] = useState(false);

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

    // Authentication check
    const handleCheckAuthentication = async () => {
        setAuthLoading(true);
        setAuthStatus('');
        setAuthUser(null);

        try {
            const res = await fetch(`${API_BASE}/auth/debug`, {
                credentials: "include"
            });

            const data = await res.json();

            if (data.ok) {
                setAuthStatus('authenticated');
                setAuthUser(data.database_user);
            } else {
                setAuthStatus('not-authenticated');
            }
        } catch (err) {
            setAuthStatus('error');
        } finally {
            setAuthLoading(false);
        }
    };

    if (isLoading) {
        return (
            <div className="text-center py-20 text-xl font-semibold">
                Loading profile...
            </div>
        );
    }

    if (!user) {
        return (
            <div className="text-center py-20 text-xl font-bold text-red-600">
                Please log in to view your profile.
            </div>
        );
    }

    const isClient = profile?.role === 'client';

    return (
        <section className="bg-indigo-50 min-h-screen py-10">
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

                {/* Authentication Card */}
                <div className="bg-white shadow-md rounded-lg p-6 mb-6 border">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">

                        <div>
                            <h2 className="text-xl font-bold text-gray-800">
                                Authentication Status
                            </h2>
                            <p className="text-gray-600 text-sm mt-1">
                                Verify your session, JWT, and logged-in user data.
                            </p>
                        </div>

                        <button
                            onClick={handleCheckAuthentication}
                            disabled={authLoading}
                            className="bg-indigo-500 hover:bg-indigo-600 text-white font-semibold px-5 py-2 rounded disabled:opacity-50"
                        >
                            {authLoading ? "Checking..." : "Check Authentication"}
                        </button>

                    </div>

                    {authStatus === 'authenticated' && authUser && (
                        <div className="mt-4 p-4 rounded bg-green-50 border border-green-200">

                            <p className="text-green-700 font-semibold mb-2">
                                ✅ Authenticated
                            </p>

                            <div className="grid grid-cols-2 gap-2 text-sm text-gray-700">
                                <p><strong>Username:</strong></p>
                                <p>{authUser.username}</p>

                                <p><strong>Role:</strong></p>
                                <p>{authUser.role}</p>

                                <p><strong>Wallet:</strong></p>
                                <p>{authUser.wallet || "Not connected"}</p>

                                <p><strong>Bio:</strong></p>
                                <p>{authUser.bio || "No bio added yet"}</p>
                            </div>

                        </div>
                    )}

                    {authStatus === 'not-authenticated' && (
                        <div className="mt-4 p-3 rounded bg-red-100 text-red-700 font-semibold">
                            ❌ Not authenticated
                        </div>
                    )}

                    {authStatus === 'error' && (
                        <div className="mt-4 p-3 rounded bg-yellow-100 text-yellow-700 font-semibold">
                            ⚠️ Could not reach backend
                        </div>
                    )}

                </div>

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

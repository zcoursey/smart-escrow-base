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

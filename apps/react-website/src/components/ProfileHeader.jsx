import { useState } from 'react';

const ProfileHeader = ({ user, profile, signerAddress, connectWallet, onSaveProfile }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [editBio, setEditBio] = useState(profile?.bio || "");
    const [editRole, setEditRole] = useState(profile?.role || "contractor");

    const handleSave = () => {
        onSaveProfile({ ...profile, bio: editBio, role: editRole });
        setIsEditing(false);
    };

    const handleLinkWallet = () => {
        if (!signerAddress) {
            alert("Please connect MetaMask first using the Navbar.");
            return;
        }
        onSaveProfile({ ...profile, wallet_address: signerAddress });
    };

    const isClient = profile?.role === 'client';

    return (
        <div className="bg-white rounded-lg shadow-md p-8 mb-8 flex flex-col md:flex-row items-center md:items-start gap-8 border border-gray-200">
            {/* Avatar */}
            <div className="w-32 h-32 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-500 text-5xl font-bold uppercase border-4 border-indigo-50 shadow-sm flex-shrink-0">
                {user.username.charAt(0)}
            </div>

            <div className="flex-grow w-full">
                <div className="flex justify-between items-start mb-4">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-800">@{user.username}</h1>
                        <span className={`inline-block mt-2 px-3 py-1 rounded-full text-sm font-bold uppercase tracking-wide ${isClient ? 'bg-blue-100 text-blue-800' : 'bg-orange-100 text-orange-800'}`}>
                            {profile?.role || 'Contractor'}
                        </span>
                    </div>
                    
                    {!isEditing && (
                        <button onClick={() => setIsEditing(true)} className="text-indigo-600 hover:text-indigo-800 font-semibold text-sm bg-indigo-50 px-4 py-2 rounded-md transition-colors">
                            Edit Profile
                        </button>
                    )}
                </div>

                {/* Edit Form */}
                {isEditing ? (
                    <div className="mt-4 bg-gray-50 p-4 rounded border border-gray-200">
                        <label className="block text-sm font-bold text-gray-700 mb-1">Bio</label>
                        <textarea 
                            className="w-full border border-gray-300 rounded-md p-3 focus:outline-none focus:border-indigo-500 min-h-[100px]"
                            value={editBio}
                            onChange={(e) => setEditBio(e.target.value)}
                        />
                        <div className="flex gap-2 mt-3">
                            <button onClick={handleSave} className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700 transition">Save Changes</button>
                            <button onClick={() => setIsEditing(false)} className="bg-gray-200 text-gray-800 px-4 py-2 rounded hover:bg-gray-300 transition">Cancel</button>
                        </div>
                    </div>
                ) : (
                    <p className="text-gray-600 mt-2 text-lg whitespace-pre-wrap">{profile?.bio}</p>
                )}

                {/* Wallet Integration Section */}
                <div className="mt-8 p-4 bg-slate-50 border border-slate-200 rounded-lg">
                    <h3 className="font-bold text-slate-700 mb-2">Web3 Identity</h3>
                    {profile?.wallet_address ? (
                        <div className="flex items-center text-green-700 font-mono text-sm break-all">
                            <span className="mr-2">✅</span> Linked: {profile.wallet_address}
                        </div>
                    ) : (
                        <div>
                            <p className="text-sm text-slate-500 mb-3">No wallet linked to this profile. You need a linked wallet to interact with smart contracts.</p>
                            {!signerAddress ? (
                                <button onClick={connectWallet} className="bg-orange-500 text-white px-4 py-2 rounded shadow hover:bg-orange-600 transition text-sm font-semibold">
                                    Connect MetaMask
                                </button>
                            ) : (
                                <button onClick={handleLinkWallet} className="bg-black text-white px-4 py-2 rounded shadow hover:bg-gray-800 transition text-sm font-semibold">
                                    Link Wallet ({signerAddress.slice(0,6)}...{signerAddress.slice(-4)})
                                </button>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ProfileHeader;
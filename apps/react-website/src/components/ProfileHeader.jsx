import { useState } from 'react';
import GlowCard from './GlowCard';

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
        <div className="mb-12">
        <GlowCard innerClassName="p-8 flex flex-col md:flex-row items-center md:items-start gap-8">
            {/* Avatar */}
            <div className="w-32 h-32 bg-indigo-600/80 rounded-full flex items-center justify-center text-white text-5xl font-bold uppercase border-4 border-indigo-400/30 shadow-sm flex-shrink-0">
                {user.username.charAt(0)}
            </div>

            <div className="flex-grow w-full">
                <div className="flex justify-between items-start mb-4">
                    <div>
                        <h1 className="text-3xl font-bold text-white">@{user.username}</h1>
                        <span className={`inline-block mt-2 px-3 py-1 rounded-full text-sm font-bold uppercase tracking-wide ${isClient ? 'bg-blue-900/50 text-blue-300 border border-blue-500/30' : 'bg-orange-900/50 text-orange-300 border border-orange-500/30'}`}>
                            {profile?.role || 'Contractor'}
                        </span>
                    </div>
                    
                    {!isEditing && (
                        <button onClick={() => setIsEditing(true)} className="text-indigo-300 hover:text-indigo-100 font-semibold text-sm bg-indigo-950/50 border border-indigo-500/30 px-4 py-2 rounded-md transition-colors">
                            Edit Profile
                        </button>
                    )}
                </div>

                {/* Edit Form */}
                {isEditing ? (
                    <div className="mt-4 bg-[#120a2b]/50 p-4 rounded border border-white/10">
                        <label className="block text-sm font-bold text-gray-300 mb-1">Bio</label>
                        <textarea 
                            className="w-full border border-white/20 bg-white/5 text-white rounded-md p-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 min-h-[100px]"
                            value={editBio}
                            onChange={(e) => setEditBio(e.target.value)}
                        />
                        <div className="flex gap-2 mt-3">
                            <button onClick={handleSave} className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700 transition">Save Changes</button>
                            <button onClick={() => setIsEditing(false)} className="bg-white/10 text-gray-300 px-4 py-2 rounded hover:bg-white/20 transition">Cancel</button>
                        </div>
                    </div>
                ) : (
                    <p className="text-gray-300 mt-2 text-lg whitespace-pre-wrap">{profile?.bio}</p>
                )}

                {/* Wallet Integration Section */}
                <div className="mt-8 p-4 bg-white/5 border border-white/10 rounded-lg">
                    <h3 className="font-bold text-gray-200 mb-2">Web3 Identity</h3>
                    {profile?.wallet_address ? (
                        <div className="flex flex-col gap-3">
                            <div className="flex items-center text-green-400 font-mono text-sm break-all">
                                <span className="mr-2">✅</span> Linked: {profile.wallet_address}
                            </div>
                            {isEditing && (
                                <div className="flex flex-wrap gap-2 mt-2">
                                    <button 
                                        onClick={() => onSaveProfile({ ...profile, wallet_address: "" })} 
                                        className="bg-red-500 text-white px-3 py-1.5 rounded text-xs font-semibold hover:bg-red-600 transition"
                                    >
                                        Disconnect Wallet
                                    </button>
                                    {!signerAddress ? (
                                        <button 
                                            onClick={connectWallet} 
                                            className="bg-orange-500 text-white px-3 py-1.5 rounded text-xs font-semibold hover:bg-orange-600 transition"
                                        >
                                            Connect New Wallet to Update
                                        </button>
                                    ) : (
                                        <button 
                                            onClick={handleLinkWallet} 
                                            disabled={profile.wallet_address.toLowerCase() === signerAddress.toLowerCase()}
                                            className="bg-black text-white px-3 py-1.5 rounded text-xs font-semibold hover:bg-gray-800 transition disabled:opacity-50"
                                        >
                                            {profile.wallet_address.toLowerCase() === signerAddress.toLowerCase() 
                                                ? "Active Wallet is Already Linked" 
                                                : `Update to ${signerAddress.slice(0,6)}...${signerAddress.slice(-4)}`}
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>
                    ) : (
                        <div>
                            <p className="text-sm text-gray-400 mb-3">No wallet linked to this profile. You need a linked wallet to interact with smart contracts.</p>
                            {!signerAddress ? (
                                <button onClick={connectWallet} className="bg-orange-500 text-white px-4 py-2 rounded shadow hover:bg-orange-600 transition text-sm font-semibold">
                                    Connect MetaMask
                                </button>
                            ) : (
                                <button onClick={handleLinkWallet} className="bg-indigo-600 text-white px-4 py-2 rounded shadow hover:bg-indigo-700 transition text-sm font-semibold border border-indigo-400/50">
                                    Link Wallet ({signerAddress.slice(0,6)}...{signerAddress.slice(-4)})
                                </button>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </GlowCard>
        </div>
    );
};

export default ProfileHeader;
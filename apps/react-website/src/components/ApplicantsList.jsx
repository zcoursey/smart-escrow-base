import GlowCard from './GlowCard';

const ApplicantsList = ({ applications, jobStatus, handleAcceptContractor }) => {

    const isJobOpen = !jobStatus || jobStatus.toLowerCase() === 'open';

    return (
        <GlowCard innerClassName="p-8">
            <h2 className="text-2xl font-bold text-white mb-6">Contractor Applications ({applications.length})</h2>
            
            {applications.length === 0 ? (
                <p className="text-gray-400 italic text-center py-4">No contractors have applied yet.</p>
            ) : (
                <ul className="divide-y divide-white/10">
                    {applications.map(app => (
                        <li key={app.id} className="py-4 flex justify-between items-center">
                            <div>
                                <p className="font-bold text-lg text-white">@{app.username}</p>
                                <p className="text-sm text-gray-400">Applied: {new Date(app.created_at).toLocaleDateString()}</p>
                            </div>
                            <div className="flex items-center gap-3">
                                <span className={`px-3 py-1 rounded text-sm font-semibold uppercase border
                                    ${app.status === 'accepted' ? 'bg-green-900/50 text-green-300 border-green-500/30' 
                                    : app.status === 'rejected' ? 'bg-red-900/50 text-red-300 border-red-500/30'
                                    : 'bg-yellow-900/50 text-yellow-300 border-yellow-500/30'}`}
                                >
                                    {app.status}
                                </span>
                                
                                {isJobOpen && app.status !== 'accepted' && app.status !== 'rejected' && (
                                    <button 
                                        onClick={() => handleAcceptContractor(app)}
                                        className="bg-white text-black px-4 py-2 rounded hover:bg-gray-200 transition text-sm font-bold"
                                    >
                                        Review & Accept
                                    </button>
                                )}
                            </div>
                        </li>
                    ))}
                </ul>
            )}
        </GlowCard>
    );
};

export default ApplicantsList;
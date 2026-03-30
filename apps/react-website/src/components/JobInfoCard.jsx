import GlowCard from './GlowCard';

const JobInfoCard = ({ job, isMyJob, hasApplied, applyStatus, handleApply }) => {
    return (
        <div className="mb-12">
        <GlowCard innerClassName="p-8">
            <div className="flex justify-between items-start mb-4">
                <h1 className="text-3xl font-bold text-white">{job.title}</h1>
                <span className="bg-indigo-900/50 text-indigo-300 border border-indigo-500/30 px-4 py-1 rounded-full text-sm font-bold uppercase tracking-wider">
                    {job.status || 'Open'}
                </span>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 bg-[#120a2b]/50 p-4 rounded-md border border-white/10">
                <div>
                    <p className="text-gray-400 font-semibold text-sm uppercase">Budget</p>
                    <p className="text-lg font-bold text-green-400">{job.budget} ETH</p>
                </div>
                <div>
                    <p className="text-gray-400 font-semibold text-sm uppercase">Location</p>
                    <p className="text-lg font-bold text-gray-100">{job.location || 'Remote'}</p>
                </div>
            </div>

            <div className="mb-8">
                <h3 className="text-xl font-bold text-white mb-2">Job Description</h3>
                <p className="text-gray-300 whitespace-pre-wrap">{job.description}</p>
            </div>

            <div className="border-t border-white/10 pt-6 mt-6">
                {(() => {
                    const isJobOpen = !job.status || job.status.toLowerCase() === 'open';
               
                    // SCENARIO 1: The current user is the Client who posted the job
                    if (isMyJob) {
                        return (
                            <div className="bg-blue-900/40 border border-blue-700/50 rounded p-4 text-blue-300 text-center font-semibold">
                                {isJobOpen 
                                    ? "You posted this job. Review applicants below." 
                                    : "This job is now in progress. Manage it via the Escrow Panel."}
                            </div>
                        );
                    }

                    // SCENARIO 2: The job is OPEN and the user HAS applied
                    if (hasApplied && isJobOpen) {
                        return (
                            <div className="bg-green-900/40 border border-green-700/50 rounded p-4 text-green-300 text-center font-semibold text-lg">
                                ✅ You have successfully applied for this job!
                            </div>
                        );
                    }

                    // SCENARIO 3: The job is OPEN and the user HAS NOT applied
                    if (isJobOpen && !hasApplied) {
                        return (
                            <div className="text-center">
                                {applyStatus.message && (
                                    <div className={`mb-4 p-3 rounded font-bold ${applyStatus.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                        {applyStatus.message}
                                    </div>
                                )}
                                <button 
                                    onClick={handleApply}
                                    disabled={applyStatus.loading}
                                    className="bg-indigo-600 hover:bg-indigo-700 text-white text-lg font-bold py-3 px-10 rounded-full shadow-md transition-colors disabled:opacity-50"
                                >
                                    {applyStatus.loading ? 'Submitting...' : 'Apply for this Job'}
                                </button>
                            </div>
                        );
                    }

                    // SCENARIO 4: The job is CLOSED. (We render nothing, because the EscrowPanel handles the rest if they won!)
                    return null;
                })()}
            </div>
        </GlowCard>
        </div>
    );
};

export default JobInfoCard;
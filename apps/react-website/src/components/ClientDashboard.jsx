import { Link } from 'react-router-dom';
import GlowCard from './GlowCard';

const ClientDashboard = ({ jobs }) => {
    return (
        <GlowCard innerClassName="p-6">
            <h2 className="text-xl font-bold text-white mb-4 border-b border-white/10 pb-2">My Posted Jobs</h2>
            
            {jobs.length === 0 ? (
                <p className="text-gray-400 text-sm italic">You have not posted any jobs yet.</p>
            ) : (
                <ul className="divide-y divide-white/10">
                    {jobs.map(job => (
                        <li key={job.id} className="py-4 flex flex-col md:flex-row md:justify-between md:items-center gap-4">
                            <div>
                                <h3 className="text-lg font-bold text-white">{job.title}</h3>
                                <p className="text-sm text-gray-400 font-semibold">Budget: <span className="text-green-400">{job.budget} ETH</span></p>
                            </div>
                            <div className="flex items-center gap-4">
                                <span className={`text-xs px-3 py-1 rounded-full uppercase font-bold tracking-wider ${job.status && job.status !== 'open' ? 'bg-blue-900/50 text-blue-300 border border-blue-500/30' : 'bg-green-900/50 text-green-300 border border-green-500/30'}`}>
                                    {job.status ? job.status.replace('_', ' ') : 'Open'}
                                </span>
                                <Link to={`/jobs/${job.id}`} className="bg-indigo-950/50 text-indigo-300 border border-indigo-500/30 hover:bg-indigo-600 hover:text-white px-4 py-2 rounded text-sm font-bold transition-colors">
                                    {(() =>{
                                        // 1. Safely handle null statuses and default to 'open'
                                        const currentStatus = (job.status || 'open').toLowerCase();
                                        
                                        // 2. If the status is anything other than 'open', it's in the Escrow phase!
                                        if (currentStatus !== 'open') return 'Manage Escrow';
                                        
                                        // 3. Safely handle the applicant count
                                        const count = Number(job.applicant_count || 0);
                                        
                                        if (count === 1) return `View (${count} Applicant)`;
                                        if (count > 1) return `View (${count} Applicants)`;

                                        return 'View Job Details';
                                    })()}
                                </Link>
                            </div>
                        </li>
                    ))}
                </ul>
            )}
        </GlowCard>
    );
};

export default ClientDashboard;
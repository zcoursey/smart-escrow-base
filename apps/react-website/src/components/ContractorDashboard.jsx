import { Link } from 'react-router-dom';
import GlowCard from './GlowCard';

const ContractorDashboard = ({ applications }) => {
    return (
        <GlowCard innerClassName="p-6">
            <h2 className="text-xl font-bold text-white mb-4 border-b border-white/10 pb-2">My Applications</h2>
            
            {applications.length === 0 ? (
                <p className="text-gray-400 text-sm italic">You have not applied to any jobs yet.</p>
            ) : (
                <ul className="divide-y divide-white/10">
                    {applications.map(app =>(
                        <li key={app.application_id} className="py-4 flex justify-between items-center">
                            <div>
                                <Link to={`/jobs/${app.job_id}`} className="text-lg font-bold text-indigo-400 hover:underline">{app.title}</Link>
                                <p className="text-sm text-gray-400 font-semibold">Budget: <span className="text-green-400">{app.budget} ETH</span></p>
                            </div>
                            <div className="flex flex-col items-end">
                                <span className={`text-xs px-3 py-1 rounded-full uppercase font-bold tracking-wider border ${
                                    app.status === 'pending' ? 'bg-yellow-900/50 text-yellow-300 border-yellow-500/30' :
                                    app.status === 'accepted' ? 'bg-green-900/50 text-green-300 border-green-500/30' :
                                    'bg-gray-800 text-gray-300 border-gray-600'
                                }`}>
                                    {app.status}
                                </span>
                                <span className="text-xs text-gray-500 mt-1">
                                    {new Date(app.applied_at).toLocaleDateString()}
                                </span>
                            </div>
                        </li>
                    ))} 
                </ul>
            )}
        </GlowCard>
    );
};

export default ContractorDashboard;
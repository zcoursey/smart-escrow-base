import { Link } from 'react-router-dom';

const ClientDashboard = ({ jobs }) => {
    return (
        <div className="bg-white p-6 rounded-lg shadow border border-gray-100">
            <h2 className="text-xl font-bold text-gray-800 mb-4 border-b pb-2">My Posted Jobs</h2>
            
            {jobs.length === 0 ? (
                <p className="text-gray-500 text-sm italic">You have not posted any jobs yet.</p>
            ) : (
                <ul className="divide-y divide-gray-200">
                    {jobs.map(job => (
                        <li key={job.id} className="py-4 flex flex-col md:flex-row md:justify-between md:items-center gap-4">
                            <div>
                                <h3 className="text-lg font-bold text-gray-800">{job.title}</h3>
                                <p className="text-sm text-gray-500 font-semibold">Budget: {job.budget} ETH</p>
                            </div>
                            <div className="flex items-center gap-4">
                                <span className={`text-xs px-3 py-1 rounded-full uppercase font-bold tracking-wider ${job.status === 'in_progress' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'}`}>
                                    {job.status || 'Open'}
                                </span>
                                <Link to={`/jobs/${job.id}`} className="bg-indigo-50 text-indigo-600 hover:bg-indigo-600 hover:text-white px-4 py-2 rounded text-sm font-bold transition-colors">
                                    {(() =>{
                                        if (job.status.toLowerCase() === 'in_progress') return 'Manage Escrow';
                                        
                                        const count =Number(job.applicant_count);
                                        
                                        if(count == 1) return `View (${count} Applicant)`;
                                        if(count > 1) return `View (${count} Applicants)`;

                                        return 'View Job Details';
                                    })()}
                                </Link>
                            </div>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
};

export default ClientDashboard;
import { Link } from 'react-router-dom';

const ContractorDashboard = ({ applications }) => {
    return (
        <div className="bg-white p-6 rounded-lg shadow border border-gray-100">
            <h2 className="text-xl font-bold text-gray-800 mb-4 border-b pb-2">My Applications</h2>
            
            {applications.length === 0 ? (
                <p className="text-gray-500 text-sm italic">You have not applied to any jobs yet.</p>
            ) : (
                <ul className="divide-y divide-gray-200">
                    {applications.map(app =>(
                        <li key={app.application_id} className="py-4 flex justify-between items-center">
                            <div>
                                <Link to={`/jobs/${app.job_id}`} className="text-lg font-bold text-indigo-600 hover:underline">{app.title}</Link>
                                <p className="text-sm text-gray-500 font-semibold">Budget: {app.budget} ETH</p>
                            </div>
                            <div className="flex flex-col items-end">
                                <span className={`text-xs px-3 py-1 rounded-full uppercase font-bold tracking-wider ${
                                    app.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                                    app.status === 'accepted' ? 'bg-green-100 text-green-700' :
                                    'bg-gray-100 text-gray-700'
                                }`}>
                                    {app.status}
                                </span>
                                <span className="text-xs text-gray-400 mt-1">
                                    {new Date(app.applied_at).toLocaleDateString()}
                                </span>
                            </div>
                        </li>
                    ))} 
                </ul>
            )}
        </div>
    );
};

export default ContractorDashboard;
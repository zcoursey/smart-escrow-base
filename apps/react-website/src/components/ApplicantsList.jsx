const ApplicantsList = ({ applications, handleAcceptContractor }) => {
    return (
        <div className="bg-white rounded-lg shadow-md p-8 border border-gray-200">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Contractor Applications ({applications.length})</h2>
            
            {applications.length === 0 ? (
                <p className="text-gray-500 italic text-center py-4">No contractors have applied yet.</p>
            ) : (
                <ul className="divide-y divide-gray-200">
                    {applications.map(app => (
                        <li key={app.id} className="py-4 flex justify-between items-center">
                            <div>
                                <p className="font-bold text-lg text-gray-800">@{app.username}</p>
                                <p className="text-sm text-gray-500">Applied: {new Date(app.created_at).toLocaleDateString()}</p>
                            </div>
                            <div className="flex items-center gap-3">
                                <span className={`px-3 py-1 rounded text-sm font-semibold uppercase ${app.status === 'accepted' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                                    {app.status}
                                </span>
                                
                                {app.status !== 'accepted' && (
                                    <button 
                                        onClick={() => handleAcceptContractor(app)}
                                        className="bg-black text-white px-4 py-2 rounded hover:bg-gray-800 transition text-sm font-bold"
                                    >
                                        Review & Accept
                                    </button>
                                )}
                            </div>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
};

export default ApplicantsList;
import { Link } from 'react-router-dom';

const JobCard = ({ job }) => {
  // Add a fallback so it never renders empty, and check if it's open
  const currentStatus = job.status || 'OPEN';
  const isStatusOpen = currentStatus.toLowerCase() === 'open';

  return (
    <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200 hover:shadow-lg transition-shadow flex flex-col h-full">
      <div className="flex justify-between items-start mb-4">
        <div>
            <h4 className="font-bold text-xl text-gray-800">{job.title || "Untitled Job"}</h4>
            <p className="text-sm text-gray-500">{job.location || "Unknown Location"}</p>
        </div>
        
        {/* Dynamic color based on status! */}
        <span className={`text-xs px-3 py-1 rounded-full font-bold uppercase tracking-wide ${isStatusOpen ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-800'}`}>
            {currentStatus.replace('_', ' ')} {/* Removes the underscore from "in_progress" */}
        </span>
      </div>
      
      <div className="text-sm text-gray-600 mb-6 flex-grow">
        <p className="font-semibold mb-1">Budget: {job.budget} ETH</p>
        <p className="line-clamp-3">{job.description}</p>
      </div>
      
      <Link 
        to={`/jobs/${job.id}`} 
        className="inline-block w-full text-center bg-indigo-50 text-indigo-600 font-semibold rounded-lg px-4 py-2 hover:bg-indigo-500 hover:text-white transition-colors"
      >
        View Details & Actions
      </Link>
    </div>
  );
};

export default JobCard;
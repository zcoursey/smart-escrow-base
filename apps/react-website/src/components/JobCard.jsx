import { Link } from 'react-router-dom';

const JobCard = ({ job }) => {
  return (
    <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200 hover:shadow-lg transition-shadow flex flex-col h-full">
      <div className="flex justify-between items-start mb-4">
        <div>
            {/* Display the Title and Location from the DB */}
            <h4 className="font-bold text-xl text-gray-800">{job.title || "Untitled Job"}</h4>
            <p className="text-sm text-gray-500">{job.location || "Unknown Location"}</p>
        </div>
        <span className="bg-green-100 text-green-700 text-xs px-3 py-1 rounded-full font-bold uppercase tracking-wide">
          Open
        </span>
      </div>
      
      <div className="text-sm text-gray-600 mb-6 flex-grow">
        <p className="font-semibold mb-1">Budget: {job.budget} ETH</p>
        <p className="line-clamp-3">{job.description}</p>
      </div>
      
      {/* Route using the database ID instead of the contract address */}
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
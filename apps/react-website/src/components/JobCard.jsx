import { Link } from 'react-router-dom';
import GlowCard from './GlowCard';

const JobCard = ({ job }) => {
  // Add a fallback so it never renders empty, and check if it's open
  const currentStatus = job.status || 'OPEN';
  const isStatusOpen = currentStatus.toLowerCase() === 'open';

  return (
    <GlowCard className="h-full w-full" innerClassName="p-6 flex flex-col h-full hover:shadow-glow transition-shadow">
      <div className="flex justify-between items-start mb-4">
        <div>
            <h4 className="font-bold text-xl text-white">{job.title || "Untitled Job"}</h4>
            <p className="text-sm text-gray-300">{job.location || "Unknown Location"}</p>
        </div>
        
        {/* Dynamic color based on status! */}
        <span className={`text-xs px-3 py-1 rounded-full font-bold uppercase tracking-wide ${isStatusOpen ? 'bg-green-900/50 text-green-400 border border-green-700/50' : 'bg-blue-900/50 text-blue-400 border border-blue-700/50'}`}>
            {currentStatus.replace('_', ' ')} {/* Removes the underscore from "in_progress" */}
        </span>
      </div>
      
      <div className="text-sm text-gray-200 mb-6 flex-grow">
        <p className="font-semibold mb-1 text-gray-100">Budget: <span className="text-green-400">{job.budget} ETH</span></p>
        <p className="line-clamp-3 text-gray-400">{job.description}</p>
      </div>
      
      <Link 
        to={`/jobs/${job.id}`} 
        className="inline-block w-full text-center bg-indigo-950/50 border border-indigo-500/30 text-indigo-300 font-semibold rounded-lg px-4 py-2 hover:bg-indigo-600 hover:text-white transition-colors"
      >
        View Details & Actions
      </Link>
    </GlowCard>
  );
};

export default JobCard;
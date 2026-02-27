import JobCard from './JobCard';

const JobsList = ({ jobs, isLoading }) => {
  if (isLoading) {
    return (
      <div className="text-center py-12 text-gray-500 font-semibold animate-pulse">
        Scanning blockchain for jobs...
      </div>
    );
  }

  if (jobs.length === 0) {
    return (
      <div className="text-center py-12 bg-white rounded-lg shadow-sm border border-gray-200 text-gray-500 italic">
        No jobs found. Load a factory contract or post a new job!
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {jobs.map((job, idx) => (
        <JobCard key={idx} job={job} />
      ))}
    </div>
  );
};

export default JobsList;
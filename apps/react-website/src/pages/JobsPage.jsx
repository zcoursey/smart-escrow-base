import { useState, useEffect } from "react";
import JobsList from "../components/JobsList";

const JobsPage = () => {
  const [jobs, setJobs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const API_URL = "https://smart-escrow-base-testing.onrender.com/api/jobs"; 

  const fetchJobs = async () => {
    setIsLoading(true);
    try {
        const response = await fetch(API_URL);
        if (!response.ok) throw new Error("Failed to fetch");
        
        const data = await response.json();
        
        // Ensure the data matches the props expected by your JobCard
        const formattedJobs = data.map(job => ({
            id: job.id,
            title: job.title,
            location: job.location,
            budget: job.budget,
            description: job.description
        }));

        setJobs(formattedJobs);
    } catch (error) {
        console.error("Error fetching jobs from database:", error);
    } finally {
        setIsLoading(false);
    }
  };

  // Run the fetch command as soon as the page loads
  useEffect(() => {
      fetchJobs();
  }, []);

  return (
    <section className="bg-indigo-50 min-h-screen py-10">
      <div className="container mx-auto px-4 max-w-6xl">
        <h2 className="text-3xl font-semibold text-center mb-8">Available Jobs</h2>
        <JobsList jobs={jobs} isLoading={isLoading} />
      </div>
    </section>
  );
};

export default JobsPage;
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import JobsList from "../components/JobsList";
import GlowCard from "../components/GlowCard";

const JobsPage = ({ user }) => {
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
            description: job.description,
            status: job.status
        }));

        setJobs(formattedJobs);
    } catch (error) {
        console.error("Error fetching jobs from database:", error);
    } finally {
        setIsLoading(false);
    }
  };

  const navigate = useNavigate();

  // Redirect and block fetching if not logged in
  useEffect(() => {
    if (user === null) {
      navigate('/login');
    }
  }, [user, navigate]);

  // Run the fetch command as soon as the page loads, provided user exists
  useEffect(() => {
      if (user !== null) {
          fetchJobs();
      }
  }, [user]);

  if (!user) return null;

  return (
    <section className="bg-transparent min-h-screen py-10">
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="mb-8">
            <GlowCard innerClassName="p-6 text-center">
                <h2 className="text-3xl font-semibold text-white">Available Jobs</h2>
            </GlowCard>
        </div>
        <JobsList jobs={jobs} isLoading={isLoading} />
      </div>
    </section>
  );
};

export default JobsPage;
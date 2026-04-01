import { useState, useEffect } from 'react';
import ContractorsList from '../components/ContractorsList';
import GlowCard from '../components/GlowCard';

const ContractorsPage = () => {
    const [contractors, setContractors] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');

    const API_URL = "https://smart-escrow-base-testing.onrender.com";

    useEffect(() => {
        const fetchContractors = async () => {
            try {
                const res = await fetch(`${API_URL}/api/contractors`);
                const data = await res.json();

                if (data.ok) {
                    setContractors(data.contractors);
                } else {
                    setError(data.error || "Failed to fetch contractors.");
                }
            } catch (err) {
                setError("Network error. Could not load contractors.");
            } finally {
                setIsLoading(false);
            }
        };

        fetchContractors();
    }, []);

    if (isLoading) return <div className="text-center py-20 text-xl font-bold bg-white/5 text-white rounded-xl shadow-md mx-4 my-10 border border-white/10">Loading Contractors...</div>;
    if (error) return <div className="text-center py-20 text-xl font-bold text-red-500 bg-white/5 rounded-xl shadow-md mx-4 my-10 border border-white/10">{error}</div>;

    return (
        <section className="bg-transparent min-h-screen py-10">
            <div className="container mx-auto px-4 max-w-6xl">
                <div className="mb-10">
                    <GlowCard innerClassName="p-8 md:p-12 text-center">
                        <h1 className="text-4xl font-extrabold text-white mb-4">Available Contractors</h1>
                        <p className="text-gray-300 text-lg">Browse our network of professionals ready to take on your next job.</p>
                    </GlowCard>
                </div>
                
                {/* Now using your clean, separated component! */}
                <ContractorsList contractors={contractors} />
                
            </div>
        </section>
    );
};

export default ContractorsPage;
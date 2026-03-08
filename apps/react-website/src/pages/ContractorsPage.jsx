import { useState, useEffect } from 'react';
import ContractorsList from '../components/ContractorsList';

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

    if (isLoading) return <div className="text-center py-20 text-xl font-bold">Loading Contractors...</div>;
    if (error) return <div className="text-center py-20 text-xl font-bold text-red-600">{error}</div>;

    return (
        <section className="bg-indigo-50 min-h-screen py-10">
            <div className="container mx-auto px-4 max-w-6xl">
                <div className="mb-10 text-center">
                    <h1 className="text-4xl font-extrabold text-gray-800 mb-4">Available Contractors</h1>
                    <p className="text-gray-600 text-lg">Browse our network of professionals ready to take on your next job.</p>
                </div>
                
                {/* Now using your clean, separated component! */}
                <ContractorsList contractors={contractors} />
                
            </div>
        </section>
    );
};

export default ContractorsPage;
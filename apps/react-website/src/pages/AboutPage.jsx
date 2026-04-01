import { Link } from 'react-router-dom';
import GlowCard from '../components/GlowCard';

const AboutPage = ({ user }) => {
    return (
        <section className="bg-transparent min-h-screen py-16">
            <div className="container mx-auto px-4 max-w-5xl">
                
                {/* Hero Section */}
                <div className="mb-20">
                <GlowCard innerClassName="p-8 md:p-12 text-center">
                    <h1 className="text-5xl font-extrabold text-white mb-6 tracking-tight">
                        Trustless Contracting on the <span className="text-indigo-400">Blockchain</span>
                    </h1>
                    <p className="text-xl text-gray-300 max-w-3xl mx-auto leading-relaxed">
                        SettleSmart bridges the gap between clients and contractors. By leveraging the power of Web3 and the Base network, we ensure that funds are secure, work is verified, and everyone gets paid fairly—without the need for expensive middlemen.
                    </p>
                </GlowCard>
                </div>

                {/* Core Values / How it Works Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-16">
                    <GlowCard innerClassName="p-8 text-center hover:shadow-lg transition-shadow">
                        <div className="bg-indigo-900/50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6 border border-indigo-500/30">
                            <span className="text-indigo-300 text-2xl font-bold">1</span>
                        </div>
                        <h3 className="text-xl font-bold text-white mb-3">Post or Apply</h3>
                        <p className="text-gray-300">
                            Clients post detailed job requirements and budgets. Verified contractors browse the marketplace and apply for jobs that fit their skills.
                        </p>
                    </GlowCard>

                    <GlowCard innerClassName="p-8 text-center hover:shadow-lg transition-shadow">
                        <div className="bg-indigo-900/50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6 border border-indigo-500/30">
                            <span className="text-indigo-300 text-2xl font-bold">2</span>
                        </div>
                        <h3 className="text-xl font-bold text-white mb-3">Lock Funds in Escrow</h3>
                        <p className="text-gray-300">
                            When a client accepts an applicant, the project budget is instantly locked in a secure, immutable Smart Contract on the Base blockchain.
                        </p>
                    </GlowCard>

                    <GlowCard innerClassName="p-8 text-center hover:shadow-lg transition-shadow">
                        <div className="bg-indigo-900/50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6 border border-indigo-500/30">
                            <span className="text-indigo-300 text-2xl font-bold">3</span>
                        </div>
                        <h3 className="text-xl font-bold text-white mb-3">Work & Get Paid</h3>
                        <p className="text-gray-300">
                            The contractor completes the work with peace of mind knowing the funds are guaranteed. Once the client approves, the smart contract releases payment instantly.
                        </p>
                    </GlowCard>
                </div>

                {/* Call to Action Section */}
                <GlowCard innerClassName="p-10 text-center">
                    <h2 className="text-3xl font-bold mb-4 text-white">Ready to get started?</h2>
                    <p className="text-gray-300 mb-8 max-w-2xl mx-auto text-lg">
                        Whether you need work done or you are looking for your next gig, our platform provides the security and transparency you need.
                    </p>
                    
                    <div className="flex justify-center gap-4">
                        {!user ? (
                            <Link 
                                to="/login" 
                                className="bg-indigo-600 text-white font-bold py-3 px-8 rounded-full shadow hover:bg-indigo-700 transition-colors"
                            >
                                Join the Network
                            </Link>
                        ) : (
                            <>
                                <Link 
                                    to="/addjobs" 
                                    className="bg-indigo-600 text-white font-bold py-3 px-8 rounded-full shadow hover:bg-indigo-700 transition-colors border border-indigo-400/30"
                                >
                                    Post a Job
                                </Link>
                                <Link 
                                    to="/jobs" 
                                    className="bg-white/10 text-white font-bold py-3 px-8 rounded-full shadow hover:bg-white/20 transition-colors border border-white/20"
                                >
                                    Find Work
                                </Link>
                            </>
                        )}
                    </div>
                </GlowCard>

            </div>
        </section>
    );
};

export default AboutPage;
import { Link } from 'react-router-dom';

const AboutPage = ({ user }) => {
    return (
        <section className="bg-indigo-50 min-h-screen py-16">
            <div className="container mx-auto px-4 max-w-5xl">
                
                {/* Hero Section */}
                <div className="text-center mb-16">
                    <h1 className="text-5xl font-extrabold text-gray-900 mb-6 tracking-tight">
                        Trustless Contracting on the <span className="text-indigo-600">Blockchain</span>
                    </h1>
                    <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
                        SettleSmart bridges the gap between clients and contractors. By leveraging the power of Web3 and the Base network, we ensure that funds are secure, work is verified, and everyone gets paid fairly—without the need for expensive middlemen.
                    </p>
                </div>

                {/* Core Values / How it Works Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
                    <div className="bg-white rounded-xl shadow-md p-8 border border-gray-100 text-center hover:shadow-lg transition-shadow">
                        <div className="bg-indigo-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
                            <span className="text-indigo-600 text-2xl font-bold">1</span>
                        </div>
                        <h3 className="text-xl font-bold text-gray-800 mb-3">Post or Apply</h3>
                        <p className="text-gray-600">
                            Clients post detailed job requirements and budgets. Verified contractors browse the marketplace and apply for jobs that fit their skills.
                        </p>
                    </div>

                    <div className="bg-white rounded-xl shadow-md p-8 border border-gray-100 text-center hover:shadow-lg transition-shadow">
                        <div className="bg-indigo-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
                            <span className="text-indigo-600 text-2xl font-bold">2</span>
                        </div>
                        <h3 className="text-xl font-bold text-gray-800 mb-3">Lock Funds in Escrow</h3>
                        <p className="text-gray-600">
                            When a client accepts an applicant, the project budget is instantly locked in a secure, immutable Smart Contract on the Base blockchain.
                        </p>
                    </div>

                    <div className="bg-white rounded-xl shadow-md p-8 border border-gray-100 text-center hover:shadow-lg transition-shadow">
                        <div className="bg-indigo-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
                            <span className="text-indigo-600 text-2xl font-bold">3</span>
                        </div>
                        <h3 className="text-xl font-bold text-gray-800 mb-3">Work & Get Paid</h3>
                        <p className="text-gray-600">
                            The contractor completes the work with peace of mind knowing the funds are guaranteed. Once the client approves, the smart contract releases payment instantly.
                        </p>
                    </div>
                </div>

                {/* Call to Action Section */}
                <div className="bg-indigo-600 rounded-2xl shadow-xl p-10 text-center text-white">
                    <h2 className="text-3xl font-bold mb-4">Ready to get started?</h2>
                    <p className="text-indigo-100 mb-8 max-w-2xl mx-auto text-lg">
                        Whether you need work done or you are looking for your next gig, our platform provides the security and transparency you need.
                    </p>
                    
                    <div className="flex justify-center gap-4">
                        {!user ? (
                            <Link 
                                to="/login" 
                                className="bg-white text-indigo-600 font-bold py-3 px-8 rounded-full shadow hover:bg-gray-100 transition-colors"
                            >
                                Join the Network
                            </Link>
                        ) : (
                            <>
                                <Link 
                                    to="/addjobs" 
                                    className="bg-black text-white font-bold py-3 px-8 rounded-full shadow hover:bg-gray-800 transition-colors"
                                >
                                    Post a Job
                                </Link>
                                <Link 
                                    to="/jobs" 
                                    className="bg-white text-indigo-600 font-bold py-3 px-8 rounded-full shadow hover:bg-gray-100 transition-colors"
                                >
                                    Find Work
                                </Link>
                            </>
                        )}
                    </div>
                </div>

            </div>
        </section>
    );
};

export default AboutPage;
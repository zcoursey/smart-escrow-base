import ContractorCard from './ContractorsCard';

const ContractorsList = ({ contractors }) => {
    if (contractors.length === 0) {
        return (
            <div className="bg-white rounded-lg shadow p-8 text-center border border-gray-200">
                <p className="text-gray-500 text-lg italic">No contractors have set up their profiles yet.</p>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10 lg:gap-12">
            {contractors.map(contractor => (
                <ContractorCard key={contractor.id} contractor={contractor} />
            ))}
        </div>
    );
};

export default ContractorsList;
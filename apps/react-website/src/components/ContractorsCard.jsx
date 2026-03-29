const ContractorCard = ({ contractor }) => {
    return (
        <div className="bg-white rounded-xl shadow-md p-6 border border-gray-200 hover:shadow-lg transition-shadow flex flex-col h-full">
            {/* Header: Avatar & Name */}
            <div className="flex items-center mb-5">
                <div className="bg-indigo-600 text-white h-14 w-14 rounded-full flex items-center justify-center font-bold text-2xl mr-4 shadow-inner">
                    {contractor.username.charAt(0).toUpperCase()}
                </div>
                <div>
                    <h2 className="text-xl font-bold text-gray-900">@{contractor.username}</h2>
                    <span className="inline-block mt-1 text-xs font-bold uppercase tracking-wider text-green-700 bg-green-100 px-2.5 py-0.5 rounded-full">
                        Verified Contractor
                    </span>
                </div>
            </div>

            {/* Bio Section */}
            <div className="flex-grow mb-5">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">About</h3>
                <p className="text-gray-700 text-sm leading-relaxed">
                    {contractor.bio ? contractor.bio : <span className="italic text-gray-400">This contractor hasn't added a bio yet.</span>}
                </p>
            </div>

            {/* Footer: Wallet Address */}
            {contractor.wallet_address && (
                <div className="pt-4 border-t border-gray-100 mt-auto">
                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Wallet Address</h3>
                    <div className="bg-gray-50 rounded p-2 border border-gray-100">
                        <p className="text-xs text-gray-500 font-mono truncate" title={contractor.wallet_address}>
                            {contractor.wallet_address}
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ContractorCard;
import { useRef, useEffect, useState } from 'react';
import GlowCard from './GlowCard';

const ContractorCard = ({ contractor }) => {
    const containerRef = useRef(null);
    const textRef = useRef(null);
    const [scale, setScale] = useState(1);

    useEffect(() => {
        const calculateScale = () => {
            if (containerRef.current && textRef.current) {
                // Clear the scale temporarily to measure natural width accurately
                textRef.current.style.transform = 'none';
                
                const containerWidth = containerRef.current.clientWidth;
                const textWidth = textRef.current.scrollWidth;
                const targetWidth = containerWidth - 4; // Buffer to prevent edge kissing
                
                if (textWidth > targetWidth && textWidth > 0) {
                    setScale(targetWidth / textWidth);
                } else {
                    setScale(1);
                }
            }
        };

        // Give exactly 50ms for webfonts or React layout shift to settle
        const fontLoadTimeout = setTimeout(calculateScale, 50);
        
        window.addEventListener('resize', calculateScale);
        return () => {
            clearTimeout(fontLoadTimeout);
            window.removeEventListener('resize', calculateScale);
        };
    }, [contractor.username]);

    return (
        <GlowCard innerClassName="p-6 flex flex-col h-full">
            {/* Header: Avatar & Name */}
            <div className="flex items-center mb-5">
                <div className="bg-indigo-600/80 border border-indigo-400/30 text-white h-14 w-14 shrink-0 rounded-full flex items-center justify-center font-bold text-2xl mr-4 shadow-inner">
                    {contractor.username.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1 overflow-hidden" ref={containerRef}>
                    <h2 
                        ref={textRef}
                        className="text-xl font-bold text-white inline-block origin-left whitespace-nowrap" 
                        style={{ transform: `scale(${scale})`, transition: 'transform 0.1s' }}
                    >
                        @{contractor.username}
                    </h2>
                    <br />
                    <span className="inline-block mt-1 text-xs font-bold uppercase tracking-wider text-green-400 bg-green-900/40 border border-green-700/50 px-2.5 py-0.5 rounded-full">
                        Verified Contractor
                    </span>
                </div>
            </div>

            {/* Bio Section */}
            <div className="flex-grow mb-5">
                <h3 className="text-xs font-bold text-indigo-300 uppercase tracking-wider mb-2">About</h3>
                <p className="text-gray-300 text-sm leading-relaxed">
                    {contractor.bio ? contractor.bio : <span className="italic text-gray-500">This contractor hasn't added a bio yet.</span>}
                </p>
            </div>

            {/* Footer: Wallet Address */}
            {contractor.wallet_address && (
                <div className="pt-4 border-t border-white/10 mt-auto">
                    <h3 className="text-xs font-bold text-indigo-300 uppercase tracking-wider mb-1">Wallet Address</h3>
                    <div className="bg-[#120a2b]/50 rounded p-2 border border-white/10">
                        <p className="text-xs text-gray-400 font-mono truncate" title={contractor.wallet_address}>
                            {contractor.wallet_address}
                        </p>
                    </div>
                </div>
            )}
        </GlowCard>
    );
};

export default ContractorCard;
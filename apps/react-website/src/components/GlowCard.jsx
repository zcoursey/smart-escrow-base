import BorderGlow from './BorderGlow';

const GlowCard = ({ children, className = "h-full w-full", innerClassName = "p-6 flex flex-col h-full" }) => {
  return (
    <BorderGlow
      edgeSensitivity={30}
      glowColor="40 80 80"
      backgroundColor="#060010"
      borderRadius={28}
      glowRadius={40}
      glowIntensity={1}
      coneSpread={25}
      animated={false}
      colors={['#c084fc', '#f472b6', '#38bdf8']}
      className={className}
    >
      <div className={`w-full ${innerClassName}`}>
        {children}
      </div>
    </BorderGlow>
  );
};

export default GlowCard;

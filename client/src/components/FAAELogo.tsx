interface FAAELogoProps {
  className?: string;
  width?: number;
  height?: number;
}

export default function FAAELogo({ className = "", width = 200, height = 60 }: FAAELogoProps) {
  return (
    <div className={`flex items-center ${className}`}>
      <svg
        width={width}
        height={height}
        viewBox="0 0 200 60"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="text-blue-600"
      >
        {/* Background Rectangle */}
        <rect width="200" height="60" rx="8" fill="currentColor" />
        
        {/* FAAE Text */}
        <text
          x="20"
          y="25"
          fontSize="18"
          fontWeight="bold"
          fill="white"
          fontFamily="Inter, sans-serif"
        >
          FAAE
        </text>
        
        {/* PROJETOS Text */}
        <text
          x="20"
          y="45"
          fontSize="12"
          fill="white"
          fontFamily="Inter, sans-serif"
        >
          PROJETOS
        </text>
        
        {/* Architectural Icon */}
        <g transform="translate(140, 15)">
          <path
            d="M15 30L25 10L35 30H32L30 25H20L18 30H15ZM21.5 21H28.5L25 14L21.5 21Z"
            fill="white"
            opacity="0.8"
          />
          <rect x="19" y="32" width="12" height="8" fill="white" opacity="0.6" />
          <rect x="22" y="35" width="2" height="5" fill="currentColor" />
          <rect x="26" y="35" width="2" height="5" fill="currentColor" />
        </g>
      </svg>
    </div>
  );
}
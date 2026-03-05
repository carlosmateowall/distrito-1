interface DistritoLogoProps {
  className?: string;
  size?: number;
}

export const DistritoLogo = ({ className = "", size = 32 }: DistritoLogoProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 80 80"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    {/* Losango (diamante) rotacionado */}
    <path
      d="M 40 8 L 72 40 L 40 72 L 8 40 Z"
      stroke="currentColor"
      strokeWidth="2"
      fill="none"
    />
    
    {/* Quadrado interno (disciplina) */}
    <rect
      x="24"
      y="24"
      width="32"
      height="32"
      stroke="currentColor"
      strokeWidth="1.5"
      fill="none"
    />
    
    {/* "1%" no centro */}
    <text
      x="40"
      y="46"
      fontFamily="Bebas Neue, sans-serif"
      fontSize="18"
      fontWeight="bold"
      textAnchor="middle"
      fill="currentColor"
      letterSpacing="0.05em"
    >
      1%
    </text>
  </svg>
);

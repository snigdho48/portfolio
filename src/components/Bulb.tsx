export default function Bulb() {
  return (
    <div
      className="absolute -left-36 -bottom-12 rotate-12 mix-blend-color-dodge animate-pulse z-10 w-[200px] xl:w-[260px] select-none pointer-events-none"
      aria-hidden
    >
      <svg viewBox="0 0 260 260" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
        <defs>
          <filter id="blur-bulb">
            <feGaussianBlur stdDeviation="20" />
          </filter>
          <radialGradient id="bulb-glow" cx="50%" cy="50%" r="50%">
            <stop offset="0%"   stopColor="#e68e2e" stopOpacity="0.9" />
            <stop offset="60%"  stopColor="#F13024" stopOpacity="0.5" />
            <stop offset="100%" stopColor="#F13024" stopOpacity="0" />
          </radialGradient>
        </defs>
        {/* glow core */}
        <circle cx="130" cy="120" r="60" fill="url(#bulb-glow)" filter="url(#blur-bulb)" />
        {/* bulb outline */}
        <path
          d="M130 50 C95 50 70 75 70 110 C70 135 85 155 105 165 L105 185 L155 185 L155 165 C175 155 190 135 190 110 C190 75 165 50 130 50 Z"
          fill="none"
          stroke="#e68e2e"
          strokeWidth="2"
          opacity="0.5"
        />
        {/* filament lines */}
        <line x1="115" y1="185" x2="115" y2="200" stroke="#e68e2e" strokeWidth="1.5" opacity="0.4" />
        <line x1="145" y1="185" x2="145" y2="200" stroke="#e68e2e" strokeWidth="1.5" opacity="0.4" />
        <line x1="110" y1="200" x2="150" y2="200" stroke="#e68e2e" strokeWidth="1.5" opacity="0.4" />
      </svg>
    </div>
  );
}

export default function Circles() {
  return (
    <div
      className="w-[200px] xl:w-[300px] absolute -right-16 -bottom-2 mix-blend-color-dodge animate-pulse z-10 pointer-events-none select-none"
      aria-hidden
    >
      <svg viewBox="0 0 260 200" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
        <defs>
          <filter id="blur-circles">
            <feGaussianBlur stdDeviation="15" />
          </filter>
        </defs>
        <circle cx="80"  cy="100" r="70"  fill="none" stroke="#F13024" strokeWidth="1" opacity="0.4" />
        <circle cx="130" cy="100" r="90"  fill="none" stroke="#F13024" strokeWidth="0.8" opacity="0.3" />
        <circle cx="160" cy="100" r="110" fill="none" stroke="#F13024" strokeWidth="0.5" opacity="0.2" />
        <circle cx="80"  cy="100" r="8"   fill="#F13024" opacity="0.8" filter="url(#blur-circles)" />
        <circle cx="200" cy="60"  r="5"   fill="#e68e2e" opacity="0.9" filter="url(#blur-circles)" />
        <circle cx="50"  cy="150" r="4"   fill="#F13024" opacity="0.7" filter="url(#blur-circles)" />
      </svg>
    </div>
  );
}

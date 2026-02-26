export default function TopLeftImg() {
  return (
    <div
      className="absolute left-0 top-0 mix-blend-color-dodge z-10 w-[200px] xl:w-[400px] opacity-50 pointer-events-none select-none"
      aria-hidden
    >
      {/* decorative blurred glow replacing top-left-img.png */}
      <svg viewBox="0 0 400 400" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
        <defs>
          <filter id="blur-tl">
            <feGaussianBlur stdDeviation="60" />
          </filter>
        </defs>
        <circle cx="100" cy="100" r="180" fill="#6b21a8" filter="url(#blur-tl)" />
        <circle cx="220" cy="50"  r="120" fill="#4c1d95" filter="url(#blur-tl)" />
      </svg>
    </div>
  );
}

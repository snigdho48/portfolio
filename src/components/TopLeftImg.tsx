/** Top-left decorative image — same as modern-portfolio: /top-left-img.png */
export default function TopLeftImg() {
  return (
    <div
      className="absolute left-0 top-0 mix-blend-color-dodge z-10 w-[200px] xl:w-[400px] opacity-50 pointer-events-none select-none"
      aria-hidden
    >
      <img
        src="/top-left-img.png"
        alt=""
        width={400}
        height={400}
        className="w-full h-full object-cover"
        loading="eager"
        decoding="async"
      />
    </div>
  );
}

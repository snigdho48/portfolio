/** Bulb decorative image — same as modern-portfolio: /bulb.png with animate-pulse */
export default function Bulb() {
  return (
    <div className='absolute -left-36 -bottom-12 rotate-12 mix-blend-color-dodge animate-pulse duration-75 z-10 w-[200px] xl:w-[260px] select-none pointer-events-none'>
      <img
        src='./bulb.png'
        alt='bulb'
        width={260}
        height={200}
        className='w-full h-full'
      />
    </div>
  );
}

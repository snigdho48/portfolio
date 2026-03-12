/** Circles decorative image — same as modern-portfolio: /circles.png with animate-pulse */
export default function Circles() {
  return (
    <div className='w-[200px] xl:w-[300px] absolute -right-16 -bottom-2 mix-blend-color-dodge animate-pulse duration-75 z-10'>
      <img
        src='/circles.png'
        alt='circles'
        width={260}
        height={200}
        className='w-full h-full'
      />
    </div>
  );
}

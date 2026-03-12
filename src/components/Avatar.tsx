/** Avatar image — same as modern-portfolio: /avatar.png with translate-z-0 */
export default function Avatar() {
  return (
    <div className='hidden xl:flex xl:max-w-none pointer-events-none select-none'>
      <img
        src='/avatar.png'
        alt='avatar'
        width={737}
        height={678}
        className='translate-z-0 w-full h-auto'
      />
    </div>
  );
}

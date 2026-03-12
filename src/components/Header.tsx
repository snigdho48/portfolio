import { Link } from "react-router-dom";
import Socials from "./Socials";

export default function Header() {
  return (
    <header className='absolute z-30 w-full items-center  xl-px-0 xl:h-[90px]'>
      <div className='container mx-auto'>
        <div className='flex flex-col lg:flex-row justify-between items-center gap-y-6 py-8'>
          {/* logo */}
          <Link to='/'>
            <img
              src='/logo.svg'
              alt='logo'
              width={220}
              height={48}
            />
          </Link>

          {/* socials */}
          <Socials />
        </div>
      </div>
    </header>
  );
}

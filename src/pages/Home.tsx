import { motion } from "framer-motion";
import { Helmet } from "react-helmet-async";
import ParticlesContainer from "@/components/ParticlesContainer";
import ProjectsBtn from "@/components/ProjectsBtn";
import Avatar from "@/components/Avatar";
import { fadeIn } from "@/variants";
import { siteConfig } from "@/data/portfolio";

export default function Home() {
  return (
    <div className='bg-primary/60 h-full'>
      <Helmet>
        <title>Snigdho | Software Engineer</title>
        <meta
          name='description'
          content='MD. Atiquzzaman Snigdho — Software Engineer specializing in Django, React & Cloud.'
        />
      </Helmet>

      <div className='w-full h-full bg-gradient-to-r from-primary/10 via-black/30 to-black/10'>
        <div className='text-center flex flex-col justify-center xl:pt-40 xl:text-left h-full container mx-auto'>
          <motion.div
            variants={fadeIn("down", 0.2)}
            initial='hidden'
            animate='show'
            exit='hidden'
          >
            <h1 className='h1'>
              Building <br className='hidden xl:block' />
              Production <span className='text-accent'>Backend Systems.</span>
            </h1>
          </motion.div>

          <motion.div
            variants={fadeIn("down", 0.3)}
            initial='hidden'
            animate='show'
            exit='hidden'
          >
            <p className='max-w-sm xl:max-w-xl mx-auto xl:mx-0 mb-10 xl:mb-16 text-white/60 font-light leading-[1.8]'>
              {siteConfig.bio}
            </p>
          </motion.div>

          <div className='flex justify-center xl:hidden relative'>
            <ProjectsBtn />
          </div>
          <motion.div
            variants={fadeIn("down", 0.4)}
            initial='hidden'
            animate='show'
            exit='hidden'
          >
            <div className='hidden xl:flex'>
              <ProjectsBtn />
            </div>
          </motion.div>
        </div>
      </div>

      <div className='absolute bottom-24 xl:bottom-8 left-1/2 xl:left-auto xl:right-[8%] -translate-x-1/2 xl:translate-x-0 z-20 flex flex-col items-center gap-1 pointer-events-none opacity-60'>
        <span className='text-[10px] tracking-widest uppercase text-white/50'>
          Scroll
        </span>
        <div className='w-px h-6 bg-gradient-to-b from-white/40 to-transparent animate-pulse' />
      </div>

      <div className='w-[1280px] h-full absolute right-0 bottom-0 max-w-full xl:max-w-none'>
        <div
          role='img'
          className='bg-none xl:bg-explosion xl:bg-cover xl:bg-right xl:bg-no-repeat w-full h-full absolute mix-blend-color-dodge translate-z-0'
          aria-hidden
        />
        <ParticlesContainer />
        <div className='w-full h-full max-w-[737px] max-h-[678px] absolute -bottom-32 lg:bottom-0 lg:right-[8%]'>
          <motion.div
            variants={fadeIn("up", 0.5)}
            initial='hidden'
            animate='show'
            exit='hidden'
            transition={{ duration: 1, ease: "easeInOut" }}
          >
            <Avatar />
          </motion.div>
        </div>
      </div>
    </div>
  );
}

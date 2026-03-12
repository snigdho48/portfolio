import { useState } from "react";
import { motion } from "framer-motion";
import CountUp from "react-countup";
import { Helmet } from "react-helmet-async";
import Avatar from "@/components/Avatar";
import Circles from "@/components/Circles";
import { fadeIn } from "@/variants";
import { aboutData, stats } from "@/data/portfolio";

export default function About() {
  const [index, setIndex] = useState(0);

  return (
    <div className='h-full bg-primary/30 py-32 text-center xl:text-left p-0'>
      <Helmet>
        <title>Snigdho | About</title>
        <meta
          name='description'
          content='About MD. Atiquzzaman Snigdho — 3+ years building production backends.'
        />
      </Helmet>

      <Circles />
      <div className='hidden xl:flex absolute bottom-0 -left-[370px]'>
        <motion.div
          variants={fadeIn("right", 0.2)}
          initial='hidden'
          animate='show'
          exit='hidden'
        >
          <Avatar />
        </motion.div>
      </div>

      <div className='container mx-auto h-full flex flex-col items-center xl:flex-row gap-x-6'>
        <div className='flex-1  flex flex-col justify-center'>
          <motion.div
            variants={fadeIn("right", 0.2)}
            initial='hidden'
            animate='show'
            exit='hidden'
          >
            <h2 className='h2'>
              Crafting robust{" "}
              <span className='text-accent'>backend systems</span> that scale.
            </h2>
          </motion.div>
          <motion.div
            variants={fadeIn("right", 0.4)}
            initial='hidden'
            animate='show'
            exit='hidden'
          >
            <p className='max-w-[500px] mx-auto xl:mx-0 mb-6 xl:mb-12 px-2 xl:px-0 text-white/60 font-light leading-[1.8]'>
              3+ years ago I started as a Flutter intern. Since then I have
              built enterprise analytics platforms, data-driven PR tools,
              AI-assisted content systems, and deployed them on AWS,
              DigitalOcean and Linux servers.
            </p>
          </motion.div>

          <motion.div
            variants={fadeIn("right", 0.6)}
            initial='hidden'
            animate='show'
            exit='hidden'
          >
            <div className='hidden md:flex md:max-w-xl xl:max-w-none mx-auto xl:mx-0 mb-8'>
              <div className='flex flex-1 xl:gap-x-6'>
                {stats.map((stat, i) => (
                  <div
                    key={i}
                    className={`relative flex-1 ${
                      i < stats.length - 1
                        ? "after:w-[1px] after:h-full after:bg-white/10 after:absolute after:top-0 after:right-0"
                        : ""
                    }`}
                  >
                    <div className='text-2xl xl:text-4xl font-extrabold text-accent mb-2'>
                      <CountUp
                        start={0}
                        end={stat.end}
                        duration={5}
                        suffix={stat.suffix}
                      />
                    </div>
                    <div className='text-xs uppercase tracking-[1px] leading-[1.4] max-w-[100px]'>
                      {stat.label}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
        <div className='flex flex-col w-full xl:max-w-[38%] min-h-0 max-h-[60vh] xl:max-h-[480px] xl:h-[480px]'>
          <motion.div
            variants={fadeIn("left", 0.4)}
            initial='hidden'
            animate='show'
            exit='hidden'
          >
            <div className='flex gap-x-4 xl:gap-x-8 mx-auto xl:mx-0 mb-4 flex-shrink-0'>
              {aboutData.map((item, itemI) => (
                <button
                  key={itemI}
                  type='button'
                  onClick={() => setIndex(itemI)}
                  className={`${
                    index === itemI
                      ? "text-accent after:w-[100%] after:bg-accent after:transition-all after:duration-300"
                      : ""
                  } cursor-pointer capitalize xl:text-lg relative after:w-8 after:h-[2px] after:bg-white after:absolute after:-bottom-1 after:left-0 bg-transparent border-0 text-white`}
                >
                  {item.title}
                </button>
              ))}
            </div>

            <div className='py-2 xl:py-6 flex flex-col gap-y-2 xl:gap-y-4 items-center xl:items-start overflow-y-auto scrollbar-thin min-h-0 flex-1 overscroll-contain scroll-smooth'>
              {aboutData[index].info.map((item, itemI) => (
                <div
                  key={itemI}
                  className='flex-shrink-0 flex flex-col md:flex-row max-w-max gap-x-2 items-center text-center text-white/60'
                >
                  <div className='font-light mb-2 md:mb-0'>{item.title}</div>
                  {item.stage && <div className='hidden md:flex'>-</div>}
                  <div>{item.stage}</div>
                  <div className='flex gap-x-4'>
                    {item.icons?.map((Icon, iconI) => (
                      <div key={iconI} className='text-2xl text-white'>
                        <Icon aria-hidden />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

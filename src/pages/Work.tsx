import { motion } from "framer-motion";
import { Helmet } from "react-helmet-async";
import Bulb from "@/components/Bulb";
import Circles from "@/components/Circles";
import WorkSlider from "@/components/WorkSlider";
import { fadeIn } from "@/variants";

export default function Work() {
  return (
    <div className="h-full bg-primary/30 py-36 flex items-center">
      <Helmet>
        <title>Snigdho | Work</title>
        <meta name="description" content="Projects by MD. Atiquzzaman Snigdho — Braincount, Papercable, Chobirbaksho and more." />
      </Helmet>

      <Circles />
      <div className="container mx-auto">
        <div className="flex flex-col xl:flex-row gap-x-8">
          <div className="text-center flex xl:w-[30vw] flex-col lg:text-left mb-4 xl:mb-0">
            <motion.div variants={fadeIn("up", 0.2)} initial="hidden" animate="show" exit="hidden">
              <h2 className="h2 xl:mt-12">
                My work <span className="text-accent">.</span>
              </h2>
            </motion.div>
            <motion.div variants={fadeIn("up", 0.4)} initial="hidden" animate="show" exit="hidden">
              <p className="mb-4 max-w-[400px] mx-auto lg:mx-0 text-white/60 font-light leading-[1.8]">
                Production-grade systems across OOH analytics, PR outreach, AI
                content creation, omnichannel marketing, and mobile identity verification.
              </p>
            </motion.div>
          </div>

          <motion.div variants={fadeIn("down", 0.6)} initial="hidden" animate="show" exit="hidden" className="w-full xl:max-w-[65%] min-w-0">
            <div className="min-h-[200px] sm:min-h-[260px] xl:min-h-[300px] overflow-hidden">
              <WorkSlider />
            </div>
          </motion.div>
        </div>
      </div>
      <Bulb />
    </div>
  );
}

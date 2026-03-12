import { motion } from "framer-motion";
import { Helmet } from "react-helmet-async";
import TestimonialSlider from "@/components/TestimonialSlider";
import { fadeIn } from "@/variants";

export default function Testimonials() {
  return (
    <div className="h-full bg-primary/30 py-32 text-center">
      <Helmet>
        <title>Snigdho | Testimonials</title>
        <meta name="description" content="What colleagues and clients say about Snigdho." />
      </Helmet>

      <div className="container mx-auto h-full flex flex-col justify-center">
        <motion.div variants={fadeIn("up", 0.2)} initial="hidden" animate="show" exit="hidden">
          <h2 className="h2 mb-8 xl:mb-0">
            What clients <span className="text-accent">say.</span>
          </h2>
        </motion.div>
        <motion.div variants={fadeIn("up", 0.4)} initial="hidden" animate="show" exit="hidden">
          <TestimonialSlider />
        </motion.div>
      </div>
    </div>
  );
}

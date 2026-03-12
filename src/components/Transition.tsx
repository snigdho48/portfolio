import type { ComponentProps } from "react";
import { motion } from "framer-motion";

const transitionVariants = {
  initial: { x: "100%", width: "100%" },
  animate: { x: "0%", width: "0%" },
  exit: { x: ["0%", "100%"], width: ["0%", "100%"] },
};

const ease = "easeInOut" as const;

type MotionDivProps = ComponentProps<"div"> & ComponentProps<typeof motion.div>;
const MotionDiv = motion.div as React.FC<MotionDivProps>;

export default function Transition() {
  return (
    <>
      <MotionDiv
        className="fixed top-0 bottom-0 right-full w-screen h-screen z-30 bg-[#2e2257]"
        variants={transitionVariants}
        initial="initial"
        animate="animate"
        exit="exit"
        transition={{ delay: 0.2, duration: 0.6, ease }}
        aria-hidden
      />
      <MotionDiv
        className="fixed top-0 bottom-0 right-full w-screen h-screen z-20 bg-[#3b2d71]"
        variants={transitionVariants}
        initial="initial"
        animate="animate"
        exit="exit"
        transition={{ delay: 0.4, duration: 0.6, ease }}
        aria-hidden
      />
      <MotionDiv
        className="fixed top-0 bottom-0 right-full w-screen h-screen z-10 bg-[#4b3792]"
        variants={transitionVariants}
        initial="initial"
        animate="animate"
        exit="exit"
        transition={{ delay: 0.6, duration: 0.6, ease }}
        aria-hidden
      />
    </>
  );
}

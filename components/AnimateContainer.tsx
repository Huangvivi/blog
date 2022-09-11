import classNames from "classnames";
import { HTMLMotionProps, Variants, motion } from "framer-motion";

type Props = HTMLMotionProps<"div"> & {
  children?: React.ReactNode;
  className?: string;
};

const variants: Variants = {
  initial: {
    opacity: 0,
    y: 200,
  },
  enter: {
    opacity: 1,
    y: 0,
  },
  exit: {
    opacity: 0,
    y: 200,
  },
};

const AnimateContainer = ({ children, className }: Props) => {
  return (
    <motion.div
      variants={variants}
      initial="initial"
      animate="enter"
      exit="exit"
      transition={{
        ease: "linear",
      }}
      className={classNames(
        "container mx-auto px-5 min-h-[calc(100vh-12rem)]",
        className
      )}
    >
      {children}
    </motion.div>
  );
};

export default AnimateContainer;

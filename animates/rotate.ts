import { TargetAndTransition } from "framer-motion";

const rotate: TargetAndTransition = {
  rotate: 360,
  transition: {
    duration: 3,
    repeat: Infinity,
    ease: "linear",
  },
};

export default rotate;

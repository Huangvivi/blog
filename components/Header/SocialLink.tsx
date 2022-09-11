import { motion } from "framer-motion";
import React from "react";

const SocialLink: React.FC<{ href: string; children?: React.ReactNode }> = ({
  children,
  href,
}) => (
  <motion.a
    whileHover={{
      y: [0, -1, 1, 0],
      transition: {
        duration: 1,
      },
    }}
    href={href}
    className="inline-block font-bold underline underline-offset-4 text-primary-content"
  >
    {children}
  </motion.a>
);

export default React.memo(SocialLink);

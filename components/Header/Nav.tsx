import { MenuAlt1Icon, XIcon } from "@heroicons/react/outline";
import { AnimatePresence, motion } from "framer-motion";
import React, { useRef, useEffect, useState } from "react";
import { NAV } from "~/lib/constants";
import NoScrollLink from "../NoScrollLink";
import { useTranslation } from "react-i18next";

export const useDimensions = (ref) => {
  const dimensions = useRef({ width: 0, height: 0 });

  useEffect(() => {
    dimensions.current.width = ref.current.offsetWidth;
    dimensions.current.height = ref.current.offsetHeight;
  }, [ref]);

  return dimensions.current;
};

const sidebar = {
  open: (height = 1000) => ({
    clipPath: `circle(${height * 2 + 200}px at 34px 34px)`,
    transition: {
      type: "spring",
      stiffness: 20,
      restDelta: 2,
    },
  }),
  closed: {
    clipPath: "circle(0px at 34px 34px)",
    transition: {
      delay: 0.3,
      type: "spring",
      stiffness: 400,
      damping: 40,
    },
  },
};

const closeButton = {
  open: {
    scale: 1,
    rotate: 360,
    transition: {
      delay: 0.5,
      duration: 0.5,
    },
  },
  closed: {
    scale: 0,
    rotate: -360,
    transition: {
      duration: 0.5,
    },
  },
  initial: {
    scale: 0,
  },
};

const navList = {
  open: {
    opacity: 1,
    transition: {
      staggerChildren: 0.07,
      delayChildren: 0.2,
    },
  },
  closed: {
    opacity: 0,
    transition: {
      staggerChildren: 0.05,
      staggerDirection: -1,
    },
  },
};

const navItem = {
  open: {
    y: 0,
    opacity: 1,
    transition: {
      y: { stiffness: 1000, velocity: -100 },
    },
  },
  closed: {
    y: 50,
    opacity: 0,
    transition: {
      y: { stiffness: 1000 },
    },
  },
};

const NavButtonStyle: Record<
  typeof NAV[number]["href"],
  Record<"buttonColor", string>
> = {
  "/blog": {
    buttonColor: "btn-primary",
  },
  "/tag": {
    buttonColor: "btn-secondary",
  },
  // "/about": {
  //   buttonColor: "btn-accent",
  // },
};

const Nav: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);
  const { height } = useDimensions(containerRef);
  const { t } = useTranslation();
  return (
    <>
      <motion.button
        onClick={() => setIsOpen(true)}
        className="text-primary-content md:hidden"
      >
        <MenuAlt1Icon className="w-7 h-7" />
      </motion.button>
      <motion.nav
        onBlur={() => setIsOpen(false)}
        initial={false}
        animate={isOpen ? "open" : "closed"}
        custom={height}
        ref={containerRef}
      >
        <motion.div
          className="fixed top-0 left-0 bottom-0 [width:300px] bg-base-100 z-10 shadow"
          variants={sidebar}
        >
          <AnimatePresence>
            {isOpen && (
              <motion.button
                whileHover={{
                  scale: 1.1,
                }}
                variants={closeButton}
                initial={"initial"}
                animate={"open"}
                exit={"closed"}
                className="absolute left-5 top-5 text-primary"
                onClick={() => setIsOpen(false)}
              >
                <XIcon className="w-7 h-7" />
              </motion.button>
            )}
          </AnimatePresence>
          <motion.ul
            variants={navList}
            className="absolute flex flex-col gap-8 top-48 left-1/2 -translate-x-1/2"
          >
            {NAV.map((item, i) => (
              <motion.li variants={navItem} key={item.href}>
                <NoScrollLink href={item.href} passHref>
                  <motion.a
                    role="button"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    className={`btn btn-outline [width:240px] ${
                      NavButtonStyle[item.href].buttonColor
                    }`}
                    onClick={() => {
                      setIsOpen(false);
                    }}
                  >
                    {t(item.label)}
                  </motion.a>
                </NoScrollLink>
              </motion.li>
            ))}
          </motion.ul>
        </motion.div>
      </motion.nav>
    </>
  );
};

export default React.memo(Nav);

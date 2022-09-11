import { XIcon } from "@heroicons/react/outline";
import { AnimatePresence, motion } from "framer-motion";
import React, { useRef, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

export const useDimensions = (ref) => {
  const dimensions = useRef({ width: 0, height: 0 });

  useEffect(() => {
    dimensions.current.width = ref.current.offsetWidth;
    dimensions.current.height = ref.current.offsetHeight;
  }, [ref]);

  return dimensions.current;
};

const TocIcon: React.FC<{ className: string }> = ({ className }) => (
  <svg
    className={className}
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    transform="scale(-1,1)"
  >
    <path
      d="M12 5C11.4477 5 11 5.44772 11 6C11 6.55228 11.4477 7 12 7H20C20.5523 7 21 6.55228 21 6C21 5.44772 20.5523 5 20 5H12Z"
      fill="currentColor"
    />
    <path
      d="M7 12C7 11.4477 7.44772 11 8 11H16C16.5523 11 17 11.4477 17 12C17 12.5523 16.5523 13 16 13H8C7.44772 13 7 12.5523 7 12Z"
      fill="currentColor"
    />
    <path
      d="M3 18C3 17.4477 3.44772 17 4 17H12C12.5523 17 13 17.4477 13 18C13 18.5523 12.5523 19 12 19H4C3.44772 19 3 18.5523 3 18Z"
      fill="currentColor"
    />
  </svg>
);

const sidebar = {
  open: (height = 1000) => ({
    clipPath: `circle(${height * 2 + 200}px at 300px ${height}px)`,
    transition: {
      type: "spring",
      stiffness: 20,
      restDelta: 2,
    },
  }),
  closed: (height = 1000) => ({
    clipPath: `circle(0px at 300px ${height}px)`,
    transition: {
      delay: 0.3,
      type: "spring",
      stiffness: 400,
      damping: 40,
    },
  }),
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

type TocButtonProps = {
  headings: {
    title: string;
    id: string;
    rank: number;
  }[];
};

const TocButton: React.FC<TocButtonProps> = ({ headings }) => {
  const [isOpen, setIsOpen] = useState(false);
  const { t } = useTranslation();
  const containerRef = useRef(null);
  const { height } = useDimensions(containerRef);
  return (
    <>
      <motion.button
        initial={{
          x: 0,
        }}
        animate={{
          x: 30,
          transition: {
            delay: 3,
          },
        }}
        whileHover={{
          x: 0,
          transition: {
            duration: 0.1,
          },
        }}
        onClick={() => setIsOpen((prev) => !prev)}
        className="btn btn-circle btn-xl fixed bottom-16 right-2"
      >
        <TocIcon className="w-6 h-6" />
      </motion.button>
      <motion.nav
        initial={false}
        animate={isOpen ? "open" : "closed"}
        custom={height}
        ref={containerRef}
      >
        <motion.div
          className="fixed top-0 right-0 bottom-0 [width:300px] bg-base-100 z-10 shadow"
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
                className="absolute right-5 bottom-5 text-primary"
                onClick={() => setIsOpen(false)}
              >
                <XIcon className="w-7 h-7" />
              </motion.button>
            )}
          </AnimatePresence>
          <motion.span className="absolute text-2xl font-bold left-5 top-5">
            {t("tableOfContents")}
          </motion.span>
          <motion.ul
            variants={navList}
            className="absolute flex flex-col gap-2 top-16 left-5"
          >
            {headings.map((item) => (
              <motion.li variants={navItem} key={item.id}>
                <motion.a
                  href={`#${item.id}`}
                  style={{
                    marginLeft: `${0.75 * (item.rank - 2)}rem`,
                    fontSize: `calc(1rem - ${item.rank - 2}px)`,
                  }}
                  className="link-hover line-clamp-1"
                >
                  {item.title}
                </motion.a>
              </motion.li>
            ))}
          </motion.ul>
        </motion.div>
      </motion.nav>
    </>
  );
};

export default React.memo(TocButton);

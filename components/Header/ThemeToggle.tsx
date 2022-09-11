import { useState, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { MoonIcon, SunIcon } from "@heroicons/react/outline";
import rotate from "~/animates/rotate";

const isDark = (): boolean =>
  (localStorage && localStorage.theme === "dark") ||
  (!("theme" in localStorage) &&
    window.matchMedia("(prefers-color-scheme: dark)").matches);

const getThemeString = (isDark: boolean): string => (isDark ? "dark" : "light");

const ThemeToggle: React.FC = () => {
  const [isDarkMode, setDarkMode] = useState(false);

  const toggleMode = (): void => {
    localStorage.theme = getThemeString(!isDarkMode);
    if (localStorage.theme === "dark") {
      document.documentElement.setAttribute("data-theme", "dark");
    } else {
      document.documentElement.setAttribute("data-theme", "light");
    }
    setDarkMode(!isDarkMode);
  };

  useEffect(() => {
    setDarkMode(isDark());
    if (isDark()) {
      document.documentElement.setAttribute("data-theme", "dark");
    }
  }, []);

  const darkModeActive: boolean =
    typeof window !== "undefined" &&
    document.documentElement.getAttribute("data-theme") === "dark";
  return (
    <AnimatePresence exitBeforeEnter initial={false}>
      <motion.button
        className="text-primary-content focus:outline-none"
        onClick={() => toggleMode()}
        whileHover={!darkModeActive ? rotate : undefined}
        key={darkModeActive ? "dark-icon" : "light-icon"}
        initial={{ y: 20, x: -20, opacity: 0 }}
        animate={{ y: 0, x: 0, opacity: 1 }}
        exit={{ y: 20, x: 20, opacity: 0 }}
        transition={{ duration: 0.2 }}
      >
        {darkModeActive ? <MoonIcon /> : <SunIcon />}
      </motion.button>
    </AnimatePresence>
  );
};

export default ThemeToggle;

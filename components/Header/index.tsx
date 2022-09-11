import React, { useEffect, useState } from "react";
import {
  TELEGRAM_SOCIAL_URL,
  GITHUB_SOCIAL_URL,
  TWITTER_SOCIAL_URL,
} from "~/lib/constants";
import { motion } from "framer-motion";
import Container from "~/components/Container";
import { SearchIcon, GlobeAltIcon } from "@heroicons/react/outline";
import MdNav from "./MdNav";
import Nav from "./Nav";
import SocialLink from "./SocialLink";
import ThemeToggle from "./ThemeToggle";
import { Trans, useTranslation } from "next-i18next";
import languages from "~/constants/languages.json";
import LocaleLink from "../LocaleLink";
import { useRouter } from "next/router";
import rotate from "~/animates/rotate";

const Header = () => {
  const router = useRouter();
  const { pathname, asPath, query } = router;
  const { t, i18n } = useTranslation();
  const [isFixedNav, setIsFixedNav] = useState(false);

  useEffect(() => {
    const foo = () => {
      setIsFixedNav(window.scrollY > 0);
    };
    window.addEventListener("scroll", foo);
    return () => window.removeEventListener("scroll", foo);
  }, []);

  return (
    <header className="from-primary to-secondary text-primary-content bg-gradient-to-br pt-8 pb-12 md:pb-0">
      <Container>
        <div className="flex-col md:flex-row flex md:justify-between">
          <motion.div
            layout
            className={`flex p-4 top-0 left-0 w-full justify-between fixed shadow md:shadow-none md:p-0 md:static md:order-1 md:w-auto md:bg-transparent z-10 ${
              isFixedNav
                ? "bg-gradient-to-br from-primary to-secondary text-primary-content"
                : "bg-transparent"
            }`}
          >
            <Nav />
            <div className="grid gap-4 grid-cols-3 items-center">
              <span>
                <SearchIcon className="w-7 h-7" />
              </span>
              <ThemeToggle />
              <motion.div className="w-7 h-7 dropdown dropdown-end">
                <motion.button whileHover={rotate} tabIndex={0}>
                  <GlobeAltIcon className="w-7 h-7" />
                </motion.button>
                <motion.ul
                  tabIndex={0}
                  className="dropdown-content menu shadow-sm p-2 bg-base-200 text-base-content rounded-box w-44"
                >
                  {languages.map((i) => (
                    <li key={i.code}>
                      <button
                        className={`${
                          i18n.language === i.code ? "active" : ""
                        }`}
                        onClick={() => {
                          i18n.changeLanguage(i.code);
                          router.push({ pathname, query }, asPath, {
                            locale: i.code,
                          });
                          if (document.activeElement instanceof HTMLElement) {
                            document.activeElement.blur();
                          }
                        }}
                      >
                        {i.name}
                      </button>
                    </li>
                  ))}
                </motion.ul>
              </motion.div>
            </div>
          </motion.div>
          <motion.div
            layout
            whileHover={{
              scale: 1.05,
              x: 6,
            }}
            className="flex items-center mt-12 md:mt-0"
          >
            <motion.span className="text-4xl text-center md:text-left md:text-6xl font-bold tracking-tighter leading-tight">
              <LocaleLink href="/">{t("title")}</LocaleLink>
            </motion.span>
          </motion.div>
        </div>

        <p className="mt-3 text-xl md:mb-9">
          <Trans ns="common" i18nKey={"bio"}>
            Just a regular cyber security engineer. Find me on
            <SocialLink href={GITHUB_SOCIAL_URL} key={1}>
              Github
            </SocialLink>
            ,
            <SocialLink href={TWITTER_SOCIAL_URL} key={2}>
              Twitter
            </SocialLink>
            or
            <SocialLink href={TELEGRAM_SOCIAL_URL} key={3}>
              Telegram
            </SocialLink>
            .
          </Trans>
        </p>

        <MdNav />
      </Container>
    </header>
  );
};

export default Header;

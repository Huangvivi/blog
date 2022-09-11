import { AnimatePresence } from "framer-motion";
import { AppProps } from "next/app";
import { useEffect } from "react";
import Layout from "~/components/Layout";
import { appWithTranslation, SSRConfig, useTranslation } from "next-i18next";
import nextI18NextConfig from "../next-i18next.config";
import { DefaultSeo } from "next-seo";
import "../styles/index.css";
import "../styles/code.css";
import { SITE_URL } from "~/lib/constants";

function MyApp({
  Component,
  pageProps,
  router,
}: AppProps<{ hideFooter?: boolean; hideHeader?: boolean }>) {
  useEffect(() => {
    // On page load or when changing themes, best to add inline in `head` to avoid FOUC
    if (
      localStorage.theme === "dark" ||
      (!("theme" in localStorage) &&
        window.matchMedia("(prefers-color-scheme: dark)").matches)
    ) {
      document.documentElement.setAttribute("data-theme", "dark");
    } else {
      document.documentElement.setAttribute("data-theme", "light");
    }
  });
  const { t, i18n } = useTranslation();

  return (
    <Layout hideFooter={pageProps.hideFooter} hideHeader={pageProps.hideFooter}>
      <DefaultSeo
        openGraph={{
          type: "website",
          locale: i18n.language,
          url: SITE_URL,
          site_name: t("title"),
        }}
      />
      <AnimatePresence
        exitBeforeEnter
        initial={false}
        onExitComplete={() => window.scrollTo(0, 0)}
      >
        <Component {...pageProps} key={router.route} />
      </AnimatePresence>
    </Layout>
  );
}

export default appWithTranslation<
  AppProps<{
    hideFooter: boolean;
    hideHeader: boolean;
    _nextI18Next: SSRConfig["_nextI18Next"];
  }>
>(MyApp, nextI18NextConfig);

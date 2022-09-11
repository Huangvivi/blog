import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import { useTranslation } from "next-i18next";
import { useRouter } from "next/router";
import { HomeIcon } from "@heroicons/react/solid";

const PageNotFound = () => {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  return (
    <div className=" w-full min-h-screen flex flex-col justify-center items-center bg-base-100 text-base-content">
      <h1 className="text-8xl font-bold text-transparent bg-clip-text bg-gradient-to-b from-secondary to-primary">
        404
      </h1>
      <p className="text-3xl text-transparent bg-clip-text bg-gradient-to-b from-secondary to-primary">
        {t("pageNotFound")}
      </p>
      <button
        className="btn btn-primary btn-lg mt-16"
        onClick={() => {
          router.push("/", undefined, {
            locale: i18n.language,
          });
        }}
      >
        <HomeIcon className="w-6 h-6" />
        {t("backToHome")}
      </button>
    </div>
  );
};

export async function getStaticProps({ locale }) {
  return {
    props: {
      ...(await serverSideTranslations(locale, ["common"])),
      hideFooter: true,
      hideHeader: true,
    },
  };
}

export default PageNotFound;

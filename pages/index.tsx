import { serverSideTranslations } from "next-i18next/serverSideTranslations";

const Index = () => {
  return <></>;
};

export async function getStaticProps({ locale }) {
  return {
    props: {
      ...(await serverSideTranslations(locale, ["common"])),
    },
  };
}

export default Index;

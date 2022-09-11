import { serverSideTranslations } from "next-i18next/serverSideTranslations";

const About = () => {
  return <></>;
};

export async function getStaticProps({ locale }) {
  return {
    props: {
      ...(await serverSideTranslations(locale, ["common"])),
    },
  };
}

export default About;

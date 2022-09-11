import { serverSideTranslations } from "next-i18next/serverSideTranslations";

const Projects = () => {
  return <></>;
};

export async function getStaticProps({ locale }) {
  return {
    props: {
      ...(await serverSideTranslations(locale, ["common"])),
    },
  };
}

export default Projects;

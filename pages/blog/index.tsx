import { NextPage } from "next";
import { getAllSortedPosts } from "~/lib/api";
import AnimateContainer from "~/components/AnimateContainer";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import "dayjs/locale/zh";
import PostList from "../../components/PostList";
import { useTranslation } from "react-i18next";
import { NextSeo } from "next-seo";

type BlogIndexProps = Awaited<ReturnType<typeof getStaticProps>>["props"];

const BlogIndex: NextPage<BlogIndexProps> = ({ posts }) => {
  const { t } = useTranslation();
  return (
    <>
      <NextSeo title={`${t("blogList")} | ${t("title")}`} />
      <AnimateContainer>
        <div className="py-6">
          <PostList posts={posts} />
        </div>
      </AnimateContainer>
    </>
  );
};

export async function getStaticProps({ locale }) {
  const posts = await getAllSortedPosts(locale);
  return {
    props: {
      posts,
      ...(await serverSideTranslations(locale, ["common"])),
    },
  };
}

export default BlogIndex;

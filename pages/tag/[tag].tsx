import { NextPage } from "next";
import { getAllTagsWithLocale, getSortedPostsByTags } from "~/lib/api";
import AnimateContainer from "~/components/AnimateContainer";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import "dayjs/locale/zh";
import PostList from "~/components/PostList";
import { NextSeo } from "next-seo";
import { useTranslation } from "react-i18next";

type PostsByTagProps = Awaited<ReturnType<typeof getStaticProps>>["props"];

const PostsByTag: NextPage<PostsByTagProps> = ({ posts, tag }) => {
  const { t } = useTranslation();
  return (
    <>
      <NextSeo title={`#${tag} | ${t("title")}`} />
      <AnimateContainer>
        <div className="w-full md:h-44 py-8 flex justify-center items-center">
          <span className="text-6xl text-base-content">#{tag}</span>
        </div>
        <div className="pb-4">
          <PostList posts={posts} />
        </div>
      </AnimateContainer>
    </>
  );
};

export async function getStaticProps({ locale, params }) {
  const posts = await getSortedPostsByTags(params.tag, locale);
  return {
    props: {
      tag: params.tag,
      posts: posts,
      ...(await serverSideTranslations(locale, ["common"])),
    },
  };
}

export async function getStaticPaths() {
  const tagsWithLocale = await getAllTagsWithLocale();

  return {
    paths: tagsWithLocale.map((tagsWithLocale) => {
      return {
        params: {
          tag: tagsWithLocale.tag,
        },
        locale: tagsWithLocale.locale,
      };
    }),
    fallback: false,
  };
}

export default PostsByTag;

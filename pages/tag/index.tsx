import { NextPage } from "next";
import { getAllPostTagsByOccurTimes } from "~/lib/api";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import { TagCloud } from "react-tagcloud";
import "dayjs/locale/zh";
import { Trans, useTranslation } from "next-i18next";
import React from "react";
import NoScrollLink from "~/components/NoScrollLink";
import { motion } from "framer-motion";
import { NextSeo } from "next-seo";

const TagRenderer = (
  tag: {
    value: string;
  },
  size: number,
  color: string
) => {
  return (
    <NoScrollLink
      key={tag.value}
      href={`/tag/${tag.value}`}
      prefetch={false}
      passHref
    >
      <motion.a
        whileHover={{ scale: 1.1 }}
        style={{ fontSize: size, color }}
        className={"link-hover inline-block tag-cloud-tag"}
      >
        #{tag.value}
      </motion.a>
    </NoScrollLink>
  );
};

type TagIndexProps = Awaited<ReturnType<typeof getStaticProps>>["props"];

const TagIndex: NextPage<TagIndexProps> = ({ tags }) => {
  const { t } = useTranslation();
  return (
    <>
      <NextSeo title={`${t("allPostTags")} | ${t("title")}`} />
      <div className="hero bg-base-200 min-h-[calc(100vh-12rem)]">
        <div className="hero-content text-center">
          <div className="max-w-2xl">
            <h1 className="text-5xl font-bold my-4">
              <Trans i18nKey="allPostTags" />
            </h1>
            <TagCloud
              className="space-x-3"
              disableRandomColor
              minSize={14}
              maxSize={35}
              tags={tags}
              renderer={TagRenderer}
              onClick={(tag: Parameters<typeof TagRenderer>[0]) =>
                alert(`'${tag.value}' was selected!`)
              }
            />
          </div>
        </div>
      </div>
    </>
  );
};

export async function getStaticProps({ locale }) {
  const tags = await getAllPostTagsByOccurTimes(locale);
  return {
    props: {
      tags,
      ...(await serverSideTranslations(locale, ["common"])),
    },
  };
}

export default TagIndex;

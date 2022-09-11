import { MDXRemote } from "next-mdx-remote";
import { getPostByPath, PostType, getAllSortedPosts } from "~/lib/api";
import { NextPage } from "next";
import AnimateContainer from "~/components/AnimateContainer";
import { AUTHOR_NAME, TWIKOO_URL } from "~/lib/constants";
import dayjs from "dayjs";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import { ArrowUpIcon } from "@heroicons/react/solid";
import Prism from "prismjs";
import { useEffect, useRef, useState } from "react";
import { useCopyToClipboard } from "react-use";
import { motion } from "framer-motion";
import {
  ClipboardCopyIcon,
  ClipboardCheckIcon,
} from "@heroicons/react/outline";
import "dayjs/locale/zh";
import { useTranslation } from "react-i18next";
import { useRouter } from "next/router";
import TocButton from "~/components/TocButton";
import React from "react";
import { NextSeo } from "next-seo";
import Script from "next/script";

const Pre = (props) => {
  const [, copyToClipboard] = useCopyToClipboard();
  const [copied, setCopied] = useState(false);
  const timeOutIdRef = useRef(0);
  useEffect(() => {
    if (copied === true) {
      timeOutIdRef.current = window.setTimeout(() => {
        setCopied(false);
      }, 2000);
    }
  }, [copied]);
  return (
    <div className="relative">
      <button
        onClick={() => {
          clearTimeout(timeOutIdRef.current);
          copyToClipboard(props.children.props.children);
          setCopied(true);
        }}
        className="absolute right-1 top-1"
      >
        {!copied && (
          <ClipboardCopyIcon className="w-5 h-5 opacity-80 text-white" />
        )}
        {copied && (
          <ClipboardCheckIcon className="w-5 h-5 opacity-80 text-success" />
        )}
      </button>
      <pre {...props}>{props?.children}</pre>
    </div>
  );
};

const Post: NextPage<{ post: PostType }> = ({ post }) => {
  useEffect(() => {
    Prism.highlightAll();
  }, []);
  const { i18n, t } = useTranslation();
  const router = useRouter();
  return (
    <>
      <Script
        id="twikoo"
        strategy="afterInteractive"
        src="https://rorsch-1256426089.file.myqcloud.com/public/libs/twikoo/1.6.7/twikoo.all.min.js"
        onReady={() => {
          twikoo.init({
            envId: TWIKOO_URL,
            el: "#comment",
          });
          console.log(twikoo);
        }}
      ></Script>
      <NextSeo
        title={`${post.frontmatter.title} | ${t("title")}`}
        description={post.frontmatter.excerpt}
      />
      <AnimateContainer>
        <article>
          <header className="flex flex-col py-8 gap-6 items-center justify-center">
            <div className="flex gap-2 py-6 flex-col items-center">
              <h1 className="text-5xl lg:[font-size:3rem] font-bold uppercase">
                {post.frontmatter.title}
              </h1>
              <span className="text-lg">
                <time dateTime="post.frontmatter.date">
                  {dayjs(post.frontmatter.date)
                    .locale(i18n.language)
                    .format("MMM DD, YYYY")}
                </time>{" "}
                by {post.frontmatter.author || AUTHOR_NAME}
              </span>
              <div className="space-x-2">
                {post.frontmatter.tags.map((tag) => (
                  <motion.button
                    key={tag}
                    onClick={(e) => {
                      e.preventDefault();
                      router.push(`/tag/${tag}`, undefined, {
                        locale: i18n.language,
                        scroll: false,
                      });
                    }}
                    className="link-hover"
                  >
                    #{tag}
                  </motion.button>
                ))}
              </div>
            </div>
            {post.frontmatter.coverImage && (
              <picture className="max-w-4xl md:max-h-screen w-full items-center overflow-hidden rounded-lg">
                <img
                  className="object-cover w-full h-full"
                  src={post.frontmatter.coverImage}
                  alt="unimportant"
                />
              </picture>
            )}
          </header>
          <section className="prose prose-base dark:prose-invert max-w-4xl md:prose-lg  mx-auto prose-img:w-full pb-10">
            <MDXRemote {...post} components={{ pre: Pre }} />
          </section>
        </article>
        <div className="flex justify-center">
          <div className="w-full max-w-4xl">
            <div id="comment" />
          </div>
        </div>
      </AnimateContainer>
      <TocButton headings={post.headings} />
      <motion.button
        onClick={() => window.scroll(0, 0)}
        initial={{
          x: 0,
        }}
        animate={{
          x: 30,
          transition: {
            delay: 3,
          },
        }}
        whileHover={{
          x: 0,
          transition: {
            duration: 0.1,
          },
        }}
        className="btn btn-circle btn-xl fixed bottom-2 right-2"
      >
        <ArrowUpIcon className="w-6 h-6" />
      </motion.button>
    </>
  );
};

export async function getStaticProps({
  params,
  locale,
}: {
  params: { slug: string };
  locale: string;
}) {
  const post = await getPostByPath(params.slug);
  return {
    props: {
      post: post,
      ...(await serverSideTranslations(locale, ["common"])),
    },
  };
}

export async function getStaticPaths() {
  const posts = await getAllSortedPosts();

  return {
    paths: posts.map((post) => {
      return {
        params: {
          slug: post.route,
        },
        locale: post.frontmatter.locale,
      };
    }),
    fallback: false,
  };
}

export default Post;

import dayjs from "dayjs";
import { motion } from "framer-motion";
import { useTranslation } from "next-i18next";
import React from "react";
import NoScrollLink from "~/components/NoScrollLink";
import { PostType } from "~/lib/api";
import "dayjs/locale/zh";
import { useRouter } from "next/router";
import { BookOpenIcon } from "@heroicons/react/outline";

type PostListProps = {
  posts: PostType[];
};

const PostList: React.FC<PostListProps> = ({ posts }) => {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  return (
    <div className="max-w-5xl m-auto">
      {posts?.map((post, index) => (
        <NoScrollLink key={post.route} href={`/blog/${post.route}`} passHref>
          <motion.a className="inline-block bg-gradient-to-b from-primary to-secondary">
            <motion.article
              whileHover={{
                x: 10,
              }}
              className={`grid md:h-56 gap-3 py-8 px-4 bg-base-100 transparent md:gap-6 md:grid-cols-4`}
            >
              <header
                className={`flex flex-col gap-1 justify-center ${
                  post.frontmatter.coverImage
                    ? "md:col-span-3"
                    : "md:col-span-4"
                }`}
              >
                <h2 className="text-3xl uppercase leading-snug tracking-tighter font-bold col-span-2">
                  {post.frontmatter.title}
                </h2>
                <div className="flex items-center gap-3">
                  <time
                    className="font-light text-gray-600 dark:text-slate-300"
                    dateTime={post.frontmatter.date}
                  >
                    {dayjs(post.frontmatter.date)
                      .locale(i18n.language)
                      .format("MMM DD, YYYY")}
                  </time>
                  <div className="flex gap-1 items-center justify-center">
                    <span className="w-4 h-4">
                      <BookOpenIcon />
                    </span>
                    <span className="font-light text-gray-600 dark:text-slate-300">
                      {t("minToRead", { min: post.timeToRead.minutes })}
                    </span>
                  </div>
                </div>
                <div className={`md:flex md:items-center`}>
                  <p className="line-clamp-1">{post.frontmatter.excerpt}</p>
                </div>
                <div className="space-x-2 py-2">
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
                      className="link-hover link-primary"
                    >
                      #{tag}
                    </motion.button>
                  ))}
                </div>
              </header>
              {post.frontmatter.coverImage && (
                <picture className="max-h-72 overflow-hidden rounded-lg">
                  <img
                    className="object-cover w-full h-full"
                    src={post.frontmatter.coverImage}
                    alt="unimportant"
                  />
                </picture>
              )}
            </motion.article>
          </motion.a>
        </NoScrollLink>
      ))}
    </div>
  );
};

export default PostList;

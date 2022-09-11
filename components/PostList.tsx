import dayjs from "dayjs";
import { motion } from "framer-motion";
import { useTranslation } from "next-i18next";
import React from "react";
import NoScrollLink from "~/components/NoScrollLink";
import { PostType } from "~/lib/api";
import "dayjs/locale/zh";
import { useRouter } from "next/router";

type PostListProps = {
  posts: PostType[];
};

const PostList: React.FC<PostListProps> = ({ posts }) => {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  return (
    <>
      {posts?.map((post, index) => (
        <NoScrollLink key={post.route} href={`/blog/${post.route}`} passHref>
          <motion.a className="inline-block bg-gradient-to-b from-primary to-secondary">
            <motion.article
              whileHover={{
                x: 10,
              }}
              className={`grid md:h-56 gap-3 py-8 px-4 bg-base-100 transparent md:gap-6 md:grid-cols-4`}
            >
              <header className="flex flex-col justify-center">
                <h2 className="text-3xl uppercase leading-snug tracking-tighter font-bold col-span-2">
                  {post.frontmatter.title}
                </h2>
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
                      className="link-hover"
                    >
                      #{tag}
                    </motion.button>
                  ))}
                </div>
              </header>

              <div className="flex justify-between items-center gap-1 md:order-1 md:flex-col md:justify-center md:items-end">
                <time
                  className="font-extrabold text-gray-600 dark:text-slate-300 text-lg"
                  dateTime={post.frontmatter.date}
                >
                  {dayjs(post.frontmatter.date)
                    .locale(i18n.language)
                    .format("MMM DD, YYYY")}
                </time>
                <span className="font-light text-gray-600 dark:text-slate-300">
                  {t("minToRead", { min: post.timeToRead.minutes })}
                </span>
              </div>
              <div
                className={`md:flex md:items-center text-gray-800 dark:text-slate-400 ${
                  post.frontmatter.coverImage
                    ? "md:col-span-1"
                    : "md:col-span-2"
                }`}
              >
                <p className="line-clamp-3">{post.frontmatter.excerpt}</p>
              </div>

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
    </>
  );
};

export default PostList;

import fs from "fs";
import { join } from "path";
import readingTime, { ReadTimeResults } from "reading-time";
import { serialize } from "next-mdx-remote/serialize";
import { MDXRemoteSerializeResult } from "next-mdx-remote";
import { i18n } from "../next-i18next.config";
import dayjs from "dayjs";
import { hasProperty } from "hast-util-has-property";
import { headingRank } from "hast-util-heading-rank";
import { toString } from "hast-util-to-string";
import { visit } from "unist-util-visit";
import { Root } from "hast";
import rehypeSlug from "rehype-slug";

export default function rehypeExtractHeadings({ rank = 2, headings }) {
  return (tree: Root) => {
    visit(tree, "element", (node) => {
      if (
        headingRank(node) >= rank &&
        node.properties &&
        hasProperty(node, "id")
      ) {
        headings.push({
          title: toString(node),
          id: node.properties.id.toString(),
          rank: headingRank(node),
        });
      }
    });
  };
}

const postsDirectory = join(process.cwd(), "posts");

export type Frontmatter = {
  title: string;
  date: string;
  coverImage: string;
  excerpt: string;
  ogImage: string;
  author: string;
  tags?: string[];
  locale?: string;
};

export type PostType = MDXRemoteSerializeResult<
  Record<string, unknown>,
  Frontmatter
> & {
  headings: any[];
  route: string;
  timeToRead: ReadTimeResults;
};

export function getPostFilenames() {
  return fs.readdirSync(postsDirectory);
}

export async function getPostByPath(blogPath: string): Promise<PostType> {
  const postRoute = blogPath;
  const postFilenames = getPostFilenames();
  const fullPath = join(
    postsDirectory,
    postFilenames.find((i) => i.startsWith(blogPath))
  );

  const fileContents = fs.readFileSync(fullPath, "utf8");

  const timeToRead = readingTime(fileContents);

  const headings = [];
  const mdxSource = await serialize(fileContents, {
    parseFrontmatter: true,
    mdxOptions: {
      remarkPlugins: [],
      rehypePlugins: [
        rehypeSlug,
        [rehypeExtractHeadings, { rank: 2, headings }],
      ],
    },
  });

  return {
    ...mdxSource,
    headings,
    route: postRoute,
    timeToRead: { ...timeToRead, minutes: Math.ceil(timeToRead.minutes) },
  };
}

export const getPostPaths = async () => {
  const postPaths = getPostFilenames();
  return postPaths.map((p) => p.replace(/\.mdx?$/, ""));
};

export const getAllPosts = async (locale?: string) => {
  const postPaths = await getPostPaths();
  const allPosts = await Promise.all(
    postPaths.map(async (p) => await getPostByPath(p))
  );
  return locale
    ? allPosts.filter(
        (p) => (p.frontmatter.locale || i18n.defaultLocale) === locale
      )
    : allPosts;
};

export const getAllSortedPosts = async (locale?: string) => {
  const allPosts = await getAllPosts();
  const sortedPosts = allPosts.sort(
    (a, b) => -dayjs(a.frontmatter.date).diff(dayjs(b.frontmatter.date))
  );
  return locale
    ? sortedPosts.filter(
        (p) => (p.frontmatter.locale || i18n.defaultLocale) === locale
      )
    : sortedPosts;
};

export const getAllPostTagsByOccurTimes = async (locale: string) => {
  const allPosts = await getAllPosts(locale);
  let result: { value: string; count: number }[] = [];
  const allTags = allPosts.flatMap((post) => post.frontmatter.tags || []);
  allTags.forEach((tag) => {
    const tagIndex = result.findIndex((i) => i.value === tag);
    if (tagIndex < 0) return result.push({ value: tag, count: 1 });
    result[tagIndex] = { value: tag, count: result[tagIndex].count + 1 };
  });
  return result;
};

export const getAllTagsWithLocale = async () => {
  const allPosts = await getAllPosts();
  let allTags: { locale: string; tag: string }[] = [];
  allPosts.forEach((post) => {
    const postTags = post.frontmatter.tags || [];
    const postLocale = post.frontmatter.locale || i18n.defaultLocale;
    allTags = allTags.concat(
      postTags.map((tag) => ({ locale: postLocale, tag }))
    );
  });
  return allTags;
};

export const getSortedPostsByTags = async (tag: string, locale: string) => {
  const posts = await getAllPosts(locale);
  return posts
    .sort((a, b) => -dayjs(a.frontmatter.date).diff(dayjs(b.frontmatter.date)))
    .filter((i) => (i.frontmatter.tags || []).includes(tag));
};

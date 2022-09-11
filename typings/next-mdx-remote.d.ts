import "next-mdx-remote";
import { Frontmatter } from "~/lib/api";
declare module "next-mdx-remote" {
  type MDXRemoteProps = MDXRemoteSerializeResult<
    Record<string, unknown>,
    Frontmatter
  > & {
    components?: React.ComponentProps<typeof mdx.MDXProvider>["components"];
    lazy?: boolean;
  };

  function MDXRemote({
    compiledSource,
    frontmatter,
    scope,
    components,
    lazy,
  }: MDXRemoteProps): JSX.Element;
}

declare module "next-mdx-remote/serialize" {
  function serialize(
    /** Raw MDX contents as a string. */
    source: string,
    { scope, mdxOptions, parseFrontmatter }?: SerializeOptions
  ): Promise<MDXRemoteSerializeResult<Record<string, unknown>, Frontmatter>>;
}

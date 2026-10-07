import "server-only";
import * as runtime from "react/jsx-runtime";
import { evaluate } from "@mdx-js/mdx";
import remarkGfm from "remark-gfm";
import { remarkCellIds } from "./parse";
import { Callout, Expect, Explain, mdxElements } from "@/components/notebook/cells/static";
import { Prompt } from "@/components/notebook/cells/prompt";
import { Checkpoint } from "@/components/notebook/cells/checkpoint";
import { Decision } from "@/components/notebook/cells/decision";
import { Diagram, Interview, Pitfall, Quiz } from "@/components/notebook/cells/interactive";

export const cellComponents = {
  Explain,
  Prompt,
  Expect,
  Checkpoint,
  Pitfall,
  Decision,
  Interview,
  Quiz,
  Diagram,
  Callout,
};

/**
 * Compile and render MDX on the server. Content is trusted (it ships from git),
 * never user input.
 */
export async function MdxContent({ source }: { source: string }) {
  const { default: Content } = await evaluate(source, {
    ...runtime,
    remarkPlugins: [remarkGfm, remarkCellIds],
    development: false,
  });
  return <Content components={{ ...mdxElements, ...cellComponents }} />;
}

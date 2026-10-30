import defaultMdxComponents from "fumadocs-ui/mdx";
import type { MDXComponents } from "mdx/types";
import type { ComponentProps } from "react";
import { Hint } from "./hint";
import { CardLibrary } from "./card-library";
import { LearnMap } from "./learn-map";
import { Task } from "./step-frame";
import { LearningRoadmap } from "./learning-roadmap";
import { StepCards } from "./step-cards";
import { SubmissionPanel } from "./submission-panel";
import { ToolTable } from "./tool-table";

// ลิงก์ไปไฟล์จาก API (เช่น PDF Requirement) ไม่ใช่หน้าเว็บ ให้เปิดแท็บใหม่แบบลิงก์ธรรมดา
// (ลิงก์หน้าเว็บใช้ Link ของ Next ตามปกติ เปลี่ยนหน้าได้โดยไม่โหลดใหม่ทั้งหน้า)
function Anchor(props: ComponentProps<"a">) {
  if (props.href?.startsWith("/api/")) return <a {...props} target="_blank" rel="noopener" />;
  const DefaultLink = defaultMdxComponents.a;
  return <DefaultLink {...props} />;
}

// component ที่เรียกใช้ในไฟล์ .mdx ได้ เช่น <LearningRoadmap /> ในหน้าแรก, <ToolTable group="..." /> ในบทเรียน
export function getMDXComponents(components?: MDXComponents) {
  return { ...defaultMdxComponents, a: Anchor, CardLibrary, Hint, LearnMap, LearningRoadmap, StepCards, SubmissionPanel, Task, ToolTable, ...components } satisfies MDXComponents;
}

declare global {
  type MDXProvidedComponents = ReturnType<typeof getMDXComponents>;
}

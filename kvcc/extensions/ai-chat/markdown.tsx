import { Fragment } from "react";
import type { ReactNode } from "react";
import { CodeBlock } from "../code-block/code-block";
import styles from "./ai-chat.module.css";

/** A small, safe markdown subset for model output: paragraphs, headings (rendered as emphasized lines), bullet and numbered lists, quotes, fenced code, **bold**, `code` and http(s)/mailto links. Builds React nodes only, never HTML strings, so model text cannot inject markup. */
export interface AiMarkdownProps {
  text: string;
}

type Block =
  | { kind: "paragraph"; lines: string[] }
  | { kind: "heading"; text: string }
  | { kind: "list"; ordered: boolean; items: string[] }
  | { kind: "quote"; lines: string[] }
  | { kind: "code"; language: string; code: string };

const FENCE = /^```\s*([\w+#.-]*)\s*$/;
const HEADING = /^#{1,6}\s+(.*)$/;
const BULLET = /^\s*[-*]\s+(.*)$/;
const NUMBERED = /^\s*\d+[.)]\s+(.*)$/;
const QUOTE = /^>\s?(.*)$/;
const SAFE_LINK = /^(https?:|mailto:)/i;
const INLINE = /(`[^`\n]+`|\*\*[^*\n]+\*\*|\[[^\]\n]+\]\([^)\s]+\))/g;

function parseBlocks(text: string): Block[] {
  const blocks: Block[] = [];
  const lines = text.replace(/\r\n/g, "\n").split("\n");
  let index = 0;
  while (index < lines.length) {
    const line = lines[index] ?? "";
    const fence = FENCE.exec(line);
    if (fence) {
      // An unclosed fence is a block still streaming in: show what has arrived as code.
      const body: string[] = [];
      index++;
      while (index < lines.length && !FENCE.test(lines[index] ?? "")) body.push(lines[index++] ?? "");
      index++;
      blocks.push({ kind: "code", language: fence[1] ?? "", code: body.join("\n") });
      continue;
    }
    if (!line.trim()) { index++; continue; }
    const heading = HEADING.exec(line);
    if (heading) { blocks.push({ kind: "heading", text: heading[1] ?? "" }); index++; continue; }
    const listMatch = BULLET.test(line) ? BULLET : NUMBERED.test(line) ? NUMBERED : null;
    if (listMatch) {
      const items: string[] = [];
      while (index < lines.length && listMatch.test(lines[index] ?? "")) items.push(listMatch.exec(lines[index++] ?? "")?.[1] ?? "");
      blocks.push({ kind: "list", ordered: listMatch === NUMBERED, items });
      continue;
    }
    if (QUOTE.test(line)) {
      const quoted: string[] = [];
      while (index < lines.length && QUOTE.test(lines[index] ?? "")) quoted.push(QUOTE.exec(lines[index++] ?? "")?.[1] ?? "");
      blocks.push({ kind: "quote", lines: quoted });
      continue;
    }
    const paragraph: string[] = [];
    while (index < lines.length && (lines[index] ?? "").trim() && !FENCE.test(lines[index] ?? "") && !HEADING.test(lines[index] ?? "") && !BULLET.test(lines[index] ?? "") && !NUMBERED.test(lines[index] ?? "") && !QUOTE.test(lines[index] ?? "")) paragraph.push(lines[index++] ?? "");
    blocks.push({ kind: "paragraph", lines: paragraph });
  }
  return blocks;
}

function renderInline(text: string): ReactNode[] {
  return text.split(INLINE).map((part, i) => {
    if (part.startsWith("`") && part.endsWith("`") && part.length > 2) return <code key={i} className={styles.inlineCode}>{part.slice(1, -1)}</code>;
    if (part.startsWith("**") && part.endsWith("**") && part.length > 4) return <strong key={i}>{part.slice(2, -2)}</strong>;
    const link = /^\[([^\]]+)\]\(([^)\s]+)\)$/.exec(part);
    if (link) {
      const [, label = "", href = ""] = link;
      // Anything but http, https or mailto (javascript:, data:, relative paths) stays plain text.
      return SAFE_LINK.test(href) ? <a key={i} className={styles.link} href={href} target="_blank" rel="noopener noreferrer">{label}</a> : <Fragment key={i}>{label}</Fragment>;
    }
    return <Fragment key={i}>{part}</Fragment>;
  });
}

const withBreaks = (lines: string[]): ReactNode[] => lines.flatMap((line, i) => (i === 0 ? renderInline(line) : [<br key={`br${i}`} />, ...renderInline(line)]));

export function AiMarkdown({ text }: AiMarkdownProps) {
  return <div className={styles.markdown}>
    {parseBlocks(text).map((block, i) => {
      switch (block.kind) {
        case "heading": return <p key={i} className={styles.mdHeading}>{renderInline(block.text)}</p>;
        case "list": {
          const Tag = block.ordered ? "ol" : "ul";
          return <Tag key={i} className={styles.mdList}>{block.items.map((item, j) => <li key={j}>{renderInline(item)}</li>)}</Tag>;
        }
        case "quote": return <blockquote key={i} className={styles.mdQuote}>{withBreaks(block.lines)}</blockquote>;
        case "code": return <div key={i} className={styles.mdCode}><CodeBlock code={block.code} language={block.language || undefined} /></div>;
        default: return <p key={i} className={styles.mdParagraph}>{withBreaks(block.lines)}</p>;
      }
    })}
  </div>;
}

import type { JSONContent } from "@tiptap/react";

/**
 * Minimal, dependency-free markdown -> TipTap JSON converter. Covers the
 * subset of markdown a plain-text meeting-notes-style import realistically
 * needs: headings, paragraphs, bullet/numbered lists, and bold/italic
 * inline emphasis. Not a full CommonMark implementation by design — that
 * would be scope creep for a file-import feature that only needs to
 * preserve structure, not round-trip arbitrary markdown.
 */
export function markdownToTiptapDoc(markdown: string): JSONContent {
  const lines = markdown.replace(/\r\n/g, "\n").split("\n");
  const content: JSONContent[] = [];

  let listBuffer: { type: "bulletList" | "orderedList"; items: string[] } | null =
    null;
  let paragraphBuffer: string[] = [];

  const flushParagraph = () => {
    if (paragraphBuffer.length === 0) return;
    const text = paragraphBuffer.join(" ").trim();
    paragraphBuffer = [];
    if (text) {
      content.push({ type: "paragraph", content: parseInline(text) });
    }
  };

  const flushList = () => {
    if (!listBuffer) return;
    content.push({
      type: listBuffer.type,
      content: listBuffer.items.map((item) => ({
        type: "listItem",
        content: [{ type: "paragraph", content: parseInline(item) }],
      })),
    });
    listBuffer = null;
  };

  for (const rawLine of lines) {
    const line = rawLine.trimEnd();

    if (line.trim() === "") {
      flushParagraph();
      flushList();
      continue;
    }

    const headingMatch = /^(#{1,6})\s+(.*)$/.exec(line);
    if (headingMatch) {
      flushParagraph();
      flushList();
      const level = Math.min(headingMatch[1]!.length, 2); // editor supports H1/H2
      content.push({
        type: "heading",
        attrs: { level },
        content: parseInline(headingMatch[2]!.trim()),
      });
      continue;
    }

    const bulletMatch = /^[-*]\s+(.*)$/.exec(line);
    if (bulletMatch) {
      flushParagraph();
      if (listBuffer && listBuffer.type !== "bulletList") flushList();
      listBuffer ??= { type: "bulletList", items: [] };
      listBuffer.items.push(bulletMatch[1]!.trim());
      continue;
    }

    const orderedMatch = /^\d+[.)]\s+(.*)$/.exec(line);
    if (orderedMatch) {
      flushParagraph();
      if (listBuffer && listBuffer.type !== "orderedList") flushList();
      listBuffer ??= { type: "orderedList", items: [] };
      listBuffer.items.push(orderedMatch[1]!.trim());
      continue;
    }

    flushList();
    paragraphBuffer.push(line.trim());
  }

  flushParagraph();
  flushList();

  return {
    type: "doc",
    content: content.length > 0 ? content : [{ type: "paragraph" }],
  };
}

/** Plain-text import: blank-line-separated paragraphs, no markdown parsing. */
export function textToTiptapDoc(text: string): JSONContent {
  const paragraphs = text
    .replace(/\r\n/g, "\n")
    .split(/\n{2,}/)
    .map((block) => block.replace(/\n/g, " ").trim())
    .filter(Boolean);

  return {
    type: "doc",
    content:
      paragraphs.length > 0
        ? paragraphs.map((p) => ({
            type: "paragraph",
            content: [{ type: "text", text: p }],
          }))
        : [{ type: "paragraph" }],
  };
}

function parseInline(text: string): JSONContent[] {
  if (!text) return [];

  const nodes: JSONContent[] = [];
  // Order matters: bold before italic so **x** isn't half-consumed by *.
  const pattern = /(\*\*\*(.+?)\*\*\*)|(\*\*(.+?)\*\*)|(\*(.+?)\*)/g;

  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(text)) !== null) {
    if (match.index > lastIndex) {
      nodes.push({ type: "text", text: text.slice(lastIndex, match.index) });
    }

    if (match[2] !== undefined) {
      nodes.push({
        type: "text",
        text: match[2],
        marks: [{ type: "bold" }, { type: "italic" }],
      });
    } else if (match[4] !== undefined) {
      nodes.push({ type: "text", text: match[4], marks: [{ type: "bold" }] });
    } else if (match[6] !== undefined) {
      nodes.push({ type: "text", text: match[6], marks: [{ type: "italic" }] });
    }

    lastIndex = pattern.lastIndex;
  }

  if (lastIndex < text.length) {
    nodes.push({ type: "text", text: text.slice(lastIndex) });
  }

  return nodes.length > 0 ? nodes : [{ type: "text", text }];
}

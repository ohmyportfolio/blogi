"use client";

import { LexicalComposer } from "@lexical/react/LexicalComposer";
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin";
import { ContentEditable } from "@lexical/react/LexicalContentEditable";
import { LexicalErrorBoundary } from "@lexical/react/LexicalErrorBoundary";
import { ListNode, ListItemNode } from "@lexical/list";
import { LinkNode, AutoLinkNode } from "@lexical/link";
import { HeadingNode, QuoteNode } from "@lexical/rich-text";
import { CodeNode, CodeHighlightNode, registerCodeHighlighting } from "@lexical/code";
import { TableNode, TableCellNode, TableRowNode } from "@lexical/table";
import { HorizontalRuleNode } from "@lexical/react/LexicalHorizontalRuleNode";
import { lexicalTheme } from "@/components/editor/lexical-theme";
import { ImageNode } from "@/components/editor/nodes/ImageNode";
import { $createParagraphNode, $createTextNode, $getRoot, type LexicalEditor } from "lexical";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { useEffect } from "react";
import { TablePlugin } from "@lexical/react/LexicalTablePlugin";

interface RichTextViewerProps {
  content: string;
  className?: string;
}

const buildInitialState = (content: string) => (editor: LexicalEditor) => {
  if (!content) return;
  try {
    JSON.parse(content);
    const state = editor.parseEditorState(content);
    editor.setEditorState(state);
  } catch {
    editor.update(() => {
      const root = $getRoot();
      root.clear();
      const paragraph = $createParagraphNode();
      paragraph.append($createTextNode(content));
      root.append(paragraph);
    });
  }
};

const CodeHighlightingPlugin = () => {
  const [editor] = useLexicalComposerContext();
  useEffect(() => registerCodeHighlighting(editor), [editor]);
  return null;
};

export function RichTextViewer({ content, className }: RichTextViewerProps) {
  const defaultClassName =
    "blog-content min-h-[220px] rounded-3xl border border-black/5 bg-white/90 px-5 sm:px-8 py-6 sm:py-8 shadow-[0_20px_60px_-40px_rgba(15,23,42,0.45)]";
  const contentClassName = className ? `${defaultClassName} ${className}` : defaultClassName;
  const initialConfig = {
    namespace: "blogi-viewer",
    theme: lexicalTheme,
    editable: false,
    nodes: [
      HeadingNode,
      QuoteNode,
      ListNode,
      ListItemNode,
      LinkNode,
      AutoLinkNode,
      CodeNode,
      CodeHighlightNode,
      TableNode,
      TableRowNode,
      TableCellNode,
      HorizontalRuleNode,
      ImageNode,
    ],
    onError: (error: Error) => {
      throw error;
    },
    editorState: buildInitialState(content),
  };

  return (
    <LexicalComposer initialConfig={initialConfig}>
      <RichTextPlugin
        contentEditable={
          <ContentEditable
            className={
              contentClassName
            }
          />
        }
        placeholder={null}
        ErrorBoundary={LexicalErrorBoundary}
      />
      <TablePlugin hasHorizontalScroll />
      <CodeHighlightingPlugin />
    </LexicalComposer>
  );
}

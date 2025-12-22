"use client";

import {
  $createParagraphNode,
  $createTextNode,
  $getSelection,
  $getRoot,
  $isRangeSelection,
  $isTextNode,
  $setSelection,
  COMMAND_PRIORITY_EDITOR,
  FORMAT_ELEMENT_COMMAND,
  FORMAT_TEXT_COMMAND,
  REDO_COMMAND,
  UNDO_COMMAND,
  type LexicalEditor,
} from "lexical";
import { $patchStyleText, $setBlocksType } from "@lexical/selection";
import { HeadingNode, QuoteNode, $createHeadingNode, $createQuoteNode, $isHeadingNode } from "@lexical/rich-text";
import {
  ListNode,
  ListItemNode,
  INSERT_ORDERED_LIST_COMMAND,
  INSERT_UNORDERED_LIST_COMMAND,
  REMOVE_LIST_COMMAND,
  $isListNode,
  INSERT_CHECK_LIST_COMMAND,
} from "@lexical/list";
import { LinkNode, AutoLinkNode, TOGGLE_LINK_COMMAND, $isLinkNode, createLinkMatcherWithRegExp } from "@lexical/link";
import { CodeNode, CodeHighlightNode, $createCodeNode, $isCodeNode, registerCodeHighlighting } from "@lexical/code";
import { TableNode, TableCellNode, TableRowNode, INSERT_TABLE_COMMAND } from "@lexical/table";
import { LexicalComposer } from "@lexical/react/LexicalComposer";
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin";
import { ContentEditable } from "@lexical/react/LexicalContentEditable";
import { HistoryPlugin } from "@lexical/react/LexicalHistoryPlugin";
import { OnChangePlugin } from "@lexical/react/LexicalOnChangePlugin";
import { ListPlugin } from "@lexical/react/LexicalListPlugin";
import { LinkPlugin } from "@lexical/react/LexicalLinkPlugin";
import { MarkdownShortcutPlugin, DEFAULT_TRANSFORMERS } from "@lexical/react/LexicalMarkdownShortcutPlugin";
import { LexicalErrorBoundary } from "@lexical/react/LexicalErrorBoundary";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { AutoLinkPlugin } from "@lexical/react/LexicalAutoLinkPlugin";
import { CheckListPlugin } from "@lexical/react/LexicalCheckListPlugin";
import { TablePlugin } from "@lexical/react/LexicalTablePlugin";
import { HorizontalRulePlugin } from "@lexical/react/LexicalHorizontalRulePlugin";
import { HorizontalRuleNode, INSERT_HORIZONTAL_RULE_COMMAND } from "@lexical/react/LexicalHorizontalRuleNode";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";
import data from "@emoji-mart/data";
import { Picker } from "emoji-mart";
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  Code,
  List,
  ListOrdered,
  ListChecks,
  Quote,
  SquareCode,
  Table as TableIcon,
  SeparatorHorizontal,
  Undo,
  Redo,
  Link as LinkIcon,
  Image as ImageIcon,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Heading1,
  Heading2,
  Heading3,
  Highlighter,
  Smile,
  Unlink,
} from "lucide-react";
import { lexicalTheme } from "@/components/editor/lexical-theme";
import {
  ImageNode,
  INSERT_IMAGE_COMMAND,
  $createImageNode,
  type ImagePayload,
} from "@/components/editor/nodes/ImageNode";
import { $convertToMarkdownString } from "@lexical/markdown";
import type { RangeSelection } from "lexical";

interface RichTextEditorProps {
  content: string;
  onChange: (content: string) => void;
  onMarkdownChange?: (markdown: string) => void;
  placeholder?: string;
  className?: string;
}

const ToolbarButton = ({
  onClick,
  isActive,
  title,
  children,
}: {
  onClick: () => void;
  isActive?: boolean;
  title: string;
  children: React.ReactNode;
}) => (
  <button
    type="button"
    onClick={onClick}
    onMouseDown={(e) => e.preventDefault()}
    title={title}
    className={cn(
      "p-2 rounded-full hover:bg-black/5 transition-colors",
      isActive && "bg-black/10"
    )}
  >
    {children}
  </button>
);

const Placeholder = ({ text }: { text: string }) => (
  <div className="absolute top-4 left-4 text-sm text-muted-foreground pointer-events-none">
    {text}
  </div>
);

const InitialContentPlugin = ({
  content,
  initializingRef,
}: {
  content: string;
  initializingRef: React.MutableRefObject<boolean>;
}) => {
  const [editor] = useLexicalComposerContext();
  const hydratedRef = useRef(false);

  useEffect(() => {
    if (hydratedRef.current) return;
    if (!content) return;

    let cancelled = false;
    const schedule = (fn: () => void) => {
      if (typeof queueMicrotask === "function") {
        queueMicrotask(fn);
      } else {
        Promise.resolve().then(fn);
      }
    };
    initializingRef.current = true;
    try {
      JSON.parse(content);
      const state = editor.parseEditorState(content);
      schedule(() => {
        if (!cancelled) {
          editor.setEditorState(state);
          hydratedRef.current = true;
          initializingRef.current = false;
        }
      });
    } catch {
      schedule(() => {
        if (cancelled) return;
        editor.update(() => {
          const root = $getRoot();
          root.clear();
          const paragraph = $createParagraphNode();
          paragraph.append($createTextNode(content));
          root.append(paragraph);
        });
        hydratedRef.current = true;
        initializingRef.current = false;
      });
    }
    return () => {
      cancelled = true;
    };
  }, [content, editor, initializingRef]);

  return null;
};

const ImagePlugin = () => {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    return editor.registerCommand<ImagePayload>(
      INSERT_IMAGE_COMMAND,
      (payload) => {
        editor.update(() => {
          const selection = $getSelection();
          if ($isRangeSelection(selection)) {
            const imageNode = $createImageNode(payload);
            selection.insertNodes([imageNode]);
          }
        });
        return true;
      },
      COMMAND_PRIORITY_EDITOR
    );
  }, [editor]);

  return null;
};

const URL_REGEX =
  /((https?:\/\/(www\.)?)|(www\.))[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_+.~#?&//=]*)/;
const EMAIL_REGEX = /[\w.+-]+@[\w-]+\.[\w.-]+/;

const AUTO_LINK_MATCHERS = [
  createLinkMatcherWithRegExp(URL_REGEX, (text) =>
    text.startsWith("http") ? text : `https://${text}`
  ),
  createLinkMatcherWithRegExp(EMAIL_REGEX, (text) => `mailto:${text}`),
];

const CodeHighlightingPlugin = () => {
  const [editor] = useLexicalComposerContext();

  useEffect(() => registerCodeHighlighting(editor), [editor]);

  return null;
};

const MARKDOWN_TRANSFORMERS = DEFAULT_TRANSFORMERS;

const Toolbar = ({
  onImageUpload,
  onEmojiPick,
}: {
  onImageUpload: () => void;
  onEmojiPick: (emoji: { native: string }) => void;
}) => {
  const [editor] = useLexicalComposerContext();
  const [blockType, setBlockType] = useState("paragraph");
  const [isBold, setIsBold] = useState(false);
  const [isItalic, setIsItalic] = useState(false);
  const [isUnderline, setIsUnderline] = useState(false);
  const [isStrike, setIsStrike] = useState(false);
  const [isCode, setIsCode] = useState(false);
  const [isLink, setIsLink] = useState(false);
  const [isHighlight, setIsHighlight] = useState(false);
  const [showLinkInput, setShowLinkInput] = useState(false);
  const [linkUrl, setLinkUrl] = useState("");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const emojiPickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    return editor.registerUpdateListener(({ editorState }) => {
      editorState.read(() => {
        const selection = $getSelection();
        if (!$isRangeSelection(selection)) return;

        setIsBold(selection.hasFormat("bold"));
        setIsItalic(selection.hasFormat("italic"));
        setIsUnderline(selection.hasFormat("underline"));
        setIsStrike(selection.hasFormat("strikethrough"));
        setIsCode(selection.hasFormat("code"));

        const anchorNode = selection.anchor.getNode();
        const parent = anchorNode.getParent();
        const isLinkNode = $isLinkNode(anchorNode) || (parent && $isLinkNode(parent));
        setIsLink(Boolean(isLinkNode));

        const element = anchorNode.getKey() === "root" ? anchorNode : anchorNode.getTopLevelElementOrThrow();
        if ($isListNode(element)) {
          setBlockType(element.getListType());
        } else if ($isCodeNode(element)) {
          setBlockType("code");
        } else if ($isHeadingNode(element)) {
          setBlockType(element.getTag());
        } else {
          setBlockType(element.getType());
        }

        const highlightActive = selection
          .getNodes()
          .some((node) => $isTextNode(node) && node.getStyle().includes("background-color"));
        setIsHighlight(highlightActive);
      });
    });
  }, [editor]);

  const applyHeading = (tag: "h1" | "h2" | "h3") => {
    editor.update(() => {
      const selection = $getSelection();
      if ($isRangeSelection(selection)) {
        $setBlocksType(selection, () => $createHeadingNode(tag));
      }
    });
  };

  const applyParagraph = () => {
    editor.update(() => {
      const selection = $getSelection();
      if ($isRangeSelection(selection)) {
        $setBlocksType(selection, () => $createParagraphNode());
      }
    });
  };

  const applyQuote = () => {
    editor.update(() => {
      const selection = $getSelection();
      if ($isRangeSelection(selection)) {
        $setBlocksType(selection, () => $createQuoteNode());
      }
    });
  };

  const toggleCodeBlock = () => {
    editor.update(() => {
      const selection = $getSelection();
      if (!$isRangeSelection(selection)) return;
      const element = selection.anchor.getNode().getTopLevelElementOrThrow();
      if ($isCodeNode(element)) {
        $setBlocksType(selection, () => $createParagraphNode());
      } else {
        $setBlocksType(selection, () => $createCodeNode());
      }
    });
  };

  const toggleHighlight = () => {
    editor.update(() => {
      const selection = $getSelection();
      if (!$isRangeSelection(selection)) return;
      const hasHighlight = selection
        .getNodes()
        .some((node) => $isTextNode(node) && node.getStyle().includes("background-color"));
      $patchStyleText(selection, {
        "background-color": hasHighlight ? null : "#fef08a",
      });
    });
  };

  const addLink = () => {
    if (linkUrl.trim() === "") {
      editor.dispatchCommand(TOGGLE_LINK_COMMAND, null);
    } else {
      editor.dispatchCommand(TOGGLE_LINK_COMMAND, linkUrl.trim());
    }
    setLinkUrl("");
    setShowLinkInput(false);
  };

  const handleEmojiSelect = useCallback(
    (emoji: { native: string }) => {
      onEmojiPick(emoji);
      setShowEmojiPicker(false);
    },
    [onEmojiPick]
  );

  useEffect(() => {
    if (!showEmojiPicker) return;
    const container = emojiPickerRef.current;
    if (!container) return;

    container.innerHTML = "";
    const picker = new Picker({
      data,
      onEmojiSelect: handleEmojiSelect,
      theme: "light",
      locale: "ko",
      previewPosition: "none",
      skinTonePosition: "none",
    });

    container.appendChild(picker as unknown as Node);

    return () => {
      container.innerHTML = "";
    };
  }, [showEmojiPicker, handleEmojiSelect]);

  return (
    <div className="border-b px-2 py-2 flex gap-1 bg-white/80 overflow-x-auto flex-nowrap sm:flex-wrap">
      <ToolbarButton
        onClick={() => editor.dispatchCommand(UNDO_COMMAND, undefined)}
        title="실행 취소"
      >
        <Undo className="w-4 h-4" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.dispatchCommand(REDO_COMMAND, undefined)}
        title="다시 실행"
      >
        <Redo className="w-4 h-4" />
      </ToolbarButton>

      <div className="w-px h-6 bg-black/10 mx-1 self-center" />

      <ToolbarButton
        onClick={() => applyHeading("h1")}
        isActive={blockType === "h1"}
        title="제목 1"
      >
        <Heading1 className="w-4 h-4" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => applyHeading("h2")}
        isActive={blockType === "h2"}
        title="제목 2"
      >
        <Heading2 className="w-4 h-4" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => applyHeading("h3")}
        isActive={blockType === "h3"}
        title="제목 3"
      >
        <Heading3 className="w-4 h-4" />
      </ToolbarButton>
      <ToolbarButton
        onClick={applyParagraph}
        isActive={blockType === "paragraph"}
        title="본문"
      >
        <span className="text-xs font-semibold">P</span>
      </ToolbarButton>

      <div className="w-px h-6 bg-black/10 mx-1 self-center" />

      <ToolbarButton
        onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, "bold")}
        isActive={isBold}
        title="굵게"
      >
        <Bold className="w-4 h-4" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, "italic")}
        isActive={isItalic}
        title="기울임"
      >
        <Italic className="w-4 h-4" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, "underline")}
        isActive={isUnderline}
        title="밑줄"
      >
        <UnderlineIcon className="w-4 h-4" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, "strikethrough")}
        isActive={isStrike}
        title="취소선"
      >
        <Strikethrough className="w-4 h-4" />
      </ToolbarButton>
      <ToolbarButton
        onClick={toggleHighlight}
        isActive={isHighlight}
        title="하이라이트"
      >
        <Highlighter className="w-4 h-4" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, "code")}
        isActive={isCode}
        title="인라인 코드"
      >
        <Code className="w-4 h-4" />
      </ToolbarButton>

      <div className="w-px h-6 bg-black/10 mx-1 self-center" />

      <ToolbarButton
        onClick={() => editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, "left")}
        title="왼쪽 정렬"
      >
        <AlignLeft className="w-4 h-4" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, "center")}
        title="가운데 정렬"
      >
        <AlignCenter className="w-4 h-4" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, "right")}
        title="오른쪽 정렬"
      >
        <AlignRight className="w-4 h-4" />
      </ToolbarButton>

      <div className="w-px h-6 bg-black/10 mx-1 self-center" />

      <ToolbarButton
        onClick={() =>
          editor.dispatchCommand(
            blockType === "bullet" ? REMOVE_LIST_COMMAND : INSERT_UNORDERED_LIST_COMMAND,
            undefined
          )
        }
        isActive={blockType === "bullet"}
        title="글머리 기호"
      >
        <List className="w-4 h-4" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() =>
          editor.dispatchCommand(
            blockType === "number" ? REMOVE_LIST_COMMAND : INSERT_ORDERED_LIST_COMMAND,
            undefined
          )
        }
        isActive={blockType === "number"}
        title="번호 목록"
      >
        <ListOrdered className="w-4 h-4" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() =>
          editor.dispatchCommand(
            blockType === "check" ? REMOVE_LIST_COMMAND : INSERT_CHECK_LIST_COMMAND,
            undefined
          )
        }
        isActive={blockType === "check"}
        title="체크리스트"
      >
        <ListChecks className="w-4 h-4" />
      </ToolbarButton>
      <ToolbarButton
        onClick={applyQuote}
        isActive={blockType === "quote"}
        title="인용"
      >
        <Quote className="w-4 h-4" />
      </ToolbarButton>
      <ToolbarButton
        onClick={toggleCodeBlock}
        isActive={blockType === "code"}
        title="코드 블록"
      >
        <SquareCode className="w-4 h-4" />
      </ToolbarButton>

      <div className="w-px h-6 bg-black/10 mx-1 self-center" />

      <div className="relative">
        {isLink ? (
          <ToolbarButton
            onClick={() => editor.dispatchCommand(TOGGLE_LINK_COMMAND, null)}
            isActive
            title="링크 제거"
          >
            <Unlink className="w-4 h-4" />
          </ToolbarButton>
        ) : (
          <ToolbarButton
            onClick={() => setShowLinkInput(!showLinkInput)}
            isActive={showLinkInput}
            title="링크 추가"
          >
            <LinkIcon className="w-4 h-4" />
          </ToolbarButton>
        )}
        {showLinkInput && (
          <div className="absolute top-full left-0 mt-2 p-2 bg-white border rounded-lg shadow-lg z-10 flex gap-2">
            <input
              type="url"
              placeholder="URL 입력"
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addLink()}
              className="px-2 py-1 border rounded text-sm w-48"
            />
            <button
              type="button"
              className="px-3 py-1 text-sm rounded-full bg-black text-white"
              onClick={addLink}
            >
              추가
            </button>
          </div>
        )}
      </div>

      <ToolbarButton onClick={onImageUpload} title="이미지 추가">
        <ImageIcon className="w-4 h-4" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() =>
          editor.dispatchCommand(INSERT_TABLE_COMMAND, {
            columns: "3",
            rows: "3",
            includeHeaders: true,
          })
        }
        title="테이블 추가"
      >
        <TableIcon className="w-4 h-4" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.dispatchCommand(INSERT_HORIZONTAL_RULE_COMMAND, undefined)}
        title="구분선"
      >
        <SeparatorHorizontal className="w-4 h-4" />
      </ToolbarButton>

      <div className="relative">
        <ToolbarButton
          onClick={() => setShowEmojiPicker(!showEmojiPicker)}
          isActive={showEmojiPicker}
          title="이모지"
        >
          <Smile className="w-4 h-4" />
        </ToolbarButton>
        {showEmojiPicker && (
          <div className="absolute top-full right-0 mt-2 z-20">
            <div className="fixed inset-0" onClick={() => setShowEmojiPicker(false)} />
            <div className="relative" ref={emojiPickerRef} />
          </div>
        )}
      </div>
    </div>
  );
};

export function RichTextEditor({
  content,
  onChange,
  onMarkdownChange,
  placeholder = "내용을 입력하세요...",
  className,
}: RichTextEditorProps) {
  const { showToast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const initializingRef = useRef(false);

  const initialConfig = useMemo(
    () => ({
      namespace: "danang-editor",
      theme: lexicalTheme,
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
    }),
    []
  );

  const handleImageUpload = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFileChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>, editor: LexicalEditor) => {
      const file = e.target.files?.[0];
      if (!file) return;

      const formData = new FormData();
      formData.append("file", file);
      formData.append("scope", "posts");

      try {
        const response = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });

        if (response.ok) {
          const { url } = await response.json();
          editor.dispatchCommand(INSERT_IMAGE_COMMAND, { src: url, altText: file.name });
        } else {
          showToast("이미지 업로드에 실패했습니다.", "error");
        }
      } catch {
        showToast("이미지 업로드 중 오류가 발생했습니다.", "error");
      } finally {
        e.target.value = "";
      }
    },
    [showToast]
  );

  const handleEmojiPick = useCallback(
    (emoji: { native: string }, editor: LexicalEditor, savedSelection: RangeSelection | null) => {
      editor.focus();
      editor.update(() => {
        let selection = $getSelection();
        if (!$isRangeSelection(selection)) {
          if (savedSelection) {
            $setSelection(savedSelection);
            selection = $getSelection();
          } else {
            const root = $getRoot();
            root.selectEnd();
            selection = $getSelection();
          }
        }

        if ($isRangeSelection(selection)) {
          selection.insertText(emoji.native);
        }
      });
    },
    []
  );

  return (
    <LexicalComposer initialConfig={initialConfig}>
      <div className={cn("border rounded-2xl overflow-hidden bg-white/90", className)}>
        <LexicalEditorBody
          placeholder={placeholder}
          content={content}
          onChange={onChange}
          onMarkdownChange={onMarkdownChange}
          onImageUpload={handleImageUpload}
          onEmojiPick={handleEmojiPick}
          onFileChange={handleFileChange}
          fileInputRef={fileInputRef}
          initializingRef={initializingRef}
        />
      </div>
    </LexicalComposer>
  );
}

const LexicalEditorBody = ({
  placeholder,
  content,
  onChange,
  onMarkdownChange,
  onImageUpload,
  onEmojiPick,
  onFileChange,
  fileInputRef,
  initializingRef,
}: {
  placeholder: string;
  content: string;
  onChange: (content: string) => void;
  onMarkdownChange?: (markdown: string) => void;
  onImageUpload: () => void;
  onEmojiPick: (emoji: { native: string }, editor: LexicalEditor, selection: RangeSelection | null) => void;
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>, editor: LexicalEditor) => void;
  fileInputRef: React.RefObject<HTMLInputElement>;
  initializingRef: React.MutableRefObject<boolean>;
}) => {
  const [editor] = useLexicalComposerContext();
  const lastSelectionRef = useRef<RangeSelection | null>(null);

  useEffect(() => {
    return editor.registerUpdateListener(({ editorState }) => {
      editorState.read(() => {
        const selection = $getSelection();
        if ($isRangeSelection(selection)) {
          lastSelectionRef.current = selection.clone();
        }
      });
    });
  }, [editor]);

  return (
    <>
      <Toolbar
        onImageUpload={onImageUpload}
        onEmojiPick={(emoji) => onEmojiPick(emoji, editor, lastSelectionRef.current)}
      />
      <div className="relative">
        <RichTextPlugin
          contentEditable={
            <ContentEditable className="min-h-[280px] px-4 py-4 text-base leading-relaxed outline-none" />
          }
          placeholder={<Placeholder text={placeholder} />}
          ErrorBoundary={LexicalErrorBoundary}
        />
      </div>
      <HistoryPlugin />
      <ListPlugin />
      <CheckListPlugin />
      <LinkPlugin />
      <AutoLinkPlugin matchers={AUTO_LINK_MATCHERS} />
      <TablePlugin hasHorizontalScroll />
      <HorizontalRulePlugin />
      <CodeHighlightingPlugin />
      <MarkdownShortcutPlugin transformers={MARKDOWN_TRANSFORMERS} />
      <ImagePlugin />
      <InitialContentPlugin content={content} initializingRef={initializingRef} />
      <OnChangePlugin
        onChange={(editorState) => {
          if (initializingRef.current) return;
          const json = JSON.stringify(editorState.toJSON());
          onChange(json);
          if (onMarkdownChange) {
            let markdown = "";
            editorState.read(() => {
              markdown = $convertToMarkdownString(MARKDOWN_TRANSFORMERS);
            });
            onMarkdownChange(markdown);
          }
        }}
      />
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={(e) => onFileChange(e, editor)}
        className="hidden"
      />
    </>
  );
};

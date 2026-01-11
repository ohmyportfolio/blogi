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
  COMMAND_PRIORITY_HIGH,
  FORMAT_ELEMENT_COMMAND,
  FORMAT_TEXT_COMMAND,
  PASTE_COMMAND,
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
import { $insertDataTransferForRichText } from "@lexical/clipboard";
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
  Youtube,
  MessageSquare,
  ChevronDown,
  MousePointer2,
  Palette,
  Type,
  Info,
  AlertTriangle,
  CheckCircle,
  Lightbulb,
  ChevronsUpDown,
  ExternalLink,
} from "lucide-react";
import { lexicalTheme } from "@/components/editor/lexical-theme";
import {
  ImageNode,
  INSERT_IMAGE_COMMAND,
  $createImageNode,
  type ImagePayload,
} from "@/components/editor/nodes/ImageNode";
import {
  YouTubeNode,
  INSERT_YOUTUBE_COMMAND,
  $createYouTubeNode,
  extractYouTubeVideoId,
} from "@/components/editor/nodes/YouTubeNode";
import {
  CalloutNode,
  INSERT_CALLOUT_COMMAND,
  $createCalloutNode,
  type CalloutType,
} from "@/components/editor/nodes/CalloutNode";
import {
  CollapsibleNode,
  INSERT_COLLAPSIBLE_COMMAND,
  $createCollapsibleNode,
} from "@/components/editor/nodes/CollapsibleNode";
import {
  ButtonLinkNode,
  INSERT_BUTTON_LINK_COMMAND,
  $createButtonLinkNode,
} from "@/components/editor/nodes/ButtonLinkNode";
import { TableActionMenuPlugin } from "@/components/editor/plugins/TableActionMenuPlugin";
import { TableCellResizerPlugin } from "@/components/editor/plugins/TableCellResizerPlugin";
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
          let selection = $getSelection();
          if (!$isRangeSelection(selection)) {
            // selection이 없으면 root 끝으로 이동 후 selection 생성
            const root = $getRoot();
            root.selectEnd();
            selection = $getSelection();
          }
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

const YouTubePlugin = () => {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    return editor.registerCommand(
      INSERT_YOUTUBE_COMMAND,
      (payload) => {
        editor.update(() => {
          let selection = $getSelection();
          if (!$isRangeSelection(selection)) {
            const root = $getRoot();
            root.selectEnd();
            selection = $getSelection();
          }
          if ($isRangeSelection(selection)) {
            const youtubeNode = $createYouTubeNode(payload);
            selection.insertNodes([youtubeNode]);
          }
        });
        return true;
      },
      COMMAND_PRIORITY_EDITOR
    );
  }, [editor]);

  return null;
};

const CalloutPlugin = () => {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    return editor.registerCommand(
      INSERT_CALLOUT_COMMAND,
      (payload) => {
        editor.update(() => {
          let selection = $getSelection();
          if (!$isRangeSelection(selection)) {
            const root = $getRoot();
            root.selectEnd();
            selection = $getSelection();
          }
          if ($isRangeSelection(selection)) {
            const calloutNode = $createCalloutNode(payload);
            selection.insertNodes([calloutNode]);
          }
        });
        return true;
      },
      COMMAND_PRIORITY_EDITOR
    );
  }, [editor]);

  return null;
};

const CollapsiblePlugin = () => {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    return editor.registerCommand(
      INSERT_COLLAPSIBLE_COMMAND,
      (payload) => {
        editor.update(() => {
          let selection = $getSelection();
          if (!$isRangeSelection(selection)) {
            const root = $getRoot();
            root.selectEnd();
            selection = $getSelection();
          }
          if ($isRangeSelection(selection)) {
            const collapsibleNode = $createCollapsibleNode(payload);
            selection.insertNodes([collapsibleNode]);
          }
        });
        return true;
      },
      COMMAND_PRIORITY_EDITOR
    );
  }, [editor]);

  return null;
};

const ButtonLinkPlugin = () => {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    return editor.registerCommand(
      INSERT_BUTTON_LINK_COMMAND,
      (payload) => {
        editor.update(() => {
          let selection = $getSelection();
          if (!$isRangeSelection(selection)) {
            const root = $getRoot();
            root.selectEnd();
            selection = $getSelection();
          }
          if ($isRangeSelection(selection)) {
            const buttonLinkNode = $createButtonLinkNode(payload);
            selection.insertNodes([buttonLinkNode]);
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

  // YouTube modal state
  const [showYouTubeModal, setShowYouTubeModal] = useState(false);
  const [youtubeUrl, setYoutubeUrl] = useState("");

  // Callout dropdown state
  const [showCalloutDropdown, setShowCalloutDropdown] = useState(false);

  // Collapsible modal state
  const [showCollapsibleModal, setShowCollapsibleModal] = useState(false);
  const [collapsibleTitle, setCollapsibleTitle] = useState("");
  const [collapsibleContent, setCollapsibleContent] = useState("");

  // Button link modal state
  const [showButtonLinkModal, setShowButtonLinkModal] = useState(false);
  const [buttonLinkText, setButtonLinkText] = useState("");
  const [buttonLinkUrl, setButtonLinkUrl] = useState("");
  const [buttonLinkVariant, setButtonLinkVariant] = useState<"primary" | "secondary" | "outline">("primary");

  // Text color state
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [currentTextColor, setCurrentTextColor] = useState<string | null>(null);

  // Font size state
  const [showFontSizePicker, setShowFontSizePicker] = useState(false);
  const [currentFontSize, setCurrentFontSize] = useState<string | null>(null);

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

        // Check text color
        const colorNode = selection.getNodes().find((node) => $isTextNode(node) && node.getStyle().includes("color:"));
        if (colorNode && $isTextNode(colorNode)) {
          const style = colorNode.getStyle();
          const colorMatch = style.match(/(?<!background-)color:\s*([^;]+)/);
          setCurrentTextColor(colorMatch ? colorMatch[1].trim() : null);
        } else {
          setCurrentTextColor(null);
        }

        // Check font size
        const sizeNode = selection.getNodes().find((node) => $isTextNode(node) && node.getStyle().includes("font-size:"));
        if (sizeNode && $isTextNode(sizeNode)) {
          const style = sizeNode.getStyle();
          const sizeMatch = style.match(/font-size:\s*([^;]+)/);
          setCurrentFontSize(sizeMatch ? sizeMatch[1].trim() : null);
        } else {
          setCurrentFontSize(null);
        }
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

  // YouTube handler
  const handleInsertYouTube = () => {
    const videoId = extractYouTubeVideoId(youtubeUrl);
    if (videoId) {
      editor.dispatchCommand(INSERT_YOUTUBE_COMMAND, { videoId });
      setYoutubeUrl("");
      setShowYouTubeModal(false);
    }
  };

  // Callout handler
  const handleInsertCallout = (type: CalloutType) => {
    editor.dispatchCommand(INSERT_CALLOUT_COMMAND, { type, content: "내용을 입력하세요..." });
    setShowCalloutDropdown(false);
  };

  // Collapsible handler
  const handleInsertCollapsible = () => {
    if (collapsibleTitle.trim()) {
      editor.dispatchCommand(INSERT_COLLAPSIBLE_COMMAND, {
        title: collapsibleTitle,
        content: collapsibleContent || "내용을 입력하세요...",
      });
      setCollapsibleTitle("");
      setCollapsibleContent("");
      setShowCollapsibleModal(false);
    }
  };

  // Button link handler
  const handleInsertButtonLink = () => {
    if (buttonLinkText.trim() && buttonLinkUrl.trim()) {
      editor.dispatchCommand(INSERT_BUTTON_LINK_COMMAND, {
        text: buttonLinkText,
        url: buttonLinkUrl,
        variant: buttonLinkVariant,
      });
      setButtonLinkText("");
      setButtonLinkUrl("");
      setButtonLinkVariant("primary");
      setShowButtonLinkModal(false);
    }
  };

  // Text color handler
  const applyTextColor = (color: string | null) => {
    editor.update(() => {
      const selection = $getSelection();
      if ($isRangeSelection(selection)) {
        $patchStyleText(selection, { color: color });
      }
    });
    setShowColorPicker(false);
  };

  // Font size handler
  const applyFontSize = (size: string | null) => {
    editor.update(() => {
      const selection = $getSelection();
      if ($isRangeSelection(selection)) {
        $patchStyleText(selection, { "font-size": size });
      }
    });
    setShowFontSizePicker(false);
  };

  const textColors = [
    { name: "기본", value: null },
    { name: "검정", value: "#000000" },
    { name: "회색", value: "#6b7280" },
    { name: "빨강", value: "#ef4444" },
    { name: "주황", value: "#f97316" },
    { name: "노랑", value: "#eab308" },
    { name: "초록", value: "#22c55e" },
    { name: "파랑", value: "#3b82f6" },
    { name: "보라", value: "#8b5cf6" },
    { name: "분홍", value: "#ec4899" },
  ];

  const fontSizes = [
    { name: "작게", value: "12px" },
    { name: "기본", value: null },
    { name: "중간", value: "18px" },
    { name: "크게", value: "24px" },
    { name: "매우 크게", value: "32px" },
  ];

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
    <div className="border-b">
      <div className="px-2 py-2 flex gap-1 bg-white/80 overflow-x-auto flex-nowrap sm:flex-wrap">
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

      {/* 두 번째 툴바 행: 새 기능들 */}
      <div className="px-2 py-1.5 flex gap-1 bg-gray-50/80 border-t border-gray-100 flex-wrap">
      {/* Link */}
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
          <>
            <div className="fixed inset-0 z-10" onClick={() => setShowLinkInput(false)} />
            <div className="absolute top-full left-0 mt-2 p-2 bg-white border rounded-lg shadow-lg z-20 flex gap-2">
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
          </>
        )}
      </div>

      {/* Text Color Picker */}
      <div className="relative">
        <ToolbarButton
          onClick={() => setShowColorPicker(!showColorPicker)}
          isActive={showColorPicker || currentTextColor !== null}
          title="글자 색상"
        >
          <div className="relative">
            <Palette className="w-4 h-4" />
            {currentTextColor && (
              <div
                className="absolute -bottom-1 left-0 right-0 h-1 rounded-full"
                style={{ backgroundColor: currentTextColor }}
              />
            )}
          </div>
        </ToolbarButton>
        {showColorPicker && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setShowColorPicker(false)} />
            <div className="absolute top-full left-0 mt-2 p-2 bg-white border rounded-lg shadow-lg z-20 w-36">
              <div className="grid grid-cols-5 gap-1">
                {textColors.map((color) => (
                  <button
                    key={color.name}
                    type="button"
                    onClick={() => applyTextColor(color.value)}
                    title={color.name}
                    className={cn(
                      "w-6 h-6 rounded border hover:scale-110 transition-transform",
                      color.value === null && "bg-white border-dashed",
                      currentTextColor === color.value && "ring-2 ring-blue-500"
                    )}
                    style={color.value ? { backgroundColor: color.value } : undefined}
                  >
                    {color.value === null && <span className="text-xs text-gray-400">X</span>}
                  </button>
                ))}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Font Size Picker */}
      <div className="relative">
        <ToolbarButton
          onClick={() => setShowFontSizePicker(!showFontSizePicker)}
          isActive={showFontSizePicker || currentFontSize !== null}
          title="글자 크기"
        >
          <Type className="w-4 h-4" />
        </ToolbarButton>
        {showFontSizePicker && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setShowFontSizePicker(false)} />
            <div className="absolute top-full left-0 mt-2 p-1 bg-white border rounded-lg shadow-lg z-20 w-28">
              <div className="flex flex-col">
                {fontSizes.map((size) => (
                  <button
                    key={size.name}
                    type="button"
                    onClick={() => applyFontSize(size.value)}
                    className={cn(
                      "px-2 py-1 text-left text-sm hover:bg-gray-100 rounded",
                      currentFontSize === size.value && "bg-gray-100 font-medium"
                    )}
                  >
                    {size.name}
                  </button>
                ))}
              </div>
            </div>
          </>
        )}
      </div>

      <div className="w-px h-6 bg-black/10 mx-1 self-center" />

      {/* YouTube */}
      <div className="relative">
        <ToolbarButton
          onClick={() => setShowYouTubeModal(!showYouTubeModal)}
          isActive={showYouTubeModal}
          title="YouTube 동영상"
        >
          <Youtube className="w-4 h-4" />
        </ToolbarButton>
        {showYouTubeModal && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setShowYouTubeModal(false)} />
            <div className="absolute top-full left-0 mt-2 p-3 bg-white border rounded-lg shadow-lg z-20 w-72">
              <div className="space-y-2">
                <p className="text-xs text-gray-500">YouTube URL을 입력하세요</p>
                <input
                  type="url"
                  value={youtubeUrl}
                  onChange={(e) => setYoutubeUrl(e.target.value)}
                  placeholder="https://youtube.com/watch?v=..."
                  className="w-full px-2 py-1.5 text-sm border rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                  onKeyDown={(e) => e.key === "Enter" && handleInsertYouTube()}
                />
                <div className="flex gap-2 justify-end">
                  <button
                    type="button"
                    onClick={() => setShowYouTubeModal(false)}
                    className="px-2 py-1 text-xs bg-gray-100 rounded hover:bg-gray-200"
                  >
                    취소
                  </button>
                  <button
                    type="button"
                    onClick={handleInsertYouTube}
                    className="px-2 py-1 text-xs bg-red-500 text-white rounded hover:bg-red-600"
                  >
                    추가
                  </button>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Callout */}
      <div className="relative">
        <ToolbarButton
          onClick={() => setShowCalloutDropdown(!showCalloutDropdown)}
          isActive={showCalloutDropdown}
          title="콜아웃 박스"
        >
          <MessageSquare className="w-4 h-4" />
        </ToolbarButton>
        {showCalloutDropdown && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setShowCalloutDropdown(false)} />
            <div className="absolute top-full left-0 mt-2 p-1 bg-white border rounded-lg shadow-lg z-20 w-32">
              <div className="flex flex-col">
                <button
                  type="button"
                  onClick={() => handleInsertCallout("info")}
                  className="flex items-center gap-2 px-2 py-1.5 text-sm hover:bg-blue-50 rounded text-left"
                >
                  <Info className="w-4 h-4 text-blue-500" /> 정보
                </button>
                <button
                  type="button"
                  onClick={() => handleInsertCallout("warning")}
                  className="flex items-center gap-2 px-2 py-1.5 text-sm hover:bg-amber-50 rounded text-left"
                >
                  <AlertTriangle className="w-4 h-4 text-amber-500" /> 주의
                </button>
                <button
                  type="button"
                  onClick={() => handleInsertCallout("success")}
                  className="flex items-center gap-2 px-2 py-1.5 text-sm hover:bg-green-50 rounded text-left"
                >
                  <CheckCircle className="w-4 h-4 text-green-500" /> 성공
                </button>
                <button
                  type="button"
                  onClick={() => handleInsertCallout("tip")}
                  className="flex items-center gap-2 px-2 py-1.5 text-sm hover:bg-purple-50 rounded text-left"
                >
                  <Lightbulb className="w-4 h-4 text-purple-500" /> 팁
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Collapsible */}
      <div className="relative">
        <ToolbarButton
          onClick={() => setShowCollapsibleModal(!showCollapsibleModal)}
          isActive={showCollapsibleModal}
          title="접이식 섹션"
        >
          <ChevronsUpDown className="w-4 h-4" />
        </ToolbarButton>
        {showCollapsibleModal && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setShowCollapsibleModal(false)} />
            <div className="absolute top-full left-0 mt-2 p-3 bg-white border rounded-lg shadow-lg z-20 w-72">
              <div className="space-y-2">
                <p className="text-xs text-gray-500">접이식 섹션 추가</p>
                <input
                  type="text"
                  value={collapsibleTitle}
                  onChange={(e) => setCollapsibleTitle(e.target.value)}
                  placeholder="제목"
                  className="w-full px-2 py-1.5 text-sm border rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
                <textarea
                  value={collapsibleContent}
                  onChange={(e) => setCollapsibleContent(e.target.value)}
                  placeholder="내용 (선택)"
                  className="w-full px-2 py-1.5 text-sm border rounded resize-none focus:outline-none focus:ring-1 focus:ring-blue-500"
                  rows={2}
                />
                <div className="flex gap-2 justify-end">
                  <button
                    type="button"
                    onClick={() => setShowCollapsibleModal(false)}
                    className="px-2 py-1 text-xs bg-gray-100 rounded hover:bg-gray-200"
                  >
                    취소
                  </button>
                  <button
                    type="button"
                    onClick={handleInsertCollapsible}
                    className="px-2 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600"
                  >
                    추가
                  </button>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Button Link */}
      <div className="relative">
        <ToolbarButton
          onClick={() => setShowButtonLinkModal(!showButtonLinkModal)}
          isActive={showButtonLinkModal}
          title="버튼 링크"
        >
          <ExternalLink className="w-4 h-4" />
        </ToolbarButton>
        {showButtonLinkModal && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setShowButtonLinkModal(false)} />
            <div className="absolute top-full right-0 mt-2 p-3 bg-white border rounded-lg shadow-lg z-20 w-72">
              <div className="space-y-2">
                <p className="text-xs text-gray-500">버튼 링크 추가</p>
                <input
                  type="text"
                  value={buttonLinkText}
                  onChange={(e) => setButtonLinkText(e.target.value)}
                  placeholder="버튼 텍스트"
                  className="w-full px-2 py-1.5 text-sm border rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
                <input
                  type="url"
                  value={buttonLinkUrl}
                  onChange={(e) => setButtonLinkUrl(e.target.value)}
                  placeholder="https://..."
                  className="w-full px-2 py-1.5 text-sm border rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
                <select
                  value={buttonLinkVariant}
                  onChange={(e) => setButtonLinkVariant(e.target.value as "primary" | "secondary" | "outline")}
                  className="w-full px-2 py-1.5 text-sm border rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="primary">Primary (파랑)</option>
                  <option value="secondary">Secondary (회색)</option>
                  <option value="outline">Outline (테두리)</option>
                </select>
                <div className="flex gap-2 justify-end">
                  <button
                    type="button"
                    onClick={() => setShowButtonLinkModal(false)}
                    className="px-2 py-1 text-xs bg-gray-100 rounded hover:bg-gray-200"
                  >
                    취소
                  </button>
                  <button
                    type="button"
                    onClick={handleInsertButtonLink}
                    className="px-2 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600"
                  >
                    추가
                  </button>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
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
      namespace: "blogi-editor",
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
        YouTubeNode,
        CalloutNode,
        CollapsibleNode,
        ButtonLinkNode,
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
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  initializingRef: React.MutableRefObject<boolean>;
}) => {
  const [editor] = useLexicalComposerContext();
  const { showToast } = useToast();
  const lastSelectionRef = useRef<RangeSelection | null>(null);
  const [isPasting, setIsPasting] = useState(false);
  const [pasteProgress, setPasteProgress] = useState({ current: 0, total: 0 });

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

  // 이미지 붙여넣기 핸들러
  useEffect(() => {
    return editor.registerCommand(
      PASTE_COMMAND,
      (event: ClipboardEvent) => {
        const clipboardData = event.clipboardData;
        if (!clipboardData) return false;

        // 1. 클립보드에서 직접 이미지 파일 확인 (스크린샷 등)
        const items = clipboardData.items;
        for (let i = 0; i < items.length; i++) {
          const item = items[i];
          if (item.type.startsWith("image/") && item.kind === "file") {
            const file = item.getAsFile();
            if (!file) continue;

            // HTML 콘텐츠가 없으면 순수 이미지 붙여넣기
            const hasHtml = clipboardData.types.includes("text/html");
            if (!hasHtml) {
              event.preventDefault();

              const formData = new FormData();
              formData.append("file", file);
              formData.append("scope", "posts");

              fetch("/api/upload", {
                method: "POST",
                body: formData,
              })
                .then((response) => {
                  if (response.ok) return response.json();
                  throw new Error("Upload failed");
                })
                .then(({ url }) => {
                  editor.dispatchCommand(INSERT_IMAGE_COMMAND, {
                    src: url,
                    altText: file.name || "pasted-image",
                  });
                })
                .catch(() => {
                  showToast("이미지 업로드에 실패했습니다.", "error");
                });

              return true;
            }
          }
        }

        // 2. HTML 콘텐츠가 있는 경우 - 서식 유지하며 붙여넣기
        const htmlData = clipboardData.getData("text/html");
        if (htmlData) {
          const parser = new DOMParser();
          const doc = parser.parseFromString(htmlData, "text/html");
          const images = doc.querySelectorAll("img");

          // 이미지가 있는 경우
          if (images.length > 0) {
            event.preventDefault();

            // 이미지를 placeholder로 교체하고 업로드
            const imagePlaceholders: { id: string; src: string; alt: string }[] = [];

            images.forEach((img, index) => {
              const src = img.getAttribute("src");
              const alt = img.getAttribute("alt") || "pasted-image";
              if (!src) return;

              const placeholderId = `__img_placeholder_${index}_${Date.now()}__`;
              imagePlaceholders.push({ id: placeholderId, src, alt });

              // 이미지를 placeholder 텍스트로 교체
              const placeholder = doc.createTextNode(placeholderId);
              img.parentNode?.replaceChild(placeholder, img);
            });

            // 로딩 상태 시작
            setIsPasting(true);
            setPasteProgress({ current: 0, total: imagePlaceholders.length });

            // 이미지 업로드
            let uploadedCount = 0;
            const uploadPromises = imagePlaceholders.map(async (item) => {
              try {
                let uploadedUrl = item.src;

                if (item.src.startsWith("data:")) {
                  const res = await fetch(item.src);
                  const blob = await res.blob();
                  const formData = new FormData();
                  formData.append("file", blob, "pasted-image.png");
                  formData.append("scope", "posts");
                  const response = await fetch("/api/upload", {
                    method: "POST",
                    body: formData,
                  });
                  if (response.ok) {
                    const data = await response.json();
                    uploadedUrl = data.url;
                  }
                } else if (item.src.startsWith("http")) {
                  const response = await fetch("/api/upload", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ imageUrl: item.src, scope: "posts" }),
                  });
                  if (response.ok) {
                    const data = await response.json();
                    uploadedUrl = data.url;
                  }
                }

                uploadedCount++;
                setPasteProgress({ current: uploadedCount, total: imagePlaceholders.length });
                return { ...item, uploadedUrl };
              } catch {
                uploadedCount++;
                setPasteProgress({ current: uploadedCount, total: imagePlaceholders.length });
                return { ...item, uploadedUrl: item.src };
              }
            });

            Promise.all(uploadPromises).then((uploadedItems) => {
              // placeholder가 포함된 HTML 삽입
              const htmlWithPlaceholders = doc.body.innerHTML;
              const dataTransfer = new DataTransfer();
              dataTransfer.setData("text/html", htmlWithPlaceholders);
              dataTransfer.setData("text/plain", clipboardData.getData("text/plain"));

              editor.update(() => {
                let selection = $getSelection();
                // selection이 없으면 root 끝에 생성
                if (!$isRangeSelection(selection)) {
                  const root = $getRoot();
                  root.selectEnd();
                  selection = $getSelection();
                }
                if ($isRangeSelection(selection)) {
                  $insertDataTransferForRichText(dataTransfer, selection, editor);
                }
              });

              // placeholder를 이미지로 교체
              setTimeout(() => {
                uploadedItems.forEach((item) => {
                  editor.update(() => {
                    const root = $getRoot();
                    const textContent = root.getTextContent();

                    // placeholder 찾기
                    if (textContent.includes(item.id)) {
                      // 모든 텍스트 노드를 순회하며 placeholder 찾기
                      const findAndReplace = (node: import("lexical").LexicalNode) => {
                        if ($isTextNode(node)) {
                          const text = node.getTextContent();
                          if (text.includes(item.id)) {
                            // placeholder 전후로 텍스트 분리
                            const parts = text.split(item.id);
                            const parent = node.getParent();
                            if (parent) {
                              // 새 노드들 생성
                              const beforeText = parts[0];
                              const afterText = parts.slice(1).join(item.id);

                              // placeholder 노드를 이미지로 교체
                              if (beforeText) {
                                const beforeNode = $createTextNode(beforeText);
                                node.insertBefore(beforeNode);
                              }

                              // 이미지 삽입
                              const imageNode = $createImageNode({
                                src: item.uploadedUrl,
                                altText: item.alt,
                              });
                              node.insertBefore(imageNode);

                              if (afterText) {
                                const afterNode = $createTextNode(afterText);
                                node.insertBefore(afterNode);
                              }

                              node.remove();
                            }
                          }
                        } else {
                          const children = "getChildren" in node ? (node as import("lexical").ElementNode).getChildren() : [];
                          children.forEach(findAndReplace);
                        }
                      };

                      root.getChildren().forEach(findAndReplace);
                    }
                  });
                });
                // 로딩 상태 해제
                setIsPasting(false);
                setPasteProgress({ current: 0, total: 0 });
              }, 100);
            });

            return true;
          }
        }

        return false;
      },
      COMMAND_PRIORITY_HIGH
    );
  }, [editor, showToast]);

  const [editorHeight, setEditorHeight] = useState(320);
  const resizeRef = useRef<HTMLDivElement>(null);
  const editorContainerRef = useRef<HTMLDivElement>(null);
  const isDraggingRef = useRef(false);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    isDraggingRef.current = true;
    const startY = e.clientY;
    const startHeight = editorHeight;

    const handleMouseMove = (e: MouseEvent) => {
      if (!isDraggingRef.current) return;
      const delta = e.clientY - startY;
      const newHeight = Math.max(200, Math.min(800, startHeight + delta));
      setEditorHeight(newHeight);
    };

    const handleMouseUp = () => {
      isDraggingRef.current = false;
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
  }, [editorHeight]);

  return (
    <>
      <Toolbar
        onImageUpload={onImageUpload}
        onEmojiPick={(emoji) => onEmojiPick(emoji, editor, lastSelectionRef.current)}
      />
      <div
        ref={editorContainerRef}
        className="relative overflow-y-auto"
        style={{ height: editorHeight }}
      >
        <RichTextPlugin
          contentEditable={
            <ContentEditable className="min-h-full px-4 py-4 text-base leading-relaxed outline-none" />
          }
          placeholder={<Placeholder text={placeholder} />}
          ErrorBoundary={LexicalErrorBoundary}
        />
        {/* 붙여넣기 로딩 오버레이 */}
        {isPasting && (
          <div className="absolute inset-0 bg-white/80 flex items-center justify-center z-10">
            <div className="flex flex-col items-center gap-3 p-4 bg-white rounded-lg shadow-lg border">
              <div className="w-8 h-8 border-3 border-blue-500 border-t-transparent rounded-full animate-spin" />
              <div className="text-sm text-gray-600">
                이미지 업로드 중... ({pasteProgress.current}/{pasteProgress.total})
              </div>
              <div className="w-48 h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-500 transition-all duration-300"
                  style={{
                    width: pasteProgress.total > 0
                      ? `${(pasteProgress.current / pasteProgress.total) * 100}%`
                      : "0%",
                  }}
                />
              </div>
            </div>
          </div>
        )}
      </div>
      {/* Resize handle */}
      <div
        ref={resizeRef}
        onMouseDown={handleMouseDown}
        className="h-2 bg-gray-100 hover:bg-gray-200 cursor-ns-resize flex items-center justify-center border-t transition-colors"
      >
        <div className="w-12 h-1 bg-gray-300 rounded-full" />
      </div>
      <HistoryPlugin />
      <ListPlugin />
      <CheckListPlugin />
      <LinkPlugin />
      <AutoLinkPlugin matchers={AUTO_LINK_MATCHERS} />
      <TablePlugin hasHorizontalScroll />
      <TableCellResizerPlugin />
      {editorContainerRef.current && (
        <TableActionMenuPlugin anchorElem={editorContainerRef.current} />
      )}
      <HorizontalRulePlugin />
      <CodeHighlightingPlugin />
      <MarkdownShortcutPlugin transformers={MARKDOWN_TRANSFORMERS} />
      <ImagePlugin />
      <YouTubePlugin />
      <CalloutPlugin />
      <CollapsiblePlugin />
      <ButtonLinkPlugin />
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

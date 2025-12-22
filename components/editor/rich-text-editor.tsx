"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import { StarterKit } from "@tiptap/starter-kit";
import { Image } from "@tiptap/extension-image";
import { Link } from "@tiptap/extension-link";
import { Placeholder } from "@tiptap/extension-placeholder";
import { TextAlign } from "@tiptap/extension-text-align";
import { Underline } from "@tiptap/extension-underline";
import { TextStyle } from "@tiptap/extension-text-style";
import { Color } from "@tiptap/extension-color";
import { Highlight } from "@tiptap/extension-highlight";
import { useCallback, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import {
    Bold,
    Italic,
    Underline as UnderlineIcon,
    Strikethrough,
    Code,
    List,
    ListOrdered,
    Quote,
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
import { cn } from "@/lib/utils";
import data from "@emoji-mart/data";
import Picker from "@emoji-mart/react";

interface RichTextEditorProps {
    content: string;
    onChange: (content: string) => void;
    placeholder?: string;
    className?: string;
}

export function RichTextEditor({
    content,
    onChange,
    placeholder = "내용을 입력하세요...",
    className,
}: RichTextEditorProps) {
    const { showToast } = useToast();
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [showLinkInput, setShowLinkInput] = useState(false);
    const [linkUrl, setLinkUrl] = useState("");
    const fileInputRef = useRef<HTMLInputElement>(null);

    const editor = useEditor({
        extensions: [
            StarterKit.configure({
                heading: {
                    levels: [1, 2, 3],
                },
            }),
            Image.configure({
                HTMLAttributes: {
                    class: "max-w-full h-auto rounded-lg",
                },
            }),
            Link.configure({
                openOnClick: false,
                HTMLAttributes: {
                    class: "text-blue-500 underline hover:text-blue-700",
                },
            }),
            Placeholder.configure({
                placeholder,
            }),
            TextAlign.configure({
                types: ["heading", "paragraph"],
            }),
            Underline,
            TextStyle,
            Color,
            Highlight.configure({
                multicolor: true,
            }),
        ],
        content,
        onUpdate: ({ editor }) => {
            onChange(editor.getHTML());
        },
        immediatelyRender: false,
    });

    const addImage = useCallback(async (file: File) => {
        if (!editor) return;

        const formData = new FormData();
        formData.append("file", file);

        try {
            const response = await fetch("/api/upload", {
                method: "POST",
                body: formData,
            });

            if (response.ok) {
                const { url } = await response.json();
                editor.chain().setImage({ src: url }).run();
            } else {
                showToast("이미지 업로드에 실패했습니다.", "error");
            }
        } catch (error) {
            showToast("이미지 업로드 중 오류가 발생했습니다.", "error");
        }
    }, [editor, showToast]);

    const handleImageUpload = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            addImage(file);
        }
        e.target.value = "";
    };

    const addLink = useCallback(() => {
        if (!editor || !linkUrl) return;

        if (linkUrl === "") {
            editor.chain().unsetLink().run();
        } else {
            editor.chain().setLink({ href: linkUrl }).run();
        }
        setLinkUrl("");
        setShowLinkInput(false);
    }, [editor, linkUrl]);

    const removeLink = useCallback(() => {
        if (!editor) return;
        editor.chain().unsetLink().run();
    }, [editor]);

    const addEmoji = useCallback((emoji: { native: string }) => {
        if (!editor) return;
        editor.chain().insertContent(emoji.native).run();
        setShowEmojiPicker(false);
    }, [editor]);

    if (!editor) {
        return (
            <div className={cn("border rounded-lg p-4 min-h-[300px] bg-gray-50", className)}>
                <div className="animate-pulse space-y-4">
                    <div className="h-10 bg-gray-200 rounded"></div>
                    <div className="h-48 bg-gray-200 rounded"></div>
                </div>
            </div>
        );
    }

    const ToolbarButton = ({
        onClick,
        isActive,
        children,
        title,
    }: {
        onClick: () => void;
        isActive?: boolean;
        children: React.ReactNode;
        title: string;
    }) => (
        <button
            type="button"
            onClick={() => {
                editor?.chain().focus().run();
                onClick();
            }}
            onMouseDown={(e) => e.preventDefault()}
            title={title}
            className={cn(
                "p-2 rounded hover:bg-gray-100 transition-colors",
                isActive && "bg-gray-200 text-blue-600"
            )}
        >
            {children}
        </button>
    );

    return (
        <div className={cn("border rounded-lg overflow-hidden bg-white", className)}>
            {/* Toolbar */}
            <div className="border-b p-2 flex flex-wrap gap-1 bg-gray-50">
                {/* Undo/Redo */}
                <ToolbarButton onClick={() => editor.chain().undo().run()} title="실행 취소">
                    <Undo className="w-4 h-4" />
                </ToolbarButton>
                <ToolbarButton onClick={() => editor.chain().redo().run()} title="다시 실행">
                    <Redo className="w-4 h-4" />
                </ToolbarButton>

                <div className="w-px h-6 bg-gray-300 mx-1 self-center" />

                {/* Headings */}
                <ToolbarButton
                    onClick={() => editor.chain().toggleHeading({ level: 1 }).run()}
                    isActive={editor.isActive("heading", { level: 1 })}
                    title="제목 1"
                >
                    <Heading1 className="w-4 h-4" />
                </ToolbarButton>
                <ToolbarButton
                    onClick={() => editor.chain().toggleHeading({ level: 2 }).run()}
                    isActive={editor.isActive("heading", { level: 2 })}
                    title="제목 2"
                >
                    <Heading2 className="w-4 h-4" />
                </ToolbarButton>
                <ToolbarButton
                    onClick={() => editor.chain().toggleHeading({ level: 3 }).run()}
                    isActive={editor.isActive("heading", { level: 3 })}
                    title="제목 3"
                >
                    <Heading3 className="w-4 h-4" />
                </ToolbarButton>

                <div className="w-px h-6 bg-gray-300 mx-1 self-center" />

                {/* Text Formatting */}
                <ToolbarButton
                    onClick={() => editor.chain().toggleBold().run()}
                    isActive={editor.isActive("bold")}
                    title="굵게"
                >
                    <Bold className="w-4 h-4" />
                </ToolbarButton>
                <ToolbarButton
                    onClick={() => editor.chain().toggleItalic().run()}
                    isActive={editor.isActive("italic")}
                    title="기울임"
                >
                    <Italic className="w-4 h-4" />
                </ToolbarButton>
                <ToolbarButton
                    onClick={() => editor.chain().toggleUnderline().run()}
                    isActive={editor.isActive("underline")}
                    title="밑줄"
                >
                    <UnderlineIcon className="w-4 h-4" />
                </ToolbarButton>
                <ToolbarButton
                    onClick={() => editor.chain().toggleStrike().run()}
                    isActive={editor.isActive("strike")}
                    title="취소선"
                >
                    <Strikethrough className="w-4 h-4" />
                </ToolbarButton>
                <ToolbarButton
                    onClick={() => editor.chain().toggleHighlight({ color: "#fef08a" }).run()}
                    isActive={editor.isActive("highlight")}
                    title="하이라이트"
                >
                    <Highlighter className="w-4 h-4" />
                </ToolbarButton>
                <ToolbarButton
                    onClick={() => editor.chain().toggleCode().run()}
                    isActive={editor.isActive("code")}
                    title="인라인 코드"
                >
                    <Code className="w-4 h-4" />
                </ToolbarButton>

                <div className="w-px h-6 bg-gray-300 mx-1 self-center" />

                {/* Alignment */}
                <ToolbarButton
                    onClick={() => editor.chain().setTextAlign("left").run()}
                    isActive={editor.isActive({ textAlign: "left" })}
                    title="왼쪽 정렬"
                >
                    <AlignLeft className="w-4 h-4" />
                </ToolbarButton>
                <ToolbarButton
                    onClick={() => editor.chain().setTextAlign("center").run()}
                    isActive={editor.isActive({ textAlign: "center" })}
                    title="가운데 정렬"
                >
                    <AlignCenter className="w-4 h-4" />
                </ToolbarButton>
                <ToolbarButton
                    onClick={() => editor.chain().setTextAlign("right").run()}
                    isActive={editor.isActive({ textAlign: "right" })}
                    title="오른쪽 정렬"
                >
                    <AlignRight className="w-4 h-4" />
                </ToolbarButton>

                <div className="w-px h-6 bg-gray-300 mx-1 self-center" />

                {/* Lists */}
                <ToolbarButton
                    onClick={() => editor.chain().toggleBulletList().run()}
                    isActive={editor.isActive("bulletList")}
                    title="글머리 기호"
                >
                    <List className="w-4 h-4" />
                </ToolbarButton>
                <ToolbarButton
                    onClick={() => editor.chain().toggleOrderedList().run()}
                    isActive={editor.isActive("orderedList")}
                    title="번호 목록"
                >
                    <ListOrdered className="w-4 h-4" />
                </ToolbarButton>
                <ToolbarButton
                    onClick={() => editor.chain().toggleBlockquote().run()}
                    isActive={editor.isActive("blockquote")}
                    title="인용"
                >
                    <Quote className="w-4 h-4" />
                </ToolbarButton>

                <div className="w-px h-6 bg-gray-300 mx-1 self-center" />

                {/* Link */}
                <div className="relative">
                    {editor.isActive("link") ? (
                        <ToolbarButton onClick={removeLink} isActive={true} title="링크 제거">
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
                        <div className="absolute top-full left-0 mt-1 p-2 bg-white border rounded-lg shadow-lg z-10 flex gap-2">
                            <input
                                type="url"
                                placeholder="URL 입력"
                                value={linkUrl}
                                onChange={(e) => setLinkUrl(e.target.value)}
                                onKeyDown={(e) => e.key === "Enter" && addLink()}
                                className="px-2 py-1 border rounded text-sm w-48"
                            />
                            <Button size="sm" onClick={addLink}>
                                추가
                            </Button>
                        </div>
                    )}
                </div>

                {/* Image */}
                <ToolbarButton onClick={handleImageUpload} title="이미지 추가">
                    <ImageIcon className="w-4 h-4" />
                </ToolbarButton>
                <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                />

                {/* Emoji */}
                <div className="relative">
                    <ToolbarButton
                        onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                        isActive={showEmojiPicker}
                        title="이모지"
                    >
                        <Smile className="w-4 h-4" />
                    </ToolbarButton>
                    {showEmojiPicker && (
                        <div className="absolute top-full right-0 mt-1 z-20">
                            <div
                                className="fixed inset-0"
                                onClick={() => setShowEmojiPicker(false)}
                            />
                            <div className="relative">
                                <Picker
                                    data={data}
                                    onEmojiSelect={addEmoji}
                                    theme="light"
                                    locale="ko"
                                    previewPosition="none"
                                    skinTonePosition="none"
                                />
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Editor Content */}
            <EditorContent
                editor={editor}
                className="prose prose-sm sm:prose max-w-none p-4 min-h-[300px] focus:outline-none [&_.ProseMirror]:outline-none [&_.ProseMirror]:min-h-[280px] [&_.ProseMirror_p.is-editor-empty:first-child::before]:text-gray-400 [&_.ProseMirror_p.is-editor-empty:first-child::before]:content-[attr(data-placeholder)] [&_.ProseMirror_p.is-editor-empty:first-child::before]:float-left [&_.ProseMirror_p.is-editor-empty:first-child::before]:h-0 [&_.ProseMirror_p.is-editor-empty:first-child::before]:pointer-events-none"
            />
        </div>
    );
}

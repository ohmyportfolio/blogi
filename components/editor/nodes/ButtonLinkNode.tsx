"use client";

import type { JSX } from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  DecoratorNode,
  type NodeKey,
  createCommand,
  $getNodeByKey,
  $getSelection,
  $isNodeSelection,
  CLICK_COMMAND,
  COMMAND_PRIORITY_LOW,
  KEY_DELETE_COMMAND,
  KEY_BACKSPACE_COMMAND,
} from "lexical";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { useLexicalNodeSelection } from "@lexical/react/useLexicalNodeSelection";
import { mergeRegister } from "@lexical/utils";
import { ExternalLink } from "lucide-react";

export type ButtonVariant = "primary" | "secondary" | "outline";

export type ButtonLinkPayload = {
  text: string;
  url: string;
  variant?: ButtonVariant;
};

export type SerializedButtonLinkNode = {
  type: "buttonLink";
  version: 1;
  text: string;
  url: string;
  variant: ButtonVariant;
};

export const INSERT_BUTTON_LINK_COMMAND = createCommand<ButtonLinkPayload>();

const variantStyles: Record<ButtonVariant, string> = {
  primary: "bg-blue-600 text-white hover:bg-blue-700",
  secondary: "bg-gray-800 text-white hover:bg-gray-900",
  outline: "bg-white text-gray-800 border-2 border-gray-800 hover:bg-gray-100",
};

function ButtonLinkComponent({
  text,
  url,
  variant,
  nodeKey,
}: {
  text: string;
  url: string;
  variant: ButtonVariant;
  nodeKey: NodeKey;
}) {
  const [editor] = useLexicalComposerContext();
  const containerRef = useRef<HTMLSpanElement>(null);
  const [isSelected, setSelected, clearSelection] = useLexicalNodeSelection(nodeKey);
  const [isFocused, setIsFocused] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(text);
  const [editUrl, setEditUrl] = useState(url);
  const [editVariant, setEditVariant] = useState(variant);

  const onDelete = useCallback(
    (event: KeyboardEvent) => {
      if (isSelected && $isNodeSelection($getSelection()) && !isEditing) {
        event.preventDefault();
        const node = $getNodeByKey(nodeKey);
        if (node) {
          node.remove();
        }
      }
      return false;
    },
    [isSelected, nodeKey, isEditing]
  );

  const handleSave = useCallback(() => {
    editor.update(() => {
      const node = $getNodeByKey(nodeKey) as ButtonLinkNode | null;
      if (node) {
        node.setText(editText);
        node.setUrl(editUrl);
        node.setVariant(editVariant);
      }
    });
    setIsEditing(false);
  }, [editor, nodeKey, editText, editUrl, editVariant]);

  useEffect(() => {
    return mergeRegister(
      editor.registerCommand<MouseEvent>(
        CLICK_COMMAND,
        (event) => {
          if (containerRef.current && containerRef.current.contains(event.target as Node)) {
            if (!event.shiftKey) {
              clearSelection();
            }
            setSelected(true);
            setIsFocused(true);
            return true;
          }
          return false;
        },
        COMMAND_PRIORITY_LOW
      ),
      editor.registerCommand(KEY_DELETE_COMMAND, onDelete, COMMAND_PRIORITY_LOW),
      editor.registerCommand(KEY_BACKSPACE_COMMAND, onDelete, COMMAND_PRIORITY_LOW)
    );
  }, [editor, clearSelection, setSelected, onDelete]);

  useEffect(() => {
    setIsFocused(isSelected);
  }, [isSelected]);

  if (isEditing) {
    return (
      <span
        ref={containerRef}
        className="inline-block my-2 p-3 border rounded-lg bg-gray-50 space-y-2"
      >
        <div className="flex gap-2">
          <input
            type="text"
            value={editText}
            onChange={(e) => setEditText(e.target.value)}
            placeholder="버튼 텍스트"
            className="flex-1 p-2 text-sm border rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
            autoFocus
          />
          <select
            value={editVariant}
            onChange={(e) => setEditVariant(e.target.value as ButtonVariant)}
            className="p-2 text-sm border rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="primary">Primary</option>
            <option value="secondary">Secondary</option>
            <option value="outline">Outline</option>
          </select>
        </div>
        <input
          type="url"
          value={editUrl}
          onChange={(e) => setEditUrl(e.target.value)}
          placeholder="https://..."
          className="w-full p-2 text-sm border rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
        <div className="flex gap-2">
          <button
            onClick={handleSave}
            className="px-3 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            저장
          </button>
          <button
            onClick={() => {
              setEditText(text);
              setEditUrl(url);
              setEditVariant(variant);
              setIsEditing(false);
            }}
            className="px-3 py-1 text-xs bg-gray-200 rounded hover:bg-gray-300"
          >
            취소
          </button>
        </div>
      </span>
    );
  }

  return (
    <span
      ref={containerRef}
      className={`relative inline-block my-1 ${
        isFocused ? "ring-2 ring-blue-500 ring-offset-2 rounded" : ""
      }`}
      onDoubleClick={() => setIsEditing(true)}
    >
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        onClick={(e) => e.preventDefault()}
        className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-colors cursor-pointer ${variantStyles[variant]}`}
      >
        {text}
        <ExternalLink className="w-4 h-4" />
      </a>
      {isFocused && (
        <span className="absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-1 bg-black/75 text-white text-xs rounded whitespace-nowrap z-10">
          더블클릭하여 수정 · Delete 키로 삭제
        </span>
      )}
    </span>
  );
}

export class ButtonLinkNode extends DecoratorNode<JSX.Element> {
  __text: string;
  __url: string;
  __variant: ButtonVariant;

  static getType(): string {
    return "buttonLink";
  }

  static clone(node: ButtonLinkNode): ButtonLinkNode {
    return new ButtonLinkNode(node.__text, node.__url, node.__variant, node.__key);
  }

  constructor(text: string, url: string, variant: ButtonVariant = "primary", key?: NodeKey) {
    super(key);
    this.__text = text;
    this.__url = url;
    this.__variant = variant;
  }

  setText(text: string): void {
    const writable = this.getWritable();
    writable.__text = text;
  }

  setUrl(url: string): void {
    const writable = this.getWritable();
    writable.__url = url;
  }

  setVariant(variant: ButtonVariant): void {
    const writable = this.getWritable();
    writable.__variant = variant;
  }

  createDOM(): HTMLElement {
    const span = document.createElement("span");
    return span;
  }

  updateDOM(): boolean {
    return false;
  }

  static importJSON(serializedNode: SerializedButtonLinkNode): ButtonLinkNode {
    return new ButtonLinkNode(
      serializedNode.text,
      serializedNode.url,
      serializedNode.variant
    );
  }

  exportJSON(): SerializedButtonLinkNode {
    return {
      type: "buttonLink",
      version: 1,
      text: this.__text,
      url: this.__url,
      variant: this.__variant,
    };
  }

  decorate(): JSX.Element {
    return (
      <ButtonLinkComponent
        text={this.__text}
        url={this.__url}
        variant={this.__variant}
        nodeKey={this.__key}
      />
    );
  }
}

export function $createButtonLinkNode(payload: ButtonLinkPayload): ButtonLinkNode {
  return new ButtonLinkNode(payload.text, payload.url, payload.variant || "primary");
}

export function $isButtonLinkNode(node: unknown): node is ButtonLinkNode {
  return node instanceof ButtonLinkNode;
}

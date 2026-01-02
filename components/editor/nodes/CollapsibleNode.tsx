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
import { ChevronDown, ChevronRight } from "lucide-react";

export type CollapsiblePayload = {
  title: string;
  content: string;
};

export type SerializedCollapsibleNode = {
  type: "collapsible";
  version: 1;
  title: string;
  content: string;
};

export const INSERT_COLLAPSIBLE_COMMAND = createCommand<CollapsiblePayload>();

function CollapsibleComponent({
  title,
  content,
  nodeKey,
}: {
  title: string;
  content: string;
  nodeKey: NodeKey;
}) {
  const [editor] = useLexicalComposerContext();
  const containerRef = useRef<HTMLDivElement>(null);
  const [isSelected, setSelected, clearSelection] = useLexicalNodeSelection(nodeKey);
  const [isFocused, setIsFocused] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(title);
  const [editContent, setEditContent] = useState(content);

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
      const node = $getNodeByKey(nodeKey) as CollapsibleNode | null;
      if (node) {
        node.setTitle(editTitle);
        node.setContent(editContent);
      }
    });
    setIsEditing(false);
  }, [editor, nodeKey, editTitle, editContent]);

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
      <div
        ref={containerRef}
        className="my-4 p-4 border rounded-lg bg-gray-50 space-y-3"
      >
        <div>
          <label className="block text-xs text-gray-500 mb-1">제목</label>
          <input
            type="text"
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            className="w-full p-2 text-sm border rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
            autoFocus
          />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">내용</label>
          <textarea
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            className="w-full p-2 text-sm border rounded resize-none focus:outline-none focus:ring-1 focus:ring-blue-500"
            rows={4}
          />
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleSave}
            className="px-3 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            저장
          </button>
          <button
            onClick={() => {
              setEditTitle(title);
              setEditContent(content);
              setIsEditing(false);
            }}
            className="px-3 py-1 text-xs bg-gray-200 rounded hover:bg-gray-300"
          >
            취소
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={`relative my-4 border rounded-lg overflow-hidden cursor-pointer ${
        isFocused ? "ring-2 ring-blue-500 ring-offset-2" : ""
      }`}
      onDoubleClick={() => setIsEditing(true)}
    >
      <button
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
        className="w-full flex items-center gap-2 p-3 bg-gray-100 hover:bg-gray-200 transition-colors text-left"
      >
        {isOpen ? (
          <ChevronDown className="w-4 h-4 text-gray-500 shrink-0" />
        ) : (
          <ChevronRight className="w-4 h-4 text-gray-500 shrink-0" />
        )}
        <span className="font-medium text-gray-700">{title}</span>
      </button>
      {isOpen && (
        <div className="p-4 bg-white border-t">
          <div className="text-sm text-gray-600 whitespace-pre-wrap">{content}</div>
        </div>
      )}
      {isFocused && (
        <span className="absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-1 bg-black/75 text-white text-xs rounded whitespace-nowrap z-10">
          더블클릭하여 수정 · Delete 키로 삭제
        </span>
      )}
    </div>
  );
}

export class CollapsibleNode extends DecoratorNode<JSX.Element> {
  __title: string;
  __content: string;

  static getType(): string {
    return "collapsible";
  }

  static clone(node: CollapsibleNode): CollapsibleNode {
    return new CollapsibleNode(node.__title, node.__content, node.__key);
  }

  constructor(title: string, content: string, key?: NodeKey) {
    super(key);
    this.__title = title;
    this.__content = content;
  }

  setTitle(title: string): void {
    const writable = this.getWritable();
    writable.__title = title;
  }

  setContent(content: string): void {
    const writable = this.getWritable();
    writable.__content = content;
  }

  createDOM(): HTMLElement {
    const div = document.createElement("div");
    return div;
  }

  updateDOM(): boolean {
    return false;
  }

  static importJSON(serializedNode: SerializedCollapsibleNode): CollapsibleNode {
    return new CollapsibleNode(serializedNode.title, serializedNode.content);
  }

  exportJSON(): SerializedCollapsibleNode {
    return {
      type: "collapsible",
      version: 1,
      title: this.__title,
      content: this.__content,
    };
  }

  decorate(): JSX.Element {
    return (
      <CollapsibleComponent
        title={this.__title}
        content={this.__content}
        nodeKey={this.__key}
      />
    );
  }
}

export function $createCollapsibleNode(payload: CollapsiblePayload): CollapsibleNode {
  return new CollapsibleNode(payload.title, payload.content);
}

export function $isCollapsibleNode(node: unknown): node is CollapsibleNode {
  return node instanceof CollapsibleNode;
}

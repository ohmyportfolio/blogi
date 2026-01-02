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
import { Info, AlertTriangle, CheckCircle, Lightbulb } from "lucide-react";

export type CalloutType = "info" | "warning" | "success" | "tip";

export type CalloutPayload = {
  type: CalloutType;
  content: string;
};

export type SerializedCalloutNode = {
  type: "callout";
  version: 1;
  calloutType: CalloutType;
  content: string;
};

export const INSERT_CALLOUT_COMMAND = createCommand<CalloutPayload>();

const calloutStyles: Record<CalloutType, { bg: string; border: string; icon: JSX.Element; title: string }> = {
  info: {
    bg: "bg-blue-50",
    border: "border-blue-200",
    icon: <Info className="w-5 h-5 text-blue-500" />,
    title: "정보",
  },
  warning: {
    bg: "bg-amber-50",
    border: "border-amber-200",
    icon: <AlertTriangle className="w-5 h-5 text-amber-500" />,
    title: "주의",
  },
  success: {
    bg: "bg-green-50",
    border: "border-green-200",
    icon: <CheckCircle className="w-5 h-5 text-green-500" />,
    title: "성공",
  },
  tip: {
    bg: "bg-purple-50",
    border: "border-purple-200",
    icon: <Lightbulb className="w-5 h-5 text-purple-500" />,
    title: "팁",
  },
};

function CalloutComponent({
  calloutType,
  content,
  nodeKey,
}: {
  calloutType: CalloutType;
  content: string;
  nodeKey: NodeKey;
}) {
  const [editor] = useLexicalComposerContext();
  const containerRef = useRef<HTMLDivElement>(null);
  const [isSelected, setSelected, clearSelection] = useLexicalNodeSelection(nodeKey);
  const [isFocused, setIsFocused] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(content);

  const style = calloutStyles[calloutType];

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
      const node = $getNodeByKey(nodeKey) as CalloutNode | null;
      if (node) {
        node.setContent(editContent);
      }
    });
    setIsEditing(false);
  }, [editor, nodeKey, editContent]);

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

  return (
    <div
      ref={containerRef}
      className={`relative my-4 p-4 rounded-lg border ${style.bg} ${style.border} cursor-pointer ${
        isFocused ? "ring-2 ring-blue-500 ring-offset-2" : ""
      }`}
      onDoubleClick={() => setIsEditing(true)}
    >
      <div className="flex items-start gap-3">
        <div className="shrink-0 mt-0.5">{style.icon}</div>
        <div className="flex-1 min-w-0">
          <div className="font-medium text-sm text-gray-700 mb-1">{style.title}</div>
          {isEditing ? (
            <div className="space-y-2">
              <textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                className="w-full p-2 text-sm border rounded resize-none focus:outline-none focus:ring-1 focus:ring-blue-500"
                rows={3}
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === "Escape") {
                    setEditContent(content);
                    setIsEditing(false);
                  }
                }}
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
                    setEditContent(content);
                    setIsEditing(false);
                  }}
                  className="px-3 py-1 text-xs bg-gray-200 rounded hover:bg-gray-300"
                >
                  취소
                </button>
              </div>
            </div>
          ) : (
            <div className="text-sm text-gray-600 whitespace-pre-wrap">{content}</div>
          )}
        </div>
      </div>
      {isFocused && !isEditing && (
        <span className="absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-1 bg-black/75 text-white text-xs rounded whitespace-nowrap">
          더블클릭하여 수정 · Delete 키로 삭제
        </span>
      )}
    </div>
  );
}

export class CalloutNode extends DecoratorNode<JSX.Element> {
  __calloutType: CalloutType;
  __content: string;

  static getType(): string {
    return "callout";
  }

  static clone(node: CalloutNode): CalloutNode {
    return new CalloutNode(node.__calloutType, node.__content, node.__key);
  }

  constructor(calloutType: CalloutType, content: string, key?: NodeKey) {
    super(key);
    this.__calloutType = calloutType;
    this.__content = content;
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

  static importJSON(serializedNode: SerializedCalloutNode): CalloutNode {
    return new CalloutNode(serializedNode.calloutType, serializedNode.content);
  }

  exportJSON(): SerializedCalloutNode {
    return {
      type: "callout",
      version: 1,
      calloutType: this.__calloutType,
      content: this.__content,
    };
  }

  decorate(): JSX.Element {
    return (
      <CalloutComponent
        calloutType={this.__calloutType}
        content={this.__content}
        nodeKey={this.__key}
      />
    );
  }
}

export function $createCalloutNode(payload: CalloutPayload): CalloutNode {
  return new CalloutNode(payload.type, payload.content);
}

export function $isCalloutNode(node: unknown): node is CalloutNode {
  return node instanceof CalloutNode;
}

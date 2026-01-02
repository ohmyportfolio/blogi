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

export type YouTubePayload = {
  videoId: string;
};

export type SerializedYouTubeNode = {
  type: "youtube";
  version: 1;
  videoId: string;
};

export const INSERT_YOUTUBE_COMMAND = createCommand<YouTubePayload>();

function YouTubeComponent({
  videoId,
  nodeKey,
}: {
  videoId: string;
  nodeKey: NodeKey;
}) {
  const [editor] = useLexicalComposerContext();
  const containerRef = useRef<HTMLDivElement>(null);
  const [isSelected, setSelected, clearSelection] = useLexicalNodeSelection(nodeKey);
  const [isFocused, setIsFocused] = useState(false);

  const onDelete = useCallback(
    (event: KeyboardEvent) => {
      if (isSelected && $isNodeSelection($getSelection())) {
        event.preventDefault();
        const node = $getNodeByKey(nodeKey);
        if (node) {
          node.remove();
        }
      }
      return false;
    },
    [isSelected, nodeKey]
  );

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
      className={`relative my-4 cursor-pointer ${
        isFocused ? "ring-2 ring-blue-500 ring-offset-2 rounded-lg" : ""
      }`}
    >
      <div className="relative w-full" style={{ paddingBottom: "56.25%" }}>
        <iframe
          className="absolute top-0 left-0 w-full h-full rounded-lg"
          src={`https://www.youtube.com/embed/${videoId}`}
          title="YouTube video"
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>
      {isFocused && (
        <span className="absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-1 bg-black/75 text-white text-xs rounded whitespace-nowrap z-10">
          Delete 키로 삭제
        </span>
      )}
    </div>
  );
}

export class YouTubeNode extends DecoratorNode<JSX.Element> {
  __videoId: string;

  static getType(): string {
    return "youtube";
  }

  static clone(node: YouTubeNode): YouTubeNode {
    return new YouTubeNode(node.__videoId, node.__key);
  }

  constructor(videoId: string, key?: NodeKey) {
    super(key);
    this.__videoId = videoId;
  }

  createDOM(): HTMLElement {
    const div = document.createElement("div");
    return div;
  }

  updateDOM(): boolean {
    return false;
  }

  static importJSON(serializedNode: SerializedYouTubeNode): YouTubeNode {
    return new YouTubeNode(serializedNode.videoId);
  }

  exportJSON(): SerializedYouTubeNode {
    return {
      type: "youtube",
      version: 1,
      videoId: this.__videoId,
    };
  }

  decorate(): JSX.Element {
    return <YouTubeComponent videoId={this.__videoId} nodeKey={this.__key} />;
  }
}

export function $createYouTubeNode(payload: YouTubePayload): YouTubeNode {
  return new YouTubeNode(payload.videoId);
}

export function $isYouTubeNode(node: unknown): node is YouTubeNode {
  return node instanceof YouTubeNode;
}

export function extractYouTubeVideoId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
}

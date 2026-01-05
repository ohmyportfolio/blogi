"use client";

/**
 * Lexical Playground 기반 TableCellResizer
 * 테이블 셀 리사이즈 및 드래그 선택 지원
 */

import type { TableDOMCell } from "@lexical/table";

import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import {
  $getTableColumnIndexFromTableCellNode,
  $getTableNodeFromLexicalNodeOrThrow,
  $getTableRowIndexFromTableCellNode,
  $isTableCellNode,
  $isTableRowNode,
  getDOMCellFromTarget,
  TableCellNode,
} from "@lexical/table";
import {
  $getNearestNodeFromDOMNode,
  $getSelection,
  $isRangeSelection,
} from "lexical";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";

type MousePosition = {
  x: number;
  y: number;
};

type MouseDraggingDirection = "right" | "bottom";

const MIN_ROW_HEIGHT = 33;
const MIN_COLUMN_WIDTH = 50;

function TableCellResizer({ editor }: { editor: ReturnType<typeof useLexicalComposerContext>[0] }) {
  const targetRef = useRef<HTMLElement | null>(null);
  const resizerRef = useRef<HTMLDivElement | null>(null);
  const tableRectRef = useRef<DOMRect | null>(null);

  const mouseStartPosRef = useRef<MousePosition | null>(null);
  const [mouseCurrentPos, updateMouseCurrentPos] = useState<MousePosition | null>(null);
  const [liveCellRect, setLiveCellRect] = useState<DOMRect | null>(null);

  const [activeCell, setActiveCell] = useState<TableDOMCell | null>(null);
  const [isMouseDown, setIsMouseDown] = useState<boolean>(false);
  const [draggingDirection, setDraggingDirection] = useState<MouseDraggingDirection | null>(null);

  const resetState = useCallback(() => {
    setActiveCell(null);
    targetRef.current = null;
      setDraggingDirection(null);
      setIsMouseDown(false);
      mouseStartPosRef.current = null;
      setLiveCellRect(null);
      tableRectRef.current = null;
    }, []);

  useEffect(() => {
    const onMouseMove = (event: MouseEvent) => {
      setTimeout(() => {
        const target = event.target;

        if (draggingDirection) {
          updateMouseCurrentPos({
            x: event.clientX,
            y: event.clientY,
          });
          return;
        }

        if (resizerRef.current && resizerRef.current.contains(target as Node)) {
          return;
        }

        if (targetRef.current !== target) {
          targetRef.current = target as HTMLElement;
          const cell = getDOMCellFromTarget(target as HTMLElement);

          if (cell && activeCell !== cell) {
            editor.update(() => {
              const tableCellNode = $getNearestNodeFromDOMNode(cell.elem);
              if (!tableCellNode) {
                return;
              }

              const tableNode = $getTableNodeFromLexicalNodeOrThrow(tableCellNode);
              const tableElement = editor.getElementByKey(tableNode.getKey());

              if (!tableElement) {
                return;
              }

              targetRef.current = target as HTMLElement;
              tableRectRef.current = tableElement.getBoundingClientRect();
              setActiveCell(cell);
              setLiveCellRect(cell.elem.getBoundingClientRect());
            });
          } else if (cell == null) {
            resetState();
          }
        }
      }, 0);
    };

    document.addEventListener("mousemove", onMouseMove);

    return () => {
      document.removeEventListener("mousemove", onMouseMove);
    };
  }, [activeCell, draggingDirection, editor, resetState]);

  const isHeightChanging = (direction: MouseDraggingDirection) => {
    return direction === "bottom";
  };

  const updateRowHeight = useCallback(
    (newHeight: number) => {
      if (!activeCell) {
        return;
      }

      editor.update(
        () => {
          const tableCellNode = $getNearestNodeFromDOMNode(activeCell.elem);
          if (!$isTableCellNode(tableCellNode)) {
            return;
          }

          const tableNode = $getTableNodeFromLexicalNodeOrThrow(tableCellNode);

          const tableRowIndex = $getTableRowIndexFromTableCellNode(tableCellNode);

          const tableRows = tableNode.getChildren();

          if (tableRowIndex >= tableRows.length || tableRowIndex < 0) {
            return;
          }

          const tableRow = tableRows[tableRowIndex];

          if (!$isTableRowNode(tableRow)) {
            return;
          }

          tableRow.setHeight(newHeight);
        },
        { tag: "skip-scroll-into-view" }
      );
    },
    [activeCell, editor]
  );

  const updateColumnWidth = useCallback(
    (newWidth: number) => {
      if (!activeCell) {
        return;
      }

      editor.update(
        () => {
          const tableCellNode = $getNearestNodeFromDOMNode(activeCell.elem);
          if (!$isTableCellNode(tableCellNode)) {
            return;
          }

          const tableNode = $getTableNodeFromLexicalNodeOrThrow(tableCellNode);
          const tableColumnIndex = $getTableColumnIndexFromTableCellNode(tableCellNode);

          const tableRows = tableNode.getChildren();

          for (let r = 0; r < tableRows.length; r++) {
            const tableRow = tableRows[r];

            if (!$isTableRowNode(tableRow)) {
              continue;
            }

            const tableCells = tableRow.getChildren();
            let currentColumnIndex = 0;

            for (let c = 0; c < tableCells.length; c++) {
              const cell = tableCells[c];
              if (!$isTableCellNode(cell)) {
                continue;
              }

              const colSpan = cell.getColSpan();
              if (
                currentColumnIndex <= tableColumnIndex &&
                tableColumnIndex < currentColumnIndex + colSpan
              ) {
                cell.setWidth(newWidth);
              }

              currentColumnIndex += colSpan;
            }
          }
        },
        { tag: "skip-scroll-into-view" }
      );
    },
    [activeCell, editor]
  );

  const mouseUpHandler = useCallback(
    (direction: MouseDraggingDirection) => {
      const handler = (event: MouseEvent) => {
        event.preventDefault();
        event.stopPropagation();

        if (!activeCell) {
          return;
        }

        if (mouseStartPosRef.current) {
          const { x, y } = mouseStartPosRef.current;

          if (activeCell === null) {
            return;
          }

          const zoom = parseFloat(getComputedStyle(document.body).getPropertyValue("zoom") || "1");

          if (isHeightChanging(direction)) {
            const rect = activeCell.elem.getBoundingClientRect();
            const height = rect.height;
            const heightChange = (event.clientY - y) / zoom;

            const newHeight = Math.max(height + heightChange, MIN_ROW_HEIGHT);

            updateRowHeight(newHeight);
            const tableRect = tableRectRef.current;
            const previewRect = tableRect
              ? new DOMRect(tableRect.left, rect.top, tableRect.width, newHeight)
              : new DOMRect(rect.left, rect.top, rect.width, newHeight);
            setLiveCellRect(previewRect);
          } else {
            const rect = activeCell.elem.getBoundingClientRect();
            const computedStyle = getComputedStyle(activeCell.elem);
            let width = activeCell.elem.clientWidth;
            width -= parseFloat(computedStyle.paddingLeft);
            width -= parseFloat(computedStyle.paddingRight);

            const widthChange = (event.clientX - x) / zoom;

            const newWidth = Math.max(width + widthChange, MIN_COLUMN_WIDTH);

            updateColumnWidth(newWidth);
            const tableRect = tableRectRef.current;
            const previewRect = tableRect
              ? new DOMRect(rect.left, tableRect.top, newWidth, tableRect.height)
              : new DOMRect(rect.left, rect.top, newWidth, rect.height);
            setLiveCellRect(previewRect);
          }

          resetState();
          document.removeEventListener("mouseup", handler);
        }
      };
      return handler;
    },
    [activeCell, resetState, updateColumnWidth, updateRowHeight]
  );

  const toggleResize = useCallback(
    (direction: MouseDraggingDirection) =>
      (event: React.MouseEvent<HTMLDivElement>) => {
        event.preventDefault();
        event.stopPropagation();

        if (!activeCell) {
          return;
        }

        setIsMouseDown(true);
        setDraggingDirection(direction);
        mouseStartPosRef.current = {
          x: event.clientX,
          y: event.clientY,
        };
        document.addEventListener("mouseup", mouseUpHandler(direction));
      },
    [activeCell, mouseUpHandler]
  );

  // Dragging 중 미리보기 라인 업데이트
  useEffect(() => {
    if (!isMouseDown || !draggingDirection || !mouseStartPosRef.current || !mouseCurrentPos || !activeCell) {
      return;
    }

    const { x, y } = mouseStartPosRef.current;
    const zoom = parseFloat(getComputedStyle(document.body).getPropertyValue("zoom") || "1");
    const rect = activeCell.elem.getBoundingClientRect();
    const tableRect = tableRectRef.current;

    if (isHeightChanging(draggingDirection)) {
      const heightChange = (mouseCurrentPos.y - y) / zoom;
      const newHeight = Math.max(rect.height + heightChange, MIN_ROW_HEIGHT);
      const previewRect = tableRect
        ? new DOMRect(tableRect.left, rect.top, tableRect.width, newHeight)
        : new DOMRect(rect.left, rect.top, rect.width, newHeight);
      setLiveCellRect(previewRect);
    } else {
      const widthChange = (mouseCurrentPos.x - x) / zoom;
      const newWidth = Math.max(rect.width + widthChange, MIN_COLUMN_WIDTH);
      const previewRect = tableRect
        ? new DOMRect(rect.left, tableRect.top, newWidth, tableRect.height)
        : new DOMRect(rect.left, rect.top, newWidth, rect.height);
      setLiveCellRect(previewRect);
    }
  }, [activeCell, draggingDirection, isMouseDown, mouseCurrentPos]);

  const getResizers = useCallback(() => {
    if (activeCell) {
      const { height, width, top, left } = activeCell.elem.getBoundingClientRect();
      const zoom = parseFloat(getComputedStyle(document.body).getPropertyValue("zoom") || "1");

      const styles = {
        bottom: {
          backgroundColor: "none",
          cursor: "row-resize",
          height: "10px",
          left: `${left * zoom}px`,
          top: `${(top + height) * zoom}px`,
          width: `${width * zoom}px`,
        },
        right: {
          backgroundColor: "none",
          cursor: "col-resize",
          height: `${height * zoom}px`,
          left: `${(left + width) * zoom}px`,
          top: `${top * zoom}px`,
          width: "10px",
        },
      };

      const tableRect = tableRectRef.current;

      if (tableRect) {
        Object.assign(styles.bottom, {
          left: `${tableRect.left * zoom}px`,
          width: `${tableRect.width * zoom}px`,
        });
        Object.assign(styles.right, {
          height: `${tableRect.height * zoom}px`,
          top: `${tableRect.top * zoom}px`,
        });
      }

      return styles;
    }

    return {
      bottom: null,
      left: null,
      right: null,
      top: null,
    };
  }, [activeCell]);

  const resizerStyles = getResizers();

  return (
    <div ref={resizerRef}>
      {activeCell != null && isMouseDown && liveCellRect && (
        <>
          <div
            className="TableCellResizerPreview"
            style={{
              position: "fixed",
              zIndex: 1001,
              left: liveCellRect.left,
              top: liveCellRect.top,
              width: liveCellRect.width,
              height: liveCellRect.height,
            }}
          />
          {draggingDirection === "right" && (
            <div
              className="TableCellResizerPreviewLine"
              style={{
                position: "fixed",
                zIndex: 1002,
                left: liveCellRect.left + liveCellRect.width,
                top: liveCellRect.top,
                width: 2,
                height: liveCellRect.height,
              }}
            />
          )}
          {draggingDirection === "bottom" && (
            <div
              className="TableCellResizerPreviewLine"
              style={{
                position: "fixed",
                zIndex: 1002,
                left: liveCellRect.left,
                top: liveCellRect.top + liveCellRect.height,
                width: liveCellRect.width,
                height: 2,
              }}
            />
          )}
        </>
      )}
      {activeCell != null && !isMouseDown && (
        <>
          <div
            className={`TableCellResizer ${isMouseDown ? "TableCellResizer--active" : ""}`}
            style={{
              ...resizerStyles.right,
              position: "fixed",
              zIndex: 1000,
            }}
            onMouseDown={toggleResize("right")}
          />
          <div
            className={`TableCellResizer ${isMouseDown ? "TableCellResizer--active" : ""}`}
            style={{
              ...resizerStyles.bottom,
              position: "fixed",
              zIndex: 1000,
            }}
            onMouseDown={toggleResize("bottom")}
          />
        </>
      )}
    </div>
  );
}

export function TableCellResizerPlugin() {
  const [editor] = useLexicalComposerContext();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const isEditable = useMemo(() => editor.isEditable(), [editor]);

  if (!isEditable || !isClient) {
    return null;
  }

  return createPortal(<TableCellResizer editor={editor} />, document.body);
}

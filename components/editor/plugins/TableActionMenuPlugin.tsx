"use client";

/**
 * Lexical Playground 기반 TableActionMenuPlugin
 * 테이블 셀 선택 시 액션 버튼 표시 및 컨텍스트 메뉴 제공
 */

import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import {
  $deleteTableColumn__EXPERIMENTAL,
  $deleteTableRow__EXPERIMENTAL,
  $getTableCellNodeFromLexicalNode,
  $getTableNodeFromLexicalNodeOrThrow,
  $insertTableColumn__EXPERIMENTAL,
  $insertTableRow__EXPERIMENTAL,
  $isTableCellNode,
  TableCellNode,
} from "@lexical/table";
import { $getSelection, $isRangeSelection } from "lexical";
import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  ChevronDown,
  Minus,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  Trash2,
  TableProperties,
} from "lucide-react";

interface TableActionMenuProps {
  anchorElem?: HTMLElement;
}

function TableCellActionMenuContainer({
  anchorElem,
}: {
  anchorElem: HTMLElement;
}) {
  const [editor] = useLexicalComposerContext();
  const menuButtonRef = useRef<HTMLButtonElement | null>(null);
  const menuRootRef = useRef<HTMLDivElement | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [tableCellNode, setTableCellNode] = useState<TableCellNode | null>(null);

  const moveMenu = useCallback(() => {
    const menu = menuButtonRef.current;
    const selection = $getSelection();
    const nativeSelection = window.getSelection();
    const activeElement = document.activeElement;

    if (selection == null || menu == null) {
      setTableCellNode(null);
      return;
    }

    const rootElement = editor.getRootElement();

    if (
      $isRangeSelection(selection) &&
      rootElement !== null &&
      nativeSelection !== null &&
      rootElement.contains(nativeSelection.anchorNode)
    ) {
      const tableCellNodeFromSelection = $getTableCellNodeFromLexicalNode(
        selection.anchor.getNode()
      );

      if (tableCellNodeFromSelection == null) {
        setTableCellNode(null);
        return;
      }

      const tableCellParentNodeDOM = editor.getElementByKey(
        tableCellNodeFromSelection.getKey()
      );

      if (tableCellParentNodeDOM == null) {
        setTableCellNode(null);
        return;
      }

      setTableCellNode(tableCellNodeFromSelection);
    } else if (!activeElement) {
      setTableCellNode(null);
    }
  }, [editor]);

  useEffect(() => {
    return editor.registerUpdateListener(() => {
      editor.getEditorState().read(() => {
        moveMenu();
      });
    });
  });

  useEffect(() => {
    const menuButtonDOM = menuButtonRef.current;

    if (menuButtonDOM != null && tableCellNode != null) {
      const tableCellNodeDOM = editor.getElementByKey(tableCellNode.getKey());

      if (tableCellNodeDOM != null) {
        const tableCellRect = tableCellNodeDOM.getBoundingClientRect();

        // fixed 위치로 직접 배치
        const top = tableCellRect.top + 4;
        const left = tableCellRect.right - 30;

        menuButtonDOM.style.opacity = "1";
        menuButtonDOM.style.top = `${top}px`;
        menuButtonDOM.style.left = `${left}px`;
      } else {
        menuButtonDOM.style.opacity = "0";
        menuButtonDOM.style.top = "-10000px";
        menuButtonDOM.style.left = "-10000px";
      }
    }
  }, [menuButtonRef, tableCellNode, editor]);

  const prevTableCellDOM = useRef(tableCellNode);

  useEffect(() => {
    prevTableCellDOM.current = tableCellNode;
  }, [prevTableCellDOM, tableCellNode]);

  // 테이블 작업 함수들
  const insertRowAbove = useCallback(() => {
    editor.update(() => {
      $insertTableRow__EXPERIMENTAL(false);
    });
    setIsMenuOpen(false);
  }, [editor]);

  const insertRowBelow = useCallback(() => {
    editor.update(() => {
      $insertTableRow__EXPERIMENTAL(true);
    });
    setIsMenuOpen(false);
  }, [editor]);

  const insertColumnLeft = useCallback(() => {
    editor.update(() => {
      $insertTableColumn__EXPERIMENTAL(false);
    });
    setIsMenuOpen(false);
  }, [editor]);

  const insertColumnRight = useCallback(() => {
    editor.update(() => {
      $insertTableColumn__EXPERIMENTAL(true);
    });
    setIsMenuOpen(false);
  }, [editor]);

  const deleteRow = useCallback(() => {
    editor.update(() => {
      $deleteTableRow__EXPERIMENTAL();
    });
    setIsMenuOpen(false);
  }, [editor]);

  const deleteColumn = useCallback(() => {
    editor.update(() => {
      $deleteTableColumn__EXPERIMENTAL();
    });
    setIsMenuOpen(false);
  }, [editor]);

  const deleteTable = useCallback(() => {
    editor.update(() => {
      if (tableCellNode) {
        const tableNode = $getTableNodeFromLexicalNodeOrThrow(tableCellNode);
        tableNode.remove();
      }
    });
    setIsMenuOpen(false);
  }, [editor, tableCellNode]);

  const handleCloseMenu = useCallback(() => {
    setIsMenuOpen(false);
  }, []);

  // 메뉴 외부 클릭 시 닫기
  useEffect(() => {
    if (!isMenuOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (
        menuRootRef.current &&
        !menuRootRef.current.contains(event.target as Node)
      ) {
        handleCloseMenu();
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        handleCloseMenu();
      }
    };

    document.addEventListener("click", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("click", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isMenuOpen, handleCloseMenu]);

  const buttonClass =
    "flex items-center gap-2 px-3 py-2 text-sm text-left hover:bg-gray-100 transition-colors w-full";
  const dangerButtonClass =
    "flex items-center gap-2 px-3 py-2 text-sm text-left hover:bg-gray-100 transition-colors text-red-600 w-full";
  const sectionHeaderClass =
    "px-3 py-1.5 text-xs font-medium text-gray-500 border-b border-gray-100";

  let menuContent = null;

  if (tableCellNode != null) {
    menuContent = isMenuOpen ? (
      <>
        {/* 오버레이 */}
        <div
          className="fixed inset-0 z-[9998]"
          onClick={handleCloseMenu}
        />
        {/* 메뉴 */}
        <div
          ref={menuRootRef}
          className="fixed z-[9999] flex flex-col bg-white rounded-lg shadow-xl border border-gray-200 py-1 min-w-[200px] max-h-[80vh] overflow-y-auto"
          style={{
            top: menuButtonRef.current
              ? menuButtonRef.current.getBoundingClientRect().bottom + 4
              : 0,
            left: menuButtonRef.current
              ? menuButtonRef.current.getBoundingClientRect().left - 150
              : 0,
          }}
        >
          {/* 행 편집 */}
          <div className={sectionHeaderClass}>행 편집</div>
          <button type="button" className={buttonClass} onClick={insertRowAbove}>
            <ArrowUp className="w-4 h-4" />
            위에 행 추가
          </button>
          <button type="button" className={buttonClass} onClick={insertRowBelow}>
            <ArrowDown className="w-4 h-4" />
            아래에 행 추가
          </button>
          <button type="button" className={dangerButtonClass} onClick={deleteRow}>
            <Minus className="w-4 h-4" />
            행 삭제
          </button>

          {/* 열 편집 */}
          <div className={`${sectionHeaderClass} border-t mt-1`}>열 편집</div>
          <button type="button" className={buttonClass} onClick={insertColumnLeft}>
            <ArrowLeft className="w-4 h-4" />
            왼쪽에 열 추가
          </button>
          <button type="button" className={buttonClass} onClick={insertColumnRight}>
            <ArrowRight className="w-4 h-4" />
            오른쪽에 열 추가
          </button>
          <button type="button" className={dangerButtonClass} onClick={deleteColumn}>
            <Minus className="w-4 h-4" />
            열 삭제
          </button>

          {/* 테이블 삭제 */}
          <div className="border-t border-gray-100 mt-1 pt-1">
            <button
              type="button"
              className="flex items-center gap-2 px-3 py-2 text-sm text-left hover:bg-red-50 transition-colors text-red-600 w-full"
              onClick={deleteTable}
            >
              <Trash2 className="w-4 h-4" />
              테이블 삭제
            </button>
          </div>
        </div>
      </>
    ) : null;
  }

  return (
    <>
      <button
        ref={menuButtonRef}
        type="button"
        className="fixed opacity-0 flex items-center justify-center w-6 h-6 bg-white hover:bg-gray-100 border border-gray-200 rounded shadow-sm cursor-pointer transition-colors z-[1000]"
        onClick={(e) => {
          e.stopPropagation();
          setIsMenuOpen(!isMenuOpen);
        }}
        aria-label="테이블 옵션"
      >
        <ChevronDown className="w-4 h-4 text-gray-600" />
      </button>
      {menuContent}
    </>
  );
}

function TableCellActionMenuContainerWithContext({
  anchorElem,
}: {
  anchorElem: HTMLElement;
}) {
  const [editor] = useLexicalComposerContext();

  // 우클릭 컨텍스트 메뉴도 지원
  useEffect(() => {
    const rootElement = editor.getRootElement();
    if (!rootElement) return;

    const handleContextMenu = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      const tableCell = target.closest("td, th");
      if (!tableCell) return;

      const table = target.closest("table");
      if (!table || !rootElement.contains(table)) return;

      // 테이블 셀에서 우클릭 시 기본 컨텍스트 메뉴 방지하지 않음
      // 대신 액션 버튼 사용 유도
    };

    rootElement.addEventListener("contextmenu", handleContextMenu);

    return () => {
      rootElement.removeEventListener("contextmenu", handleContextMenu);
    };
  }, [editor]);

  return <TableCellActionMenuContainer anchorElem={anchorElem} />;
}

export function TableActionMenuPlugin({
  anchorElem = typeof document !== "undefined" ? document.body : null!,
}: TableActionMenuProps) {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) {
    return null;
  }

  return createPortal(
    <TableCellActionMenuContainerWithContext
      anchorElem={anchorElem}
    />,
    anchorElem
  );
}

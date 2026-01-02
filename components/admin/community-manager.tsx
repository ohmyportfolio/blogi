"use client";

import { useState } from "react";
import { BoardManager, type BoardItem } from "@/components/admin/board-manager";
import { CommunityThumbnailEditor } from "@/components/admin/community-thumbnail-editor";

interface CommunityGroup {
  menuItemId: string;
  label: string;
  href: string;
  slug: string;
  order: number;
  isVisible: boolean;
  thumbnailUrl: string | null;
  boards: BoardItem[];
}

interface CommunityManagerProps {
  initialGroups: CommunityGroup[];
}

export const CommunityManager = ({ initialGroups }: CommunityManagerProps) => {
  const [groups, setGroups] = useState(initialGroups);

  const handleUpdateThumbnail = (menuItemId: string, thumbnailUrl: string) => {
    setGroups((prev) =>
      prev.map((group) =>
        group.menuItemId === menuItemId
          ? { ...group, thumbnailUrl }
          : group
      )
    );
  };

  if (groups.length === 0) {
    return (
      <div className="rounded-2xl border border-black/5 bg-white p-8 text-center">
        <p className="text-gray-500">등록된 커뮤니티 그룹이 없습니다.</p>
        <p className="text-sm text-gray-400 mt-1">
          메뉴 관리에서 커뮤니티 그룹을 먼저 추가해주세요.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {groups.map((group) => (
        <div
          key={group.menuItemId}
          className="rounded-2xl border border-black/5 bg-white shadow-sm overflow-hidden"
        >
          <div className="p-4 border-b border-gray-100 space-y-3">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-medium text-lg">{group.label}</h3>
                  {!group.isVisible && (
                    <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                      숨김
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-400 mt-1">/{group.slug}</p>
                <p className="text-xs text-gray-400 mt-1">
                  그룹 이름/정렬은 메뉴 관리에서 변경합니다.
                </p>
              </div>
              <div className="min-w-[220px]">
                <CommunityThumbnailEditor
                  menuItemId={group.menuItemId}
                  thumbnailUrl={group.thumbnailUrl ?? ""}
                  onUpdate={(thumbnailUrl) =>
                    handleUpdateThumbnail(group.menuItemId, thumbnailUrl)
                  }
                />
              </div>
            </div>
          </div>

          <div className="p-4 bg-gray-50/40">
            <BoardManager
              boards={group.boards ?? []}
              menuItemId={group.menuItemId}
              groupSlug={group.slug}
            />
          </div>
        </div>
      ))}
    </div>
  );
};

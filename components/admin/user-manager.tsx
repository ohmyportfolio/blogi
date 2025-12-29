"use client";

import { useEffect, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, KeyRound, Trash2, Save } from "lucide-react";

export type AdminUserItem = {
  id: string;
  name?: string | null;
  email: string;
  role: string;
  isApproved: boolean;
  createdAt: string | Date;
};

const blankDraft = {
  name: "",
  email: "",
  password: "",
  role: "USER",
  isApproved: false,
};

interface UserManagerProps {
  users: AdminUserItem[];
  currentUserId?: string | null;
}

export const UserManager = ({ users, currentUserId }: UserManagerProps) => {
  const { showToast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [userState, setUserState] = useState<AdminUserItem[]>(users);
  const [draft, setDraft] = useState(blankDraft);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [passwordDrafts, setPasswordDrafts] = useState<Record<string, string>>({});
  const [showPasswordForm, setShowPasswordForm] = useState<Record<string, boolean>>({});

  useEffect(() => {
    setUserState(users);
  }, [users]);

  const updateUserState = (updater: (items: AdminUserItem[]) => AdminUserItem[]) => {
    setUserState((prev) => updater(prev));
  };

  const handleCreate = () => {
    if (!draft.email.trim()) {
      showToast("이메일을 입력해주세요.", "error");
      return;
    }
    if (!draft.password.trim()) {
      showToast("비밀번호를 입력해주세요.", "error");
      return;
    }
    startTransition(async () => {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "create", data: draft }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        showToast(data.error || "사용자 생성에 실패했습니다.", "error");
        return;
      }
      const created = await res.json();
      updateUserState((items) => [created, ...items]);
      setDraft(blankDraft);
      setShowCreateForm(false);
      showToast("사용자가 추가되었습니다.", "success");
    });
  };

  const handleUpdate = (item: AdminUserItem) => {
    if (!item.email.trim()) {
      showToast("이메일을 입력해주세요.", "error");
      return;
    }
    startTransition(async () => {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "update",
          id: item.id,
          data: {
            name: item.name,
            email: item.email,
            role: item.role,
            isApproved: item.isApproved,
          },
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        showToast(data.error || "사용자 저장에 실패했습니다.", "error");
        return;
      }
      const updated = await res.json();
      updateUserState((items) =>
        items.map((target) => (target.id === updated.id ? updated : target))
      );
      showToast("사용자 정보가 저장되었습니다.", "success");
    });
  };

  const handleDelete = (item: AdminUserItem) => {
    if (item.id === currentUserId) {
      showToast("현재 로그인한 계정은 삭제할 수 없습니다.", "error");
      return;
    }
    if (!confirm("이 사용자를 삭제할까요?")) return;
    startTransition(async () => {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "delete", id: item.id }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        showToast(data.error || "사용자 삭제에 실패했습니다.", "error");
        return;
      }
      updateUserState((items) => items.filter((target) => target.id !== item.id));
      showToast("사용자가 삭제되었습니다.", "success");
    });
  };

  const handlePasswordChange = (item: AdminUserItem) => {
    const nextPassword = passwordDrafts[item.id]?.trim();
    if (!nextPassword) {
      showToast("새 비밀번호를 입력해주세요.", "error");
      return;
    }
    startTransition(async () => {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "resetPassword", id: item.id, password: nextPassword }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        showToast(data.error || "비밀번호 변경에 실패했습니다.", "error");
        return;
      }
      setPasswordDrafts((prev) => ({ ...prev, [item.id]: "" }));
      setShowPasswordForm((prev) => ({ ...prev, [item.id]: false }));
      showToast("비밀번호가 변경되었습니다.", "success");
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-lg font-semibold">사용자 목록</h2>
        <Button
          type="button"
          variant="outline"
          onClick={() => setShowCreateForm((prev) => !prev)}
          disabled={isPending}
        >
          <Plus className="mr-2 h-4 w-4" />
          새 사용자 추가
        </Button>
      </div>

      <div className="overflow-x-auto rounded-xl border border-black/10 bg-white shadow-sm">
        <table className="w-full min-w-[920px] text-left text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="p-3 font-medium">이름</th>
              <th className="p-3 font-medium">이메일</th>
              <th className="p-3 font-medium">권한</th>
              <th className="p-3 font-medium">승인</th>
              <th className="p-3 font-medium">비밀번호</th>
              <th className="p-3 font-medium">관리</th>
            </tr>
          </thead>
          <tbody>
            {showCreateForm && (
              <tr className="border-t bg-white">
                <td className="p-3">
                  <Input
                    value={draft.name}
                    onChange={(event) =>
                      setDraft((prev) => ({ ...prev, name: event.target.value }))
                    }
                    placeholder="이름"
                    disabled={isPending}
                  />
                </td>
                <td className="p-3">
                  <Input
                    value={draft.email}
                    onChange={(event) =>
                      setDraft((prev) => ({ ...prev, email: event.target.value }))
                    }
                    placeholder="이메일"
                    disabled={isPending}
                  />
                </td>
                <td className="p-3">
                  <Select
                    value={draft.role}
                    onValueChange={(value) =>
                      setDraft((prev) => ({ ...prev, role: value }))
                    }
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="권한" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="USER">USER</SelectItem>
                      <SelectItem value="ADMIN">ADMIN</SelectItem>
                    </SelectContent>
                  </Select>
                </td>
                <td className="p-3">
                  <label className="flex items-center gap-2 text-xs text-gray-600">
                    <input
                      type="checkbox"
                      checked={draft.isApproved}
                      onChange={(event) =>
                        setDraft((prev) => ({ ...prev, isApproved: event.target.checked }))
                      }
                      disabled={isPending}
                    />
                    승인
                  </label>
                </td>
                <td className="p-3">
                  <Input
                    value={draft.password}
                    onChange={(event) =>
                      setDraft((prev) => ({ ...prev, password: event.target.value }))
                    }
                    placeholder="비밀번호"
                    type="password"
                    disabled={isPending}
                  />
                </td>
                <td className="p-3">
                  <div className="flex flex-wrap gap-2">
                    <Button type="button" onClick={handleCreate} disabled={isPending}>
                      추가
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setDraft(blankDraft);
                        setShowCreateForm(false);
                      }}
                      disabled={isPending}
                    >
                      취소
                    </Button>
                  </div>
                </td>
              </tr>
            )}
            {userState.map((user) => (
              <tr key={user.id} className="border-t">
                <td className="p-3">
                  <Input
                    value={user.name ?? ""}
                    onChange={(event) =>
                      updateUserState((items) =>
                        items.map((target) =>
                          target.id === user.id ? { ...target, name: event.target.value } : target
                        )
                      )
                    }
                    placeholder="이름"
                    disabled={isPending}
                  />
                </td>
                <td className="p-3">
                  <Input
                    value={user.email}
                    onChange={(event) =>
                      updateUserState((items) =>
                        items.map((target) =>
                          target.id === user.id ? { ...target, email: event.target.value } : target
                        )
                      )
                    }
                    placeholder="이메일"
                    disabled={isPending}
                  />
                </td>
                <td className="p-3">
                  <Select
                    value={user.role}
                    onValueChange={(value) =>
                      updateUserState((items) =>
                        items.map((target) =>
                          target.id === user.id ? { ...target, role: value } : target
                        )
                      )
                    }
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="USER">USER</SelectItem>
                      <SelectItem value="ADMIN">ADMIN</SelectItem>
                    </SelectContent>
                  </Select>
                </td>
                <td className="p-3">
                  <label className="flex items-center gap-2 text-xs text-gray-600">
                    <input
                      type="checkbox"
                      checked={user.isApproved}
                      onChange={(event) =>
                        updateUserState((items) =>
                          items.map((target) =>
                            target.id === user.id
                              ? { ...target, isApproved: event.target.checked }
                              : target
                          )
                        )
                      }
                      disabled={isPending}
                    />
                    승인
                  </label>
                </td>
                <td className="p-3">
                  {showPasswordForm[user.id] ? (
                    <div className="flex flex-wrap items-center gap-2">
                      <Input
                        type="password"
                        value={passwordDrafts[user.id] ?? ""}
                        onChange={(event) =>
                          setPasswordDrafts((prev) => ({ ...prev, [user.id]: event.target.value }))
                        }
                        placeholder="새 비밀번호"
                        disabled={isPending}
                      />
                      <Button
                        type="button"
                        onClick={() => handlePasswordChange(user)}
                        disabled={isPending}
                      >
                        변경
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() =>
                          setShowPasswordForm((prev) => ({ ...prev, [user.id]: false }))
                        }
                        disabled={isPending}
                      >
                        취소
                      </Button>
                    </div>
                  ) : (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() =>
                        setShowPasswordForm((prev) => ({ ...prev, [user.id]: true }))
                      }
                      disabled={isPending}
                    >
                      <KeyRound className="mr-2 h-4 w-4" />
                      변경
                    </Button>
                  )}
                </td>
                <td className="p-3">
                  <div className="flex flex-wrap gap-2">
                    <Button type="button" onClick={() => handleUpdate(user)} disabled={isPending}>
                      <Save className="mr-2 h-4 w-4" />
                      저장
                    </Button>
                    <Button
                      type="button"
                      variant="destructive"
                      onClick={() => handleDelete(user)}
                      disabled={isPending}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      삭제
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

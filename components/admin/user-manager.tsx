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
import { Plus, KeyRound, Trash2, Save, Shield, ShieldCheck, X, Check } from "lucide-react";

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
    <div className="rounded-2xl border border-black/5 bg-white shadow-sm overflow-hidden">
      {/* 목록 */}
      <div className="divide-y divide-gray-100">
        {userState.map((user) => (
          <div key={user.id} className="p-4 hover:bg-gray-50/50 transition-colors">
            <div className="flex flex-col gap-3 md:flex-row md:items-center">
              {/* 사용자 정보 */}
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="flex-shrink-0">
                  {user.role === "ADMIN" ? (
                    <div className="p-2 rounded-lg bg-purple-50 text-purple-600">
                      <ShieldCheck className="w-4 h-4" />
                    </div>
                  ) : (
                    <div className="p-2 rounded-lg bg-gray-100 text-gray-500">
                      <Shield className="w-4 h-4" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
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
                    className="h-8 text-sm font-medium border-transparent bg-transparent hover:bg-white hover:border-gray-200 focus:bg-white focus:border-gray-300 transition-colors"
                  />
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
                    className="h-7 text-xs text-gray-500 border-transparent bg-transparent hover:bg-white hover:border-gray-200 focus:bg-white focus:border-gray-300 transition-colors mt-0.5"
                  />
                </div>
              </div>

              {/* 권한, 승인 상태 */}
              <div className="flex items-center gap-2 flex-wrap">
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
                  <SelectTrigger className="w-24 h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="USER">일반</SelectItem>
                    <SelectItem value="ADMIN">관리자</SelectItem>
                  </SelectContent>
                </Select>

                <button
                  type="button"
                  onClick={() =>
                    updateUserState((items) =>
                      items.map((target) =>
                        target.id === user.id
                          ? { ...target, isApproved: !target.isApproved }
                          : target
                      )
                    )
                  }
                  disabled={isPending}
                  className={`flex items-center gap-1 px-2 py-1 rounded text-xs transition-colors ${
                    user.isApproved
                      ? "text-green-600 bg-green-50 hover:bg-green-100"
                      : "text-gray-400 bg-gray-100 hover:bg-gray-200"
                  }`}
                >
                  {user.isApproved ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
                  {user.isApproved ? "승인" : "미승인"}
                </button>

                {/* 비밀번호 변경 */}
                {showPasswordForm[user.id] ? (
                  <div className="flex items-center gap-1">
                    <Input
                      type="password"
                      value={passwordDrafts[user.id] ?? ""}
                      onChange={(event) =>
                        setPasswordDrafts((prev) => ({ ...prev, [user.id]: event.target.value }))
                      }
                      placeholder="새 비밀번호"
                      disabled={isPending}
                      className="w-28 h-8 text-xs"
                    />
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => handlePasswordChange(user)}
                      disabled={isPending}
                      className="h-8 text-xs"
                    >
                      변경
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        setShowPasswordForm((prev) => ({ ...prev, [user.id]: false }))
                      }
                      disabled={isPending}
                      className="h-8 text-xs"
                    >
                      취소
                    </Button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() =>
                      setShowPasswordForm((prev) => ({ ...prev, [user.id]: true }))
                    }
                    disabled={isPending}
                    className="p-1.5 rounded text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                    title="비밀번호 변경"
                  >
                    <KeyRound className="h-4 w-4" />
                  </button>
                )}

                {/* 저장, 삭제 */}
                <button
                  type="button"
                  onClick={() => handleUpdate(user)}
                  disabled={isPending}
                  className="p-1.5 rounded text-blue-500 hover:text-blue-700 hover:bg-blue-50 transition-colors"
                  title="저장"
                >
                  <Save className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(user)}
                  disabled={isPending || user.id === currentUserId}
                  className="p-1.5 rounded text-red-400 hover:text-red-600 hover:bg-red-50 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                  title="삭제"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 새 사용자 추가 */}
      <div className="border-t border-dashed border-gray-200">
        {!showCreateForm ? (
          <button
            type="button"
            onClick={() => setShowCreateForm(true)}
            disabled={isPending}
            className="w-full p-3 flex items-center justify-center gap-2 text-sm text-gray-500 hover:text-gray-700 hover:bg-gray-100/50 transition-colors"
          >
            <Plus className="w-4 h-4" />
            새 사용자 추가
          </button>
        ) : (
          <div className="p-4 space-y-3 bg-gray-50/50">
            <div className="flex items-center gap-3 flex-wrap">
              <Input
                value={draft.name}
                onChange={(event) =>
                  setDraft((prev) => ({ ...prev, name: event.target.value }))
                }
                placeholder="이름"
                disabled={isPending}
                className="w-32 h-9"
              />
              <Input
                value={draft.email}
                onChange={(event) =>
                  setDraft((prev) => ({ ...prev, email: event.target.value }))
                }
                placeholder="이메일"
                disabled={isPending}
                className="w-48 h-9"
              />
              <Input
                value={draft.password}
                onChange={(event) =>
                  setDraft((prev) => ({ ...prev, password: event.target.value }))
                }
                placeholder="비밀번호"
                type="password"
                disabled={isPending}
                className="w-32 h-9"
              />
              <Select
                value={draft.role}
                onValueChange={(value) =>
                  setDraft((prev) => ({ ...prev, role: value }))
                }
              >
                <SelectTrigger className="w-24 h-9">
                  <SelectValue placeholder="권한" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="USER">일반</SelectItem>
                  <SelectItem value="ADMIN">관리자</SelectItem>
                </SelectContent>
              </Select>
              <button
                type="button"
                onClick={() =>
                  setDraft((prev) => ({ ...prev, isApproved: !prev.isApproved }))
                }
                disabled={isPending}
                className={`flex items-center gap-1 px-2 py-1.5 rounded text-xs transition-colors ${
                  draft.isApproved
                    ? "text-green-600 bg-green-50"
                    : "text-gray-400 bg-gray-100"
                }`}
              >
                {draft.isApproved ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
                {draft.isApproved ? "승인" : "미승인"}
              </button>
              <Button type="button" onClick={handleCreate} disabled={isPending} size="sm">
                추가
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  setDraft(blankDraft);
                  setShowCreateForm(false);
                }}
                disabled={isPending}
              >
                취소
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

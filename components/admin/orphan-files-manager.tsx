"use client";

import { useState, useEffect, useCallback } from "react";
import { Trash2, RefreshCw, CheckSquare, Square, AlertTriangle } from "lucide-react";
import { useToast } from "@/components/ui/toast";
import { ConfirmModal } from "@/components/ui/confirm-modal";

interface OrphanFile {
    path: string;
    name: string;
    size: number;
    createdAt: string;
    ageInHours: number;
}

interface Stats {
    totalFiles: number;
    totalSize: number;
    referencedFiles: number;
    referencedSize: number;
    orphanFiles: number;
    orphanSize: number;
}

function formatBytes(bytes: number): string {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

function formatAge(hours: number): string {
    if (hours < 24) return `${hours}시간 전`;
    const days = Math.floor(hours / 24);
    if (days < 30) return `${days}일 전`;
    const months = Math.floor(days / 30);
    return `${months}개월 전`;
}

export function OrphanFilesManager() {
    const { showToast } = useToast();
    const [loading, setLoading] = useState(true);
    const [deleting, setDeleting] = useState(false);
    const [stats, setStats] = useState<Stats | null>(null);
    const [orphanFiles, setOrphanFiles] = useState<OrphanFile[]>([]);
    const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set());
    const [confirmModalOpen, setConfirmModalOpen] = useState(false);
    const [deleteAllModalOpen, setDeleteAllModalOpen] = useState(false);

    const fetchOrphanFiles = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/admin/orphan-files");
            if (res.ok) {
                const data = await res.json();
                setStats(data.stats);
                setOrphanFiles(data.orphanFiles);
                setSelectedFiles(new Set());
            } else {
                showToast("고아 파일 조회에 실패했습니다.", "error");
            }
        } catch {
            showToast("서버 오류가 발생했습니다.", "error");
        } finally {
            setLoading(false);
        }
    }, [showToast]);

    useEffect(() => {
        fetchOrphanFiles();
    }, [fetchOrphanFiles]);

    const toggleSelect = (path: string) => {
        setSelectedFiles((prev) => {
            const next = new Set(prev);
            if (next.has(path)) {
                next.delete(path);
            } else {
                next.add(path);
            }
            return next;
        });
    };

    const toggleSelectAll = () => {
        if (selectedFiles.size === orphanFiles.length) {
            setSelectedFiles(new Set());
        } else {
            setSelectedFiles(new Set(orphanFiles.map((f) => f.path)));
        }
    };

    const handleDelete = async (files: string[]) => {
        setDeleting(true);
        try {
            const res = await fetch("/api/admin/orphan-files", {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ files }),
            });

            if (res.ok) {
                const data = await res.json();
                showToast(`${data.deletedCount}개 파일이 삭제되었습니다.`, "success");
                fetchOrphanFiles();
            } else {
                showToast("파일 삭제에 실패했습니다.", "error");
            }
        } catch {
            showToast("서버 오류가 발생했습니다.", "error");
        } finally {
            setDeleting(false);
            setConfirmModalOpen(false);
            setDeleteAllModalOpen(false);
        }
    };

    const handleDeleteSelected = () => {
        if (selectedFiles.size === 0) {
            showToast("삭제할 파일을 선택해주세요.", "error");
            return;
        }
        setConfirmModalOpen(true);
    };

    const handleDeleteAll = () => {
        if (orphanFiles.length === 0) {
            showToast("삭제할 고아 파일이 없습니다.", "error");
            return;
        }
        setDeleteAllModalOpen(true);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <RefreshCw className="w-6 h-6 animate-spin text-gray-400" />
                <span className="ml-2 text-gray-500">파일 스캔 중...</span>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* 통계 */}
            {stats && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-white p-4 rounded-lg shadow-sm border">
                        <div className="text-sm text-gray-500">전체 파일</div>
                        <div className="text-2xl font-bold">{stats.totalFiles}개</div>
                        <div className="text-sm text-gray-400">{formatBytes(stats.totalSize)}</div>
                    </div>
                    <div className="bg-white p-4 rounded-lg shadow-sm border">
                        <div className="text-sm text-gray-500">참조된 파일</div>
                        <div className="text-2xl font-bold text-green-600">{stats.referencedFiles}개</div>
                        <div className="text-sm text-gray-400">{formatBytes(stats.referencedSize)}</div>
                    </div>
                    <div className="bg-white p-4 rounded-lg shadow-sm border">
                        <div className="text-sm text-gray-500">고아 파일</div>
                        <div className="text-2xl font-bold text-red-600">{stats.orphanFiles}개</div>
                        <div className="text-sm text-gray-400">{formatBytes(stats.orphanSize)}</div>
                    </div>
                </div>
            )}

            {/* 액션 버튼 */}
            <div className="flex flex-wrap gap-2">
                <button
                    onClick={fetchOrphanFiles}
                    disabled={loading}
                    className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                >
                    <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
                    새로고침
                </button>
                <button
                    onClick={handleDeleteSelected}
                    disabled={deleting || selectedFiles.size === 0}
                    className="flex items-center gap-2 px-4 py-2 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg transition-colors disabled:opacity-50"
                >
                    <Trash2 className="w-4 h-4" />
                    선택 삭제 ({selectedFiles.size})
                </button>
                <button
                    onClick={handleDeleteAll}
                    disabled={deleting || orphanFiles.length === 0}
                    className="flex items-center gap-2 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors disabled:opacity-50"
                >
                    <Trash2 className="w-4 h-4" />
                    전체 삭제 ({orphanFiles.length})
                </button>
            </div>

            {/* 고아 파일 목록 */}
            {orphanFiles.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                    고아 파일이 없습니다.
                </div>
            ) : (
                <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
                    {/* 헤더 */}
                    <div className="flex items-center gap-4 px-4 py-3 bg-gray-50 border-b">
                        <button onClick={toggleSelectAll} className="text-gray-500 hover:text-gray-700">
                            {selectedFiles.size === orphanFiles.length ? (
                                <CheckSquare className="w-5 h-5" />
                            ) : (
                                <Square className="w-5 h-5" />
                            )}
                        </button>
                        <span className="text-sm text-gray-600">
                            {selectedFiles.size > 0
                                ? `${selectedFiles.size}개 선택됨`
                                : `${orphanFiles.length}개 고아 파일`}
                        </span>
                    </div>

                    {/* 파일 목록 */}
                    <div className="divide-y max-h-[500px] overflow-y-auto">
                        {orphanFiles.map((file) => (
                            <div
                                key={file.path}
                                className={`flex items-center gap-4 px-4 py-3 hover:bg-gray-50 ${
                                    selectedFiles.has(file.path) ? "bg-blue-50" : ""
                                }`}
                            >
                                <button
                                    onClick={() => toggleSelect(file.path)}
                                    className="text-gray-500 hover:text-gray-700"
                                >
                                    {selectedFiles.has(file.path) ? (
                                        <CheckSquare className="w-5 h-5 text-blue-500" />
                                    ) : (
                                        <Square className="w-5 h-5" />
                                    )}
                                </button>

                                {/* 미리보기 */}
                                <div className="w-12 h-12 flex-shrink-0 rounded overflow-hidden bg-gray-100">
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img
                                        src={file.path}
                                        alt={file.name}
                                        className="w-full h-full object-cover"
                                        onError={(e) => {
                                            (e.target as HTMLImageElement).style.display = "none";
                                        }}
                                    />
                                </div>

                                {/* 파일 정보 */}
                                <div className="flex-1 min-w-0">
                                    <div className="text-sm font-medium text-gray-900 truncate">
                                        {file.name}
                                    </div>
                                    <div className="text-xs text-gray-500 truncate">{file.path}</div>
                                </div>

                                {/* 메타 정보 */}
                                <div className="text-right text-sm text-gray-500">
                                    <div>{formatBytes(file.size)}</div>
                                    <div>{formatAge(file.ageInHours)}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* 선택 삭제 확인 모달 */}
            <ConfirmModal
                isOpen={confirmModalOpen}
                onClose={() => setConfirmModalOpen(false)}
                onConfirm={() => handleDelete(Array.from(selectedFiles))}
                title="선택한 파일 삭제"
                message={`선택한 ${selectedFiles.size}개의 파일을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.`}
                confirmText="삭제"
                confirmVariant="danger"
                icon={<AlertTriangle className="w-6 h-6 text-red-500" />}
            />

            {/* 전체 삭제 확인 모달 */}
            <ConfirmModal
                isOpen={deleteAllModalOpen}
                onClose={() => setDeleteAllModalOpen(false)}
                onConfirm={() => handleDelete(orphanFiles.map((f) => f.path))}
                title="모든 고아 파일 삭제"
                message={`${orphanFiles.length}개의 고아 파일을 모두 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.`}
                confirmText="전체 삭제"
                confirmVariant="danger"
                icon={<AlertTriangle className="w-6 h-6 text-red-500" />}
            />
        </div>
    );
}

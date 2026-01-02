import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { OrphanFilesManager } from "@/components/admin/orphan-files-manager";
import { HardDrive } from "lucide-react";

export default async function StoragePage() {
    const session = await auth();

    if (session?.user?.role !== "ADMIN") {
        redirect("/");
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-3">
                <HardDrive className="w-8 h-8 text-gray-600" />
                <div>
                    <h1 className="text-2xl font-bold">스토리지 관리</h1>
                    <p className="text-sm text-gray-500">
                        업로드된 파일 중 사용되지 않는 고아 파일을 관리합니다.
                    </p>
                </div>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <div className="flex gap-3">
                    <div className="text-amber-500 text-lg">⚠️</div>
                    <div className="text-sm text-amber-800">
                        <p className="font-medium mb-1">고아 파일이란?</p>
                        <ul className="list-disc list-inside space-y-1 text-amber-700">
                            <li>업로드 후 24시간이 지났지만 어떤 콘텐츠에서도 사용되지 않는 파일입니다.</li>
                            <li>게시 취소, 이미지 삭제, 콘텐츠 삭제 등으로 발생할 수 있습니다.</li>
                            <li>삭제된 파일은 복구할 수 없으니 신중하게 확인 후 삭제해주세요.</li>
                        </ul>
                    </div>
                </div>
            </div>

            <OrphanFilesManager />
        </div>
    );
}

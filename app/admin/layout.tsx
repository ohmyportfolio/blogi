import { auth } from "@/auth";
import Link from "next/link";
import { redirect } from "next/navigation";

export default async function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const session = await auth();

    if (session?.user.role !== "ADMIN") {
        redirect("/");
    }

    return (
        <div className="flex min-h-screen flex-col md:flex-row">
            <div className="w-full md:w-64 bg-[#0b1320] text-white p-6">
                <h2 className="font-display text-2xl mb-6 md:mb-8">관리자 대시보드</h2>
                <nav className="flex flex-wrap gap-2 md:block md:space-y-4">
                    <Link href="/admin" className="block p-2 hover:bg-gray-800 rounded">
                        개요
                    </Link>
                    <Link href="/admin/menus" className="block p-2 hover:bg-gray-800 rounded">
                        메뉴 관리
                    </Link>
                    <Link href="/admin/community-settings" className="block p-2 hover:bg-gray-800 rounded">
                        커뮤니티 관리
                    </Link>
                    <Link href="/admin/contents" className="block p-2 hover:bg-gray-800 rounded">
                        콘텐츠 관리
                    </Link>
                    <Link href="/admin/category-settings" className="block p-2 hover:bg-gray-800 rounded">
                        콘텐츠 표시 설정
                    </Link>
                    <Link href="/admin/home-settings" className="block p-2 hover:bg-gray-800 rounded">
                        메인화면 노출 설정
                    </Link>
                    <Link href="/admin/users" className="block p-2 hover:bg-gray-800 rounded">
                        사용자 관리
                    </Link>
                    <Link href="/admin/site-settings" className="block p-2 hover:bg-gray-800 rounded">
                        사이트 설정
                    </Link>
                    <Link href="/admin/footer" className="block p-2 hover:bg-gray-800 rounded">
                        푸터 설정
                    </Link>
                    <Link href="/admin/storage" className="block p-2 hover:bg-gray-800 rounded">
                        스토리지 관리
                    </Link>
                    <div className="space-y-1">
                        <span className="block p-2 text-gray-400 text-sm">휴지통</span>
                        <Link href="/admin/trash" className="block p-2 pl-4 hover:bg-gray-800 rounded text-sm">
                            삭제된 게시판
                        </Link>
                        <Link href="/admin/categories/hidden" className="block p-2 pl-4 hover:bg-gray-800 rounded text-sm">
                            숨김 카테고리
                        </Link>
                    </div>
                    <Link href="/" className="block p-2 text-gray-400 hover:text-white md:mt-8">
                        사이트로 돌아가기
                    </Link>
                </nav>
            </div>
            <div className="flex-1 p-4 md:p-8 bg-gray-100 overflow-y-auto">
                {children}
            </div>
        </div>
    );
}

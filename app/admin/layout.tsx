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
                <nav className="flex flex-col gap-4 md:gap-6">
                    <div className="space-y-2">
                        <span className="block text-xs uppercase tracking-widest text-gray-400">대시보드</span>
                        <Link href="/admin" className="block rounded p-2 hover:bg-gray-800">
                            개요
                        </Link>
                    </div>

                    <div className="space-y-2">
                        <span className="block text-xs uppercase tracking-widest text-gray-400">콘텐츠</span>
                        <Link href="/admin/contents" className="block rounded p-2 hover:bg-gray-800">
                            콘텐츠 관리
                        </Link>
                        <Link href="/admin/category-settings" className="block rounded p-2 hover:bg-gray-800">
                            카테고리 설정
                        </Link>
                        <Link href="/admin/categories/hidden" className="block rounded p-2 hover:bg-gray-800">
                            숨김 카테고리
                        </Link>
                    </div>

                    <div className="space-y-2">
                        <span className="block text-xs uppercase tracking-widest text-gray-400">커뮤니티</span>
                        <Link href="/admin/community-settings" className="block rounded p-2 hover:bg-gray-800">
                            게시판 관리
                        </Link>
                    </div>

                    <div className="space-y-2">
                        <span className="block text-xs uppercase tracking-widest text-gray-400">사이트 구조</span>
                        <Link href="/admin/menus" className="block rounded p-2 hover:bg-gray-800">
                            메뉴 관리
                        </Link>
                        <Link href="/admin/site-settings" className="block rounded p-2 hover:bg-gray-800">
                            사이트 설정
                        </Link>
                    </div>

                    <div className="space-y-2">
                        <span className="block text-xs uppercase tracking-widest text-gray-400">디자인/노출</span>
                        <Link href="/admin/home-settings" className="block rounded p-2 hover:bg-gray-800">
                            홈 노출 설정
                        </Link>
                        <Link href="/admin/splash-settings" className="block rounded p-2 hover:bg-gray-800">
                            스플래시 설정
                        </Link>
                        <Link href="/admin/footer" className="block rounded p-2 hover:bg-gray-800">
                            푸터 설정
                        </Link>
                    </div>

                    <div className="space-y-2">
                        <span className="block text-xs uppercase tracking-widest text-gray-400">운영</span>
                        <Link href="/admin/users" className="block rounded p-2 hover:bg-gray-800">
                            사용자 관리
                        </Link>
                        <Link href="/admin/storage" className="block rounded p-2 hover:bg-gray-800">
                            스토리지 관리
                        </Link>
                    </div>

                    <div className="space-y-2">
                        <span className="block text-xs uppercase tracking-widest text-gray-400">휴지통</span>
                        <Link href="/admin/contents/trash" className="block rounded p-2 hover:bg-gray-800">
                            콘텐츠 휴지통
                        </Link>
                        <Link href="/admin/trash" className="block rounded p-2 hover:bg-gray-800">
                            게시판 휴지통
                        </Link>
                    </div>

                    <Link href="/" className="block p-2 text-gray-400 hover:text-white md:mt-4">
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

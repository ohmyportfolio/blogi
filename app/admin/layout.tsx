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
            <div className="w-full md:w-64 bg-[#0b1320] text-slate-200 p-6">
                <h2 className="font-display text-2xl mb-6 md:mb-8 text-white">관리자 대시보드</h2>
                <nav className="flex flex-col gap-4 md:gap-6">
                    <div className="space-y-2">
                        <span className="block text-xs uppercase tracking-widest text-slate-400">대시보드</span>
                        <Link href="/admin" className="block rounded p-2 text-slate-200 hover:text-white hover:bg-white/10 transition-colors">
                            개요
                        </Link>
                    </div>

                    <div className="space-y-2">
                        <span className="block text-xs uppercase tracking-widest text-slate-400">콘텐츠</span>
                        <Link href="/admin/contents" className="block rounded p-2 text-slate-200 hover:text-white hover:bg-white/10 transition-colors">
                            콘텐츠 관리
                        </Link>
                        <Link href="/admin/category-settings" className="block rounded p-2 text-slate-200 hover:text-white hover:bg-white/10 transition-colors">
                            카테고리 설정
                        </Link>
                        <Link href="/admin/categories/hidden" className="block rounded p-2 text-slate-200 hover:text-white hover:bg-white/10 transition-colors">
                            숨김 카테고리
                        </Link>
                        <Link href="/admin/tags" className="block rounded p-2 text-slate-200 hover:text-white hover:bg-white/10 transition-colors">
                            태그 관리
                        </Link>
                    </div>

                    <div className="space-y-2">
                        <span className="block text-xs uppercase tracking-widest text-slate-400">커뮤니티</span>
                        <Link href="/admin/community-settings" className="block rounded p-2 text-slate-200 hover:text-white hover:bg-white/10 transition-colors">
                            게시판 관리
                        </Link>
                    </div>

                    <div className="space-y-2">
                        <span className="block text-xs uppercase tracking-widest text-slate-400">사이트 구조</span>
                        <Link href="/admin/menus" className="block rounded p-2 text-slate-200 hover:text-white hover:bg-white/10 transition-colors">
                            메뉴 관리
                        </Link>
                        <Link href="/admin/site-settings" className="block rounded p-2 text-slate-200 hover:text-white hover:bg-white/10 transition-colors">
                            사이트 설정
                        </Link>
                    </div>

                    <div className="space-y-2">
                        <span className="block text-xs uppercase tracking-widest text-slate-400">디자인/노출</span>
                        <Link href="/admin/theme-settings" className="block rounded p-2 text-slate-200 hover:text-white hover:bg-white/10 transition-colors">
                            테마 설정
                        </Link>
                        <Link href="/admin/home-settings" className="block rounded p-2 text-slate-200 hover:text-white hover:bg-white/10 transition-colors">
                            홈 노출 설정
                        </Link>
                        <Link href="/admin/splash-settings" className="block rounded p-2 text-slate-200 hover:text-white hover:bg-white/10 transition-colors">
                            스플래시 설정
                        </Link>
                        <Link href="/admin/footer" className="block rounded p-2 text-slate-200 hover:text-white hover:bg-white/10 transition-colors">
                            푸터 설정
                        </Link>
                    </div>

                    <div className="space-y-2">
                        <span className="block text-xs uppercase tracking-widest text-slate-400">운영</span>
                        <Link href="/admin/users" className="block rounded p-2 text-slate-200 hover:text-white hover:bg-white/10 transition-colors">
                            사용자 관리
                        </Link>
                        <Link href="/admin/storage" className="block rounded p-2 text-slate-200 hover:text-white hover:bg-white/10 transition-colors">
                            스토리지 관리
                        </Link>
                    </div>

                    <div className="space-y-2">
                        <span className="block text-xs uppercase tracking-widest text-slate-400">휴지통</span>
                        <Link href="/admin/contents/trash" className="block rounded p-2 text-slate-200 hover:text-white hover:bg-white/10 transition-colors">
                            콘텐츠 휴지통
                        </Link>
                        <Link href="/admin/trash" className="block rounded p-2 text-slate-200 hover:text-white hover:bg-white/10 transition-colors">
                            게시판 휴지통
                        </Link>
                    </div>

                    <Link href="/" className="block p-2 text-slate-400 hover:text-white md:mt-4 transition-colors">
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

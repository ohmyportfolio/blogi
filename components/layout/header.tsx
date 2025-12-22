"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Search, LogOut, Settings, Menu, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useSession, signOut } from "next-auth/react";

const routes = [
    {
        href: "/products/casino",
        label: "카지노",
    },
    {
        href: "/products/nightlife",
        label: "다낭 유흥",
    },
    {
        href: "/products/promotion",
        label: "프로모션",
    },
    {
        href: "/products/vip-trip",
        label: "VIP 여행",
    },
    {
        href: "/products/tip",
        label: "여행 TIP",
    },
    {
        href: "/products/hotel-villa",
        label: "호텔 & 풀빌라",
    },
    {
        href: "/products/golf",
        label: "골프 & 레저",
    },
    {
        href: "/community",
        label: "후기 & 자유게시판",
    },
];

export const Header = () => {
    const pathname = usePathname();
    const { data: session } = useSession();
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    const closeSidebar = () => setIsSidebarOpen(false);

    return (
        <>
            <header className="relative w-full overflow-hidden bg-[#0b1320] text-white">
                <div className="absolute inset-0 bg-[radial-gradient(900px_500px_at_20%_-10%,rgba(14,165,166,0.35),transparent_60%),radial-gradient(700px_420px_at_80%_0%,rgba(255,107,87,0.35),transparent_65%)]" />
                <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(3,10,20,0.85)_0%,rgba(11,19,32,0.6)_45%,rgba(12,28,42,0.9)_100%)]" />
                <div className="container mx-auto px-4 relative">
                    <div className="flex items-center justify-between gap-3 py-4">
                        <button
                            className="md:hidden p-2 rounded-full border border-white/10 bg-white/10 hover:bg-white/20 transition"
                            onClick={() => setIsSidebarOpen(true)}
                            aria-label="메뉴 열기"
                        >
                            <Menu className="w-6 h-6" />
                        </button>

                        <Link href="/" className="flex items-center gap-3">
                            <Image
                                src="/logo.png"
                                alt="다낭VIP투어 로고"
                                width={160}
                                height={54}
                                className="h-10 w-auto"
                                priority
                            />
                            <div className="hidden sm:flex flex-col leading-none">
                                <span className="font-display text-xl tracking-tight">다낭VIP투어</span>
                                <span className="text-[10px] uppercase tracking-[0.3em] text-white/60">
                                    Danang Curated
                                </span>
                            </div>
                        </Link>

                        <form
                            action="/search"
                            method="get"
                            className="hidden md:flex relative w-[360px]"
                        >
                            <Input
                                name="q"
                                type="search"
                                className="w-full pl-4 pr-10 bg-white/10 text-white placeholder:text-white/60 border-white/15"
                                placeholder="검색어를 입력하세요"
                            />
                            <Search className="absolute right-3 top-2.5 h-5 w-5 text-white/60" />
                        </form>

                        <div className="hidden md:flex items-center gap-x-4 text-sm">
                            {session ? (
                                <>
                                    <span className="text-white/70">
                                        {session.user?.name || session.user?.email}님
                                    </span>
                                    {session.user?.role === "ADMIN" && (
                                        <Link href="/admin" className="hover:text-white transition flex items-center gap-1">
                                            <Settings className="w-4 h-4" />
                                            관리자
                                        </Link>
                                    )}
                                    <button
                                        onClick={() => signOut({ callbackUrl: "/" })}
                                        className="hover:text-white transition flex items-center gap-1"
                                    >
                                        <LogOut className="w-4 h-4" />
                                        로그아웃
                                    </button>
                                </>
                            ) : (
                                <>
                                    <Link href="/login" className="hover:text-white transition">
                                        로그인
                                    </Link>
                                    <Link href="/register" className="hover:text-white transition">
                                        회원가입
                                    </Link>
                                </>
                            )}
                        </div>

                        <div className="md:hidden w-10" />
                    </div>

                    <div className="hidden md:block pb-5">
                        <nav className="flex items-center gap-2 overflow-x-auto pb-1">
                            {routes.map((route) => (
                                <Link
                                    key={route.href}
                                    href={route.href}
                                    className={cn(
                                        "px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] rounded-full border border-white/10 bg-white/5 transition-all whitespace-nowrap",
                                        pathname === route.href || pathname?.startsWith(route.href + "/")
                                            ? "bg-white text-[#0b1320] border-white/30 shadow-[0_12px_30px_-20px_rgba(15,23,42,0.6)]"
                                            : "text-white/80 hover:text-white hover:border-white/20"
                                    )}
                                >
                                    {route.label}
                                </Link>
                            ))}
                        </nav>
                    </div>
                </div>
            </header>

            {isSidebarOpen && (
                <div
                    className="md:hidden fixed inset-0 bg-black/60 z-40"
                    onClick={closeSidebar}
                />
            )}

            <div
                className={cn(
                    "md:hidden fixed top-0 left-0 h-full w-72 bg-[#0b1320] text-white z-50 transform transition-transform duration-300 ease-in-out overflow-y-auto",
                    isSidebarOpen ? "translate-x-0" : "-translate-x-full"
                )}
            >
                <div className="flex items-center justify-between p-4 border-b border-white/10">
                    <Link href="/" className="flex items-center gap-x-2" onClick={closeSidebar}>
                        <Image
                            src="/logo.png"
                            alt="다낭VIP투어 로고"
                            width={140}
                            height={48}
                            className="h-10 w-auto"
                        />
                        <span className="font-display text-lg">다낭VIP투어</span>
                    </Link>
                    <button
                        className="p-2 rounded-full border border-white/10 bg-white/10 hover:bg-white/20 transition"
                        onClick={closeSidebar}
                        aria-label="메뉴 닫기"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <div className="p-4 border-b border-white/10">
                    <form action="/search" method="get" className="relative">
                        <Input
                            name="q"
                            type="search"
                            className="w-full pl-4 pr-10 bg-white/10 text-white placeholder:text-white/60 border-white/15"
                            placeholder="검색어를 입력하세요"
                        />
                        <Search className="absolute right-3 top-2.5 h-5 w-5 text-white/60" />
                    </form>
                </div>

                <nav className="py-2">
                    {routes.map((route) => (
                        <Link
                            key={route.href}
                            href={route.href}
                            onClick={closeSidebar}
                            className={cn(
                                "block px-6 py-3 text-sm font-semibold transition-colors",
                                pathname === route.href || pathname?.startsWith(route.href + "/")
                                    ? "text-white bg-white/10 border-l-4 border-white/70"
                                    : "text-white/70 hover:text-white hover:bg-white/5"
                            )}
                        >
                            {route.label}
                        </Link>
                    ))}
                </nav>

                <div className="border-t border-white/10 p-4">
                    {session ? (
                        <div className="space-y-3">
                            <div className="text-white/60 text-sm">
                                {session.user?.name || session.user?.email}님
                            </div>
                            {session.user?.role === "ADMIN" && (
                                <Link
                                    href="/admin"
                                    onClick={closeSidebar}
                                    className="flex items-center gap-2 text-sm hover:text-white transition"
                                >
                                    <Settings className="w-4 h-4" />
                                    관리자
                                </Link>
                            )}
                            <button
                                onClick={() => {
                                    closeSidebar();
                                    signOut({ callbackUrl: "/" });
                                }}
                                className="flex items-center gap-2 text-sm hover:text-white transition"
                            >
                                <LogOut className="w-4 h-4" />
                                로그아웃
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            <Link
                                href="/login"
                                onClick={closeSidebar}
                                className="block w-full py-2 px-4 bg-white text-[#0b1320] text-center rounded-full font-semibold transition"
                            >
                                로그인
                            </Link>
                            <Link
                                href="/register"
                                onClick={closeSidebar}
                                className="block w-full py-2 px-4 border border-white/30 hover:bg-white/10 text-white text-center rounded-full transition"
                            >
                                회원가입
                            </Link>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
};

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";

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

    return (
        <div className="w-full bg-[#0a192f] text-white">
            {/* Top Bar */}
            <div className="container mx-auto px-4 py-4 flex items-center justify-between">
                <Link href="/" className="flex items-center gap-x-2">
                    {/* Logo */}
                    <div className="flex flex-col items-center">
                        <h1 className="text-2xl font-bold tracking-tighter">VIP</h1>
                        <span className="text-[10px] tracking-widest">TOUR</span>
                    </div>
                    <span className="text-xl font-bold">다낭VIP투어</span>
                </Link>

                {/* Search Bar */}
                <div className="hidden md:flex relative w-[400px]">
                    <Input
                        className="w-full pl-4 pr-10 bg-white text-black rounded-full"
                        placeholder="Search..."
                    />
                    <Search className="absolute right-3 top-2.5 h-5 w-5 text-gray-400" />
                </div>

                {/* Auth Buttons / User Menu */}
                <div className="flex items-center gap-x-4 text-sm">
                    <Link href="/login" className="hover:text-sky-400 transition">
                        로그인
                    </Link>
                    <Link href="/register" className="hover:text-sky-400 transition">
                        회원가입
                    </Link>
                </div>
            </div>

            {/* Navigation Bar */}
            <div className="border-t border-white/10">
                <div className="container mx-auto px-4">
                    <nav className="flex items-center justify-between overflow-x-auto">
                        {routes.map((route) => (
                            <Link
                                key={route.href}
                                href={route.href}
                                className={cn(
                                    "px-4 py-4 text-sm font-medium transition-colors hover:text-sky-400 whitespace-nowrap",
                                    pathname === route.href ? "text-sky-400 border-b-2 border-sky-400" : "text-white"
                                )}
                            >
                                {route.label}
                            </Link>
                        ))}
                    </nav>
                </div>
            </div>
        </div>
    );
};

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  FileText,
  MessageSquare,
  FolderOpen,
  Tags,
  Palette,
  Menu,
  LayoutGrid,
  Bell,
  Smartphone,
  PanelBottom,
  Globe,
  Users,
  HardDrive,
  EyeOff,
  Trash2,
  ExternalLink,
  type LucideIcon,
} from "lucide-react";

interface MenuItem {
  label: string;
  href: string;
  icon: LucideIcon;
}

interface MenuSection {
  title: string;
  items: MenuItem[];
}

const menuSections: MenuSection[] = [
  {
    title: "대시보드",
    items: [
      { label: "홈", href: "/admin", icon: LayoutDashboard },
    ],
  },
  {
    title: "콘텐츠",
    items: [
      { label: "글", href: "/admin/contents", icon: FileText },
      { label: "게시판", href: "/admin/community-settings", icon: MessageSquare },
      { label: "카테고리", href: "/admin/category-settings", icon: FolderOpen },
      { label: "태그", href: "/admin/tags", icon: Tags },
    ],
  },
  {
    title: "디자인",
    items: [
      { label: "테마", href: "/admin/theme-settings", icon: Palette },
      { label: "메뉴", href: "/admin/menus", icon: Menu },
      { label: "홈 화면", href: "/admin/home-settings", icon: LayoutGrid },
      { label: "공지 배너", href: "/admin/notices", icon: Bell },
      { label: "스플래시", href: "/admin/splash-settings", icon: Smartphone },
      { label: "푸터", href: "/admin/footer", icon: PanelBottom },
    ],
  },
  {
    title: "설정",
    items: [
      { label: "사이트 정보", href: "/admin/site-settings", icon: Globe },
      { label: "사용자", href: "/admin/users", icon: Users },
    ],
  },
  {
    title: "관리",
    items: [
      { label: "저장소", href: "/admin/storage", icon: HardDrive },
      { label: "숨김 카테고리", href: "/admin/categories/hidden", icon: EyeOff },
      { label: "콘텐츠 휴지통", href: "/admin/contents/trash", icon: Trash2 },
      { label: "게시판 휴지통", href: "/admin/trash", icon: Trash2 },
    ],
  },
];

function isActive(pathname: string, href: string): boolean {
  if (href === "/admin") {
    return pathname === "/admin";
  }
  return pathname === href || pathname.startsWith(href + "/");
}

export default function AdminSidebar() {
  const pathname = usePathname();

  return (
    <div className="w-full md:w-64 shrink-0 bg-[#0b1320] text-slate-200 p-6">
      <h2 className="font-display text-2xl mb-6 md:mb-8 text-white">관리자</h2>
      <nav className="flex flex-col gap-4 md:gap-5">
        {menuSections.map((section) => (
          <div key={section.title} className="space-y-0.5">
            <span className="block text-[11px] uppercase tracking-widest text-slate-500 mb-1.5 px-2">
              {section.title}
            </span>
            {section.items.map((item) => {
              const Icon = item.icon;
              const active = isActive(pathname, item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm transition-colors ${
                    active
                      ? "bg-white/15 text-white font-medium"
                      : "text-slate-300 hover:text-white hover:bg-white/10"
                  }`}
                >
                  <Icon size={17} className="shrink-0" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>
        ))}

        <div className="border-t border-slate-700/50 pt-3 mt-1">
          <Link
            href="/"
            className="flex items-center gap-2.5 px-2.5 py-2 text-sm text-slate-400 hover:text-white transition-colors"
          >
            <ExternalLink size={17} className="shrink-0" />
            <span>&larr; 사이트로 이동</span>
          </Link>
        </div>
      </nav>
    </div>
  );
}

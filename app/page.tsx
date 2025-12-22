import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight } from "lucide-react";

// Mock data for categories matching the reference
const categories = [
  {
    label: "Casino",
    subLabel: "카지노",
    href: "/products/casino",
    image: "/images/casino_bg.jpg", // Placeholder
    description: "최고의 시설과 서비스를 자랑하는 카지노",
  },
  {
    label: "Night Life",
    subLabel: "다낭 유흥",
    href: "/products/nightlife",
    image: "/images/nightlife_bg.jpg",
    description: "화려한 다낭의 밤을 즐기세요",
  },
  {
    label: "Promotion",
    subLabel: "프로모션",
    href: "/products/promotion",
    image: "/images/promotion_bg.jpg",
    description: "다양한 혜택과 이벤트를 확인하세요",
  },
  {
    label: "VIP Trip",
    subLabel: "VIP 여행",
    href: "/products/vip-trip",
    image: "/images/viptrip_bg.jpg",
    description: "특별한 당신을 위한 VIP 케어 서비스",
  },
  {
    label: "Travel TIP",
    subLabel: "여행 TIP",
    href: "/products/tip",
    image: "/images/tip_bg.jpg",
    description: "알아두면 쓸데많은 다낭 여행 꿀팁",
  },
  {
    label: "Hotel & Pool Villa",
    subLabel: "호텔 & 풀빌라",
    href: "/products/hotel-villa",
    image: "/images/hotel_bg.jpg",
    description: "엄선된 최고의 숙소를 최저가로",
  },
  {
    label: "Golf & Leisure",
    subLabel: "골프 & 레저",
    href: "/products/golf",
    image: "/images/golf_bg.jpg",
    description: "환상적인 코스에서의 라운딩",
  },
];

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-slate-900 via-slate-800 to-cyan-900 py-20 text-white relative overflow-hidden">
        {/* Subtle background pattern */}
        <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%2306b6d4%22%20fill-opacity%3D%220.05%22%3E%3Cpath%20d%3D%22M36%2034v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6%2034v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6%204V0H4v4H0v2h4v4h2V6h4V4H6z%22%2F%3E%3C%2Fg%3E%3C%2Fg%3E%3C%2Fsvg%3E')] opacity-50"></div>
        <div className="container mx-auto px-4 text-center relative z-10">
          <h1 className="text-3xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-white via-cyan-100 to-teal-200 bg-clip-text text-transparent">
            다낭 여행의 모든 것, <br className="md:hidden" /> 다낭 VIP 투어에서!
          </h1>
          <p className="text-lg text-slate-300 mb-12 max-w-2xl mx-auto">
            최고의 파트너와 함께하는 잊지 못할 추억. 카지노, 유흥, 호텔, 골프까지 원스톱으로 즐기세요.
          </p>

          {/* Category Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6">
            {categories.map((category) => (
              <Link key={category.label} href={category.href} className="group">
                <Card className="bg-white text-black overflow-hidden hover:shadow-xl transition duration-300 h-[160px] sm:h-[220px] lg:h-[300px] flex flex-col relative border-none rounded-lg sm:rounded-xl">
                  {/* Background Image */}
                  <div className="absolute inset-0 group-hover:scale-105 transition duration-500">
                    <Image
                      src={category.image}
                      alt={category.label}
                      fill
                      className="object-cover"
                      sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                    />
                  </div>

                  {/* Content Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent flex flex-col justify-end p-3 sm:p-6 text-white text-left">
                    <div className="transform translate-y-2 group-hover:translate-y-0 transition">
                      <h3 className="text-sm sm:text-lg lg:text-xl font-bold mb-0.5 sm:mb-1">{category.label}</h3>
                      <div className="bg-gradient-to-r from-cyan-500 to-teal-500 text-[10px] sm:text-xs font-bold px-1.5 sm:px-2 py-0.5 sm:py-1 rounded inline-block">
                        {category.subLabel}
                      </div>
                      <p className="hidden sm:block text-sm text-gray-200 opacity-0 group-hover:opacity-100 transition duration-300 line-clamp-2 mt-2">
                        {category.description}
                      </p>
                    </div>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        </div>
        {/* Bottom gradient fade */}
        <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-gray-50 to-transparent"></div>
      </section>

      {/* Intro Section */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-12">
            <div className="md:w-1/2">
              <h2 className="text-3xl font-bold mb-6 text-gray-900">
                다낭 유흥
              </h2>
              <p className="text-gray-600 mb-6 leading-relaxed">
                최고의 시설에서 즐기는 특별한 밤. 엄선된 퀄리티와 합리적인 가격으로 모십니다.
                안전하고 프라이빗한 서비스를 약속드립니다.
              </p>
              <Button asChild>
                <Link href="/products/nightlife">
                  자세히 보기 <ArrowRight className="ml-2 w-4 h-4" />
                </Link>
              </Button>
            </div>
            <div className="md:w-1/2 h-[300px] relative rounded-xl overflow-hidden">
              <Image
                src="/images/intro_nightlife.jpg"
                alt="다낭 유흥"
                fill
                className="object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Recent Posts / Products Section (Mock) */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold mb-10 text-center">최신 여행 정보</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { image: "/images/post_danang1.jpg", title: "베트남 다낭 3박 4일 추천 코스", date: "2024.12.20" },
              { image: "/images/post_danang2.jpg", title: "호이안 야경 투어 완벽 가이드", date: "2024.12.18" },
              { image: "/images/post_danang3.jpg", title: "바나힐 당일치기 여행 꿀팁", date: "2024.12.15" },
            ].map((post, i) => (
              <Card key={i} className="hover:shadow-lg transition cursor-pointer overflow-hidden">
                <div className="h-48 relative">
                  <Image
                    src={post.image}
                    alt={post.title}
                    fill
                    className="object-cover"
                  />
                </div>
                <CardContent className="p-6">
                  <h3 className="font-bold text-lg mb-2">{post.title}</h3>
                  <p className="text-gray-500 text-sm">{post.date} | 작성자: 다낭VIP투어</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

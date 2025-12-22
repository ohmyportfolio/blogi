import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { format } from "date-fns";

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

export default async function Home() {
  const latestPosts = await prisma.post.findMany({
    orderBy: { createdAt: "desc" },
    take: 3,
    include: { author: { select: { name: true } } },
  });

  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden py-16 sm:py-24">
        <div className="absolute inset-0 bg-[radial-gradient(900px_520px_at_10%_0%,rgba(14,165,166,0.25),transparent_60%),radial-gradient(700px_420px_at_90%_10%,rgba(255,107,87,0.22),transparent_60%)]" />
        <div className="container mx-auto px-4 relative z-10">
          <div className="grid lg:grid-cols-[1.1fr_1fr] gap-10 items-center">
            <div className="text-left">
              <div className="inline-flex items-center gap-2 rounded-full border border-foreground/10 bg-white/70 px-4 py-1 text-[10px] uppercase tracking-[0.3em] text-foreground/70">
                Danang curated
              </div>
              <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl mt-5 leading-[1.05] text-foreground">
                다낭의 밤과 낮을
                <br />
                가장 감각적으로 안내합니다.
              </h1>
              <p className="text-base sm:text-lg text-muted-foreground mt-5 max-w-xl">
                카지노, 유흥, 호텔, 골프까지 가장 세련된 여정으로 구성된 다낭 VIP 투어. 지금 가장
                트렌디한 코스를 확인하세요.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Button asChild>
                  <Link href="/products/promotion">프로모션 보기</Link>
                </Button>
                <Button variant="outline" asChild>
                  <Link href="/community">실시간 후기</Link>
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:gap-5">
              {categories.map((category) => (
                <Link key={category.label} href={category.href} className="group">
                  <Card className="overflow-hidden border-none bg-white/90 shadow-[0_18px_50px_-30px_rgba(15,23,42,0.35)]">
                    <div className="relative h-[140px] sm:h-[180px]">
                      <Image
                        src={category.image}
                        alt={category.label}
                        fill
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                        sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/0 to-transparent" />
                      <div className="absolute bottom-3 left-3 right-3 text-white">
                        <div className="text-xs uppercase tracking-[0.25em] text-white/70">
                          {category.subLabel}
                        </div>
                        <h3 className="font-display text-lg">{category.label}</h3>
                      </div>
                    </div>
                    <CardContent className="p-4">
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {category.description}
                      </p>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Intro Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-[1fr_1.1fr] items-center gap-10">
            <div className="order-2 md:order-1">
              <h2 className="font-display text-3xl sm:text-4xl mb-5 text-foreground">
                다낭의 밤을 한층 더 세련되게
              </h2>
              <p className="text-muted-foreground mb-6 leading-relaxed">
                프라이빗 라운지, 감각적인 바, 안전한 이동까지 모두 세팅합니다. 여행의 피로는 줄이고,
                경험의 밀도는 높였습니다.
              </p>
              <Button asChild>
                <Link href="/products/nightlife">
                  큐레이션 보기 <ArrowRight className="ml-2 w-4 h-4" />
                </Link>
              </Button>
            </div>
            <div className="order-1 md:order-2 h-[260px] sm:h-[320px] relative rounded-2xl overflow-hidden shadow-[0_30px_60px_-40px_rgba(15,23,42,0.35)]">
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

      {/* Recent Posts */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-10">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Latest updates</p>
              <h2 className="font-display text-3xl sm:text-4xl">최신 여행 정보</h2>
            </div>
            <Button variant="outline" asChild>
              <Link href="/community">더 보기</Link>
            </Button>
          </div>
          {latestPosts.length === 0 ? (
            <div className="text-center py-16 bg-gray-50 rounded-lg">
              <p className="text-gray-500 text-lg">아직 게시물이 없습니다.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {latestPosts.map((post) => (
                <Link key={post.id} href={`/community/${post.id}`}>
                  <Card className="hover:shadow-lg transition cursor-pointer overflow-hidden h-full">
                    <div className="h-36 sm:h-40 bg-gradient-to-br from-slate-100 via-white to-amber-50 flex items-center justify-center text-slate-500 text-sm uppercase tracking-[0.2em]">
                      Latest
                    </div>
                    <CardContent className="p-5">
                      <h3 className="font-display text-lg mb-2 line-clamp-2">{post.title}</h3>
                      <p className="text-muted-foreground text-sm">
                        {format(post.createdAt, "yyyy.MM.dd")} | 작성자: {post.author.name || "Anonymous"}
                      </p>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

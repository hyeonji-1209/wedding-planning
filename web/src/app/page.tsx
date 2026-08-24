// spec 화면 1 — 랜딩: "웨딩 드레스 취향 테스트" 1스크롤, CTA 하나.
// 모바일 세로가 기준 (.claude/rules/experience.md).

import Image from "next/image";
import Link from "next/link";
import { EditorialHeader, Eyebrow } from "@/components/editorial/header";
import { getCatalog, sampleDeck } from "@/data/catalog";

export const dynamic = "force-dynamic"; // 서명 URL은 만료된다

export default async function Home() {
  const { images } = await getCatalog();
  const preview = sampleDeck(images, 3);

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-6xl flex-1 flex-col px-7 pb-12 pt-10 lg:px-12">
      <EditorialHeader />

      <div className="grid flex-1 gap-10 pt-10 lg:grid-cols-2 lg:items-center lg:gap-20">
        <section className="flex flex-col lg:pr-8">
          <Eyebrow>WEDDING TASTE DISCOVERY</Eyebrow>
          <h1 className="pt-3 font-serif text-4xl font-medium leading-[1.15] lg:text-6xl">
            웨딩 드레스
            <br />
            <span className="italic text-blush">취향 테스트</span>
          </h1>
          <p className="pt-4 text-[13px] font-light leading-relaxed text-muted-foreground lg:text-sm">
            드레스 사진을 넘기기만 하면, 말로 설명 못 하던 내 취향을
            <br className="hidden lg:block" /> 언어로 정리해드려요. 그리고 그 취향과 닮은
            드레스샵을 <strong className="font-medium text-foreground">근거 사진과 함께</strong>{" "}
            보여드려요.
          </p>

          <div className="flex items-center gap-3 py-7">
            {["90초면 충분해요", "로그인 없음", "결과는 링크로"].map((tip, i) => (
              <span key={tip} className="flex items-center gap-3">
                {i > 0 && <span className="font-serif italic text-blush">·</span>}
                <span className="text-[10px] font-medium tracking-[0.2em] text-muted-foreground">
                  {tip}
                </span>
              </span>
            ))}
          </div>

          <Link
            href="/test"
            className="inline-block max-w-md bg-primary py-4 text-center text-xs font-bold tracking-[0.25em] text-primary-foreground transition-colors hover:bg-foreground/90"
          >
            내 취향 찾으러 가기
          </Link>
        </section>

        <section className="relative hidden min-h-[52dvh] items-center justify-center lg:flex">
          <div className="flex items-end gap-4">
            {preview.map((img, i) => (
              <div
                key={img.id}
                className={
                  i === 1
                    ? "relative aspect-[3/4] w-44 border border-border shadow-[0_14px_50px_rgba(190,168,150,0.25)]"
                    : "relative aspect-[3/4] w-32 opacity-70"
                }
              >
                <Image
                  src={img.src}
                  alt={img.attrs.rationale}
                  fill
                  sizes="176px"
                  className="object-cover"
                />
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}

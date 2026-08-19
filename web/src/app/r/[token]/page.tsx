// spec 화면 3+4 — 취향 결과 + 샵 추천. 토큰이 곧 영구 URL (로그인 없음).
// 한 스크롤 안에 다 들어오게 압축한다: 선호는 칩, 기피는 라벨 한 줄,
// 샵 이유는 매치된 취향 키워드로만. 드레스 하나하나를 해설하지 않는다.

import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { EditorialHeader, Eyebrow } from "@/components/editorial/header";
import { ShareLink } from "@/components/share-link";
import { DRESS_IMAGES, SHOPS, getImage } from "@/data/seed";
import { MOOD_KO } from "@/lib/taste/labels";
import { matchShops } from "@/lib/taste/match";
import { buildProfile } from "@/lib/taste/profile";
import { deterministicSummary } from "@/lib/taste/summary";
import { generateSummary } from "@/lib/taste/summary-claude";
import { decodeReactions } from "@/lib/taste/token";

type Props = { params: Promise<{ token: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { token } = await params;
  const reactions = decodeReactions(token);
  const profile = reactions && buildProfile(reactions, DRESS_IMAGES);
  if (!profile) return { title: "취향 결과" };
  const summary = deterministicSummary(profile);
  return {
    title: `${summary.name} — 내 웨딩 드레스 취향`,
    description: summary.description,
  };
}

export default async function ResultPage({ params }: Props) {
  const { token } = await params;
  const reactions = decodeReactions(token);
  if (!reactions || reactions.length === 0) notFound();

  const profile = buildProfile(reactions, DRESS_IMAGES);

  if (!profile) {
    // 전부 ✕ — 프로필을 지어내지 않고 다시 청한다
    return (
      <main className="mx-auto flex min-h-dvh w-full max-w-lg flex-col px-7 pb-12 pt-10">
        <EditorialHeader backHref="/" />
        <div className="flex flex-1 flex-col items-center justify-center gap-4 text-center">
          <h1 className="font-serif text-3xl italic">마음에 드는 드레스가 없었네요</h1>
          <p className="text-[13px] font-light text-muted-foreground">
            ♥가 한 장도 없으면 취향을 읽을 수 없어요.
            <br />
            다른 마음으로 한 번 더 볼까요?
          </p>
          <Link
            href="/test"
            className="mt-2 bg-primary px-8 py-3 text-xs font-bold tracking-[0.25em] text-primary-foreground"
          >
            다시 해보기
          </Link>
        </div>
      </main>
    );
  }

  const summary = await generateSummary(profile);
  const matches = matchShops(profile, DRESS_IMAGES, SHOPS);
  const moods = (Object.keys(profile.moodPct) as (keyof typeof profile.moodPct)[]).sort(
    (a, b) => profile.moodPct[b] - profile.moodPct[a],
  );

  return (
    <main className="mx-auto flex w-full max-w-xl flex-col px-7 pb-14 pt-10 lg:px-0">
      <EditorialHeader backHref="/" right={<ShareLink />} />

      {/* ── 취향 이름 + 무드 ── */}
      <section className="pt-8">
        <Eyebrow>MY WEDDING TASTE</Eyebrow>
        <h1 className="pt-2 font-serif text-4xl font-medium leading-[1.15]">
          <span className="italic text-blush">{summary.name}</span>
        </h1>
        <p className="pt-3 text-[13px] font-light leading-relaxed text-muted-foreground">
          {summary.description}
        </p>

        <div className="flex flex-col gap-2 pt-6">
          {moods.map((m) => (
            <div key={m} className="grid grid-cols-[4.5rem_1fr_2.5rem] items-center gap-3">
              <span className="text-[10px] font-medium tracking-[0.2em] text-muted-foreground">
                {MOOD_KO[m].toUpperCase()}
              </span>
              <div className="h-1 bg-muted">
                <div className="h-1 bg-blush" style={{ width: `${profile.moodPct[m]}%` }} />
              </div>
              <span className="text-right font-serif text-sm italic text-gold">
                {profile.moodPct[m]}%
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* ── 선호 — 칩 하나 = 취향 하나 + 근거 사진 ── */}
      <section className="pt-10">
        <div className="rule-gilded" />
        <div className="flex items-baseline justify-between pt-6">
          <h2 className="font-serif text-xl font-medium">
            마음이 기운 <span className="italic text-blush">{profile.preferred.length}가지</span>
          </h2>
          <span className="text-[10px] font-light text-muted-foreground">
            사진은 직접 고르신 근거예요
          </span>
        </div>
        <div className="flex flex-wrap gap-2 pt-4">
          {profile.preferred.map((facet) => (
            <span
              key={facet.label}
              className="flex items-center gap-2 border border-border bg-background py-1.5 pl-3 pr-1.5"
            >
              <span className="text-xs font-bold">{facet.label}</span>
              <span className="flex gap-1">
                {facet.evidenceIds.slice(0, 2).map((id) => {
                  const img = getImage(id);
                  if (!img) return null;
                  return (
                    <span key={id} className="relative block h-9 w-7 overflow-hidden bg-muted">
                      <Image src={img.src} alt="" fill sizes="28px" className="object-cover" />
                    </span>
                  );
                })}
              </span>
            </span>
          ))}
        </div>
      </section>

      {/* ── 기피 — 라벨 한 줄이면 충분하다 ── */}
      {profile.avoided.length > 0 && (
        <p className="pt-5 text-[12px] font-light text-muted-foreground">
          <span className="font-medium text-foreground">확실히 아닌 것</span>
          <span className="px-2 font-serif italic text-blush">—</span>
          {profile.avoided.map((f) => f.label).join(" · ")}
        </p>
      )}

      {/* ── 샵 추천 ── */}
      <section className="pt-10">
        <div className="rule-gilded" />
        <h2 className="pt-6 font-serif text-xl font-medium">
          이 취향과 닮은 <span className="italic text-blush">드레스샵</span>
        </h2>

        <div className="flex flex-col pt-2">
          {matches.map(({ shop, matchPct, reasons, portfolio }, rank) => (
            <article
              key={shop.id}
              className="border-b border-border py-6 last:border-b-0"
            >
              <div className="grid grid-cols-[1fr_auto] items-baseline gap-3">
                <div className="flex flex-wrap items-baseline gap-x-2.5 gap-y-0.5">
                  <span className="font-serif text-base italic text-gold">No.{rank + 1}</span>
                  <h3 className="text-[15px] font-bold">{shop.name}</h3>
                  <span className="text-[11px] font-light text-muted-foreground">
                    {shop.region}
                  </span>
                </div>
                <span className="flex items-baseline gap-1">
                  <span className="font-serif text-2xl italic text-blush">{matchPct}</span>
                  <span className="text-[9px] font-medium tracking-[0.2em] text-muted-foreground">
                    MATCH
                  </span>
                </span>
              </div>

              {/* 매치 이유 — 내 취향 키워드가 이 샵에 있다, 한 줄 */}
              <p className="pt-2 text-[12px] font-light text-muted-foreground">
                선호하시는{" "}
                <span className="font-medium text-foreground">
                  {reasons.map((r) => r.label).join(" · ")}
                </span>
                {reasons.length > 1 ? " 결이 모두 있어요" : " 결이 있어요"}
              </p>

              <div className="grid grid-cols-3 gap-1.5 pt-3.5">
                {portfolio.map(({ image, similarity }) => (
                  <figure key={image.id}>
                    <div className="relative aspect-[3/4] w-full overflow-hidden bg-muted">
                      <Image
                        src={image.src}
                        alt={image.attrs.rationale}
                        fill
                        sizes="(max-width: 640px) 30vw, 11rem"
                        className="object-cover"
                      />
                      <span className="absolute bottom-1 right-1.5 bg-background/85 px-1 font-serif text-[10px] italic text-gold">
                        {Math.round(similarity * 100)}%
                      </span>
                    </div>
                    <figcaption className="pt-1 text-[9px] font-light text-muted-foreground">
                      <a href={image.sourceUrl} target="_blank" rel="noreferrer" className="hover:text-blush">
                        {image.sourceLabel} · {image.credit}
                      </a>
                    </figcaption>
                  </figure>
                ))}
              </div>

              {shop.officialUrl ? (
                <a
                  href={shop.officialUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-3 inline-block border-b border-foreground pb-0.5 text-[11px] font-medium hover:border-blush hover:text-blush"
                >
                  공식 사이트 보기
                </a>
              ) : (
                <p className="pt-3 text-[10px] font-light text-muted-foreground/70">
                  시드 데이터 — 실제 샵 연결 전
                </p>
              )}
            </article>
          ))}
        </div>
      </section>

      <div className="flex items-center gap-3 pt-8">
        <div className="h-px flex-1 bg-foreground" />
        <Link href="/test" className="text-[11px] font-medium tracking-[0.15em] hover:text-blush">
          다시 테스트하기
        </Link>
        <div className="h-px flex-1 bg-foreground" />
      </div>
    </main>
  );
}

"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  AnimatePresence,
  animate,
  motion,
  useMotionValue,
  useReducedMotion,
  useTransform,
  type MotionValue,
} from "motion/react";
import { Bookmark, Heart, Undo2, X } from "lucide-react";
import { EditorialHeader } from "@/components/editorial/header";
import { DECK } from "@/data/seed";
import { encodeReactions } from "@/lib/taste/token";
import type { DressImage, Reaction, ReactionKind } from "@/lib/taste/types";

const INPUT_LOCK_MS = 160; // 더블탭이 다음 카드를 잘못 찍는 것만 막는 최소 잠금

const STAMP: Record<ReactionKind, { word: string; className: string }> = {
  like: { word: "yes.", className: "text-blush" },
  pass: { word: "no.", className: "text-foreground/70" },
  save: { word: "keep.", className: "text-gold" },
};

function milestoneCopy(index: number, total: number): string {
  if (index === 0) return "어떤 드레스에 마음이 가나요?";
  if (index === total - 1) return "마지막 한 장이에요";
  if (index / total >= 2 / 3) return "거의 다 왔어요";
  if (index / total >= 1 / 3) return "좋아요 — 결이 보이기 시작해요";
  return "고민하지 말고, 첫 느낌으로";
}

export default function TestPage() {
  const router = useRouter();
  const reduceMotion = useReducedMotion();
  const [reactions, setReactions] = useState<Reaction[]>([]);
  const [commanded, setCommanded] = useState<{ id: string; kind: ReactionKind } | null>(null);
  const [hintSeen, setHintSeen] = useState(false);
  const [finishing, setFinishing] = useState<Reaction[] | null>(null);
  const lockRef = useRef(0);
  const doneRef = useRef(false);
  const [undone, setUndone] = useState<Reaction | null>(null);

  const index = reactions.length;
  const current = DECK[index];
  const visible = useMemo(() => DECK.slice(index, index + 3), [index]);

  const finish = useCallback(
    (all: Reaction[]) => {
      if (doneRef.current) return;
      doneRef.current = true;
      const go = () => router.push(`/r/${encodeReactions(all)}`);
      if (reduceMotion) {
        go();
        return;
      }
      setFinishing(all); // 고른 사진이 잠깐 펼쳐지는 인터스티셜
      setTimeout(go, 1100);
    },
    [router, reduceMotion],
  );

  // 반응 확정 — 카드가 날아가는 것과 동시에 다음 장이 올라온다 (대기 없음)
  const react = useCallback(
    (kind: ReactionKind) => {
      if (!current || finishing) return;
      const now = performance.now();
      if (now - lockRef.current < INPUT_LOCK_MS) return;
      lockRef.current = now;
      navigator.vibrate?.(8);
      setHintSeen(true);
      setUndone(null);
      const next = [...reactions, { imageId: current.id, reaction: kind }];
      setReactions(next);
      if (next.length >= DECK.length) finish(next);
    },
    [current, finishing, reactions, finish],
  );

  // 버튼 반응 — 카드에게 "이 방향으로 날아가"를 시키고, 카드가 스스로 react를 부른다
  const command = useCallback(
    (kind: ReactionKind) => {
      if (!current || finishing) return;
      if (performance.now() - lockRef.current < INPUT_LOCK_MS) return;
      setCommanded({ id: current.id, kind });
    },
    [current, finishing],
  );

  const undo = useCallback(() => {
    if (reactions.length === 0 || finishing) return;
    const popped = reactions[reactions.length - 1];
    setUndone(popped);
    setCommanded(null);
    setReactions(reactions.slice(0, -1));
  }, [reactions, finishing]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") command("pass");
      if (e.key === "ArrowRight") command("like");
      if (e.key === "ArrowUp") {
        e.preventDefault();
        command("save");
      }
      if (e.key === "Backspace") undo();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [command, undo]);

  // 다음 장 미리 로드 — 스와이프가 이미지 로딩에 묶이면 90초 완주가 깨진다
  useEffect(() => {
    DECK.slice(index + 1, index + 4).forEach((d) => {
      const img = new window.Image();
      img.src = d.src;
    });
  }, [index]);

  /* ── 완료 인터스티셜 — ♥/저장한 사진이 폴라로이드처럼 놓인다 ── */
  if (finishing || !current) {
    const picks = (finishing ?? reactions)
      .filter((r) => r.reaction !== "pass")
      .map((r) => DECK.find((d) => d.id === r.imageId))
      .filter((d): d is NonNullable<typeof d> => Boolean(d))
      .slice(-5);
    return (
      <main className="mx-auto flex min-h-dvh w-full max-w-lg flex-col px-7 pb-12 pt-10">
        <EditorialHeader backHref="/" />
        <div className="flex flex-1 flex-col items-center justify-center">
          <div className="flex h-40 items-center justify-center">
            {picks.length > 0 ? (
              picks.map((d, i) => (
                <div
                  key={d.id}
                  className="relative -mx-3 aspect-[3/4] w-20 animate-[polaroid-in_0.5s_ease_both] border-[3px] border-background bg-muted shadow-[0_8px_30px_rgba(190,168,150,0.35)]"
                  style={
                    {
                      "--tilt": `${(i - (picks.length - 1) / 2) * 7}deg`,
                      animationDelay: `${i * 90}ms`,
                      zIndex: i,
                    } as React.CSSProperties
                  }
                >
                  <Image src={d.src} alt="" fill sizes="80px" className="object-cover" />
                </div>
              ))
            ) : (
              <div className="h-24 w-40 animate-pulse bg-muted" />
            )}
          </div>
          <p className="pt-8 font-serif text-2xl italic">취향을 언어로 옮기는 중</p>
          <p className="pt-2 text-[11px] font-light tracking-wider text-muted-foreground">
            고른 사진들에서 일관된 결을 찾고 있어요
          </p>
          <div className="rule-gilded mt-6 w-40" />
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-lg flex-col px-7 pb-8 pt-10">
      <EditorialHeader backHref="/" />

      {/* ── 필름 카운터 + 마일스톤 카피 ── */}
      <div className="flex items-baseline justify-between pt-6">
        <p className="text-[10px] font-medium tracking-[0.4em] text-gold">
          {milestoneCopy(index, DECK.length)}
        </p>
        <p className="font-serif text-sm italic text-muted-foreground">
          <span className="text-lg text-foreground">No.{String(index + 1).padStart(2, "0")}</span>
          {" — "}
          {String(DECK.length).padStart(2, "0")}
        </p>
      </div>

      {/* 반응 기록 도트 — 내가 지나온 자리 */}
      <div className="mt-2.5 flex items-center gap-1.5">
        {DECK.map((d, i) => {
          const r = reactions[i]?.reaction;
          return (
            <span
              key={d.id}
              className={
                r === "like"
                  ? "size-1.5 rounded-full bg-blush"
                  : r === "save"
                    ? "size-1.5 rounded-full bg-gold"
                    : r === "pass"
                      ? "size-1.5 rounded-full border border-border"
                      : i === index
                        ? "size-1.5 rounded-full border border-blush"
                        : "size-1 rounded-full bg-border"
              }
            />
          );
        })}
      </div>

      {/* ── 카드 스택 ── */}
      <div className="relative mt-4 min-h-[54dvh] flex-1">
        <AnimatePresence>
          {visible
            .map((img, slot) => (
              <DeckCard
                key={img.id}
                img={img}
                slot={slot}
                look={index + slot + 1}
                showHint={index === 0 && slot === 0 && !hintSeen}
                commandedKind={commanded?.id === img.id ? commanded.kind : null}
                entryFrom={
                  undone?.imageId === img.id ? undone.reaction : null
                }
                reduceMotion={Boolean(reduceMotion)}
                onDragStart={() => setHintSeen(true)}
                onReact={react}
              />
            ))
            .reverse()}
        </AnimatePresence>
      </div>

      {/* ── 반응 버튼 — 화면의 유일한 결정 ── */}
      <div className="flex items-start justify-center gap-9 pt-5">
        <div className="flex flex-col items-center gap-1.5">
          <button
            type="button"
            onClick={() => command("pass")}
            aria-label="이 드레스는 패스"
            className="flex size-14 items-center justify-center rounded-full border border-border bg-background transition-all hover:border-foreground active:scale-90"
          >
            <X className="size-5" strokeWidth={1.4} />
          </button>
          <span className="text-[9px] font-medium tracking-[0.25em] text-muted-foreground">패스</span>
        </div>
        <div className="flex flex-col items-center gap-1.5">
          <button
            type="button"
            onClick={() => command("like")}
            aria-label="이 드레스가 마음에 들어요"
            className="flex size-[70px] items-center justify-center rounded-full border border-blush bg-blush/10 shadow-[0_6px_24px_rgba(201,154,158,0.35)] transition-all hover:bg-blush/25 active:scale-90"
          >
            <Heart className="size-7 text-blush" strokeWidth={1.4} />
          </button>
          <span className="text-[9px] font-medium tracking-[0.25em] text-blush">좋아요</span>
        </div>
        <div className="flex flex-col items-center gap-1.5">
          <button
            type="button"
            onClick={() => command("save")}
            aria-label="이 드레스를 저장"
            className="flex size-14 items-center justify-center rounded-full border border-gold-line bg-background transition-all hover:border-gold active:scale-90"
          >
            <Bookmark className="size-5 text-gold" strokeWidth={1.4} />
          </button>
          <span className="text-[9px] font-medium tracking-[0.25em] text-gold">저장</span>
        </div>
      </div>

      <div className="flex items-center justify-between pt-4">
        <button
          type="button"
          onClick={undo}
          disabled={index === 0}
          className="flex items-center gap-1.5 text-[11px] font-light text-muted-foreground transition-opacity disabled:opacity-30"
        >
          <Undo2 className="size-3.5" strokeWidth={1.4} /> 이전으로
        </button>
        <p className="hidden text-[10px] font-light tracking-wide text-muted-foreground/70 lg:block">
          ← 패스 · → 좋아요 · ↑ 저장 · ⌫ 되돌리기
        </p>
      </div>
    </main>
  );
}

/* ── 카드 한 장 — 드래그·스탬프·플링은 전부 모션 값이라 리렌더 없이 60fps ── */

const FLING: Record<ReactionKind, { x: number; y: number }> = {
  like: { x: 560, y: -40 },
  pass: { x: -560, y: -40 },
  save: { x: 0, y: -680 },
};

function DeckCard({
  img,
  slot,
  look,
  showHint,
  commandedKind,
  entryFrom,
  reduceMotion,
  onDragStart,
  onReact,
}: {
  img: DressImage;
  slot: number;
  look: number;
  showHint: boolean;
  commandedKind: ReactionKind | null;
  entryFrom: ReactionKind | null;
  reduceMotion: boolean;
  onDragStart: () => void;
  onReact: (kind: ReactionKind) => void;
}) {
  const isTop = slot === 0;
  // 되돌리기로 돌아온 카드는 날아갔던 방향에서 다시 들어온다
  const x = useMotionValue(entryFrom ? FLING[entryFrom].x : 0);
  const y = useMotionValue(entryFrom ? FLING[entryFrom].y : 0);
  const rotate = useTransform(x, [-260, 260], [-13, 13]);

  const likeOp = useTransform(x, [24, 110], [0, 1]);
  const passOp = useTransform(x, [-110, -24], [1, 0]);
  const saveRaw = useTransform(y, [-130, -44], [1, 0]);
  const saveGate = useTransform(x, [-80, -40, 40, 80], [0, 1, 1, 0]);
  const saveOp = useTransform(() => saveRaw.get() * saveGate.get());
  const likeWash = useTransform(likeOp, (v) => v * 0.14);
  const passWash = useTransform(passOp, (v) => v * 0.12);
  const saveWash = useTransform(saveOp, (v) => v * 0.14);

  const firedRef = useRef(false);

  const fling = useCallback(
    (kind: ReactionKind) => {
      if (firedRef.current) return;
      firedRef.current = true;
      const target = FLING[kind];
      if (!reduceMotion) {
        // 카드는 exit 동안에도 마운트돼 있어서, 이 애니메이션이 끝까지 그려진다
        animate(x, target.x, { duration: 0.26, ease: "easeIn" });
        animate(y, target.y, { duration: 0.26, ease: "easeIn" });
      }
      onReact(kind);
    },
    [onReact, reduceMotion, x, y],
  );

  // 버튼/키보드 반응 — 부모가 방향만 알려주면 카드가 직접 날아간다
  useEffect(() => {
    if (commandedKind && isTop) fling(commandedKind);
  }, [commandedKind, isTop, fling]);

  // 되돌아온 카드는 제자리로 스프링
  useEffect(() => {
    if (entryFrom) {
      animate(x, 0, { type: "spring", stiffness: 380, damping: 32 });
      animate(y, 0, { type: "spring", stiffness: 380, damping: 32 });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- 마운트 시 1회
  }, []);

  return (
    /* 바깥: 스택 자리(뒷장 → 앞장 승격이 같은 엘리먼트의 스프링 전환) */
    <motion.div
      className="absolute inset-0"
      style={{ zIndex: 10 - slot }}
      initial={slot === 2 ? { opacity: 0 } : false}
      animate={{
        scale: 1 - slot * 0.045,
        y: slot * 12,
        opacity: slot === 0 ? 1 : 0.6 - slot * 0.22,
      }}
      exit={{ opacity: 0, transition: { duration: 0.3, ease: "easeIn" } }}
      transition={{ type: "spring", stiffness: 320, damping: 30 }}
    >
      {/* 안쪽: 드래그·회전·플링 */}
      <motion.div
        className="absolute inset-0 touch-none select-none overflow-hidden border border-border bg-muted shadow-[0_18px_60px_rgba(190,168,150,0.28)]"
        style={{ x, y, rotate }}
        drag={isTop}
        dragElastic={0.9}
        dragMomentum={false}
        onDragStart={onDragStart}
        onDragEnd={(_, info) => {
          const { offset, velocity } = info;
          if ((offset.y < -110 || velocity.y < -600) && Math.abs(offset.x) < 80) fling("save");
          else if (offset.x > 90 || velocity.x > 550) fling("like");
          else if (offset.x < -90 || velocity.x < -550) fling("pass");
          else {
            // 스프링백 — 결정이 아니면 제자리로
            animate(x, 0, { type: "spring", stiffness: 420, damping: 30 });
            animate(y, 0, { type: "spring", stiffness: 420, damping: 30 });
          }
        }}
      >
        <Image
          src={img.src}
          alt="웨딩 드레스"
          fill
          sizes="28rem"
          priority={isTop}
          className="pointer-events-none object-cover"
          draggable={false}
        />

        {/* 룩 캡션 — 화보 지면처럼 */}
        <span className="absolute left-3 top-3 bg-background/85 px-2.5 py-1 font-serif text-[12px] italic text-foreground">
          Look No.{String(look).padStart(2, "0")}
        </span>
        <span className="absolute bottom-2.5 right-3 text-[9px] font-light tracking-wider text-white/85 [text-shadow:0_1px_4px_rgba(0,0,0,0.4)]">
          {img.sourceLabel}
        </span>

        {isTop && (
          <>
            {/* 색 워시 — 드래그 방향의 감정이 은은하게 비친다 */}
            <motion.span aria-hidden className="pointer-events-none absolute inset-0 bg-blush" style={{ opacity: likeWash }} />
            <motion.span aria-hidden className="pointer-events-none absolute inset-0 bg-foreground" style={{ opacity: passWash }} />
            <motion.span aria-hidden className="pointer-events-none absolute inset-0 bg-gold" style={{ opacity: saveWash }} />

            {/* 시그니처 — 에디터의 낙서 스탬프. 날아가는 동안에도 계속 진해진다 */}
            <Stamp kind="like" opacity={likeOp} />
            <Stamp kind="pass" opacity={passOp} />
            <Stamp kind="save" opacity={saveOp} />
          </>
        )}

        {/* 첫 카드 힌트 — 첫 터치에 사라진다 */}
        {showHint && (
          <div className="pointer-events-none absolute inset-x-0 bottom-0 flex items-center justify-center gap-6 bg-gradient-to-t from-black/45 to-transparent pb-5 pt-14 text-[11px] font-light tracking-wider text-white">
            <span>← 아니면 넘기고</span>
            <span className="font-serif text-base italic">·</span>
            <span>마음에 들면 →</span>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}

function Stamp({ kind, opacity }: { kind: ReactionKind; opacity: MotionValue<number> }) {
  const scale = useTransform(opacity, [0, 1], [1.06, 1.16]);
  return (
    <motion.span
      className={`pointer-events-none absolute inset-0 flex items-center justify-center font-serif text-7xl font-semibold italic ${STAMP[kind].className}`}
      style={{
        opacity,
        scale,
        rotate: -8,
        textShadow: "0 2px 24px rgba(255,253,251,0.9)",
      }}
    >
      {STAMP[kind].word}
    </motion.span>
  );
}

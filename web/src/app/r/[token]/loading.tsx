// 취향 분석 대기 — 스피너 대신 스켈레톤 (.claude/rules/experience.md)
export default function Loading() {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-3xl flex-col px-7 pb-12 pt-10 lg:px-0">
      <div className="h-10 animate-pulse bg-muted" />
      <div className="mt-10 h-6 w-40 animate-pulse bg-muted" />
      <div className="mt-4 h-12 w-72 animate-pulse bg-muted" />
      <p className="pt-6 text-[11px] font-light tracking-wider text-muted-foreground">
        고른 사진들에서 취향의 언어를 찾는 중이에요…
      </p>
      <div className="mt-6 grid grid-cols-4 gap-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="aspect-[3/4] animate-pulse bg-muted" />
        ))}
      </div>
    </main>
  );
}

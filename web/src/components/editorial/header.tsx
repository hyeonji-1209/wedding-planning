import Link from "next/link";
import { ChevronLeft } from "lucide-react";

type EditorialHeaderProps = {
  backHref?: React.ComponentProps<typeof Link>["href"];
  right?: React.ReactNode;
};

export function EditorialHeader({ backHref, right }: EditorialHeaderProps) {
  return (
    <header>
      <div className="flex items-center pb-5">
        <div className="flex w-5 justify-start">
          {backHref ? (
            <Link href={backHref} aria-label="뒤로 가기">
              <ChevronLeft className="size-5" strokeWidth={1.4} />
            </Link>
          ) : null}
        </div>
        <div className="flex-1" />
        <div className="font-serif text-base font-semibold tracking-[0.25em]">
          WEDDING TASTE
        </div>
        <div className="flex-1" />
        <div className="flex w-5 justify-end">{right}</div>
      </div>
      <div className="rule-gilded" />
    </header>
  );
}

export function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[10px] font-medium tracking-[0.4em] text-gold">
      {children}
    </p>
  );
}

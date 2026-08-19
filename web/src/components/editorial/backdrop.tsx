// 모서리에서 은은하게 번지는 블러시·샴페인 빛 — 장식 없이 톤으로만 반짝임을 낸다
export function BridalBackdrop() {
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
    >
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(52% 42% at 92% -8%, #f7ece9 0%, rgba(247, 236, 233, 0) 62%), " +
            "radial-gradient(44% 38% at -10% 108%, #f6efdf 0%, rgba(246, 239, 223, 0) 60%)",
        }}
      />
    </div>
  );
}

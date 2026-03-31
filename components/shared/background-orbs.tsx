type BackgroundOrbsProps = {
  tone?: "dark" | "light";
};

export function BackgroundOrbs({ tone = "dark" }: BackgroundOrbsProps) {
  const orbClasses =
    tone === "light"
      ? {
          top: "absolute left-1/2 top-[-12rem] h-[28rem] w-[28rem] -translate-x-1/2 rounded-full bg-[radial-gradient(circle,_rgba(7,107,210,0.18),_rgba(255,255,255,0)_68%)] blur-3xl",
          right:
            "absolute right-[-8rem] top-[16rem] h-[26rem] w-[26rem] rounded-full bg-[radial-gradient(circle,_rgba(59,130,246,0.16),_rgba(255,255,255,0)_72%)] blur-3xl",
          left: "absolute bottom-[-8rem] left-[-8rem] h-[24rem] w-[24rem] rounded-full bg-[radial-gradient(circle,_rgba(29,78,216,0.12),_rgba(255,255,255,0)_72%)] blur-3xl",
          overlay:
            "absolute inset-0 bg-[linear-gradient(to_bottom,_rgba(255,255,255,0.06),_rgba(248,250,252,0.9))]",
        }
      : {
          top: "absolute left-1/2 top-[-12rem] h-[28rem] w-[28rem] -translate-x-1/2 rounded-full bg-[radial-gradient(circle,_rgba(7,107,210,0.26),_rgba(6,10,18,0)_68%)] blur-3xl",
          right:
            "absolute right-[-8rem] top-[16rem] h-[26rem] w-[26rem] rounded-full bg-[radial-gradient(circle,_rgba(59,130,246,0.18),_rgba(6,10,18,0)_72%)] blur-3xl",
          left: "absolute bottom-[-8rem] left-[-8rem] h-[24rem] w-[24rem] rounded-full bg-[radial-gradient(circle,_rgba(29,78,216,0.14),_rgba(6,10,18,0)_72%)] blur-3xl",
          overlay:
            "absolute inset-0 bg-[linear-gradient(to_bottom,_rgba(6,10,18,0.16),_rgba(6,10,18,0.92))]",
        };

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 overflow-hidden"
    >
      <div className={orbClasses.top} />
      <div className={orbClasses.right} />
      <div className={orbClasses.left} />
      <div className={orbClasses.overlay} />
    </div>
  );
}

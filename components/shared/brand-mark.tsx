import Link from "next/link";
import { cn } from "@/lib/utils";

type BrandMarkProps = {
  href?: string;
  className?: string;
  tone?: "dark" | "light";
};

export function BrandMark({
  href = "/",
  className,
  tone = "dark",
}: BrandMarkProps) {
  return (
    <Link
      href={href}
      className={cn("inline-flex items-center gap-3 text-sm font-medium", className)}
    >
      <span
        className={cn(
          "flex h-10 w-10 items-center justify-center rounded-2xl shadow-glow",
          tone === "light"
            ? "border border-slate-200 bg-white"
            : "border border-white/10 bg-white/5",
        )}
      >
        <span className="h-5 w-5 rounded-full bg-[linear-gradient(135deg,_#076BD2,_#3B82F6)]" />
      </span>
      <span className="flex flex-col">
        <span
          className={cn(
            "font-display text-base tracking-tight",
            tone === "light" ? "text-slate-950" : "text-white",
          )}
        >
          CIRCL
        </span>
        <span
          className={cn(
            "text-xs",
            tone === "light" ? "text-slate-500" : "text-muted",
          )}
        >
          Creator commerce OS
        </span>
      </span>
    </Link>
  );
}

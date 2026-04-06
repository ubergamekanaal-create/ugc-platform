"use client";

import Link from "next/link";
import type { Role } from "@/lib/types";
import { cn } from "@/lib/utils";

type SignupRoleTabsProps = {
  activeRole: Role;
  className?: string;
};

const tabItems: Array<{
  role: Role;
  label: string;
  href: string;
}> = [
  {
    role: "brand",
    label: "Brand",
    href: "/signup",
  },
  {
    role: "creator",
    label: "Creator",
    href: "/signup/creator",
  },
];

export function SignupRoleTabs({
  activeRole,
  className,
}: SignupRoleTabsProps) {
  return (
    <div
      className={cn(
        "inline-flex w-full rounded-full border border-white/80 bg-white/80 p-1.5 shadow-[0_14px_30px_rgba(15,23,42,0.06),inset_0_1px_0_rgba(255,255,255,0.75)] backdrop-blur",
        className,
      )}
    >
      {tabItems.map((item) => {
        const isActive = item.role === activeRole;

        return (
          <Link
            key={item.role}
            href={item.href}
            className={cn(
              "inline-flex flex-1 items-center justify-center rounded-full px-5 py-3 text-sm font-semibold transition duration-200",
              isActive
                ? "bg-[linear-gradient(135deg,_#076BD2,_#3B82F6)] text-white shadow-[0_14px_30px_rgba(7,107,210,0.22)]"
                : "text-slate-500 hover:bg-white/90 hover:text-slate-900",
            )}
          >
            {item.label}
          </Link>
        );
      })}
    </div>
  );
}

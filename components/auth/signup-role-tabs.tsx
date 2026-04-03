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
        "inline-flex rounded-[1.25rem] border border-white/80 bg-white/80 p-1 shadow-[0_12px_28px_rgba(15,23,42,0.06)] backdrop-blur",
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
              "inline-flex min-w-[8.5rem] items-center justify-center rounded-[1rem] px-5 py-3 text-sm font-semibold transition",
              isActive
                ? "bg-[linear-gradient(135deg,_#076BD2,_#3B82F6)] text-white shadow-[0_16px_35px_rgba(7,107,210,0.2)]"
                : "text-slate-500 hover:text-slate-900",
            )}
          >
            {item.label}
          </Link>
        );
      })}
    </div>
  );
}

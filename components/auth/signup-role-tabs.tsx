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
        "inline-flex w-full rounded-xl border border-gray-100 bg-gray-100 p-1  backdrop-blur",
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
              "inline-flex flex-1 items-center justify-center rounded-xl px-3 py-2 text-sm font-semibold transition duration-200",
              isActive
                ? "bg-white"
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

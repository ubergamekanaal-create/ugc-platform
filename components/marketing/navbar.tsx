"use client";

import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import { useState } from "react";
import { BrandMark } from "@/components/shared/brand-mark";
import { cn } from "@/lib/utils";

const links = [
  { href: "/#how-it-works", label: "How it works" },
  { href: "/#features", label: "Features" },
  { href: "/#testimonials", label: "Testimonials" },
  { href: "/#pricing", label: "Pricing" },
];

export function MarketingNavbar() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/80 backdrop-blur-xl">
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-5 py-4 sm:px-6 lg:px-8">
        <BrandMark tone="light" />
        <nav className="hidden items-center gap-8 lg:flex">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm text-slate-500 transition hover:text-slate-950"
            >
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="hidden items-center gap-3 lg:flex">
          <Link
            href="/login"
            className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700 transition hover:border-accent/40 hover:bg-blue-50"
          >
            Login
          </Link>
          <Link
            href="/signup"
            className="rounded-full bg-[linear-gradient(135deg,_#076BD2,_#3B82F6)] px-4 py-2 text-sm font-medium text-white transition hover:shadow-glow"
          >
            Get Started
          </Link>
        </div>
        <button
          type="button"
          aria-label="Toggle menu"
          onClick={() => setIsOpen((value) => !value)}
          className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-900 lg:hidden"
        >
          <span className="sr-only">Open menu</span>
          <div className="space-y-1.5">
            <div className={cn("h-0.5 w-5 bg-slate-900 transition", isOpen && "translate-y-2 rotate-45")} />
            <div className={cn("h-0.5 w-5 bg-slate-900 transition", isOpen && "opacity-0")} />
            <div className={cn("h-0.5 w-5 bg-slate-900 transition", isOpen && "-translate-y-2 -rotate-45")} />
          </div>
        </button>
      </div>
      <AnimatePresence>
        {isOpen ? (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden border-t border-slate-200 lg:hidden"
          >
            <div className="mx-auto flex max-w-7xl flex-col gap-2 px-5 py-4 sm:px-6">
              {links.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setIsOpen(false)}
                  className="rounded-2xl px-3 py-3 text-sm text-slate-500 transition hover:bg-slate-50 hover:text-slate-950"
                >
                  {link.label}
                </Link>
              ))}
              <Link
                href="/login"
                onClick={() => setIsOpen(false)}
                className="rounded-2xl border border-slate-200 px-3 py-3 text-sm text-slate-700"
              >
                Login
              </Link>
              <Link
                href="/signup"
                onClick={() => setIsOpen(false)}
                className="rounded-2xl bg-[linear-gradient(135deg,_#076BD2,_#3B82F6)] px-3 py-3 text-sm font-medium text-white"
              >
                Get Started
              </Link>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </header>
  );
}

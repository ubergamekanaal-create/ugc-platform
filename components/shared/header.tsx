import { useState, useRef, useEffect } from "react";
import { BrandMark } from "@/components/shared/brand-mark";
import Link from "next/link";

type Props = {
  tone?: String;
  name?: string | null;
  roleLabel?: string;
};

export default function Header({ tone, name, roleLabel }: Props) {
  const [open, setOpen] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);
  async function handleSignOut() {
    setIsPending(true);
    try {
      const response = await fetch("/api/auth/logout", {
        method: "POST",
      });
      const payload = (await response.json()) as { redirectTo?: string };

      window.location.assign(payload.redirectTo ?? "/login");
    } catch {
      window.location.assign("/login");
    }
  }
  return (
    <header className="max-w-[1720px] mx-auto sticky top-0 z-50 w-full  mx-auto pt-4 backdrop-blur-3xl">
      <div className="flex mx-3 sm:mx-5 items-center justify-between px-6 py-3 rounded-[2rem] border border-white/80 bg-white/82 p-6 shadow-[0_24px_70px_rgba(15,23,42,0.08)] bg-[linear-gradient(135deg,_rgba(8,145,178,0.08),_rgba(255,255,255,0.9),_rgba(7,107,210,0.1))]">
        {/* LEFT */}
        <div className="flex items-start gap-3">
          <BrandMark tone="light" />
          <span className="hidden sm:block text-[11px] font-semibold text-slate-600 flex items-center justify-center text-[#076bd2] rounded-full border px-2 py-1 font-semibold capitalize border-[rgba(7,107,210,0.14)] bg-[rgba(7,107,210,0.08)] text-accent">
            {roleLabel}
          </span>
        </div>

        {/* RIGHT */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setOpen(!open)}
            className="flex items-center gap-3 rounded-full px-3 py-2 hover:bg-slate-100 transition"
          >
            {/* Avatar */}
            <div className="h-9 w-9 rounded-full bg-black text-white flex items-center justify-center text-sm font-semibold">
              {name?.charAt(0)}
            </div>

            {/* Name */}
            <span className="text-sm font-medium text-slate-700">{name}</span>
          </button>

          {/* DROPDOWN */}
          {open && (
            <div className="absolute right-0 mt-2 w-52 rounded-2xl border border-slate-200 bg-white shadow-lg p-2">
              <div className="flex items-center gap-2 mb-2 px-2 py-2 hover:bg-slate-100 transition border-b border-b-slate-400">
                <div className="h-9 w-9 rounded-full bg-black text-white flex items-center justify-center text-sm font-semibold">
                  {name?.charAt(0)}
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-black">{name}</span>
                  <span className="text-sm text-slate-500">{roleLabel}</span>
                </div>
              </div>
              {/* Account Settings */}
              <Link
                href={
                  tone === "brand"
                    ? "/dashboard/settings"
                    : "/dashboard/profile"
                }
                className="flex w-full items-center gap-3 rounded-xl px-3 pt-2 pb-2 text-sm font-medium hover:bg-slate-100"
              >
                <span>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    className="lucide lucide-settings h-4 w-4"
                    aria-hidden="true"
                  >
                    <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"></path>
                    <circle cx="12" cy="12" r="3"></circle>
                  </svg>
                </span>
                Account Settings
              </Link>

              {/* Logout */}
              <button
                disabled={isPending}
                onClick={handleSignOut}
                className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium hover:bg-red-50 text-red-600"
              >
                <span>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    className="lucide lucide-log-out h-4 w-4"
                    aria-hidden="true"
                  >
                    <path d="m16 17 5-5-5-5"></path>
                    <path d="M21 12H9"></path>
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                  </svg>
                </span>
                Log Out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

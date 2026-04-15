"use client";

import Link from "next/link";
import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import { FadeIn, PageTransition } from "@/components/shared/motion";
import { cn } from "@/lib/utils";

type Mode = "brand" | "creator";

interface Step {
  icon: string;
  num: string;
  title: string;
  desc: string;
  chip: string;
}

interface BrandVideo {
  bg: string;
  badge: string;
  g: string;
  v: string;
  r: string;
}

interface CreatorVideo {
  bg: string;
  badge: string;
  e: string;
  h: string;
  r: string;
}

type HomePageProps = {
  isLoggedIn?: boolean;
};

const BRAND_VIDEOS: BrandVideo[] = [
  {
    bg: "linear-gradient(145deg,#1A1A2E,#2D1B4E)",
    badge: "#1 this week",
    g: "$8.4k",
    v: "182k",
    r: "5.3×",
  },
  {
    bg: "linear-gradient(145deg,#0D2A1A,#1A4A2E)",
    badge: "Trending now",
    g: "$6.1k",
    v: "94k",
    r: "4.1×",
  },
  {
    bg: "linear-gradient(145deg,#2A180D,#4A2E1A)",
    badge: "Top ROAS",
    g: "$11.2k",
    v: "241k",
    r: "7.8×",
  },
];

const CREATOR_VIDEOS: CreatorVideo[] = [
  {
    bg: "linear-gradient(145deg,#1A1A2E,#2D1B4E)",
    badge: "#1 this week",
    e: "$1,240",
    h: "68%",
    r: "4.8×",
  },
  {
    bg: "linear-gradient(145deg,#0D2A1A,#1A4A2E)",
    badge: "Most views",
    e: "$890",
    h: "54%",
    r: "3.2×",
  },
  {
    bg: "linear-gradient(145deg,#2A100D,#4A2010)",
    badge: "Top hook rate",
    e: "$1,640",
    h: "81%",
    r: "6.1×",
  },
];

const BRAND_STEPS: Step[] = [
  {
    icon: '<circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.5-7 8-7s8 3 8 7"/>',
    num: "01",
    title: "Create your brand account",
    desc: "Set up your workspace in minutes. Add your brand details, connect your Shopify store, and you're ready to launch.",
    chip: "2 min setup",
  },
  {
    icon: '<rect x="3" y="3" width="18" height="4" rx="1"/><path d="M3 10h18M3 15h11M3 20h7"/>',
    num: "02",
    title: "Set up your campaign brief",
    desc: "Define content style, budget, commission structure, and which products creators should feature.",
    chip: "Full customization",
  },
  {
    icon: '<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
    num: "03",
    title: "Match with the right creators",
    desc: "Browse the Circl marketplace or let our algorithm match your brand with creators who fit your niche.",
    chip: "Smart matching",
  },
  {
    icon: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><polyline points="9 15 11 17 15 13"/>',
    num: "04",
    title: "Review and approve content",
    desc: "Creators submit directly in Circl. One-click approval or request revisions — no email chains, ever.",
    chip: "No email chaos",
  },
  {
    icon: '<line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/><polyline points="3 9 12 2 21 9"/>',
    num: "05",
    title: "Track results and scale what works",
    desc: "See ROAS, GMV, and performance per creator and per video. Double down on what's converting.",
    chip: "Real-time analytics",
  },
];

const CREATOR_STEPS: Step[] = [
  {
    icon: '<circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.5-7 8-7s8 3 8 7"/>',
    num: "01",
    title: "Build your creator profile",
    desc: "Show brands who you are. Add your niche, past work, and social handles — your profile is your pitch.",
    chip: "Free to join",
  },
  {
    icon: '<circle cx="11" cy="11" r="7"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>',
    num: "02",
    title: "Browse and apply to campaigns",
    desc: "Explore hundreds of live brand campaigns. Filter by niche, payout, and product type. Apply in one tap.",
    chip: "340 live campaigns",
  },
  {
    icon: '<path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 01-8 0"/>',
    num: "03",
    title: "Request your product sample",
    desc: "Brands ship products directly to you through Circl. No chasing emails — sample orders are automated.",
    chip: "Auto-fulfilled",
  },
  {
    icon: '<rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/>',
    num: "04",
    title: "Create and submit your video",
    desc: "Upload your content right inside Circl. Get feedback fast, make revisions if needed, and get approved.",
    chip: "In-app upload",
  },
  {
    icon: '<circle cx="12" cy="12" r="9"/><path d="M9 12l2 2 4-4"/>',
    num: "05",
    title: "Get paid — automatically",
    desc: "Smart contracts handle your payout the moment your content is approved. No invoices, no waiting.",
    chip: "Paid within 24h",
  },
];

const STEP_COLORS = ["#1476FF", "#1476FF", "#1476FF", "#1476FF", "#1476FF"];
const STEP_BG = ["#f7f9ff", "#f7f9ff", "#f7f9ff", "#f7f9ff", "#f7f9ff"];
const STEP_BORDER = ["#d8e4f8", "#d8e4f8", "#d8e4f8", "#d8e4f8", "#d8e4f8"];

function PulseDot() {
  return (
    <span className="inline-block h-[6px] w-[6px] shrink-0 rounded-full bg-[#1D9E75] [animation:circl-pulse_1.5s_infinite]" />
  );
}
function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}
function Avatar({
  initials,
  bg,
  size = 22,
  fontSize = 8,
}: {
  initials: string;
  bg: string;
  size?: number;
  fontSize?: number;
}) {
  return (
    <div
      className="-mr-[6px] flex shrink-0 items-center justify-center rounded-full border-2 border-white font-bold text-white"
      style={{ width: size, height: size, fontSize, background: bg }}
    >
      {initials}
    </div>
  );
}

function Pill({
  children,
  type,
}: {
  children: React.ReactNode;
  type: "g" | "b" | "o";
}) {
  const map = {
    g: { bg: "#e1f5ee", color: "#0f6e56" },
    b: { bg: "#eef4ff", color: "#185fa5" },
    o: { bg: "#fff3e8", color: "#854f0b" },
  };
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full px-[9px] py-[3px] text-[10px] font-bold"
      style={{ background: map[type].bg, color: map[type].color }}
    >
      {children}
    </span>
  );
}

import { motion, animate, useMotionValue, useTransform } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import {
  BarChart,
  Bar,
  ResponsiveContainer,
  Cell,
  YAxis,
  XAxis,
  CartesianGrid,
  LineChart,
  Line,
  Tooltip,
} from "recharts";
import { BrandMark } from "../shared/brand-mark";
function BrandSampleRequest() {
  return (
    <div className="rounded-[16px] border border-[#e0e8f8] bg-white px-4 py-[14px] w-[198px] shadow-sm">
      <div className="mb-[5px] text-[10px] font-bold tracking-[0.06em] text-[#aaa]">
        CREATOR SAMPLE REQUEST
      </div>

      <div className="mb-2.5 flex items-center gap-2">
        <div className="flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-[8px] bg-[#eef4ff]">
          <svg
            width="15"
            height="15"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#1476FF"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
            <line x1="3" y1="6" x2="21" y2="6" />
            <path d="M16 10a4 4 0 01-8 0" />
          </svg>
        </div>

        <div className="text-[13px] font-semibold leading-[1.3] text-[#0d1a2d]">
          Approve creator sample?
        </div>
      </div>

      <div className="flex gap-[7px]">
        <motion.button
          whileTap={{ scale: 0.95 }}
          whileHover={{ scale: 1.05 }}
          className="flex h-[30px] flex-1 items-center justify-center gap-[3px] rounded-[8px] bg-[#e1f5ee] text-[11px] font-bold text-[#0f6e56]"
        >
          <svg
            width="10"
            height="10"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="20 6 9 17 4 12" />
          </svg>
          Approve
        </motion.button>

        <motion.button
          whileTap={{ scale: 0.95 }}
          whileHover={{ scale: 1.05 }}
          className="flex h-[30px] flex-1 items-center justify-center gap-[3px] rounded-[8px] bg-[#fcebeb] text-[11px] font-bold text-[#a32d2d]"
        >
          <svg
            width="10"
            height="10"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
          Decline
        </motion.button>
      </div>
    </div>
  );
}

function BrandTopPerformer({ bVideoIdx }: { bVideoIdx: number }) {
  const vid = BRAND_VIDEOS[bVideoIdx];
  return (
    <div className="rounded-[16px] border border-[#e0e8f8] bg-white px-4 py-[14px] w-[205px]">
      <div className="mb-[5px] text-[10px] font-bold tracking-[0.06em] text-[#aaa]">
        TOP PERFORMER
      </div>
      <div className="relative mb-2.5 h-[108px] w-full overflow-hidden rounded-[10px]">
        <div
          className="h-full w-full transition-[background] duration-[600ms]"
          style={{ background: vid.bg }}
        />
        <div className="absolute left-[7px] top-[7px] rounded-full bg-[rgba(20,118,255,0.88)] px-[7px] py-[2px] text-[9px] font-bold text-white">
          {vid.badge}
        </div>
        <div className="absolute left-1/2 top-1/2 flex h-[26px] w-[26px] -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-[rgba(255,255,255,0.92)]">
          <svg width="9" height="9" viewBox="0 0 24 24" fill="#1476FF">
            <polygon points="5 3 19 12 5 21 5 3" />
          </svg>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-1">
        {(
          [
            ["GMV", vid.g],
            ["VIEWS", vid.v],
            ["ROAS", vid.r],
          ] as [string, string][]
        ).map(([lbl, val]) => (
          <div key={lbl}>
            <div className="text-[9px] font-semibold text-[#aaa]">{lbl}</div>
            <div className="text-[13px] font-extrabold text-[#0d1a2d]">
              {val}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function BrandMetaAdSpend() {
  return (
    <div className="rounded-[16px] border border-[#e0e8f8] bg-white px-4 py-[14px] w-[172px]">
      <div className="mb-[7px] flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-[9px] bg-[#eef4ff]">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
            <path
              d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"
              stroke="#185FA5"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
        <div>
          <div className="text-[10px] font-bold tracking-[0.06em] text-[#aaa]">
            META AD SPEND
          </div>
          <div className="text-[19px] font-extrabold text-[#0d1a2d]">$120k</div>
        </div>
      </div>
      <Pill type="b">via Circl autopilot</Pill>
    </div>
  );
}

function BrandActiveCreators({ bCreatorCount }: { bCreatorCount: number }) {
  return (
    <div className="rounded-[16px] border border-[#e0e8f8] bg-white px-4 py-[14px] w-[188px]">
      <div className="mb-[5px] text-[10px] font-bold tracking-[0.06em] text-[#aaa]">
        ACTIVE CREATORS
      </div>
      <div className="my-[3px] mb-[7px] flex items-baseline gap-[7px] flex items-center">
        <div className="text-[21px] font-extrabold text-[#0d1a2d]">
          {bCreatorCount.toLocaleString()}
        </div>
        <Pill type="g">↑ live</Pill>
      </div>
      <div className="flex">
        {(
          [
            ["JK", "#1476ff"],
            ["SM", "#1d9e75"],
            ["AL", "#d85a30"],
            ["PR", "#d4537e"],
            ["NX", "#534ab7"],
          ] as [string, string][]
        ).map(([i, c]) => (
          <Avatar key={i} initials={i} bg={c} />
        ))}
        <Avatar initials="+42" bg="#888" fontSize={7} />
      </div>
    </div>
  );
}

function BrandVideoStatus() {
  return (
    <div className="rounded-[16px] border border-[#e0e8f8] bg-white px-4 py-[14px] w-[205px]">
      <div className="mb-[7px] text-[10px] font-bold tracking-[0.06em] text-[#aaa]">
        VIDEO STATUS
      </div>
      {[
        {
          label: "Approved",
          count: 303,
          pct: "85%",
          barColor: "#1d9e75",
          textColor: "#0f6e56",
          icon: (
            <svg
              width="11"
              height="11"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#0F6E56"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="20 6 9 17 4 12" />
            </svg>
          ),
        },
        {
          label: "Needs revision",
          count: 56,
          pct: "16%",
          barColor: "#ef9f27",
          textColor: "#854f0b",
          icon: (
            <svg
              width="11"
              height="11"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#854F0B"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          ),
        },
      ].map(({ label, count, pct, barColor, textColor, icon }) => (
        <div key={label} className="mb-2">
          <div className="mb-[3px] flex items-center justify-between">
            <div className="flex items-center gap-[5px]">
              {icon}
              <span className="text-[11px] font-semibold">{label}</span>
            </div>
            <span
              className="text-[13px] font-extrabold"
              style={{ color: textColor }}
            >
              {count}
            </span>
          </div>
          <div className="h-[5px] w-full overflow-hidden rounded-[3px] bg-[#f0f4ff]">
            <div
              className="h-full rounded-[3px]"
              style={{ width: pct, background: barColor }}
            />
          </div>
        </div>
      ))}
      <div className="flex">
        {(
          [
            ["AK", "#1476ff"],
            ["BL", "#d85a30"],
            ["CX", "#1d9e75"],
            ["DM", "#d4537e"],
          ] as [string, string][]
        ).map(([i, c]) => (
          <Avatar key={i} initials={i} bg={c} />
        ))}
        <Avatar initials="+10" bg="#534ab7" fontSize={7} />
      </div>
    </div>
  );
}

// function BrandHiring({ hiringData }: { hiringData: { h: number; j: number } }) {
//   return (
//     <div className="rounded-[16px] border border-[#e0e8f8] bg-white px-4 py-[14px] w-[195px]">
//       <div className="mb-[5px] text-[10px] font-bold tracking-[0.06em] text-[#aaa]">
//         BRANDS HIRING NOW
//       </div>
//       <div className="mb-[7px] text-[21px] font-extrabold text-[#1476ff]">
//         {hiringData.h.toLocaleString()}
//       </div>
//       <div className="mb-2 flex">
//         {(
//           [
//             ["NK", "#1476ff"],
//             ["GY", "#1d9e75"],
//             ["OA", "#d85a30"],
//             ["MN", "#d4537e"],
//             ["FL", "#534ab7"],
//           ] as [string, string][]
//         ).map(([i, c]) => (
//           <Avatar key={i} initials={i} bg={c} />
//         ))}
//         <Avatar
//           initials={`+${Math.max(0, hiringData.h - 5)}`}
//           bg="#888"
//           fontSize={7}
//         />
//       </div>
//       <Pill type="b">
//         <PulseDot /> {hiringData.j} joined this week
//       </Pill>
//     </div>
//   );
// }
function BrandHiring({
  hiringData,
  hiringUsers = [],
  isLoading = false,
}: {
  hiringData: { h: number; j: number };
  hiringUsers?: { name: string }[];
  isLoading?: boolean;
}) {
  const avatarColors = [
    "#1476ff",
    "#1d9e75",
    "#d85a30",
    "#d4537e",
    "#534ab7",
  ];

  const visibleUsers = isLoading ? [] : hiringUsers.slice(0, 5);
  const extraCount = isLoading ? 0 : Math.max(0, hiringData.h - 5);

  return (
    <div className="rounded-[16px] border border-[#e0e8f8] bg-white px-4 py-[14px] w-[195px]">
      <div className="mb-[5px] text-[10px] font-bold tracking-[0.06em] text-[#aaa]">
        BRANDS HIRING NOW
      </div>

      {isLoading ? (
        <div className="flex flex-col items-start">
          {/* top small skeleton */}
          <div className="mb-[10px] h-[16px] w-[40px] rounded-[6px] bg-[#e6edf7] animate-pulse" />

          {/* 5 avatar skeletons */}
          <div className="flex">
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className="-mr-[6px] rounded-full border-2 border-white bg-[#e6edf7] animate-pulse w-7 h-7"
              />
            ))}
          </div>
        </div>
      ) : (
        <div className="mb-[7px] text-[21px] font-extrabold text-[#1476ff]">
          {hiringData.h.toLocaleString()}
        </div>
      )}

      <div className="mb-2 flex">
        {visibleUsers.map((user, index) => (
          <Avatar
            key={index}
            initials={getInitials(user.name)}
            bg={avatarColors[index % avatarColors.length]}
            fontSize={10}
          />
        ))}

        {extraCount > 0 && (
          <Avatar initials={`+${extraCount}`} bg="#888" fontSize={7} />
        )}
      </div>

      {isLoading ? (
        <div className="flex items-center gap-2 rounded-full bg-[#e6edf7] px-3 py-[6px] animate-pulse">
          {/* dot skeleton */}
        </div>
      ) : (
        <Pill type="b">
          <PulseDot /> {hiringData.j} joined this week
        </Pill>
      )}
    </div>
  );
}
function CreatorMonthlyEarnings() {
  return (
    <div className="rounded-[16px] border-0 bg-[#13151c] px-4 py-[14px] w-[210px]">
      <div className="mb-[3px] text-[10px] font-bold uppercase tracking-[0.06em] text-[#444]">
        This month
      </div>
      <div className="mb-2.5 flex items-baseline gap-[7px]">
        <div className="text-[21px] font-extrabold tracking-[-0.02em] text-white">
          $78,420
        </div>
        <div className="text-[11px] font-bold text-[#4ade80]">↑ 18%</div>
      </div>
      <div className="mb-[7px] h-px bg-[#222530]" />
      {(
        [
          ["Week 4", "$26,330"],
          ["Week 3", "$14,050"],
          ["Week 2", "$21,840"],
          ["Week 1", "$16,200"],
        ] as [string, string][]
      ).map(([week, amt]) => (
        <div key={week}>
          <div className="my-[6px] mb-[2px] text-[9px] font-bold uppercase tracking-[0.06em] text-[#333]">
            {week}
          </div>
          <div className="flex items-center gap-[7px] border-b-[0.5px] border-[#1c1f2b] py-[4px]">
            <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#1d3a2a] text-[9px] font-bold text-[#4ade80]">
              C
            </div>
            <div>
              <div className="text-[11px] font-semibold text-[#e0e2ec]">
                Circl
              </div>
              <div className="text-[9px] text-[#444]">Creator Payout</div>
            </div>
            <div className="ml-auto text-[11px] font-bold text-[#4ade80]">
              +{amt}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function CreatorTopVideo({ cVideoIdx }: { cVideoIdx: number }) {
  const vid = CREATOR_VIDEOS[cVideoIdx];
  return (
    <div className="rounded-[16px] border border-[#e0e8f8] bg-white px-4 py-[14px] w-[205px]">
      <div className="mb-[5px] text-[10px] font-bold tracking-[0.06em] text-[#aaa]">
        YOUR TOP VIDEO
      </div>
      <div className="relative mb-2.5 h-[108px] w-full overflow-hidden rounded-[10px]">
        <div
          className="h-[108px] w-full transition-[background] duration-[600ms]"
          style={{ background: vid.bg }}
        />
        <div className="absolute left-[7px] top-[7px] rounded-full bg-[rgba(20,118,255,0.88)] px-[7px] py-[2px] text-[9px] font-bold text-white">
          {vid.badge}
        </div>
        <div className="absolute left-1/2 top-1/2 flex h-[26px] w-[26px] -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-[rgba(255,255,255,0.92)]">
          <svg width="9" height="9" viewBox="0 0 24 24" fill="#1476FF">
            <polygon points="5 3 19 12 5 21 5 3" />
          </svg>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-1">
        {(
          [
            ["EARNINGS", vid.e],
            ["HOOK RATE", vid.h],
            ["ROAS", vid.r],
          ] as [string, string][]
        ).map(([lbl, val]) => (
          <div key={lbl}>
            <div className="text-[9px] font-semibold text-[#aaa]">{lbl}</div>
            <div className="text-[13px] font-extrabold text-[#0d1a2d]">
              {val}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function CreatorBrandsHiring({
  hiringData,
}: {
  hiringData: { h: number; j: number };
}) {
  return (
    <div className="rounded-[16px] border border-[#e0e8f8] bg-white px-4 py-[14px] w-[195px]">
      <div className="mb-[5px] text-[10px] font-bold tracking-[0.06em] text-[#aaa]">
        BRANDS HIRING NOW
      </div>
      <div className="mb-[7px] text-[21px] font-extrabold text-[#1476ff]">
        {hiringData.h.toLocaleString()}
      </div>
      <div className="mb-2 flex">
        {(
          [
            ["NK", "#1476ff"],
            ["GY", "#1d9e75"],
            ["OA", "#d85a30"],
            ["MN", "#d4537e"],
            ["FL", "#534ab7"],
          ] as [string, string][]
        ).map(([i, c]) => (
          <Avatar key={i} initials={i} bg={c} />
        ))}
        <Avatar
          initials={`+${Math.max(0, hiringData.h - 5)}`}
          bg="#888"
          fontSize={7}
        />
      </div>
      <Pill type="b">
        <PulseDot /> {hiringData.j} joined this week
      </Pill>
    </div>
  );
}

function CreatorTotalPayout({ totalPayout }: { totalPayout: number }) {
  return (
    <div className="rounded-[16px] border border-[#e0e8f8] bg-white px-4 py-[14px] w-[212px]">
      <div className="mb-[5px] text-[10px] font-bold tracking-[0.06em] text-[#aaa]">
        TOTAL PAID TO CREATORS
      </div>
      <div className="my-[4px] text-[20px] font-extrabold tracking-[-0.02em] text-[#0d1a2d] tabular-nums">
        ${Math.round(totalPayout).toLocaleString("en-US")}
      </div>
      <div className="mt-1 flex items-center gap-[5px]">
        <PulseDot />
        <span className="text-[10px] font-semibold text-[#1d9e75]">
          Live — updating now
        </span>
      </div>
      <div className="mt-[3px] text-[10px] text-[#666]">
        +$5M paid out every month
      </div>
    </div>
  );
}

function CreatorAvgGMV() {
  return (
    <div className="rounded-[16px] border border-[#e0e8f8] bg-white px-4 py-[14px] w-[188px]">
      <div className="mb-[5px] text-[10px] font-bold tracking-[0.06em] text-[#aaa]">
        AVG MONTHLY GMV
      </div>
      <div className="mb-[2px] flex items-baseline gap-[5px]">
        <div className="text-[21px] font-extrabold text-[#0d1a2d]">$372k</div>
        <div className="text-[10px] text-[#aaa]">per creator</div>
      </div>
      <div className="my-[6px] flex h-8 items-end gap-[3px]">
        {([40, 55, 48, 68, 75, 88, 100] as number[]).map((h, i) => (
          <div
            key={i}
            className="flex-1 rounded-t-[2px]"
            style={{
              height: `${h}%`,
              background: h >= 75 ? "#1476ff" : h >= 68 ? "#85b7eb" : "#b5d4f4",
            }}
          />
        ))}
      </div>
      <Pill type="g">↑ 24% vs last month</Pill>
    </div>
  );
}

function HeroSideColumn({
  cards,
  align,
}: {
  cards: React.ReactNode[];
  align: "left" | "right";
}) {
  const rotations =
    align === "left"
      ? ["rotate-[-8deg]", "rotate-[3deg]", "rotate-[-2deg]"]
      : ["rotate-[4deg]", "rotate-[-3deg]", "rotate-[2deg]"];

  return (
    <div
      className={cn(
        "absolute flex flex-col",
        align === "left"
          ? "-left-8 items-start pl-2 gap-12"
          : "-right-8 items-end pr-2 gap-10",
      )}
    >
      {cards.map((card, i) => (
        <div key={i} className={cn("transition-transform", rotations[i] ?? "")}>
          {card}
        </div>
      ))}
    </div>
  );
}

function MobileCardsStrip({ cards }: { cards: React.ReactNode[] }) {
  const ref = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);

  useEffect(() => {
    if (ref.current) {
      setWidth(ref.current.scrollWidth / 2);
    }
  }, [cards]);

  return (
    <div className="relative w-full sm:w-[calc(100vw-48px)] mx-auto overflow-hidden">
      <motion.div
        ref={ref}
        className="flex gap-3"
        style={{ width: "max-content", willChange: "transform" }}
        animate={{ x: [0, -width] }}
        transition={{
          duration: 12,
          repeat: Infinity,
          ease: "linear",
        }}
      >
        {[...cards, ...cards].map((card, i) => (
          <div key={i} className="shrink-0">
            {card}
          </div>
        ))}
      </motion.div>
    </div>
  );
}

function StepsSection({ steps, mode }: { steps: Step[]; mode: Mode }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [paths, setPaths] = useState("");

  const drawPaths = useCallback(() => {
    if (!containerRef.current) return;
    const wrap = containerRef.current;
    const wR = wrap.getBoundingClientRect();
    // Only use dots that are actually visible in the DOM (not inside a `hidden` parent)
    const dots = Array.from(
      wrap.querySelectorAll<HTMLElement>(".step-dot-el"),
    ).filter(
      (el) => el.offsetParent !== null && el.getBoundingClientRect().width > 0,
    );
    if (dots.length < 2) {
      setPaths("");
      return;
    }
    let html = "";
    for (let i = 0; i < dots.length - 1; i++) {
      const a = dots[i].getBoundingClientRect();
      const b = dots[i + 1].getBoundingClientRect();
      const ax = a.left + a.width / 2 - wR.left;
      const ay = a.top + a.height / 2 - wR.top;
      const bx = b.left + b.width / 2 - wR.left;
      const by = b.top + b.height / 2 - wR.top;
      const sway = (bx - ax) * 0.6;
      const d = `M${ax},${ay} C${ax + sway},${ay + (by - ay) * 0.4} ${bx - sway},${by - (by - ay) * 0.4} ${bx},${by}`;
      html += `<path d="${d}" fill="none" stroke="${STEP_COLORS[i]}" stroke-width="2" stroke-dasharray="5 5" stroke-linecap="round" opacity="0.5"/>`;
    }
    setPaths(html);
  }, []);

  useEffect(() => {
    const t = setTimeout(drawPaths, 100);
    window.addEventListener("resize", drawPaths);
    return () => {
      clearTimeout(t);
      window.removeEventListener("resize", drawPaths);
    };
  }, [steps, drawPaths]);

  return (
    <div
      ref={containerRef}
      className="relative mx-auto max-w-[820px] overflow-hidden"
    >
      <svg
        className="pointer-events-none absolute left-0 top-0 h-full w-full"
        dangerouslySetInnerHTML={{ __html: paths }}
      />
      {steps.map((s, i) => {
        const flip = i % 2 === 1;
        const color = STEP_COLORS[i];
        const bg = STEP_BG[i];
        const border = STEP_BORDER[i];

        const dot = (
          <div
            className="step-dot-el flex h-[52px] w-[52px] shrink-0 items-center justify-center rounded-full"
            style={{ background: color, boxShadow: `0 0 0 8px ${bg}` }}
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#fff"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              dangerouslySetInnerHTML={{ __html: s.icon }}
            />
          </div>
        );

        const card = (
          <div
            className="w-full max-w-[330px] shrink-0 rounded-[18px] border-[1.5px] px-[24px] py-[22px]"
            style={{ background: bg, borderColor: border }}
          >
            <div
              className="mb-[7px] text-[11px] font-bold tracking-[0.08em]"
              style={{ color }}
            >
              {s.num}
            </div>
            <div className="mb-[7px] text-[17px] font-bold leading-[1.25] text-[#0d1a2d]">
              {s.title}
            </div>
            <div className="mb-[13px] text-[13px] leading-[1.6] text-[#6b7a99]">
              {s.desc}
            </div>
            <div
              className="inline-flex items-center gap-[5px] rounded-[8px] border bg-white px-[10px] py-[5px] text-[12px] font-semibold"
              style={{ borderColor: border, color }}
            >
              <svg
                width="10"
                height="10"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="20 6 9 17 4 12" />
              </svg>
              {s.chip}
            </div>
          </div>
        );

        return (
          <div
            key={`${mode}-${i}`}
            className="relative z-[2] flex items-center py-[40px] md:py-[60px]"
          >
            {/* Mobile: always dot left, card right — same center layout */}
            <div className="flex w-full flex-col items-center gap-6 md:hidden">
              {dot}
              <div className="w-full px-4">{card}</div>
            </div>

            {/* Desktop: alternate */}
            {flip ? (
              <>
                <div className="hidden w-1/2 justify-center pr-[40px] md:flex">
                  {dot}
                </div>
                <div className="hidden w-1/2 justify-center pl-[40px] md:flex">
                  {card}
                </div>
              </>
            ) : (
              <>
                <div className="hidden w-1/2 justify-center pr-[40px] md:flex">
                  {card}
                </div>
                <div className="hidden w-1/2 justify-center pl-[40px] md:flex">
                  {dot}
                </div>
              </>
            )}
          </div>
        );
      })}
    </div>
  );
}

function AnimatedNumber({ value }: { value: number }) {
  const motionVal = useMotionValue(value);
  const rounded = useTransform(motionVal, (v) =>
    Math.round(v).toLocaleString(),
  );

  useEffect(() => {
    const controls = animate(motionVal, value, {
      duration: 1.4,
      ease: [0.16, 1, 0.3, 1],
    });
    return controls.stop;
  }, [value, motionVal]);

  return <motion.span>{rounded}</motion.span>;
}

function DashboardMock() {
  const navItems = [
    {
      label: "Dashboard",
      active: false,
      icon: '<rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/>',
    },
    {
      label: "Submissions",
      active: false,
      icon: '<polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>',
    },
    {
      label: "Analytics",
      active: true,
      icon: '<line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/>',
    },
    {
      label: "Creators",
      active: false,
      icon: '<circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.5-7 8-7s8 3 8 7"/>',
    },
    {
      label: "Finance",
      active: false,
      icon: '<circle cx="12" cy="12" r="9"/><line x1="12" y1="8" x2="12" y2="12"/>',
    },
  ];

  // ── Dynamic stat counters ──────────────────────────────────────────────────
  const [stats, setStats] = useState({
    totalCreators: 11492,
    activeCreators: 12237,
    submissions: 12235,
    approved: 12165,
  });
  const [creatorData, setCreatorData] = useState([
    { month: "Jan", total: 2200, active: 1200 },
    { month: "Feb", total: 1100, active: 1700 },
    { month: "Mar", total: 1400, active: 2200 },
    { month: "Apr", total: 3000, active: 2500 },
    { month: "May", total: 2400, active: 2000 },
    { month: "Jun", total: 5000, active: 5600 },
  ]);
  useEffect(() => {
    const id = setInterval(() => {
      setStats((s) => ({
        totalCreators: s.totalCreators + Math.floor(Math.random() * 3),
        activeCreators: s.activeCreators + Math.floor(Math.random() * 4),
        submissions: s.submissions + Math.floor(Math.random() * 5),
        approved: s.approved + Math.floor(Math.random() * 4),
      }));
    }, 2400);
    return () => clearInterval(id);
  }, []);
  const INIT_BARS = [
    860, 700, 555, 680, 790, 1000, 850, 950, 880, 920, 780, 840,
  ];
  const [bars, setBars] = useState<number[]>([]);
  const [hasMounted, setHasMounted] = useState(false);
  const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];
  useEffect(() => {
    setBars(INIT_BARS);
  }, []);
  useEffect(() => {
    setHasMounted(true);
  }, []);
  const chartData = useMemo(
    () =>
      bars.map((value, index) => ({
        name: months[index],
        value,
      })),
    [bars],
  );
  useEffect(() => {
    const id = setInterval(() => {
      setBars((prev) =>
        prev.map((v, i) => {
          const delta = Math.floor(Math.random() * 200) - 100;

          return Math.max(300, v + delta);
        }),
      );
    }, 2000);

    return () => clearInterval(id);
  }, []);
  useEffect(() => {
    const id = setInterval(() => {
      setCreatorData((prev) =>
        prev.map((item) => {
          const variation = Math.floor(Math.random() * 800) - 400;

          return {
            ...item,
            total: Math.max(3000, item.total + variation),
            active: Math.max(1200, item.active + variation * 2),
          };
        }),
      );
    }, 2000);

    return () => clearInterval(id);
  }, []);
  // ── GMV trend line — grows rightward with slight wiggle ───────────────────
  const INIT_GMV = [48, 42, 34, 28, 20, 14, 9, 4, 1];
  const [gmvPoints, setGmvPoints] = useState(INIT_GMV);

  useEffect(() => {
    const id = setInterval(() => {
      setGmvPoints((prev) => {
        const next = [...prev];
        next.shift();
        const last = next[next.length - 1];
        const newY = Math.max(
          1,
          last - Math.floor(Math.random() * 4) + Math.floor(Math.random() * 2),
        );
        next.push(newY);
        return next;
      });
    }, 2000);
    return () => clearInterval(id);
  }, []);

  const gmvPolyline = gmvPoints
    .map((y, i) => `${(i / (gmvPoints.length - 1)) * 200},${y}`)
    .join(" ");
  const gmvEndY = gmvPoints[gmvPoints.length - 1];

  return (
    <div className="mt-11 overflow-hidden rounded-[16px] border border-[#E2E0DB] bg-white">
      {/* Topbar */}
      <div className="flex items-center gap-[14px] border-b border-[#E8E6E1] bg-white px-[14px] py-[11px] sm:px-[18px]">
        <div className="text-[13px] font-bold tracking-[0.05em]">CIRCL</div>
        <div className="text-[12px] text-[#aaa]">/ Brand portal</div>
        <div className="ml-auto flex items-center gap-1.5 text-[12px] text-[#888]">
          <div className="flex h-[22px] w-[22px] items-center justify-center rounded-full bg-[#1476FF] text-[9px] font-bold text-white">
            RF
          </div>
          <span className="hidden sm:inline">Robert Fox</span>
        </div>
      </div>

      <div className="flex">
        {/* Sidebar — hidden on small screens */}
        <div className="hidden w-[148px] shrink-0 border-r border-[#E8E6E1] px-[10px] py-[12px] sm:block">
          <div className="mb-[6px] px-[8px] py-[6px] text-[10px] text-[#ccc]">
            MAIN
          </div>
          {navItems.map(({ label, active, icon }) => (
            <div
              key={label}
              className={cn(
                "mb-[2px] flex cursor-pointer items-center gap-[7px] rounded-[7px] px-[8px] py-[6px] text-[12px]",
                active
                  ? "bg-[#EEF4FF] font-semibold text-[#1476FF]"
                  : "font-normal text-[#aaa]",
              )}
            >
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke={active ? "#1476FF" : "#AAA"}
                strokeWidth="2"
                dangerouslySetInnerHTML={{ __html: icon }}
              />
              {label}
            </div>
          ))}
        </div>

        {/* Main content */}
        <div className="min-w-0 flex-1 px-[12px] py-[14px] sm:px-[18px] sm:py-[16px]">
          <div className="mb-3 text-[13px] font-semibold sm:text-[14px]">
            Creator overview
          </div>

          {/* Stats grid */}
          <div className="mb-[14px] grid grid-cols-2 gap-2 md:grid-cols-4">
            {(
              [
                ["Total creators", stats.totalCreators, "↑ 12%"],
                ["Active creators", stats.activeCreators, "↑ 8%"],
                ["Submissions", stats.submissions, "↑ 31%"],
                ["Approved", stats.approved, "↑ 29%"],
              ] as [string, number, string][]
            ).map(([lbl, val, ch]) => (
              <div
                key={lbl}
                className="rounded-[9px] bg-[#F7F6F3] px-3 py-[10px]"
              >
                <div className="mb-[3px] text-[9px] text-[#aaa] sm:text-[10px]">
                  {lbl}
                </div>
                <div className="text-[15px] font-bold tabular-nums text-[#1A1A1A] sm:text-[18px]">
                  <AnimatedNumber value={val} />
                </div>
                <div className="mt-[2px] text-[10px] text-[#1D9E75]">{ch}</div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 gap-[10px] sm:grid-cols-2">
            {/* Bar chart */}
            <div className="rounded-[9px] bg-[#F7F6F3] p-3">
              <div className="mb-2 text-[11px] font-semibold text-[#888]">
                Submissions per month
              </div>

              <div className="h-[180px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      vertical={false}
                      stroke="#E5EAF2"
                    />

                    <XAxis
                      dataKey="name"
                      tick={{ fontSize: 10, fill: "#888" }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fontSize: 10, fill: "#888" }}
                      axisLine={false}
                      tickLine={false}
                      width={25}
                    />

                    <Bar
                      dataKey="value"
                      radius={[3, 3, 0, 0]}
                      isAnimationActive={false}
                      animationDuration={900}
                    >
                      {chartData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={
                            index >= chartData.length - 4
                              ? "#1476FF"
                              : "#B5D4F4"
                          }
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div className="rounded-[9px] bg-[#F7F6F3] p-3">
              <div className="mb-2 text-[11px] font-semibold text-[#888]">
                Creator Growth
              </div>

              <div className="h-[180px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={creatorData}>
                    {/* GRID */}
                    <CartesianGrid
                      strokeDasharray="3 3"
                      vertical={false}
                      stroke="#E5EAF2"
                    />

                    {/* X AXIS */}
                    <XAxis
                      dataKey="month"
                      tick={{ fontSize: 10, fill: "#888" }}
                      axisLine={false}
                      tickLine={false}
                    />

                    {/* Y AXIS */}
                    <YAxis
                      tick={{ fontSize: 10, fill: "#888" }}
                      axisLine={false}
                      tickLine={false}
                      width={30}
                    />

                    <Tooltip />
                    <Line
                      type="natural"
                      dataKey="total"
                      stroke="#1476FF"
                      strokeWidth={2}
                      connectNulls={true}
                    // dot={{ r: 3 }}
                    />
                    <Line
                      type="natural"
                      dataKey="active"
                      stroke="#1D9E75"
                      strokeWidth={2}
                      connectNulls={true}
                    // dot={{ r: 3 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function HomePage({ isLoggedIn = false }: HomePageProps) {
  const [mode, setMode] = useState<Mode>("brand");
  const [bVideoIdx, setBVideoIdx] = useState(0);
  const [cVideoIdx, setCVideoIdx] = useState(0);
  const [bCreatorCount, setBCreatorCount] = useState(847);
  const [totalPayout, setTotalPayout] = useState(22432650);
  const [hiringData, setHiringData] = useState({ h: 362, j: 84 });
  const [hiringUsers, setHiringUsers] = useState<{ name: string }[]>([]);
  const [isHiringLoading, setIsHiringLoading] = useState(true);

  // useEffect(() => {
  //   const launchDate = new Date("2026-04-07T00:00:00Z");
  //   const weeks = Math.floor(
  //     (Date.now() - launchDate.getTime()) / (7 * 24 * 60 * 60 * 1000),
  //   );
  //   const h = 362 + weeks * 4;
  //   const j = Math.min(
  //     174,
  //     Math.max(30, 30 + Math.round((Math.sin(weeks * 2.4) + 1) * 72)),
  //   );
  //   setHiringData({ h, j });
  // }, []);
  useEffect(() => {
    let isMounted = true;

    const fetchHiringData = async () => {
      const supabase = createClient();

      try {
        setIsHiringLoading(true); // ✅ start loading

        const { data: campaigns, error: campaignError } = await supabase
          .from("campaigns")
          .select("brand_id")
          .eq("status", "open");

        if (campaignError) throw campaignError;

        const brandIds = [...new Set(campaigns?.map((c) => c.brand_id))];

        const { data: profiles, error: profileError } = await supabase
          .from("public_profiles")
          .select("id, display_name, full_name, company_name")
          .in("id", brandIds);

        if (profileError) throw profileError;

        const brands =
          profiles?.map((p) => ({
            id: p.id,
            name:
              p.display_name ||
              p.company_name ||
              p.full_name ||
              "NA",
          })) || [];

        if (!isMounted) return;

        setHiringData({
          h: brandIds.length,
          j: 0,
        });

        setHiringUsers(brands);
      } catch (err) {
        console.error(err);

        if (!isMounted) return;

        setHiringData({ h: 0, j: 0 });
        setHiringUsers([]);
      } finally {
        if (isMounted) setIsHiringLoading(false);
      }
    };

    fetchHiringData();

    return () => {
      isMounted = false;
    };
  }, []);
  useEffect(() => {
    const id = setInterval(() => setBVideoIdx((v) => (v + 1) % 3), 3000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const id = setInterval(() => setCVideoIdx((v) => (v + 1) % 3), 3000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const id = setInterval(() => {
      const add = Math.floor(Math.random() * 3); // 0, 1, or 2
      if (add > 0) {
        setBCreatorCount((c) => c + add);
      }
    }, 2200);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const perTick = (5_000_000 / (30 * 24 * 3600)) * 0.1;
    const id = setInterval(() => setTotalPayout((p) => p + perTick), 100);
    return () => clearInterval(id);
  }, []);

  const brandLeft = [
    <BrandSampleRequest key="brand-sample-request" />,
    <BrandVideoStatus key="brand-video-status" />,
    <BrandActiveCreators
      key="brand-active-creators"
      bCreatorCount={bCreatorCount}
    />,
  ];

  const brandRight = [
    <BrandTopPerformer key="brand-top-performer" bVideoIdx={bVideoIdx} />,
    <BrandHiring
      key="brand-hiring"
      hiringData={hiringData}
      hiringUsers={hiringUsers}
      isLoading={isHiringLoading}
    />,
    <BrandMetaAdSpend key="brand-meta-ad-spend" />,
  ];

  const creatorLeft = [
    <CreatorMonthlyEarnings key="creator-monthly-earnings" />,
    <CreatorTotalPayout key="creator-total-payout" totalPayout={totalPayout} />,
  ];

  const creatorRight = [
    <CreatorTopVideo key="creator-top-video" cVideoIdx={cVideoIdx} />,
    <CreatorBrandsHiring key="creator-brands-hiring" hiringData={hiringData} />,
    <CreatorAvgGMV key="creator-avg-gmv" />,
  ];

  const leftCards = mode === "brand" ? brandLeft : creatorLeft;
  const rightCards = mode === "brand" ? brandRight : creatorRight;
  const allCards = [...leftCards, ...rightCards];

  const ctaHref = isLoggedIn
    ? "/dashboard"
    : mode === "brand"
      ? "/signup"
      : "/signup/creator";

  const content = {
    brand: {
      h1: (
        <>
          Turn UGC into
          <br />
          <em className="not-italic text-[#1476ff]">real revenue</em>
        </>
      ),
      p: "Circl connects your brand with top creators, automates payouts, and tracks every video — so you know exactly what's working.",
      btn: "Add my brand",
      sh2: "From signup to revenue in 5 steps",
      ss: "Everything you need to run a high-performing UGC program — without the chaos.",
      ch: "Ready to scale your UGC?",
      cp: "Join 500+ brands already using Circl to grow with creators.",
      cb: "Add my brand",
      steps: BRAND_STEPS,
    },
    creator: {
      h1: (
        <>
          Turn your content into
          <br />
          <em className="not-italic text-[#1476ff]">real income</em>
        </>
      ),
      p: "Circl connects you with top brands, handles contracts and payouts, and shows you exactly which videos are earning most.",
      btn: "Become a creator",
      sh2: "Start earning in 5 simple steps",
      ss: "No agents, no chasing invoices. Just create, submit, and get paid.",
      ch: "Ready to start earning?",
      cp: "Join 10,000+ creators already earning on Circl.",
      cb: "Join as a creator",
      steps: CREATOR_STEPS,
    },
  };

  const c = content[mode];
  async function fetchTotalPayout() {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("campaign_payouts")
      .select("creator_amount");

    if (error) {
      console.error(error);
      return;
    }
    console.log("dataaaa______", data);
    const total = data.reduce((sum, row) => sum + (row.creator_amount || 0), 0);

    setTotalPayout(total);
  }
  useEffect(() => {
    fetchTotalPayout();
  }, []);
  return (
    <>
      <div
        className="min-h-screen overflow-x-hidden bg-white text-[#1a1a1a]"
        suppressHydrationWarning
        style={{ fontFamily: "'DM Sans', sans-serif" }}
      >
        <PageTransition>
          <main>
            {/* ── Hero ── */}
            <div className="min-h-screen sm:p-[24px]">
              <section className="relative min-h-[calc(100vh-24px)] border border-[#dbe6fb] bg-gradient-to-br from-[#eef4ff] to-[#e6f0ff] py-[56px] flex items-center justify-center sm:min-h-[calc(100vh-48px)] sm:rounded-[28px] sm:py-[72px] lg:px-[80px]">
                <div>
                  <BrandMark
                    href="/"
                    tone="light"
                    className="absolute top-[16px] left-8"
                  />
                  <Link
                    href="/login"
                    className="absolute top-[16px] text-blue-600 right-[16px] text-[12px] font-medium bg-white border border-[#d8e4f8] rounded-full px-[14px] py-[7px] hover:bg-[#f7faff] transition-colors z-10 shadow-sm sm:top-[22px] sm:right-[28px] sm:text-[13px] sm:px-[18px] sm:py-[8px]"
                  >
                    Sign in
                  </Link>
                </div>

                {/* ── Mobile / Tablet layout: stacked ── */}
                <div className="flex w-full flex-col items-center gap-8 lg:hidden mt-8 sm:mt-0 ">
                  {/* Toggle */}
                  <div className="flex rounded-full bg-white/70 backdrop-blur border border-[#d0dcf5] p-1 shadow-sm">
                    {(["brand", "creator"] as Mode[]).map((m) => (
                      <button
                        key={m}
                        onClick={() => setMode(m)}
                        className={cn(
                          "cursor-pointer rounded-full px-[22px] py-[10px] text-[14px] font-bold transition-all duration-[200ms]",
                          mode === m
                            ? "bg-[#1476ff] text-white shadow"
                            : "bg-transparent text-[#888]",
                        )}
                      >
                        {m === "brand" ? "I'm a Brand" : "I'm a Creator"}
                      </button>
                    ))}
                  </div>

                  {/* Hero copy */}
                  <FadeIn className="w-full max-w-[500px] text-center">
                    <h1 className="mb-[14px] text-[38px] font-extrabold leading-[1.06] tracking-[-0.03em] text-[#0d1a2d] sm:text-[48px]">
                      {c.h1}
                    </h1>
                    <p className="text-[15px] text-[#6b7a99] leading-[1.65] mb-7 sm:text-[17px]">
                      {c.p}
                    </p>
                    <Link
                      href={ctaHref}
                      className="inline-block text-[14px] lg:text-lg font-bold lg:font-extrabold bg-[#1476ff] text-black bg-white px-[34px] py-[14px] rounded-[2rem] hover:bg-[#0e62db] hover:text-white transition-colors shadow-md capitalize"
                    >
                      {c.btn}
                    </Link>
                  </FadeIn>

                  {/* Scrollable cards strip */}
                  <MobileCardsStrip cards={allCards} />
                </div>

                {/* ── Desktop layout: 3-col grid ── */}
                <div className="hidden w-full grid-cols-3 items-center gap-4 lg:grid lg:grid-cols-1">
                  {/* LEFT SIDE */}
                  <HeroSideColumn cards={leftCards} align="left" />

                  {/* CENTER */}
                  <div className="flex flex-col items-center text-center px-[20px]">
                    {/* Toggle */}
                    <div className="mb-9 flex rounded-full bg-white/70 backdrop-blur border border-[#d0dcf5] p-1 shadow-sm">
                      {(["brand", "creator"] as Mode[]).map((m) => (
                        <button
                          key={m}
                          onClick={() => setMode(m)}
                          className={cn(
                            "cursor-pointer rounded-full px-[30px] py-[11px] text-[15px] font-bold transition-all duration-[200ms]",
                            mode === m
                              ? "bg-[#1476ff] text-white shadow"
                              : "bg-transparent text-[#888]",
                          )}
                        >
                          {m === "brand" ? "I'm a Brand" : "I'm a Creator"}
                        </button>
                      ))}
                    </div>

                    <FadeIn className="max-w-[560px]">
                      <h1 className="mb-[14px] text-[52px] lg:text-[72px] font-extrabold leading-[1.06] tracking-[-0.03em] text-[#0d1a2d]">
                        {c.h1}
                      </h1>
                      <p className="text-[17px] text-[#6b7a99] leading-[1.65] mb-7">
                        {c.p}
                      </p>
                      <Link
                        href={ctaHref}
                        className="inline-block text-[14px] lg:text-lg font-bold lg:font-extrabold bg-[#1476ff] text-black bg-white px-[34px] py-[14px] rounded-[2rem] hover:bg-[#0e62db] hover:text-white transition-colors shadow-md capitalize"
                      >
                        {c.btn}
                      </Link>
                    </FadeIn>
                  </div>

                  {/* RIGHT SIDE */}
                  <HeroSideColumn cards={rightCards} align="right" />
                </div>
              </section>
            </div>

            {/* ── How it works ── */}
            <section className="py-16 px-5 bg-white sm:py-24 sm:px-12">
              <FadeIn>
                <div className="text-[11px] font-bold tracking-[0.1em] text-[#1476ff] uppercase text-center mb-[10px]">
                  How it works
                </div>
                <h2 className="text-[28px] font-extrabold tracking-[-0.025em] text-center text-[#0d1a2d] mb-[10px] sm:text-[38px]">
                  {c.sh2}
                </h2>
                <p className="text-[15px] text-[#888] text-center mb-[48px] sm:mb-[72px] sm:text-[16px]">
                  {c.ss}
                </p>
              </FadeIn>
              <StepsSection steps={c.steps} mode={mode} />
            </section>

            {/* ── Dashboard ── */}
            <section className="bg-[#f7f6f3] px-5 py-14 sm:px-12 sm:py-20">
              <div className="max-w-[900px] mx-auto">
                <FadeIn>
                  <div className="text-[11px] font-bold tracking-[0.1em] text-[#1476ff] uppercase text-center mb-[10px]">
                    Dashboard
                  </div>
                  <h2 className="text-[28px] font-extrabold tracking-[-0.025em] text-center text-[#0d1a2d] mb-[10px] sm:text-[38px]">
                    Full visibility, zero guesswork
                  </h2>
                  <p className="text-[15px] text-[#888] text-center sm:text-[16px]">
                    See every creator, every video, every dollar — in one clean
                    view.
                  </p>
                </FadeIn>
                <FadeIn>
                  {/* Wrap in scrollable container on mobile so dashboard doesn't break layout */}
                  <div className="overflow-x-auto">
                    <div className=" sm:min-w-[480px] sm:min-w-0">
                      <DashboardMock />
                    </div>
                  </div>
                </FadeIn>
              </div>
            </section>

            {/* ── CTA ── */}
            <section className="bg-[#eef4ff] px-5 py-16 text-center sm:px-12 sm:py-20">
              <FadeIn>
                <h2 className="text-[28px] font-extrabold tracking-[-0.025em] text-[#0d1a2d] mb-3 sm:text-[36px]">
                  {c.ch}
                </h2>
                <p className="text-[15px] text-[#6b7a99] mb-7 sm:text-[16px]">
                  {c.cp}
                </p>
                <Link
                  href={ctaHref}
                  className="inline-block text-[15px] font-bold bg-[#1476ff] text-white px-9 py-[14px] rounded-[12px] hover:bg-[#0e62db] transition-colors"
                >
                  {c.cb}
                </Link>
              </FadeIn>
            </section>

            {/* Footer */}
            <footer className="pt-16 pb-8 text-center text-[11px] text-[#47C2FF]">
              © 2024 Circl Inc. All Rights Reserved.
            </footer>
          </main>
        </PageTransition>
      </div>
    </>
  );
}

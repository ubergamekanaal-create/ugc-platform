import type { JSX } from "react";
import type { CreatorWorkspaceSection } from "@/lib/creator-workspace";
import type { IconProps } from "./types";

export const sectionIcons: Record<
  CreatorWorkspaceSection,
  (props: IconProps) => JSX.Element
> = {
  home: HomeIcon,
  "my-brands": MyBrandsIcon,
  chat: ChatIcon,
  payouts: PayoutsIcon,
  profile: ProfileIcon,
};

export function HomeIcon({ className }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      className={className}
    >
      <path d="M4 13.5 12 5l8 8.5" />
      <path d="M6.5 11.5V20h11V11.5" />
    </svg>
  );
}

export function MyBrandsIcon({ className }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      className={className}
    >
      <path d="m4 12 4-3 4 3 4-3 4 3" />
      <path d="M4 15c1.4 1.3 2.7 2 4 2s2.6-.7 4-2c1.4 1.3 2.7 2 4 2s2.6-.7 4-2" />
    </svg>
  );
}

export function ChatIcon({ className }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      className={className}
    >
      <path d="M8 18 4 20v-4.5A8 8 0 1 1 12 20h-1" />
      <path d="M8 10h8M8 14h5" />
    </svg>
  );
}

export function PayoutsIcon({ className }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      className={className}
    >
      <path d="M12 4v16" />
      <path d="M16 7.5c0-1.7-1.8-3-4-3s-4 1.3-4 3 1.8 3 4 3 4 1.3 4 3-1.8 3-4 3-4-1.3-4-3" />
    </svg>
  );
}

export function ProfileIcon({ className }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      className={className}
    >
      <circle cx="12" cy="8" r="3.5" />
      <path d="M5 20a7 7 0 0 1 14 0" />
    </svg>
  );
}

export function CameraIcon({ className }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      className={className}
    >
      <path d="M5 8h3l1.2-2h5.6L16 8h3v9H5Z" />
      <circle cx="12" cy="12.5" r="3" />
    </svg>
  );
}


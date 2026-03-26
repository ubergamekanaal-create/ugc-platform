import { BackgroundOrbs } from "@/components/shared/background-orbs";
import { Skeleton } from "@/components/shared/skeleton";

export default function Loading() {
  return (
    <div className="relative min-h-screen bg-background">
      <BackgroundOrbs />
      <div className="relative z-10 mx-auto flex w-full max-w-7xl flex-col gap-6 px-5 py-10 sm:px-6 lg:px-8">
        <Skeleton className="h-14 w-48" />
        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <Skeleton className="h-[420px] w-full" />
          <Skeleton className="h-[420px] w-full" />
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-40 w-full" />
        </div>
      </div>
    </div>
  );
}

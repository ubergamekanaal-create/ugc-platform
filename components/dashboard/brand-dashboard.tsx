// import { BrandWorkspace } from "@/components/dashboard/brand-workspace";
// import type { BrandDashboardData, UserProfile } from "@/lib/types";

// type BrandDashboardProps = {
//   profile: UserProfile & { role: "brand" };
//   data: BrandDashboardData;
// };

// export function BrandDashboard({ profile, data }: BrandDashboardProps) {
//   return <BrandWorkspace profile={profile} data={data} section="dashboard" brands={brands} />;
// }


"use client";

import { useEffect, useState } from "react";

import { BrandWorkspace } from "@/components/dashboard/brand-workspace";

import type {
  BrandDashboardData,
  UserProfile,
} from "@/lib/types";

type BrandDashboardProps = {
  profile: UserProfile & {
    role: "brand";
  };
  data: BrandDashboardData;
};

export function BrandDashboard({
  profile,
  data,
}: BrandDashboardProps) {
  // const [brands, setBrands] = useState<
  //   any[]
  // >([]);

  // useEffect(() => {
  //   const fetchBrands = async () => {
  //     try {
  //       const res = await fetch(
  //         "/api/brands/my-brands"
  //       );

  //       const result =
  //         await res.json();

  //       setBrands(
  //         result.data || []
  //       );
  //     } catch (error) {
  //       console.error(error);
  //     }
  //   };

  //   fetchBrands();
  // }, []);

  return (
    <BrandWorkspace
      profile={profile}
      data={data}
      section="dashboard"
    />
  );
}
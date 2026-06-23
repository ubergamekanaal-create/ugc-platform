// "use client";

// import { useRouter, useSearchParams } from "next/navigation";
// import Link from "next/link";

// export default function CreatorsAnalyticsFilters({
//     filters,
//     filterOptions,
// }: any) {
//     const router = useRouter();
//     const searchParams = useSearchParams();

//     const updateFilter = (
//         key: string,
//         value: string
//     ) => {
//         const params = new URLSearchParams(
//             searchParams.toString()
//         );

//         if (value === "all") {
//             params.delete(key);
//         } else {
//             params.set(key, value);
//         }

//         router.push(
//             `/dashboard/analytics/creators?${params.toString()}`
//         );
//     };

//     return (
//         <div className="flex flex-wrap gap-3">

//             {/* Range */}
//             <select
//                 value={filters.range}
//                 onChange={(e) =>
//                     updateFilter(
//                         "range",
//                         e.target.value
//                     )
//                 }
//                 className="h-10 rounded-full border border-slate-200 bg-white px-4 text-sm font-medium text-slate-600 shadow-[0_8px_20px_rgba(15,23,42,0.04)] outline-none transition focus:border-accent/40"
//             >
//                 <option value="30d">
//                     Last 30 days
//                 </option>

//                 <option value="90d">
//                     Last 90 days
//                 </option>

//                 <option value="365d">
//                     Last 12 months
//                 </option>

//                 <option value="all">
//                     All time
//                 </option>
//             </select>

//             {/* Creator */}
//             <select
//                 value={filters.creator}
//                 onChange={(e) =>
//                     updateFilter(
//                         "creator",
//                         e.target.value
//                     )
//                 }
//                 className="h-10 rounded-full border border-slate-200 bg-white px-4 text-sm font-medium text-slate-600 shadow-[0_8px_20px_rgba(15,23,42,0.04)] outline-none transition focus:border-accent/40"
//             >
//                 <option value="all">
//                     All creators
//                 </option>

//                 {filterOptions.creators.map(
//                     (creator: any) => (
//                         <option
//                             key={creator.value}
//                             value={creator.value}
//                         >
//                             {creator.label}
//                         </option>
//                     )
//                 )}
//             </select>

//             {/* Product */}
//             <select
//                 value={filters.product}
//                 onChange={(e) =>
//                     updateFilter(
//                         "product",
//                         e.target.value
//                     )
//                 }
//                 className="h-10 rounded-full border border-slate-200 bg-white px-4 text-sm font-medium text-slate-600 shadow-[0_8px_20px_rgba(15,23,42,0.04)] outline-none transition focus:border-accent/40"
//             >
//                 <option value="all">
//                     All products
//                 </option>

//                 {filterOptions.products.map(
//                     (product: string) => (
//                         <option
//                             key={product}
//                             value={product}
//                         >
//                             {product}
//                         </option>
//                     )
//                 )}
//             </select>

//             {/* Campaign */}
//             <select
//                 value={filters.campaign}
//                 onChange={(e) =>
//                     updateFilter(
//                         "campaign",
//                         e.target.value
//                     )
//                 }
//                 className="h-10 rounded-full border border-slate-200 bg-white px-4 text-sm font-medium text-slate-600 shadow-[0_8px_20px_rgba(15,23,42,0.04)] outline-none transition focus:border-accent/40"
//             >
//                 <option value="all">
//                     All campaigns
//                 </option>

//                 {filterOptions.campaigns.map(
//                     (campaign: any) => (
//                         <option
//                             key={campaign.value}
//                             value={campaign.value}
//                         >
//                             {campaign.label}
//                         </option>
//                     )
//                 )}
//             </select>

//             {/* Reset */}
//             <Link
//                 href="/dashboard/analytics/creators"
//                 className="inline-flex h-10 items-center justify-center rounded-full border border-slate-200 bg-white px-4 text-sm font-medium text-slate-600 shadow-[0_8px_20px_rgba(15,23,42,0.04)] transition hover:border-slate-300 hover:bg-slate-50"
//             >
//                 Reset
//             </Link>

//         </div>
//     );
// }



"use client";

import Link from "next/link";

export default function CreatorsAnalyticsFilters({
    filters,
    setFilters,
    filterOptions,
}: any) {
    const updateFilter = (
        key: string,
        value: string
    ) => {
        setFilters((prev: any) => ({
            ...prev,
            [key]: value,
        }));
    };

    const resetFilters = () => {
        setFilters({
            range: "all",
            creator: "all",
            product: "all",
            campaign: "all",
        });
    };

    return (
        <div className="flex flex-wrap gap-3">

            <select
                value={filters.range}
                onChange={(e) =>
                    updateFilter(
                        "range",
                        e.target.value
                    )
                }
                className="h-10 rounded-full border border-slate-200 bg-white px-4 text-sm font-medium text-slate-600 shadow-[0_8px_20px_rgba(15,23,42,0.04)] outline-none transition focus:border-accent/40"
            >
                <option value="30d">
                    Last 30 days
                </option>

                <option value="90d">
                    Last 90 days
                </option>

                <option value="365d">
                    Last 12 months
                </option>

                <option value="all">
                    All time
                </option>
            </select>


            <select
                value={filters.creator}
                onChange={(e) =>
                    updateFilter(
                        "creator",
                        e.target.value
                    )
                }
                className="h-10 rounded-full border border-slate-200 bg-white px-4 text-sm font-medium text-slate-600 shadow-[0_8px_20px_rgba(15,23,42,0.04)]"
            >
                <option value="all">
                    All creators
                </option>

                {filterOptions.creators.map(
                    (creator: any) => (
                        <option
                            key={creator.value}
                            value={creator.value}
                        >
                            {creator.label}
                        </option>
                    )
                )}
            </select>


            <select
                value={filters.product}
                onChange={(e) =>
                    updateFilter(
                        "product",
                        e.target.value
                    )
                }
                className="h-10 rounded-full border border-slate-200 bg-white px-4 text-sm font-medium text-slate-600 shadow-[0_8px_20px_rgba(15,23,42,0.04)]"
            >
                <option value="all">
                    All products
                </option>

                {filterOptions.products.map(
                    (product: string) => (
                        <option
                            key={product}
                            value={product}
                        >
                            {product}
                        </option>
                    )
                )}
            </select>


            <select
                value={filters.campaign}
                onChange={(e) =>
                    updateFilter(
                        "campaign",
                        e.target.value
                    )
                }
                className="h-10 rounded-full border border-slate-200 bg-white px-4 text-sm font-medium text-slate-600 shadow-[0_8px_20px_rgba(15,23,42,0.04)]"
            >
                <option value="all">
                    All campaigns
                </option>

                {filterOptions.campaigns.map(
                    (campaign: any) => (
                        <option
                            key={campaign.value}
                            value={campaign.value}
                        >
                            {campaign.label}
                        </option>
                    )
                )}
            </select>


            <button
                onClick={resetFilters}
                className="inline-flex h-10 items-center justify-center rounded-full border border-slate-200 bg-white px-4 text-sm font-medium text-slate-600"
            >
                Reset
            </button>

        </div>
    );
}
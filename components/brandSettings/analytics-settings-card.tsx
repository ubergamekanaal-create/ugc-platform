// "use client";

// import { useState } from "react";

// const timezones = [
//   "Eastern Time (ET)",
//   "Central Time (CT)",
//   "Mountain Time (MT)",
//   "Pacific Time (PT)",
//   "Arizona (MST - no DST)",
//   "Alaska (AKT)",
//   "Hawaii (HST)",
// ];

// const metricGroups = [
//   {
//     title: "VIDEO METRICS",
//     items: [
//       "Retention Chart",
//       "Thumbstop Rate",
//       "Avg Watch Time",
//       "3-Second Views",
//     ],
//   },
//   {
//     title: "ENGAGEMENT METRICS",
//     items: ["Impressions", "Link Clicks", "Link CTR"],
//   },
//   {
//     title: "SALES METRICS",
//     items: ["Conversions", "AOV", "Trials Started"],
//   },
// ];

// const AnalyticsSettingsCard = () => {
//   const [selectedTZ, setSelectedTZ] = useState("Pacific Time (PT)");
//   const [open, setOpen] = useState(false);

//   // Flatten all metrics
//   const allMetrics = metricGroups.flatMap((g) => g.items);

//   // Selected metrics state
//   const [selectedMetrics, setSelectedMetrics] = useState<string[]>([]);

//   // Track changes (for showing buttons)
//   const [hasChanges, setHasChanges] = useState(false);

//   // Select All logic
//   const isAllSelected = selectedMetrics.length === allMetrics.length;

//   const handleSelectAll = () => {
//     if (isAllSelected) {
//       setSelectedMetrics([]);
//     } else {
//       setSelectedMetrics(allMetrics);
//     }
//     setHasChanges(true);
//   };

//   //  Individual select
//   const handleSelect = (item: string) => {
//     if (selectedMetrics.includes(item)) {
//       setSelectedMetrics(selectedMetrics.filter((i) => i !== item));
//     } else {
//       setSelectedMetrics([...selectedMetrics, item]);
//     }
//     setHasChanges(true);
//   };

//   return (
//     <div className="w-full rounded-[28px] border border-slate-200 bg-white overflow-hidden">

//       {/* HEADER */}
//       <div className="p-6 border-b border-slate-200">
//         <h2 className="text-lg font-semibold text-slate-900">
//           Analytics Settings
//         </h2>
//         <p className="text-sm text-slate-500 mt-1">
//           Configure timezone, sync analytics, and manage creator-visible metrics
//         </p>
//       </div>

//       {/* BODY */}
//       <div className="p-6 space-y-6 max-h-[500px] overflow-y-scroll">

//         {/* TIMEZONE */}
//         <div>
//           <p className="text-sm font-medium text-slate-700 mb-2">
//             🌐 Timezone
//           </p>

//           <div className="relative">
//             <button
//               onClick={() => setOpen(!open)}
//               className="w-full h-11 rounded-xl border border-slate-200 bg-white px-4 text-left text-sm"
//             >
//               {selectedTZ}
//             </button>

//             {open && (
//               <div className="absolute z-10 mt-2 w-full rounded-xl border bg-white shadow-lg p-2">
//                 <input
//                   placeholder="Search timezones..."
//                   className="w-full mb-2 h-9 px-3 rounded-lg border text-sm outline-none"
//                 />

//                 {timezones.map((tz) => (
//                   <div
//                     key={tz}
//                     onClick={() => {
//                       setSelectedTZ(tz);
//                       setOpen(false);
//                       setHasChanges(true);
//                     }}
//                     className="px-3 py-2 text-sm rounded-lg hover:bg-slate-100 cursor-pointer flex justify-between"
//                   >
//                     {tz}
//                     {selectedTZ === tz && "✓"}
//                   </div>
//                 ))}
//               </div>
//             )}
//           </div>
//         </div>

//         {/* METRICS */}
//         <div className="rounded-2xl bg-slate-50 border border-slate-200 p-5">

//           <div className="flex justify-between items-center mb-4">
//             <p className="text-sm font-medium text-slate-700">
//               Select metrics
//             </p>

//             {/* SELECT ALL */}
//             <label className="flex items-center gap-2 text-sm cursor-pointer">
//               Select All
//               <input
//                 type="checkbox"
//                 checked={isAllSelected}
//                 onChange={handleSelectAll}
//               />
//             </label>
//           </div>

//           {metricGroups.map((group) => (
//             <div key={group.title} className="mb-5">

//               <p className="text-xs font-semibold text-slate-400 mb-3">
//                 {group.title}
//               </p>

//               <div className="space-y-2">
//                 {group.items.map((item) => (
//                   <label
//                     key={item}
//                     className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer"
//                   >
//                     <input
//                       type="checkbox"
//                       checked={selectedMetrics.includes(item)}
//                       onChange={() => handleSelect(item)}
//                     />
//                     {item}
//                   </label>
//                 ))}
//               </div>
//             </div>
//           ))}
//         </div>

//         {/* NOTE */}
//         <div className="rounded-xl bg-blue-50 border border-blue-100 p-3 text-xs text-slate-600">
//           ⚠️ Note: Cost metrics (spend, CPA, CPC, CPM) and revenue metrics (GMV, ROAS) are never shown to creators
//         </div>
//       </div>

//       {/* FOOTER BUTTONS (ONLY WHEN CHANGED) */}
//       {hasChanges && (
//         <div className="flex justify-end gap-3 p-5 border-t border-t-slate-200 bg-slate-50">

//           <button
//             onClick={() => {
//               setSelectedMetrics([]);
//               setHasChanges(false);
//             }}
//             className="px-5 py-2 rounded-full bg-slate-200 text-sm"
//           >
//             Cancel
//           </button>

//           <button
//             className="px-5 py-2 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 text-white text-sm"
//           >
//             Save Changes
//           </button>
//         </div>
//       )}
//     </div>
//   );
// };

// export default AnalyticsSettingsCard;




"use client";

import { useEffect, useState } from "react";

const timezones = [
  "Eastern Time (ET)",
  "Central Time (CT)",
  "Mountain Time (MT)",
  "Pacific Time (PT)",
  "Arizona (MST - no DST)",
  "Alaska (AKT)",
  "Hawaii (HST)",
];

const metricGroups = [
  {
    title: "VIDEO METRICS",
    items: [
      "Retention Chart",
      "Thumbstop Rate",
      "Avg Watch Time",
      "3-Second Views",
    ],
  },
  {
    title: "ENGAGEMENT METRICS",
    items: ["Impressions", "Link Clicks", "Link CTR"],
  },
  {
    title: "SALES METRICS",
    items: ["Conversions", "AOV", "Trials Started"],
  },
];

const AnalyticsSkeleton = () => {
  return (
    <div className="w-full rounded-[28px] border border-slate-200 bg-white overflow-hidden animate-pulse">

      {/* HEADER */}
      <div className="p-6 border-b border-slate-200">
        <div className="h-5 w-40 bg-slate-200 rounded" />
        <div className="h-3 w-72 bg-slate-200 rounded mt-2" />
      </div>

      {/* BODY */}
      <div className="p-6 space-y-6">

        {/* TIMEZONE */}
        <div>
          <div className="h-4 w-32 bg-slate-200 rounded mb-2" />
          <div className="h-11 w-full bg-slate-200 rounded-xl" />
        </div>

        {/* METRICS BOX */}
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">

          {/* TOP */}
          <div className="flex justify-between items-center mb-4">
            <div className="h-4 w-32 bg-slate-200 rounded" />
            <div className="h-4 w-20 bg-slate-200 rounded" />
          </div>

          {/* GROUPS */}
          {[1, 2, 3].map((g) => (
            <div key={g} className="mb-5">
              <div className="h-3 w-32 bg-slate-200 rounded mb-3" />

              <div className="space-y-2">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center gap-2">
                    <div className="h-4 w-4 bg-slate-200 rounded" />
                    <div className="h-3 w-40 bg-slate-200 rounded" />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* NOTE */}
        <div className="h-12 w-full bg-slate-200 rounded-xl" />
      </div>

      {/* FOOTER */}
      <div className="flex justify-end gap-3 p-5 border-t border-slate-200 bg-slate-50">
        <div className="h-10 w-24 bg-slate-200 rounded-full" />
        <div className="h-10 w-36 bg-slate-200 rounded-full" />
      </div>
    </div>
  );
};
const AnalyticsSettingsCard = () => {
  const [selectedTZ, setSelectedTZ] = useState("Pacific Time (PT)");
  const [open, setOpen] = useState(false);
  const [selectedMetrics, setSelectedMetrics] = useState<string[]>([]);
  const [hasChanges, setHasChanges] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const allMetrics = metricGroups.flatMap((g) => g.items);

  const isAllSelected = selectedMetrics.length === allMetrics.length;

  // =========================
  //  FETCH DATA FROM DB
  // =========================
  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch("/api/brands");
        const result = await res.json();

        const data = result?.data;

        if (data) {
          setSelectedMetrics(data.creator_visible_metrics || []);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // =========================
  // SELECT ALL
  // =========================
  const handleSelectAll = () => {
    if (isAllSelected) {
      setSelectedMetrics([]);
    } else {
      setSelectedMetrics(allMetrics);
    }
    setHasChanges(true);
  };

  // =========================
  // SELECT SINGLE
  // =========================
  const handleSelect = (item: string) => {
    if (selectedMetrics.includes(item)) {
      setSelectedMetrics(selectedMetrics.filter((i) => i !== item));
    } else {
      setSelectedMetrics([...selectedMetrics, item]);
    }
    setHasChanges(true);
  };

  // =========================
  //  SAVE TO DB
  // =========================
  const handleSave = async () => {
    try {
      setSaving(true);
      const res = await fetch("/api/update-brand-profile", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          creator_visible_metrics: selectedMetrics,
          creator_enabled: selectedMetrics.length > 0,
        }),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.error);

      setHasChanges(false);
    } catch (err) {
      console.error(err);
      alert("Error saving analytics settings");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <AnalyticsSkeleton />;

  return (
    <div className="w-full rounded-[28px] border border-slate-200 bg-white overflow-hidden">

      {/* HEADER */}
      <div className="p-6 border-b border-slate-200">
        <h2 className="text-lg font-semibold text-slate-900">
          Analytics Settings
        </h2>
        <p className="text-sm text-slate-500 mt-1">
          Configure timezone, sync analytics, and manage creator-visible metrics
        </p>
      </div>

      {/* BODY */}
      <div className="p-6 space-y-6 max-h-[500px] overflow-y-scroll">

        {/* TIMEZONE */}
        <div>
          <p className="text-sm font-medium text-slate-700 mb-2">
            🌐 Timezone
          </p>

          <div className="relative">
            <button
              onClick={() => setOpen(!open)}
              className="w-full h-11 rounded-xl border border-slate-200 bg-white px-4 text-left text-sm"
            >
              {selectedTZ}
            </button>

            {open && (
              <div className="absolute z-10 mt-2 w-full rounded-xl border bg-white shadow-lg p-2">
                {timezones.map((tz) => (
                  <div
                    key={tz}
                    onClick={() => {
                      setSelectedTZ(tz);
                      setOpen(false);
                      setHasChanges(true);
                    }}
                    className="px-3 py-2 text-sm rounded-lg hover:bg-slate-100 cursor-pointer flex justify-between"
                  >
                    {tz}
                    {selectedTZ === tz && "✓"}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* METRICS */}
        <div className="rounded-2xl bg-slate-50 border border-slate-200 p-5">

          <div className="flex justify-between items-center mb-4">
            <p className="text-sm font-medium text-slate-700">
              Select metrics
            </p>

            <label className="flex items-center gap-2 text-sm cursor-pointer">
              Select All
              <input
                type="checkbox"
                checked={isAllSelected}
                onChange={handleSelectAll}
              />
            </label>
          </div>

          {metricGroups.map((group) => (
            <div key={group.title} className="mb-5">
              <p className="text-xs font-semibold text-slate-400 mb-3">
                {group.title}
              </p>

              <div className="space-y-2">
                {group.items.map((item) => (
                  <label
                    key={item}
                    className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={selectedMetrics.includes(item)}
                      onChange={() => handleSelect(item)}
                    />
                    {item}
                  </label>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* NOTE */}
        <div className="rounded-xl bg-blue-50 border border-blue-100 p-3 text-xs text-slate-600">
          ⚠️ Note: Cost metrics and revenue metrics are never shown to creators
        </div>
      </div>

      {/* FOOTER */}
      {hasChanges && (
        <div className="flex justify-end gap-3 p-5 border-t border-t-slate-200 bg-slate-50">

          <button
            onClick={() => {
              setSelectedMetrics([]);
              setHasChanges(false);
            }}
            className="px-5 py-2 rounded-full bg-slate-200 text-sm"
          >
            Cancel
          </button>

          <button
            onClick={handleSave}
            disabled={saving}
            className="px-5 py-2 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 text-white text-sm disabled:opacity-60"
          >
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      )}
    </div>
  );
};

export default AnalyticsSettingsCard;
"use client";

import { useState } from "react";

const SampleRequestsCard = () => {
  const [enabled, setEnabled] = useState(false);

  return (
    <div className="w-full rounded-[28px] border border-slate-200 bg-white overflow-hidden">
      
      {/* HEADER */}
      <div className="p-6 border-b border-slate-200">
        <h2 className="text-lg font-semibold text-slate-900">
          Sample Requests
        </h2>
      </div>

      {/* CONTENT */}
      <div className="p-6">
        <div className="flex items-center justify-between rounded-2xl bg-slate-100 px-5 py-5">
          
          {/* LEFT TEXT */}
          <div className="max-w-xl">
            <p className="text-sm font-medium text-slate-900">
              Allow Sample Requests
            </p>

            <p className="text-sm text-slate-500 mt-1">
              Enable creators to request product samples from your catalog. Orders get sent directly to Shopify with a 100% discount if Shopify is connected.
            </p>
          </div>

          {/* TOGGLE */}
          <button
            onClick={() => setEnabled(!enabled)}
            className={`relative w-12 h-6 rounded-full transition ${
              enabled ? "bg-purple-500" : "bg-slate-300"
            }`}
          >
            <span
              className={`absolute top-1 left-1 h-4 w-4 rounded-full bg-white transition ${
                enabled ? "translate-x-6" : ""
              }`}
            />
          </button>
        </div>
      </div>
    </div>
  );
};

export default SampleRequestsCard;
"use client";

import { BrandDashboardData } from "@/lib/types";
import { motion, useInView } from "framer-motion";
import { useMemo, useRef, useState } from "react";
import {
    Area,
    AreaChart,
    CartesianGrid,
    ResponsiveContainer,
    Tooltip,
    XAxis,
} from "recharts";

type Metric =
    | "Pipeline revenue"
    | "Gross payout value"
    | "Funded spend"
    | "Creator earnings";

export type TimeFilter = "7D" | "14D" | "30D" | "90D";

type Props = {
    data: BrandDashboardData;
    activeFilter: TimeFilter;
    onFilterChange: (filter: TimeFilter) => void;
};

const METRIC_OPTIONS: Metric[] = [
    "Pipeline revenue",
    "Gross payout value",
    "Funded spend",
    "Creator earnings",
];

const TIME_FILTERS: TimeFilter[] = ["7D", "14D", "30D", "90D"];

const METRIC_COPY: Record<
    Metric,
    {
        description: string;
        deltaLabel: string;
        positiveTone: boolean;
    }
> = {
    "Pipeline revenue": {
        description: "Real pipeline conversion pulled from current campaign activity.",
        deltaLabel: "in attributable pipeline",
        positiveTone: true,
    },
    "Gross payout value": {
        description: "Gross payout value attached to creator work that is queued or released.",
        deltaLabel: "in gross payout value",
        positiveTone: true,
    },
    "Funded spend": {
        description: "Capital that has actually been funded into campaign execution.",
        deltaLabel: "in funded spend",
        positiveTone: false,
    },
    "Creator earnings": {
        description: "Released and queued creator net earnings across approved campaign work.",
        deltaLabel: "in creator payouts",
        positiveTone: true,
    },
};

function getDays(filter: TimeFilter) {
    if (filter === "7D") return 7;
    if (filter === "14D") return 14;
    if (filter === "30D") return 30;
    return 90;
}

function getMetricEntries(data: BrandDashboardData, metric: Metric) {
    if (metric === "Pipeline revenue") {
        return data.submissions
            .filter((item) => item.status === "approved")
            .map((item) => ({
                dateValue: item.reviewed_at ?? item.created_at,
                amount: item.rate ?? 0,
            }));
    }

    if (metric === "Gross payout value") {
        return data.payouts
            .filter((payout) => payout.status === "paid" || payout.status === "payout_ready")
            .map((payout) => ({
                dateValue: payout.paid_at ?? payout.created_at,
                amount: payout.amount ?? 0,
            }));
    }

    if (metric === "Funded spend") {
        return data.fundings
            .filter((funding) => funding.status === "paid")
            .map((funding) => ({
                dateValue: funding.paid_at ?? funding.created_at,
                amount: funding.amount ?? 0,
            }));
    }

    return data.payouts
        .filter((payout) => payout.status === "paid" || payout.status === "payout_ready")
        .map((payout) => ({
            dateValue: payout.paid_at ?? payout.created_at,
            amount: payout.creator_amount ?? 0,
        }));
}

function buildBuckets(days: number, offsetDays: number) {
    return Array.from({ length: days }, (_, index) => {
        const day = new Date();
        day.setHours(0, 0, 0, 0);
        day.setDate(day.getDate() - offsetDays - (days - 1 - index));

        return {
            label: day.toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
            }),
            date: day.toDateString(),
            value: 0,
        };
    });
}

function formatCurrency(value: number) {
    return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        maximumFractionDigits: 0,
    }).format(value);
}

export function PipelineRevenueChart({
    data,
    activeFilter,
    onFilterChange,
}: Props) {
    const [metric, setMetric] = useState<Metric>("Pipeline revenue");
    const chartRef = useRef<HTMLDivElement | null>(null);
    const isChartInView = useInView(chartRef, {
        once: true,
        amount: 0.3,
    });

    const { graphData, total, previousTotal } = useMemo(() => {
        const days = getDays(activeFilter);
        const currentBuckets = buildBuckets(days, 0);
        const previousBuckets = buildBuckets(days, days);
        const entries = getMetricEntries(data, metric);

        const bumpBucket = (
            buckets: Array<{ label: string; date: string; value: number }>,
            dateValue: string | null | undefined,
            amount: number
        ) => {
            if (!dateValue) return;

            const day = new Date(dateValue);
            day.setHours(0, 0, 0, 0);

            const bucket = buckets.find((item) => item.date === day.toDateString());
            if (bucket) {
                bucket.value += amount;
            }
        };

        entries.forEach((entry) => {
            bumpBucket(currentBuckets, entry.dateValue, entry.amount);
            bumpBucket(previousBuckets, entry.dateValue, entry.amount);
        });

        return {
            graphData: currentBuckets,
            total: currentBuckets.reduce((sum, item) => sum + item.value, 0),
            previousTotal: previousBuckets.reduce((sum, item) => sum + item.value, 0),
        };
    }, [activeFilter, data, metric]);

    const delta = total - previousTotal;
    const growth = previousTotal ? (delta / previousTotal) * 100 : total > 0 ? 100 : 0;
    const metricCopy = METRIC_COPY[metric];
    const isPositiveResult = delta >= 0;
    const isFavorableDirection = metricCopy.positiveTone ? isPositiveResult : !isPositiveResult;
    const deltaToneClasses = isFavorableDirection
        ? "bg-emerald-50 text-emerald-600"
        : "bg-rose-50 text-rose-600";
    const deltaPrefix = delta >= 0 ? "+" : "-";
    const animationKey = `${metric}-${activeFilter}`;

    return (
        <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden rounded-[32px] border border-slate-200/80 bg-white px-5 py-5 shadow-[0_20px_60px_rgba(15,23,42,0.04)] sm:px-8 sm:py-8"
        >
            <div className="flex flex-col gap-6">
                <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                    <div className="min-w-0">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                            <div className="relative inline-flex w-fit">
                                <select
                                    value={metric}
                                    onChange={(event) => setMetric(event.target.value as Metric)}
                                    className="h-11 appearance-none rounded-full border border-slate-200 bg-white pl-5 pr-11 text-sm font-semibold text-slate-950 shadow-[0_10px_30px_rgba(15,23,42,0.05)] outline-none transition focus:border-slate-300"
                                >
                                    {METRIC_OPTIONS.map((option) => (
                                        <option key={option} value={option}>
                                            {option}
                                        </option>
                                    ))}
                                </select>
                                <span className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-slate-400">
                                    <svg
                                        width="14"
                                        height="14"
                                        viewBox="0 0 14 14"
                                        fill="none"
                                        xmlns="http://www.w3.org/2000/svg"
                                        aria-hidden="true"
                                    >
                                        <path
                                            d="M3.5 5.25L7 8.75L10.5 5.25"
                                            stroke="currentColor"
                                            strokeWidth="1.5"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                        />
                                    </svg>
                                </span>
                            </div>
                        </div>

                        <div className="mt-5 flex flex-col gap-3 lg:flex-row lg:items-end">
                            <motion.h2
                                key={`total-${animationKey}`}
                                initial={{ opacity: 0, y: 16 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.35, ease: "easeOut" }}
                                className="text-[56px] font-semibold leading-none tracking-[-0.06em] text-slate-950 sm:text-[76px]"
                            >
                                {formatCurrency(total)}
                            </motion.h2>

                            <motion.div
                                key={`delta-${animationKey}`}
                                initial={{ opacity: 0, y: 14 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.35, delay: 0.05, ease: "easeOut" }}
                                className="pb-2"
                            >
                                <motion.div
                                    className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-semibold ${deltaToneClasses}`}
                                    initial={{ scale: 0.96 }}
                                    animate={{ scale: 1 }}
                                    transition={{ duration: 0.28, ease: "easeOut" }}
                                >
                                    {isPositiveResult ? (
                                        <svg
                                            width="14"
                                            height="14"
                                            viewBox="0 0 24 24"
                                            fill="none"
                                            xmlns="http://www.w3.org/2000/svg"
                                        >
                                            <path
                                                d="M7 17L17 7"
                                                stroke="currentColor"
                                                strokeWidth="2"
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                            />
                                            <path
                                                d="M10 7H17V14"
                                                stroke="currentColor"
                                                strokeWidth="2"
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                            />
                                        </svg>
                                    ) : (
                                        <svg
                                            width="14"
                                            height="14"
                                            viewBox="0 0 24 24"
                                            fill="none"
                                            xmlns="http://www.w3.org/2000/svg"
                                        >
                                            <path
                                                d="M7 7L17 17"
                                                stroke="currentColor"
                                                strokeWidth="2"
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                            />
                                            <path
                                                d="M17 10V17H10"
                                                stroke="currentColor"
                                                strokeWidth="2"
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                            />
                                        </svg>
                                    )}
                                    <span>{Math.abs(growth).toFixed(1)}%</span>
                                    <span>vs prev {activeFilter.toLowerCase()}</span>
                                </motion.div>

                                <motion.p
                                    className="mt-2 text-sm text-slate-500"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ duration: 0.25, delay: 0.1 }}
                                >
                                    {deltaPrefix}
                                    {formatCurrency(Math.abs(delta))} {metricCopy.deltaLabel}
                                </motion.p>
                            </motion.div>
                        </div>

                        <p className="mt-6 max-w-2xl text-sm text-slate-600">
                            {metricCopy.description}
                        </p>
                    </div>

                    <div className="inline-flex w-fit rounded-full border border-slate-200 bg-white p-1 shadow-[0_10px_30px_rgba(15,23,42,0.05)]">
                        {TIME_FILTERS.map((item) => (
                            <button
                                key={item}
                                type="button"
                                onClick={() => onFilterChange(item)}
                                className={`rounded-full px-4 py-2 text-xs font-semibold transition ${activeFilter === item
                                    ? "bg-slate-950 text-white"
                                    : "text-slate-500 hover:text-slate-900"
                                    }`}
                            >
                                {item}
                            </button>
                        ))}
                    </div>
                </div>

                <motion.div
                    ref={chartRef}
                    initial={{ opacity: 0, y: 24 }}
                    animate={isChartInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 24 }}
                    transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                    className="h-[150px] pt-2 sm:h-[180px]"
                >
                    <motion.div
                        key={animationKey}
                        initial={{ opacity: 0, y: 18, scale: 0.985 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                        className="h-full w-full origin-bottom"
                    >
                        <ResponsiveContainer>
                            <AreaChart data={graphData} margin={{ top: 10, right: 6, left: 6, bottom: 5 }}>
                                <defs>
                                    <linearGradient id="pipeline-chart-fill" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="100%" stopColor="#2563eb" stopOpacity={0.2} />
                                        <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                                    </linearGradient>
                                </defs>

                                <CartesianGrid vertical={false} stroke="#E2E8F0" strokeDasharray="3 6" />

                                <XAxis
                                    dataKey="label"
                                    hide={true}
                                    axisLine={false}
                                    tickLine={false}
                                    tickMargin={10}
                                    minTickGap={24}
                                    tick={{ fill: "#94A3B8", fontSize: 12 }}
                                />
                                <Tooltip
                                    formatter={(value) => [
                                        formatCurrency(Number(value ?? 0)),
                                        metric,
                                    ]}
                                    labelStyle={{ color: "#0F172A", fontWeight: 600 }}
                                    contentStyle={{
                                        borderRadius: 18,
                                        border: "1px solid #E2E8F0",
                                        boxShadow: "0 16px 40px rgba(15, 23, 42, 0.08)",
                                    }}
                                />

                                <Area
                                    dataKey="value"
                                    type="monotone"
                                    stroke="#2563EB"
                                    fill="url(#pipeline-chart-fill)"
                                    strokeWidth={2.5}
                                    animationDuration={900}
                                    animationEasing="ease-out"
                                    activeDot={{ r: 6, fill: "#2563EB", stroke: "#DBEAFE", strokeWidth: 4 }}
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </motion.div>
                </motion.div>
            </div>
        </motion.div>
    );
}

"use client";

import { cn, formatCurrency } from "@/lib/utils";

type Product = {
  id: string;
  title: string;
  vendor?: string;
  product_type?: string;
  price: number | null;
  image_url?: string | null;
  status?: string;
};

type Props = {
  products: Product[];
};

function getStatusClasses(status?: string) {
  if (status === "active" || status === "synced") {
    return "bg-emerald-50 text-emerald-700 ring-emerald-100";
  }

  if (status === "draft" || status === "archived") {
    return "bg-slate-100 text-slate-600 ring-slate-200";
  }

  if (status === "error") {
    return "bg-rose-50 text-rose-700 ring-rose-100";
  }

  return "bg-[rgba(7,107,210,0.08)] text-accent ring-[rgba(7,107,210,0.12)]";
}

function formatStatusLabel(value: string) {
  return value.replaceAll("_", " ");
}

export function ProductTable({ products }: Props) {
  return (
    <div className="overflow-hidden rounded-[1.5rem] border border-slate-200 bg-white shadow-[0_12px_32px_rgba(15,23,42,0.04)]">
      <div className="divide-y divide-slate-100 md:hidden">
        {products.map((p) => {
          const status = p.status || "active";

          return (
            <article key={p.id} className="p-4">
              <div className="flex gap-3">
                <div className="h-[4.5rem] w-[4.5rem] shrink-0 overflow-hidden rounded-2xl border border-slate-200 bg-slate-100 shadow-[0_8px_18px_rgba(15,23,42,0.04)]">
                  {p.image_url ? (
                    <img
                      src={p.image_url}
                      alt={p.title}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-slate-50 text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-slate-400">
                      N/A
                    </div>
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <h3 className="line-clamp-2 text-sm font-semibold leading-5 text-slate-950">
                    {p.title}
                  </h3>
                  <p className="mt-1 truncate text-xs font-medium uppercase tracking-[0.12em] text-slate-400">
                    ID {p.id}
                  </p>
                </div>
              </div>

              <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 border-t border-slate-100 pt-3 text-sm">
                <div className="min-w-0">
                  <dt className="text-[0.7rem] font-medium text-slate-400">
                    Vendor
                  </dt>
                  <dd className="mt-1 truncate font-semibold text-slate-800">
                    {p.vendor || "-"}
                  </dd>
                </div>
                <div>
                  <dt className="text-[0.7rem] font-medium text-slate-400">
                    Price
                  </dt>
                  <dd className="mt-1 font-semibold text-slate-950">
                    {p.price ? formatCurrency(p.price) : "-"}
                  </dd>
                </div>
                <div className="min-w-0">
                  <dt className="text-[0.7rem] font-medium text-slate-400">
                    Type
                  </dt>
                  <dd className="mt-1 inline-flex h-7 max-w-full items-center truncate rounded-full bg-slate-100 px-3 text-[0.68rem] font-semibold uppercase tracking-[0.08em] text-slate-600">
                    {p.product_type || "-"}
                  </dd>
                </div>
                <div className="min-w-0">
                  <dt className="text-[0.7rem] font-medium text-slate-400">
                    Status
                  </dt>
                  <dd className="mt-1">
                    <span
                      className={cn(
                        "inline-flex h-7 max-w-full items-center rounded-full px-3 text-[0.68rem] font-semibold uppercase tracking-[0.08em] ring-1 ring-inset",
                        getStatusClasses(status),
                      )}
                    >
                      <span className="mr-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-current" />
                      <span className="truncate">
                        {formatStatusLabel(status)}
                      </span>
                    </span>
                  </dd>
                </div>
              </dl>
            </article>
          );
        })}
      </div>

      <div className="hidden overflow-x-auto md:block">
        <table className="w-full min-w-[760px] border-separate border-spacing-0 text-left text-sm xl:min-w-0">
          <thead>
            <tr className="bg-slate-50/80 text-xs uppercase tracking-[0.16em] text-slate-400">
              <th className="border-b border-slate-200 px-4 py-4 font-semibold lg:px-5">
                Product
              </th>
              <th className="border-b border-slate-200 px-4 py-4 font-semibold lg:px-5">
                Vendor
              </th>
              <th className="border-b border-slate-200 px-4 py-4 font-semibold lg:px-5">
                Type
              </th>
              <th className="border-b border-slate-200 px-4 py-4 font-semibold lg:px-5">
                Price
              </th>
              <th className="border-b border-slate-200 px-4 py-4 font-semibold lg:px-5">
                Status
              </th>
            </tr>
          </thead>

          <tbody>
            {products.map((p) => {
              const status = p.status || "active";

              return (
                <tr
                  key={p.id}
                  className="group align-middle text-slate-700 transition hover:bg-slate-50/70"
                >
                  <td className="border-b border-slate-100 px-4 py-4 lg:px-5">
                    <div className="flex min-w-[240px] items-center gap-3 lg:min-w-[280px] lg:gap-4">
                      <div className="h-12 w-12 shrink-0 overflow-hidden rounded-2xl border border-slate-200 bg-slate-100 lg:h-14 lg:w-14">
                        {p.image_url ? (
                          <img
                            src={p.image_url}
                            alt={p.title}
                            className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center bg-slate-50 text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-slate-400">
                            N/A
                          </div>
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="max-w-[22rem] truncate font-semibold text-slate-950">
                          {p.title}
                        </p>
                        <p className="mt-1 max-w-[18rem] truncate text-xs font-medium uppercase tracking-[0.12em] text-slate-400">
                          ID {p.id}
                        </p>
                      </div>
                    </div>
                  </td>

                  <td className="border-b border-slate-100 px-4 py-4 lg:px-5">
                    <span className="block max-w-[9rem] truncate font-medium text-slate-700 lg:max-w-[12rem]">
                      {p.vendor || "-"}
                    </span>
                  </td>
                  <td className="border-b border-slate-100 px-4 py-4 lg:px-5">
                    <span className="inline-flex max-w-[10rem] items-center truncate rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600 lg:max-w-[14rem]">
                      {p.product_type || "-"}
                    </span>
                  </td>

                  <td className="border-b border-slate-100 px-4 py-4 font-semibold text-slate-950 lg:px-5">
                    {p.price ? formatCurrency(p.price) : "-"}
                  </td>

                  <td className="border-b border-slate-100 px-4 py-4 lg:px-5">
                    <span
                      className={cn(
                        "inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold capitalize ring-1 ring-inset",
                        getStatusClasses(status),
                      )}
                    >
                      <span className="mr-2 h-1.5 w-1.5 rounded-full bg-current" />
                      {formatStatusLabel(status)}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

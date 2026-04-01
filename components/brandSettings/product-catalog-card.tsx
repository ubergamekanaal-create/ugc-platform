"use client";

import { useEffect, useState } from "react";

type Product = {
  id: string;
  title: string;
  image?: string;
  price?: string;
};

const ProductCatalogCard = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);

  // API Integration
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);

        // const res = await fetch("/api/products");
        // const data = await res.json();
        // setProducts(data);

        setProducts([]); // empty for now
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  return (
    <div className="w-full rounded-[28px] border border-slate-200 bg-white overflow-hidden">
      
      {/* HEADER */}
      <div className="flex items-center justify-between p-6 border-b border-slate-200">
        <h2 className="text-lg font-semibold text-slate-900">
          Product Catalog
        </h2>

        <button className="px-4 py-2 rounded-full bg-slate-200 text-slate-500 text-sm cursor-not-allowed">
          + Connect Shopify to Import
        </button>
      </div>

      {/* CONTENT */}
      <div className="p-6">
        {loading ? (
          <p className="text-center text-sm text-slate-500">
            Loading products...
          </p>
        ) : products.length === 0 ? (
          <EmptyState />
        ) : (
          <ProductGrid products={products} />
        )}
      </div>
    </div>
  );
};

export default ProductCatalogCard;





/* ---------------- EMPTY STATE ---------------- */

const EmptyState = () => {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      
      {/* Icon */}
      <div className="h-20 w-20 rounded-full bg-slate-200 flex items-center justify-center text-2xl">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" color="currentColor" className="w-8 h-8 text-gray-400"><path d="M3.50002 10V15C3.50002 17.8284 3.50002 19.2426 4.37869 20.1213C5.25737 21 6.67159 21 9.50002 21H14.5C17.3284 21 18.7427 21 19.6213 20.1213C20.5 19.2426 20.5 17.8284 20.5 15V10" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"></path><path d="M17 7.50184C17 8.88255 15.8807 9.99997 14.5 9.99997C13.1193 9.99997 12 8.88068 12 7.49997C12 8.88068 10.8807 9.99997 9.50002 9.99997C8.1193 9.99997 7.00002 8.88068 7.00002 7.49997C7.00002 8.88068 5.82655 9.99997 4.37901 9.99997C3.59984 9.99997 2.90008 9.67567 2.42 9.16087C1.59462 8.2758 2.12561 6.97403 2.81448 5.98842L3.20202 5.45851C4.08386 4.2527 4.52478 3.6498 5.16493 3.32494C5.80508 3.00008 6.55201 3.00018 8.04587 3.00038L15.9551 3.00143C17.4485 3.00163 18.1952 3.00173 18.8351 3.32658C19.475 3.65143 19.9158 4.25414 20.7974 5.45957L21.1855 5.99029C21.8744 6.97589 22.4054 8.27766 21.58 9.16273C21.0999 9.67754 20.4002 10.0018 19.621 10.0018C18.1734 10.0018 17 8.88255 17 7.50184Z" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"></path><path d="M14.9971 17C14.3133 17.6072 13.2247 18 11.9985 18C10.7723 18 9.68376 17.6072 9 17" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"></path></svg>
      </div>

      <p className="mt-5 text-sm text-slate-500">
        No products in your catalog yet.
      </p>
    </div>
  );
};





/* ---------------- PRODUCT GRID ---------------- */

const ProductGrid = ({ products }: { products: Product[] }) => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {products.map((product) => (
        <div
          key={product.id}
          className="rounded-2xl border border-slate-200 bg-white p-3"
        >
          <div className="h-32 w-full rounded-xl bg-slate-100 flex items-center justify-center">
            {product.image ? (
              <img
                src={product.image}
                alt={product.title}
                className="h-full w-full object-cover rounded-xl"
              />
            ) : (
              "📦"
            )}
          </div>

          <p className="mt-2 text-sm font-medium text-slate-900">
            {product.title}
          </p>

          <p className="text-xs text-slate-500">
            {product.price || "$0.00"}
          </p>
        </div>
      ))}
    </div>
  );
};
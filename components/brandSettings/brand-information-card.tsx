// "use client";

// import React, { useEffect, useState } from "react";

// const BrandInformationCard = () => {
//     const [form, setForm] = useState({
//         full_name: "",
//         brand_description: "",
//         website_url: "",
//         store_currency: "USD",
//     });

//     const [loading, setLoading] = useState(true);
//     const [saving, setSaving] = useState(false);
//     const [selectedFile, setSelectedFile] = useState<File | null>(null);
//     const [preview, setPreview] = useState<string | null>(null);
//     // 🔥 GET DATA (prefill)
//     useEffect(() => {
//         const fetchBrand = async () => {
//             try {
//                 const res = await fetch("/api/brands");
//                 const result = await res.json();

//                 if (result.data) {
//                     setForm({
//                         full_name: result.data.full_name || "",
//                         brand_description: result.data.brand_description || "",
//                         website_url: result.data.website_url || "",
//                         store_currency: result.data.store_currency || "USD",
//                     });
//                 }
//             } catch (err) {
//                 console.error("Error fetching brand:", err);
//             } finally {
//                 setLoading(false);
//             }
//         };

//         fetchBrand();
//     }, []);

//     // 🔥 HANDLE CHANGE
//     const handleChange = (
//         e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
//     ) => {
//         setForm({ ...form, [e.target.name]: e.target.value });
//     };

//     // 🔥 SAVE DATA
//     const handleSave = async () => {
//         setSaving(true);

//         try {
//             const res = await fetch("/api/update-brand-profile", {
//                 method: "POST",
//                 headers: {
//                     "Content-Type": "application/json",
//                 },
//                 body: JSON.stringify(form),
//             });

//             const result = await res.json();

//             if (!res.ok) throw new Error(result.error);

//             alert("Saved successfully ✅");
//         } catch (err) {
//             console.error(err);
//             alert("Error saving data ❌");
//         } finally {
//             setSaving(false);
//         }
//     };

//     if (loading) {
//         return <div className="p-6">Loading...</div>;
//     }

//     return (
//         <div className="w-full rounded-[28px] border border-slate-200 overflow-hidden">

//             {/* TOP SECTION */}
//             <div className="p-6 border-b bg-white border-slate-200">
//                 <div className="flex items-center gap-4">

//                     <div className="h-14 w-14 rounded-full bg-slate-300 flex items-center justify-center text-xl font-bold">
//                         {form.full_name?.charAt(0) || "B"}
//                     </div>

//                     <div className="flex flex-col gap-2">
//                         <div>
//                             <p className="text-base font-[500]">Brand Logo</p>
//                             <p className="text-xs text-slate-500">
//                                 Min 400x400px, PNG or JPEG
//                             </p>
//                         </div>

//                         <button className="w-fit px-4 py-1.5 text-sm rounded-full bg-slate-200">
//                             Upload
//                         </button>
//                     </div>
//                 </div>
//             </div>

//             {/* FORM */}
//             <div className="p-6 space-y-4 bg-white">

//                 {/* Brand Name */}
//                 <div>
//                     <label className="block text-md font-medium">Brand Name</label>
//                     <input
//                         name="full_name"
//                         value={form.full_name}
//                         onChange={handleChange}
//                         className="w-full mt-2 px-4 py-3 rounded-full bg-slate-200 text-sm"
//                     />
//                 </div>

//                 {/* Description */}
//                 <div>
//                     <label className="block text-md font-medium">
//                         Brand Description
//                     </label>
//                     <textarea
//                         name="brand_description"
//                         value={form.brand_description}
//                         onChange={handleChange}
//                         rows={4}
//                         className="w-full mt-2 px-4 py-3 rounded-2xl bg-slate-200 text-sm"
//                     />
//                 </div>

//                 {/* Website */}
//                 <div>
//                     <label className="block text-md font-medium">Website URL</label>
//                     <input
//                         name="website_url"
//                         value={form.website_url}
//                         onChange={handleChange}
//                         className="w-full mt-2 px-4 py-3 rounded-full bg-slate-200 text-sm"
//                     />
//                 </div>

//                 {/* Currency */}
//                 <div>
//                     <label className="block text-md font-medium">
//                         Store Currency
//                     </label>

//                     <select
//                         name="store_currency"
//                         value={form.store_currency}
//                         onChange={handleChange}
//                         className="w-full mt-2 px-4 py-3 rounded-full bg-slate-200 text-sm"
//                     >
//                         <option value="EUR">EU EUR</option>
//                         <option value="USD">USD</option>
//                         <option value="INR">INR</option>
//                     </select>
//                 </div>
//             </div>

//             {/* FOOTER */}
//             <div className="flex bg-white justify-end gap-3 p-5 border-t">
//                 <button
//                     onClick={() => window.location.reload()}
//                     className="px-5 py-2 rounded-full bg-slate-200 text-sm"
//                 >
//                     Discard
//                 </button>

//                 <button
//                     onClick={handleSave}
//                     disabled={saving}
//                     className="px-5 py-2 rounded-full bg-blue-500 text-white text-sm"
//                 >
//                     {saving ? "Saving..." : "Apply Changes"}
//                 </button>
//             </div>
//         </div>
//     );
// };

// export default BrandInformationCard;




"use client";

import React, { useEffect, useState } from "react";

const BrandInformationCard = () => {
  const [form, setForm] = useState({
    full_name: "",
    brand_description: "",
    website_url: "",
    store_currency: "USD",
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  // 🔥 FETCH DATA
  useEffect(() => {
    const fetchBrand = async () => {
      try {
        const res = await fetch("/api/brands");
        const result = await res.json();

        if (result.data) {
          setForm({
            full_name: result.data.full_name || "",
            brand_description: result.data.brand_description || "",
            website_url: result.data.website_url || "",
            store_currency: result.data.store_currency || "USD",
          });
        }

        // 👉 fetch user avatar also (optional)
        const userRes = await fetch("/api/user"); // if you have this
        const userData = await userRes.json();

        if (userData?.data?.avatar_url) {
          setAvatarUrl(userData.data.avatar_url);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchBrand();
  }, []);

  // 🔥 INPUT CHANGE
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // 🔥 FILE SELECT
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);
    setPreview(URL.createObjectURL(file));
  };

  // 🔥 SAVE (FormData)
  const handleSave = async () => {
    setSaving(true);

    try {
      const formData = new FormData();

      formData.append("full_name", form.full_name);
      formData.append("brand_description", form.brand_description);
      formData.append("website_url", form.website_url);
      formData.append("store_currency", form.store_currency);

      if (selectedFile) {
        formData.append("logo", selectedFile);
      }

      const res = await fetch("/api/update-brand-profile", {
        method: "POST",
        body: formData,
      });

      const result = await res.json();

      if (!res.ok) throw new Error(result.error);

      if (result.avatar_url) {
        setAvatarUrl(result.avatar_url);
      }

      alert("Saved successfully ✅");
    } catch (err) {
      console.error(err);
      alert("Error saving ❌");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-6">Loading...</div>;

  return (
    <div className="w-full rounded-[28px] border border-slate-200 overflow-hidden">

      {/* TOP */}
      <div className="p-6 border-b bg-white">
        <div className="flex items-center gap-4">

          {/* 🔥 IMAGE */}
          <div className="h-14 w-14 rounded-full bg-slate-300 overflow-hidden flex items-center justify-center">
            {preview ? (
              <img src={preview} className="h-full w-full object-cover" />
            ) : avatarUrl ? (
              <img src={avatarUrl} className="h-full w-full object-cover" />
            ) : (
              <span className="text-xl font-bold">
                {form.full_name?.charAt(0) || "B"}
              </span>
            )}
          </div>

          {/* TEXT */}
          <div className="flex flex-col gap-2">
            <div>
              <p className="text-base font-medium">Brand Logo</p>
              <p className="text-xs text-slate-500">
                Min 400x400px, PNG or JPEG
              </p>
            </div>

            {/* 🔥 FILE INPUT */}
            <label className="cursor-pointer px-4 py-1.5 text-sm rounded-full bg-slate-200 hover:bg-slate-300 w-fit">
              Upload
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />
            </label>
          </div>
        </div>
      </div>

      {/* FORM */}
      <div className="p-6 space-y-4 bg-white">

        <div>
          <label className="block text-md font-medium">Brand Name</label>
          <input
            name="full_name"
            value={form.full_name}
            onChange={handleChange}
            className="w-full mt-2 px-4 py-3 rounded-full bg-slate-200 text-sm"
          />
        </div>

        <div>
          <label className="block text-md font-medium">
            Brand Description
          </label>
          <textarea
            name="brand_description"
            value={form.brand_description}
            onChange={handleChange}
            rows={4}
            className="w-full mt-2 px-4 py-3 rounded-2xl bg-slate-200 text-sm"
          />
        </div>

        <div>
          <label className="block text-md font-medium">Website URL</label>
          <input
            name="website_url"
            value={form.website_url}
            onChange={handleChange}
            className="w-full mt-2 px-4 py-3 rounded-full bg-slate-200 text-sm"
          />
        </div>

        <div>
          <label className="block text-md font-medium">Store Currency</label>
          <select
            name="store_currency"
            value={form.store_currency}
            onChange={handleChange}
            className="w-full mt-2 px-4 py-3 rounded-full bg-slate-200 text-sm"
          >
            <option value="EUR">EU EUR</option>
            <option value="USD">USD</option>
            <option value="INR">INR</option>
          </select>
        </div>
      </div>

      {/* FOOTER */}
      <div className="flex bg-white justify-end gap-3 p-5 border-t">
        <button
          onClick={() => window.location.reload()}
          className="px-5 py-2 rounded-full bg-slate-200 text-sm"
        >
          Discard
        </button>

        <button
          onClick={handleSave}
          disabled={saving}
          className="px-5 py-2 rounded-full bg-blue-500 text-white text-sm"
        >
          {saving ? "Saving..." : "Apply Changes"}
        </button>
      </div>
    </div>
  );
};

export default BrandInformationCard;
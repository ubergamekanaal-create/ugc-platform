// "use client";

// import { useState } from "react";
// import { usePendingInvites } from "@/hooks/usePendingInvites";
// import { useRouter } from "next/navigation";
// export const GlobalInviteModal = () => {
//     const { invites, loading, refetch } = usePendingInvites();
//     const router = useRouter();
//     const [open, setOpen] = useState(true);
//     const [acceptingId, setAcceptingId] = useState<string | null>(null);

//     const handleAccept = async (inviteId: string) => {
//         try {
//             setAcceptingId(inviteId);

//             const res = await fetch("/api/team/accept-invite", {
//                 method: "POST",
//                 body: JSON.stringify({ inviteId }),
//             });

//             const data = await res.json();

//             if (!res.ok) {
//                 throw new Error(data.error);
//             }
//             await refetch();
//             router.refresh();
//             if (invites.length === 1) {
//                 router.push("/dashboard/my-brands");
//             }
//         } catch (err: any) {
//             console.error(err);
//             alert(err.message);
//         } finally {
//             setAcceptingId(null);
//         }
//     };
//     const handleReject = async (inviteId: string) => {
//         try {
//             const res = await fetch("/api/team/reject-invite", {
//                 method: "POST",
//                 headers: {
//                     "Content-Type": "application/json",
//                 },
//                 body: JSON.stringify({ inviteId }),
//             });

//             const data = await res.json();

//             if (!res.ok) throw new Error(data.error);

//             // 🔥 refresh invites
//             await refetch();

//         } catch (err: any) {
//             console.error(err);
//             alert(err.message);
//         }
//     };
//     if (loading || !open || invites.length === 0) return null;

//     return (
//         <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 backdrop-blur-sm">

//             {/* MODAL */}
//             <div className="w-full max-w-lg rounded-2xl bg-white shadow-xl p-6 relative">

//                 {/* CLOSE BUTTON */}
//                 <button
//                     onClick={() => setOpen(false)}
//                     className="absolute top-4 right-4 text-slate-500 hover:text-black"
//                 >
//                     ✕
//                 </button>

//                 {/* HEADER */}
//                 <h2 className="text-lg font-semibold text-slate-900">
//                     Team Invitations
//                 </h2>

//                 <p className="text-sm text-slate-500 mt-1">
//                     You have {invites.length} pending invitation
//                 </p>

//                 {/* INVITES */}
//                 <div className="mt-5 space-y-4 max-h-[420px] overflow-y-auto pr-1">

//                     {invites.map((inv) => (
//                         <div
//                             key={inv.id}
//                             className="border border-slate-200 rounded-xl p-4 flex gap-4 items-start"
//                         >

//                             {/* AVATAR */}
//                             <div className="h-12 w-12 rounded-full bg-gradient-to-br from-purple-500 to-indigo-500 text-white flex items-center justify-center font-semibold shrink-0">
//                                 {inv.email?.charAt(0).toUpperCase()}
//                             </div>

//                             {/* CONTENT */}
//                             <div className="flex-1">

//                                 {/* NAME + ROLE */}
//                                 <div className="flex items-center gap-2">
//                                     <p className="font-medium text-slate-900">
//                                         {inv.email}
//                                     </p>

//                                     <span className="text-xs bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full capitalize">
//                                         {inv.role}
//                                     </span>
//                                 </div>

//                                 {/* INVITED INFO */}
//                                 <p className="text-xs text-slate-400 mt-2">
//                                     Invited • {inv.invited_at ? new Date(inv.invited_at).toLocaleDateString() : "-"}
//                                 </p>

//                                 {/* ACTIONS */}
//                                 <div className="flex items-center gap-3 mt-4">

//                                     {/* ACCEPT */}
//                                     {/* <button className="flex-1 h-10 rounded-full bg-gradient-to-r from-purple-600 to-indigo-500 text-white font-medium hover:opacity-90 transition">
//                                         Accept
//                                     </button> */}
//                                     <button
//                                         onClick={() => handleAccept(inv.id)}
//                                         disabled={acceptingId === inv.id}
//                                         className="flex-1 h-10 rounded-full bg-gradient-to-r from-purple-600 to-indigo-500 text-white font-medium hover:opacity-90 transition disabled:opacity-60"
//                                     >
//                                         {acceptingId === inv.id ? "Accepting..." : "Accept"}
//                                     </button>
//                                     {/* REJECT */}
//                                     <button
//                                         onClick={() => handleReject(inv.id)}
//                                         className="px-4 h-10 rounded-full bg-red-100 text-red-500 font-medium hover:bg-red-200 transition"
//                                     >
//                                         Reject
//                                     </button>

//                                 </div>
//                             </div>
//                         </div>
//                     ))}

//                 </div>

//                 {/* FOOTER */}
//                 <div className="border-t mt-6 pt-4 text-center text-xs text-slate-400">
//                     Invitations expire after 7 days
//                 </div>
//             </div>
//         </div>
//     );
// };




"use client";

import { useState } from "react";
import { usePendingInvites } from "@/hooks/usePendingInvites";
import { useRouter } from "next/navigation";

export const GlobalInviteModal = () => {
    const { invites, loading, refetch } = usePendingInvites();
    const router = useRouter();

    const [open, setOpen] = useState(true);
    const [acceptingId, setAcceptingId] = useState<string | null>(null);

    // 🔥 NEW STATES
    const [rejectingId, setRejectingId] = useState<string | null>(null);
    const [confirmRejectId, setConfirmRejectId] = useState<string | null>(null);

    const handleAccept = async (inviteId: string) => {
        try {
            setAcceptingId(inviteId);

            const res = await fetch("/api/team/accept-invite", {
                method: "POST",
                body: JSON.stringify({ inviteId }),
            });

            const data = await res.json();

            if (!res.ok) throw new Error(data.error);

            await refetch();
            router.refresh();

            if (invites.length === 1) {
                router.push("/dashboard/my-brands");
            }
        } catch (err: any) {
            console.error(err);
            alert(err.message);
        } finally {
            setAcceptingId(null);
        }
    };

    const handleReject = async (inviteId: string) => {
        try {
            setRejectingId(inviteId);

            const res = await fetch("/api/team/reject-invite", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ inviteId }),
            });

            const data = await res.json();

            if (!res.ok) throw new Error(data.error);

            await refetch();
            setConfirmRejectId(null);

        } catch (err: any) {
            console.error(err);
            alert(err.message);
        } finally {
            setRejectingId(null);
        }
    };

    if (loading || !open || invites.length === 0) return null;

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 backdrop-blur-sm">

            <div className="w-full max-w-lg rounded-2xl bg-white shadow-xl p-6 relative">

                {/* CLOSE */}
                <button
                    onClick={() => setOpen(false)}
                    className="absolute top-4 right-4 text-slate-500 hover:text-black"
                >
                    ✕
                </button>

                <h2 className="text-lg font-semibold text-slate-900">
                    Team Invitations
                </h2>

                <p className="text-sm text-slate-500 mt-1">
                    You have {invites.length} pending invitation
                </p>

                <div className="mt-5 space-y-4 max-h-[420px] overflow-y-auto pr-1">

                    {invites.map((inv) => (
                        <div
                            key={inv.id}
                            className="border border-slate-200 rounded-xl p-4 flex gap-4 items-start"
                        >

                            {/* AVATAR */}
                            <div className="h-12 w-12 rounded-full bg-gradient-to-br from-purple-500 to-indigo-500 text-white flex items-center justify-center font-semibold shrink-0">
                                {inv.email?.charAt(0).toUpperCase()}
                            </div>

                            <div className="flex-1">

                                <div className="flex-col sm:flex-row flex sm:items-center gap-2">
                                    <p className="font-medium text-slate-900">
                                        {inv.email}
                                    </p>

                                    <span className="text-xs mr-auto sm:mr-0 bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full capitalize">
                                        {inv.role}
                                    </span>
                                </div>

                                <p className="text-xs text-slate-400 mt-2">
                                    Invited • {inv.invited_at ? new Date(inv.invited_at).toLocaleDateString() : "-"}
                                </p>

                                {/*  CONDITION BASED UI */}
                                {confirmRejectId === inv.id ? (
                                    <div className="mt-4">
                                        <p className="text-sm text-red-500 font-medium mb-3">
                                            Are you sure you want to reject this invitation?
                                        </p>

                                        <div className="flex items-center gap-3">
                                            <button
                                                onClick={() => handleReject(inv.id)}
                                                disabled={rejectingId === inv.id}
                                                className="flex-1 h-10 rounded-full bg-red-500 text-white font-medium hover:opacity-90 transition"
                                            >
                                                {rejectingId === inv.id ? "Rejecting..." : "Yes, Reject"}
                                            </button>

                                            <button
                                                onClick={() => setConfirmRejectId(null)}
                                                className="flex-1 text-sm text-slate-600 hover:text-black"
                                            >
                                                Cancel
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-3 mt-4">

                                        {/* ACCEPT */}
                                        <button
                                            onClick={() => handleAccept(inv.id)}
                                            disabled={acceptingId === inv.id}
                                            className="flex-1 h-10 rounded-full bg-gradient-to-r from-purple-600 to-indigo-500 text-white font-medium hover:opacity-90 transition disabled:opacity-60"
                                        >
                                            {acceptingId === inv.id ? "Accepting..." : "Accept"}
                                        </button>

                                        {/* REJECT */}
                                        <button
                                            onClick={() => setConfirmRejectId(inv.id)}
                                            className="px-4 h-10 rounded-full bg-red-100 text-red-500 font-medium hover:bg-red-200 transition"
                                        >
                                            Reject
                                        </button>

                                    </div>
                                )}

                            </div>
                        </div>
                    ))}

                </div>

                <div className="border-t mt-6 pt-4 text-center text-xs text-slate-400">
                    Invitations expire after 7 days
                </div>
            </div>
        </div>
    );
};
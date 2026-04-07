"use client";

import { useEffect, useState } from "react";
import { toast } from "react-toastify";


type Member = {
    id: string;
    role: string;
    user: {
        email: string;
        name: string;
        avatar_url: string | null;
    };
};

type Invitation = {
    id: string;
    email: string;
    role: string;
    status: string;
};
type Permissions = {
    include_in_chats: boolean;
    view_analytics: boolean;
    manage_submissions: boolean;
    manage_creators: boolean;
    view_finance: boolean;
    manage_campaigns: boolean;
    manage_integrations: boolean;
    manage_settings: boolean;
};
const EditPermissionsModal = ({
    member,
    onClose,
}: {
    member: any;
    onClose: () => void;
}) => {
    const [permissions, setPermissions] = useState<Permissions>(
        member.permissions || {
            include_in_chats: false,
            view_analytics: false,
            manage_submissions: false,
            manage_creators: false,
            view_finance: false,
            manage_campaigns: false,
            manage_integrations: false,
            manage_settings: false,
        }
    );

    const toggle = (key: keyof Permissions) => {
        setPermissions((prev) => ({
            ...prev,
            [key]: !prev[key],
        }));
    };

    const handleSave = async () => {
        try {
            const res = await fetch(`/api/team/members/${member.id}`, {
                method: "PATCH",
                body: JSON.stringify({ permissions }),
            });

            const data = await res.json();

            if (!res.ok) throw new Error(data.error);

            toast.success("Permissions updated");
            // window.location.reload();
        } catch (err: any) {
            toast.error(err.message);
        }
    };

    const perms: { key: keyof Permissions; label: string; desc: string }[] = [
        { key: "include_in_chats", label: "Include in Chats", desc: "Add to brand chat channels" },
        { key: "view_analytics", label: "View Analytics", desc: "Access analytics dashboard" },
        { key: "manage_submissions", label: "Manage Submissions", desc: "Approve/reject submissions" },
        { key: "manage_creators", label: "Manage Creators", desc: "Invite/remove creators" },
        { key: "view_finance", label: "View Finance", desc: "Payments & payouts" },
        { key: "manage_campaigns", label: "Manage Campaigns", desc: "Create/manage campaigns" },
        { key: "manage_integrations", label: "Manage Integrations", desc: "Shopify, Meta, etc." },
        { key: "manage_settings", label: "Manage Settings", desc: "Brand settings" },
    ];

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 backdrop-blur-sm">

            <div className="bg-white p-6 rounded-2xl w-full max-w-md shadow-xl">

                {/* HEADER */}
                <h3 className="font-semibold text-lg mb-4">
                    Edit Permissions
                </h3>

                {/* PERMISSIONS */}
                <div className="max-h-60 overflow-y-auto space-y-4">

                    {perms.map((perm) => (
                        <div key={perm.key} className="flex items-center justify-between">

                            {/* TEXT */}
                            <div>
                                <p className="text-sm font-medium text-slate-900">
                                    {perm.label}
                                </p>
                                <p className="text-xs text-slate-500">
                                    {perm.desc}
                                </p>
                            </div>

                            {/* TOGGLE */}
                            <button
                                onClick={() => toggle(perm.key)}
                                className={`w-10 h-5 flex items-center rounded-full p-1 transition ${permissions[perm.key]
                                    ? "bg-blue-500"
                                    : "bg-slate-300"
                                    }`}
                            >
                                <div
                                    className={`bg-white w-4 h-4 rounded-full shadow-md transform transition ${permissions[perm.key]
                                        ? "translate-x-5"
                                        : ""
                                        }`}
                                />
                            </button>
                        </div>
                    ))}

                </div>

                {/* FOOTER */}
                <div className="flex justify-end gap-3 mt-6">
                    <button
                        onClick={onClose}
                        className="text-sm text-slate-600 hover:text-black"
                    >
                        Cancel
                    </button>

                    <button
                        onClick={handleSave}
                        className="bg-blue-500 text-white px-5 py-2 rounded-full text-sm font-medium hover:opacity-90"
                    >
                        Save
                    </button>
                </div>
            </div>
        </div>
    );
};
// const TeamMembers = ({ members }: { members: Member[] }) => {
//     if (!members.length) {
//         return <p className="text-sm text-slate-500">No members yet</p>;
//     }

//     return (
//         <div className="space-y-3">
//             {members.map((m) => (
//                 <div
//                     key={m.id}
//                     className="border border-slate-200 p-4 rounded-xl flex justify-between"
//                 >
//                     <div className="flex items-center gap-3">
//                         <div className="h-10 w-10 rounded-full bg-blue-500 text-white flex items-center justify-center overflow-hidden">
//                             {m?.user?.avatar_url ? (
//                                 <img
//                                     src={m.user.avatar_url}
//                                     alt="avatar"
//                                     className="h-full w-full object-cover"
//                                 />
//                             ) : (
//                                 <span className="text-sm font-semibold">
//                                     {m?.user?.name?.charAt(0) || "U"}
//                                 </span>
//                             )}
//                         </div>

//                         <div>
//                             <p className="text-sm font-medium">{m.user?.name}</p>
//                             <p className="text-xs text-slate-500">{m.user?.email}</p>
//                         </div>
//                     </div>

//                     <span className="flex items-center justify-centertext-xs bg-slate-100 px-3 py-1 rounded-full">
//                         {m.role}
//                     </span>
//                 </div>
//             ))}
//         </div>
//     );
// };

// const Invitations = ({ invites }: { invites: Invitation[] }) => {
//     if (!invites.length) {
//         return (
//             <p className="text-sm text-slate-500">
//                 No pending invitations
//             </p>
//         );
//     }

//     return (
//         <div className="space-y-3">
//             {invites.map((inv) => (
//                 <div
//                     key={inv.id}
//                     className="border border-slate-200 p-4 rounded-xl flex justify-between"
//                 >
//                     <div>
//                         <p className="text-sm font-medium">{inv.email}</p>
//                         <p className="text-xs text-slate-500">{inv.role}</p>
//                     </div>

//                     <span className="flex items-center justify-center text-xs bg-yellow-100 px-3 py-1 rounded-full">
//                         {inv.status}
//                     </span>
//                 </div>
//             ))}
//         </div>
//     );
// };

// const InviteModal = ({
//     onClose,
//     onSuccess,
// }: {
//     onClose: () => void;
//     onSuccess: () => void;
// }) => {
//     const [email, setEmail] = useState("");
//     const [role, setRole] = useState("member");
//     const [loading, setLoading] = useState(false);
//     const defaultPermissions = {
//         include_in_chats: true,
//         view_analytics: true,
//         manage_submissions: true,
//         manage_creators: true,
//         view_finance: true,
//         manage_campaigns: true,
//         manage_integrations: true,
//         manage_settings: true,
//     };

//     const [permissions, setPermissions] = useState(defaultPermissions);

//     useEffect(() => {
//         if (role === "owner") {
//             setPermissions({
//                 include_in_chats: true,
//                 view_analytics: true,
//                 manage_submissions: true,
//                 manage_creators: true,
//                 view_finance: true,
//                 manage_campaigns: true,
//                 manage_integrations: true,
//                 manage_settings: true,
//             });
//         }
//     }, [role]);

//     const togglePermission = (key: string) => {
//         if (role === "owner") return;

//         setPermissions((prev) => ({
//             ...prev,
//             [key]: !prev[key],
//         }));
//     };

//     const handleDeselectAll = () => {
//         if (role === "owner") return;

//         const updated = Object.keys(permissions).reduce((acc, key) => {
//             acc[key] = false;
//             return acc;
//         }, {} as any);

//         setPermissions(updated);
//     };
//     const handleInvite = async () => {
//         if (!email) return toast.error("Email required");

//         try {
//             setLoading(true);

//             const res = await fetch("/api/team/invite", {
//                 method: "POST",
//                 body: JSON.stringify({
//                     email,
//                     role,
//                     permissions,
//                 }),
//             });

//             const data = await res.json();

//             if (!res.ok) throw new Error(data.error);

//             toast.success("Invitation sent");

//             onSuccess();
//             onClose();
//         } catch (err: any) {
//             toast.error(err.message);
//         } finally {
//             setLoading(false);
//         }
//     };

//     return (
//         <div className="fixed inset-0 flex items-center justify-center bg-black/40">

//             <div className="bg-white p-6 rounded-xl w-full max-w-md">

//                 <h3 className="font-semibold mb-4">
//                     Invite New Team Member
//                 </h3>

//                 <input
//                     placeholder="Email"
//                     className="w-full mb-3 p-3 bg-slate-100 rounded-full"
//                     value={email}
//                     onChange={(e) => setEmail(e.target.value)}
//                 />

//                 <select
//                     className="w-full mb-4 p-3 bg-slate-100 rounded-full"
//                     value={role}
//                     onChange={(e) => setRole(e.target.value)}
//                 >
//                     <option value="member">Member</option>
//                     <option value="admin">Admin</option>
//                     <option value="owner">Owner</option>
//                 </select>
//                 <div className="border-t pt-4">

//                     <div className="flex justify-between items-center mb-3">
//                         <p className="text-sm font-medium">Permissions</p>

//                         <button
//                             onClick={handleDeselectAll}
//                             className="text-xs text-purple-600"
//                         >
//                             Deselect All
//                         </button>
//                     </div>

//                     <div className="max-h-48 overflow-y-auto space-y-3">

//                         {[
//                             { key: "include_in_chats", label: "Include in Chats", desc: "Add to brand chat channels" },
//                             { key: "view_analytics", label: "View Analytics", desc: "Access analytics dashboard" },
//                             { key: "manage_submissions", label: "Manage Submissions", desc: "Approve/reject submissions" },
//                             { key: "manage_creators", label: "Manage Creators", desc: "Invite/remove creators" },
//                             { key: "view_finance", label: "View Finance", desc: "Payments & payouts" },
//                             { key: "manage_campaigns", label: "Manage Campaigns", desc: "Create/manage campaigns" },
//                             { key: "manage_integrations", label: "Manage Integrations", desc: "Shopify, Meta, etc." },
//                             { key: "manage_settings", label: "Manage Settings", desc: "Brand settings" },
//                         ].map((perm) => (
//                             <div key={perm.key} className="flex items-center justify-between">

//                                 <div>
//                                     <p className="text-sm font-medium">{perm.label}</p>
//                                     <p className="text-xs text-slate-500">{perm.desc}</p>
//                                 </div>

//                                 {/* TOGGLE */}
//                                 <button
//                                     onClick={() => togglePermission(perm.key)}
//                                     className={`w-10 h-5 flex items-center rounded-full p-1 transition ${permissions[perm.key]
//                                             ? "bg-purple-500"
//                                             : "bg-slate-300"
//                                         } ${role === "owner" && "opacity-50 cursor-not-allowed"}`}
//                                 >
//                                     <div
//                                         className={`bg-white w-4 h-4 rounded-full shadow-md transform transition ${permissions[perm.key] ? "translate-x-5" : ""
//                                             }`}
//                                     />
//                                 </button>

//                             </div>
//                         ))}
//                     </div>
//                 </div>
//                 <div className="flex justify-end gap-3">
//                     <button onClick={onClose}>Cancel</button>

//                     <button
//                         onClick={handleInvite}
//                         disabled={loading}
//                         className="bg-blue-500 text-white px-4 py-2 rounded-full"
//                     >
//                         {loading ? "Sending..." : "Invite"}
//                     </button>
//                 </div>
//             </div>
//         </div>
//     );
// };
const TableSkeleton = ({ rows = 5 }: { rows?: number }) => {
    return (
        <div className="border border-slate-200 rounded-xl overflow-hidden animate-pulse">

            {/* HEADER */}
            <div className="grid grid-cols-[2fr_1fr_1fr] px-4 py-3 border-b border-b-slate-200">
                <div className="h-3 bg-slate-200 rounded w-32" />
                <div className="h-3 bg-slate-200 rounded w-16" />
                <div className="h-3 bg-slate-200 rounded w-16 ml-auto" />
            </div>

            {/* ROWS */}
            {Array.from({ length: rows }).map((_, i) => (
                <div
                    key={i}
                    className="grid grid-cols-[2fr_1fr_1fr] items-center px-4 py-4 border-b border-b-slate-200 last:border-none"
                >
                    {/* USER */}
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-slate-200" />
                        <div className="space-y-2">
                            <div className="h-3 w-32 bg-slate-200 rounded" />
                            <div className="h-3 w-40 bg-slate-200 rounded" />
                        </div>
                    </div>

                    {/* ROLE */}
                    <div>
                        <div className="h-6 w-16 bg-slate-200 rounded-full" />
                    </div>

                    {/* ACTION */}
                    <div className="flex justify-end gap-2">
                        <div className="h-8 w-8 bg-slate-200 rounded-full" />
                        <div className="h-8 w-8 bg-slate-200 rounded-full" />
                    </div>
                </div>
            ))}
        </div>
    );
};
const InviteTableSkeleton = ({ rows = 5 }: { rows?: number }) => {
    return (
        <div className="border border-slate-200 rounded-xl overflow-hidden animate-pulse">

            {/* HEADER */}
            <div className="grid grid-cols-[2fr_1fr_1fr_1fr_0.5fr] px-4 py-3 border-b border-b-slate-200">
                <div className="h-3 bg-slate-200 rounded w-32" />
                <div className="h-3 bg-slate-200 rounded w-20" />
                <div className="h-3 bg-slate-200 rounded w-20" />
                <div className="h-3 bg-slate-200 rounded w-16" />
                <div className="h-3 bg-slate-200 rounded w-10 ml-auto" />
            </div>

            {/* ROWS */}
            {Array.from({ length: rows }).map((_, i) => (
                <div
                    key={i}
                    className="grid grid-cols-[2fr_1fr_1fr_1fr_0.5fr] items-center px-4 py-4 border-b border-b-slate-200 last:border-none"
                >
                    <div className="h-3 w-40 bg-slate-200 rounded" />
                    <div className="h-3 w-20 bg-slate-200 rounded" />
                    <div className="h-3 w-20 bg-slate-200 rounded" />
                    <div className="h-6 w-16 bg-slate-200 rounded-full" />
                    <div className="flex justify-end">
                        <div className="h-8 w-8 bg-slate-200 rounded-full" />
                    </div>
                </div>
            ))}
        </div>
    );
};
const TeamMembers = ({ members }: { members: any[] }) => {
    const [openSettings, setOpenSettings] = useState<any | null>(null);

    if (!members.length) {
        return <p className="text-sm text-slate-500">No members yet</p>;
    }

    // current logged-in user
    const currentUser = members.find((m) => m.is_current_user);
    const currentRole = currentUser?.role;

    return (
        <>
            <div className="border border-slate-200 rounded-xl overflow-hidden">

                {/* HEADER */}
                <div className="grid grid-cols-[2fr_1fr_1fr] px-4 py-3 text-xs font-medium text-slate-500 border-b border-b-slate-200">
                    <span>Team Members</span>
                    <span>Role</span>
                    <span className="text-right">Action</span>
                </div>

                {members.map((m) => {
                    const isMainOwner = m.is_main_owner;
                    const isOwner = m.role === "owner";

                    return (
                        <div
                            key={m.id}
                            className="grid grid-cols-[2fr_1fr_1fr] items-center px-4 py-4 border-b last:border-none"
                        >
                            {/* USER */}
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-full bg-blue-500 text-white flex items-center justify-center overflow-hidden">
                                    {m?.user?.avatar_url ? (
                                        <img
                                            src={m.user.avatar_url}
                                            className="h-full w-full object-cover"
                                        />
                                    ) : (
                                        <span className="text-sm font-semibold">
                                            {m?.user?.name?.charAt(0) || "U"}
                                        </span>
                                    )}
                                </div>

                                <div>
                                    <p className="text-sm font-medium">{m.user?.name}</p>
                                    <p className="text-xs text-slate-500">{m.user?.email}</p>
                                </div>
                            </div>

                            {/* ROLE */}
                            <div>
                                <span className="text-xs bg-slate-100 px-3 py-1 rounded-full capitalize">
                                    {m.role}
                                </span>
                            </div>

                            {/* ACTIONS */}
                            <div className="flex justify-end gap-2">

                                {/*  SETTINGS (ONLY admin/owner & NOT owner target) */}
                                {(currentRole === "admin" || currentRole === "owner") &&
                                    !isOwner && (
                                        <button
                                            onClick={() => setOpenSettings(m)}
                                            className="h-8 w-8 flex items-center justify-center rounded-full border border-slate-200 hover:bg-slate-100"
                                        >
                                            ⚙️
                                        </button>
                                    )}

                                {/*  REMOVE (ONLY main owner & NOT self) */}
                                {currentRole === "owner" &&
                                    !isMainOwner && (
                                        <button
                                            onClick={async () => {
                                                await fetch(`/api/team/members/${m.id}`, {
                                                    method: "DELETE",
                                                });
                                                window.location.reload();
                                            }}
                                            className="h-8 w-8 flex items-center justify-center rounded-full border border-slate-200 hover:bg-red-50"
                                        >
                                            ✕
                                        </button>
                                    )}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* SETTINGS MODAL */}
            {openSettings && (
                <EditPermissionsModal
                    member={openSettings}
                    onClose={() => setOpenSettings(null)}
                />
            )}
        </>
    );
};
const Invitations = ({ invites, setActiveTab }: { invites: any[], setActiveTab: any }) => {
    if (!invites.length) {
        return (
            <div className="border border-slate-200 rounded-xl p-10 flex flex-col items-center justify-center text-center">

                {/* ICON */}
                <div className="h-12 w-12 flex items-center justify-center rounded-full bg-slate-100 mb-4">
                    <svg
                        className="h-6 w-6 text-slate-400"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        viewBox="0 0 24 24"
                    >
                        <path d="M3 7l9 6 9-6" />
                        <path d="M21 7v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7" />
                    </svg>
                </div>

                {/* TITLE */}
                <p className="text-base font-medium text-slate-900">
                    No pending invitations
                </p>

                {/* SUBTEXT */}
                <p className="text-sm text-slate-500 mt-1">
                    Invitations will appear here once you invite new team members.
                </p>
            </div>
        );
    }

    const handleDelete = async (id: string) => {
        try {
            const res = await fetch(`/api/team/invite/${id}`, {
                method: "DELETE",
            });

            const data = await res.json();

            if (!res.ok) throw new Error(data.error);

            toast.success("Invitation deleted");
            setActiveTab("members");
        } catch (err: any) {
            toast.error(err.message);
        }
    };

    return (
        <div className="border border-slate-200 rounded-xl overflow-hidden">

            {/* HEADER */}
            <div className="grid grid-cols-[2fr_1fr_1fr_1fr_0.5fr] px-4 py-3 text-xs font-medium text-slate-500 border-b border-b-slate-200">
                <span>Team Members</span>
                <span>Date</span>
                <span>Invited By</span>
                <span>Status</span>
                <span className="text-right">Action</span>
            </div>

            {/* ROWS */}
            {invites.map((inv) => (
                <div
                    key={inv.id}
                    className="grid grid-cols-[2fr_1fr_1fr_1fr_0.5fr] items-center px-4 py-4 border-b border-b-slate-200 last:border-none"
                >
                    {/* EMAIL */}
                    <div className="truncate text-sm font-medium">
                        {inv.email}
                    </div>

                    {/* DATE */}
                    <div className="text-sm text-slate-500">
                        {inv.invited_at
                            ? new Date(inv.invited_at).toLocaleDateString()
                            : "-"}
                    </div>

                    {/* INVITED BY */}
                    <div className="text-sm text-slate-500">
                        You
                    </div>

                    {/* STATUS */}
                    <div>
                        <span className="text-xs px-3 py-1 rounded-full bg-yellow-100 text-yellow-700 capitalize">
                            {inv.status}
                        </span>
                    </div>

                    {/* ACTION */}
                    <div className="flex justify-end">
                        <button
                            onClick={() => handleDelete(inv.id)}
                            className="h-8 w-8 flex items-center justify-center rounded-full border border-slate-200 hover:bg-red-50 transition"
                        >
                            ✕
                        </button>
                    </div>
                </div>
            ))}
        </div>
    );
};

const InviteModal = ({
    onClose,
    onSuccess,
}: {
    onClose: () => void;
    onSuccess: () => void;
}) => {
    const [email, setEmail] = useState("");
    const [role, setRole] = useState("");
    const [loading, setLoading] = useState(false);

    const defaultPermissions: Permissions = {
        include_in_chats: true,
        view_analytics: true,
        manage_submissions: true,
        manage_creators: true,
        view_finance: true,
        manage_campaigns: true,
        manage_integrations: true,
        manage_settings: true,
    };

    const [permissions, setPermissions] = useState<Permissions>(defaultPermissions);

    // OWNER → FORCE ALL TRUE
    useEffect(() => {
        if (role === "owner") {
            setPermissions(defaultPermissions);
        }
    }, [role]);

    const togglePermission = (key: keyof Permissions) => {
        if (role === "owner") return;

        setPermissions((prev) => ({
            ...prev,
            [key]: !prev[key],
        }));
    };

    //  SELECT / DESELECT TOGGLE
    const areAllSelected = Object.values(permissions).every(Boolean);

    const handleToggleAll = () => {
        if (role === "owner") return;

        const updated = (Object.keys(permissions) as (keyof Permissions)[]).reduce((acc, key) => {
            acc[key] = !areAllSelected;
            return acc;
        }, {} as any);

        setPermissions(updated);
    };

    const handleInvite = async () => {
        if (!email) return toast.error("Email required");
        if (!role) return toast.error("Please select role");

        try {
            setLoading(true);

            const res = await fetch("/api/team/invite", {
                method: "POST",
                body: JSON.stringify({
                    email,
                    role,
                    permissions,
                }),
            });

            const data = await res.json();

            if (!res.ok) throw new Error(data.error);

            toast.success("Invitation sent");

            onSuccess();
            onClose();
        } catch (err: any) {
            toast.error(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 flex items-center justify-center bg-black/40">
            <div className="bg-white p-6 rounded-xl w-full max-w-md">

                <h3 className="font-semibold mb-4">
                    Invite New Team Member
                </h3>

                <input
                    placeholder="Email"
                    className="w-full mb-3 p-3 bg-slate-100 rounded-full"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                />

                {/* ROLE SELECT */}
                <select
                    className="w-full mb-4 p-3 bg-slate-100 rounded-full"
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                >
                    <option value="">Select Role</option>
                    <option value="member">Member</option>
                    <option value="admin">Admin</option>
                    <option value="owner">Owner</option>
                </select>

                {/* SHOW ONLY WHEN ROLE SELECTED */}
                {role && (
                    <div className="border-t pt-4">

                        <div className="flex justify-between items-center mb-3">
                            <p className="text-sm font-medium">Permissions</p>

                            <button
                                onClick={handleToggleAll}
                                disabled={role === "owner"}
                                className={`text-xs ${role === "owner"
                                    ? "text-slate-400 cursor-not-allowed"
                                    : "text-blue-600"
                                    }`}
                            >
                                {areAllSelected ? "Deselect All" : "Select All"}
                            </button>
                        </div>

                        <div className="max-h-48 overflow-y-auto space-y-3">

                            {[
                                { key: "include_in_chats", label: "Include in Chats", desc: "Add to brand chat channels" },
                                { key: "view_analytics", label: "View Analytics", desc: "Access analytics dashboard" },
                                { key: "manage_submissions", label: "Manage Submissions", desc: "Approve/reject submissions" },
                                { key: "manage_creators", label: "Manage Creators", desc: "Invite/remove creators" },
                                { key: "view_finance", label: "View Finance", desc: "Payments & payouts" },
                                { key: "manage_campaigns", label: "Manage Campaigns", desc: "Create/manage campaigns" },
                                { key: "manage_integrations", label: "Manage Integrations", desc: "Shopify, Meta, etc." },
                                { key: "manage_settings", label: "Manage Settings", desc: "Brand settings" },
                            ].map((perm) => (
                                <div key={perm.key} className="flex items-center justify-between">

                                    <div>
                                        <p className="text-sm font-medium">{perm.label}</p>
                                        <p className="text-xs text-slate-500">{perm.desc}</p>
                                    </div>

                                    <button
                                        onClick={() => togglePermission(perm.key as keyof Permissions)}
                                        className={`w-10 h-5 flex items-center rounded-full p-1 transition ${permissions[perm.key as keyof Permissions]
                                            ? "bg-blue-500"
                                            : "bg-slate-300"
                                            } ${role === "owner"
                                                ? "opacity-50 cursor-not-allowed"
                                                : ""
                                            }`}
                                    >
                                        <div
                                            className={`bg-white w-4 h-4 rounded-full shadow-md transform transition ${permissions[perm.key as keyof Permissions]
                                                ? "translate-x-5"
                                                : ""
                                                }`}
                                        />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                <div className="flex justify-end gap-3 mt-4">
                    <button onClick={onClose}>Cancel</button>

                    <button
                        onClick={handleInvite}
                        disabled={loading}
                        className="bg-blue-500 text-white px-4 py-2 rounded-full"
                    >
                        {loading ? "Sending..." : "Invite"}
                    </button>
                </div>
            </div>
        </div>
    );
};
const TeamManagementCard = () => {
    const [activeTab, setActiveTab] = useState<"members" | "invites">("members");
    const [openModal, setOpenModal] = useState(false);

    const [members, setMembers] = useState<Member[]>([]);
    const [invites, setInvites] = useState<Invitation[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(10);
    const [membersTotal, setMembersTotal] = useState(0);
    const [invitesTotal, setInvitesTotal] = useState(0);

    const fetchData = async () => {
        try {
            setLoading(true);

            const [membersRes, invitesRes] = await Promise.all([
                fetch(`/api/team/members?page=${page}&limit=${limit}`),
                fetch(`/api/team/invitations?page=${page}&limit=${limit}`),
            ]);

            const membersData = await membersRes.json();
            const invitesData = await invitesRes.json();

            setMembers(membersData.data || []);
            setInvites(invitesData.data || []);
            setMembersTotal(membersData.pagination?.total || 0);
            setInvitesTotal(invitesData.pagination?.total || 0);

        } catch {
            toast.error("Failed to load data");
        } finally {
            setLoading(false);
        }
    };
    useEffect(() => {
        fetchData();
    }, [page, limit, activeTab]);
    useEffect(() => {
        setPage(1);
    }, [activeTab]);
    const total = activeTab === "members" ? membersTotal : invitesTotal;
    return (
        <>
            <div className="w-full rounded-[28px] border border-slate-200 bg-white p-6">

                {/* HEADER */}
                <div className="flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-slate-900">
                        Team Management
                    </h2>

                    <button
                        onClick={() => setOpenModal(true)}
                        className="px-4 py-2 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 text-white text-sm"
                    >
                        + Add Member
                    </button>
                </div>

                {/* TABS */}
                <div className="mt-6 bg-slate-200 p-1 rounded-full flex">
                    <button
                        onClick={() => setActiveTab("members")}
                        className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-full text-sm font-medium ${activeTab === "members"
                            ? "bg-white shadow"
                            : "text-slate-500"
                            }`}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" color="currentColor" className="h-5 w-5 flex-shrink-0 text-primary-brand" stroke-width="2" stroke="currentColor"><path d="M13 7C13 9.20914 11.2091 11 9 11C6.79086 11 5 9.20914 5 7C5 4.79086 6.79086 3 9 3C11.2091 3 13 4.79086 13 7Z" stroke="currentColor" stroke-width="2"></path><path d="M15 11C17.2091 11 19 9.20914 19 7C19 4.79086 17.2091 3 15 3" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"></path><path d="M11 14H7C4.23858 14 2 16.2386 2 19C2 20.1046 2.89543 21 4 21H14C15.1046 21 16 20.1046 16 19C16 16.2386 13.7614 14 11 14Z" stroke="currentColor" stroke-linejoin="round" stroke-width="2"></path><path d="M17 14C19.7614 14 22 16.2386 22 19C22 20.1046 21.1046 21 20 21H18.5" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"></path></svg>
                        <span>Team Members</span>
                    </button>

                    <button
                        onClick={() => setActiveTab("invites")}
                        className={`flex items-center justify-center gap-2 flex-1 py-2 rounded-full text-sm font-medium ${activeTab === "invites"
                            ? "bg-white shadow"
                            : "text-slate-500"
                            }`}
                    >
                        <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" stroke="currentColor" strokeWidth="2">
                            <path d="M16 7C16 9.2 14.2 11 12 11S8 9.2 8 7s1.8-4 4-4 4 1.8 4 4Z" />
                            <path d="M14 14h-4c-2.7 0-5 2.3-5 5 0 1.1.9 2 2 2h10c1.1 0 2-.9 2-2 0-2.7-2.3-5-5-5Z" />
                        </svg>
                        <span>Sent Invitations</span>
                    </button>
                </div>

                {/* CONTENT */}
                <div className="mt-6">
                    {loading ? (
                        activeTab === "members" ? (
                            <TableSkeleton rows={2} />
                        ) : (
                            <InviteTableSkeleton rows={2} />
                        )
                    ) : activeTab === "members" ? (
                        <TeamMembers members={members} />
                    ) : (
                        <Invitations invites={invites} setActiveTab={setActiveTab} />
                    )}
                </div>
                {/* PAGINATION FOOTER */}
                {!loading && (
                    <div className="flex items-center justify-between mt-6 text-xs text-slate-500">

                        <div className="flex items-center gap-2">
                            <select
                                value={limit}
                                onChange={(e) => {
                                    setLimit(Number(e.target.value));
                                    setPage(1);
                                }}
                                className="bg-slate-200 px-2 py-1 rounded-md"
                            >
                                <option value={10}>10</option>
                                <option value={20}>20</option>
                                <option value={25}>25</option>
                                <option value={50}>50</option>
                                <option value={100}>100</option>
                            </select>
                            <span>per page</span>
                        </div>

                        <span>
                            Showing{" "}
                            {total === 0 ? 0 : (page - 1) * limit + 1}-
                            {Math.min(page * limit, total)} of {total} results
                        </span>

                        <div className="flex gap-2">
                            <button
                                disabled={page === 1}
                                onClick={() => setPage((p) => p - 1)}
                                className="px-3 py-1 rounded-md bg-slate-200 disabled:opacity-50"
                            >
                                Prev
                            </button>

                            <button
                                disabled={page * limit >= total}
                                onClick={() => setPage((p) => p + 1)}
                                className="px-3 py-1 rounded-md bg-slate-200 disabled:opacity-50"
                            >
                                Next
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {openModal && (
                <InviteModal
                    onClose={() => setOpenModal(false)}
                    onSuccess={fetchData}
                />
            )}
        </>
    );
};

export default TeamManagementCard;
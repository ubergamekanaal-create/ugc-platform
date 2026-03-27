"use client";

import { useState } from "react";

const TeamManagementCard = () => {
    const [activeTab, setActiveTab] = useState<"members" | "invites">("members");
    const [openModal, setOpenModal] = useState(false);

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
                        className="flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 text-white text-sm"
                    >
                        + Add Member
                    </button>
                </div>

                {/* TABS */}
                <div className="mt-6 bg-slate-200 p-1 rounded-full flex">
                    <button
                        onClick={() => setActiveTab("members")}
                        className={`flex-1 py-2 gap-x-2 flex items-center justify-center rounded-full text-sm font-medium transition ${activeTab === "members"
                            ? "bg-white shadow text-slate-900"
                            : "text-slate-500"
                            }`}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" color="currentColor" className="h-5 w-5 flex-shrink-0 text-primary-brand" stroke-width="2" stroke="currentColor"><path d="M13 7C13 9.20914 11.2091 11 9 11C6.79086 11 5 9.20914 5 7C5 4.79086 6.79086 3 9 3C11.2091 3 13 4.79086 13 7Z" stroke="currentColor" stroke-width="2"></path><path d="M15 11C17.2091 11 19 9.20914 19 7C19 4.79086 17.2091 3 15 3" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"></path><path d="M11 14H7C4.23858 14 2 16.2386 2 19C2 20.1046 2.89543 21 4 21H14C15.1046 21 16 20.1046 16 19C16 16.2386 13.7614 14 11 14Z" stroke="currentColor" stroke-linejoin="round" stroke-width="2"></path><path d="M17 14C19.7614 14 22 16.2386 22 19C22 20.1046 21.1046 21 20 21H18.5" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"></path></svg>
                        <span>Team Members</span>
                    </button>

                    <button
                        onClick={() => setActiveTab("invites")}
                        className={`flex-1 py-2 flex items-center justify-center gap-x-2 rounded-full text-sm font-medium transition ${activeTab === "invites"
                            ? "bg-white shadow text-slate-900"
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
                    {activeTab === "members" ? <TeamMembers /> : <Invitations />}
                </div>
            </div>

            {/* MODAL */}
            {openModal && <InviteModal onClose={() => setOpenModal(false)} />}
        </>
    );
};

export default TeamManagementCard;





/* ---------------- MODAL ---------------- */

const InviteModal = ({ onClose }: { onClose: () => void }) => {
    const [role, setRole] = useState("Select Role");

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">

            <div className="w-full max-w-md rounded-2xl bg-white shadow-xl">

                {/* HEADER */}
                <div className="flex items-center justify-between p-5 border-b">
                    <h3 className="font-semibold text-slate-900">
                        Invite New Team Member
                    </h3>

                    <button onClick={onClose} className="text-slate-500 text-lg">
                        ✕
                    </button>
                </div>

                {/* BODY */}
                <div className="p-5 space-y-5">

                    {/* Email */}
                    <div>
                        <label className="text-sm text-slate-700">
                            Email Address
                        </label>
                        <input
                            placeholder="Write email address"
                            className="w-full mt-2 px-4 py-3 rounded-full bg-slate-100 text-sm outline-none"
                        />
                    </div>

                    {/* Role */}
                    <div>
                        <label className="text-sm text-slate-700">Role</label>

                        <select
                            value={role}
                            onChange={(e) => setRole(e.target.value)}
                            className="w-full mt-2 px-4 py-3 rounded-full bg-slate-100 text-sm outline-none"
                        >
                            <option disabled>Select Role</option>
                            <option>Admin</option>
                            <option>Member</option>
                            <option>Owner</option>
                        </select>
                    </div>
                </div>

                {/* FOOTER */}
                <div className="flex justify-end gap-3 p-5 border-t bg-slate-50 rounded-b-2xl">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 rounded-full bg-slate-200 text-sm"
                    >
                        Cancel
                    </button>

                    <button className="px-5 py-2 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 text-white text-sm">
                        Invite
                    </button>
                </div>
            </div>
        </div>
    );
};





/* ---------------- TEAM MEMBERS ---------------- */

const TeamMembers = () => {
    return (
        <div>
            <div className="flex justify-between px-4 text-xs text-slate-500 mb-2">
                <span>Team Members</span>
                <span>Role</span>
            </div>

            <div className="border border-slate-200 rounded-2xl p-4 flex items-center justify-between bg-white">

                <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-blue-500 text-white flex items-center justify-center text-sm font-semibold">
                        RT
                    </div>

                    <div>
                        <p className="text-sm font-medium text-slate-900">
                            Roefat Tsjekutsjov
                        </p>
                        <p className="text-xs text-slate-500">
                            roefik@hotmail.com
                        </p>
                    </div>
                </div>

                <span className="text-xs bg-slate-100 px-3 py-1 rounded-full text-slate-700">
                    Owner
                </span>
            </div>

            <div className="flex items-center justify-between mt-4 text-xs text-slate-500">
                <div className="flex items-center gap-2">
                    <select className="bg-slate-200 px-2 py-1 rounded-md">
                        <option>10</option>
                        <option>20</option>
                        <option>25</option>
                        <option>50</option>
                        <option>100</option>
                    </select>
                    <span>per page</span>
                </div>

                <span>Showing 1-1 of 1 results</span>
            </div>
        </div>
    );
};





/* ---------------- INVITATIONS ---------------- */

const Invitations = () => {
    return (
        <div className="border border-slate-200 rounded-2xl bg-white p-10 flex flex-col items-center justify-center text-center">

            <div className="text-4xl text-slate-300"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" className="lucide lucide-mail w-12 h-12 mx-auto text-gray-300" aria-hidden="true"><path d="m22 7-8.991 5.727a2 2 0 0 1-2.009 0L2 7"></path><rect x="2" y="4" width="20" height="16" rx="2"></rect></svg></div>

            <p className="mt-4 font-medium text-slate-900">
                No pending invitations
            </p>

            <p className="text-sm text-slate-500 mt-1">
                Invitations will appear here once you invite new team members.
            </p>
        </div>
    );
};
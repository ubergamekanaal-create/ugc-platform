"use client";

import { useEffect, useState } from "react";

export type Invitation = {
  id: string;
  email: string;
  role: string;
  permissions?: Record<string, boolean>;
  invited_at?: string;
  brand_id?: string;
};

export const usePendingInvites = () => {
  const [invites, setInvites] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchInvites = async () => {
    try {
      setLoading(true);
      setError(null);

      const res = await fetch("/api/team/my-invitations");

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to fetch invites");
      }

      setInvites(data.data || []);
    } catch (err: any) {
      console.error("INVITE FETCH ERROR:", err);
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvites();
  }, []);

  return {
    invites,
    loading,
    error,
    refetch: fetchInvites,
  };
};
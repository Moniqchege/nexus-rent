"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAdminStore } from "@/app/store/adminStore";
import UserViewDetails from "@/app/components/users/UserViewDetails";

export default function ViewUserPage() {
  const router = useRouter();
  const params = useParams();
  const userId = parseInt(params.id as string);

  const { users, fetchUsers, fetchUser } = useAdminStore();
  const [user, setUser] = useState<unknown>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId || Number.isNaN(userId)) {
      router.push("/users");
      return;
    }

    let cancelled = false;

    const load = async () => {
      setLoading(true);
      try {
        const fetched = await fetchUser(userId);
        if (cancelled) return;

        if (fetched) {
          setUser(fetched);
          return;
        }

        if (!users?.length) {
          await fetchUsers("");
        }

        const match = (users || []).find((u: any) => u.id === userId);
        setUser(match ?? null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  if (loading) {
    return (
      <div
        style={{
          padding: "40px",
          textAlign: "center",
          color: "var(--neon-blue)",
        }}
      >
        Loading...
      </div>
    );
  }

  return (
    <div className="dashboard-content">
      <UserViewDetails user={user as any} />
    </div>
  );
}


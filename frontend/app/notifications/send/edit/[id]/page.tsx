"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import api from "@/app/lib/api";
import SendNotificationForm, { NotificationFormValues } from "@/app/components/notifications/SendNotifications";

interface ExistingNotification {
  id: number;
  title: string;
  message: string;
  /** IDs of the users this notification was originally sent to */
  userIds: number[];
}

export default function EditNotificationPage() {
  const { id } = useParams<{ id: string }>();
  const [initial, setInitial] = useState<NotificationFormValues | null>(null);
  const [fetchError, setFetchError] = useState("");

  // Load the existing notification once
  useEffect(() => {
    api
      .get<ExistingNotification>(`/api/notifications/${id}`)
      .then((r) =>
        setInitial({
          title: r.data.title,
          message: r.data.message,
          userIds: r.data.userIds,
        })
      )
      .catch(() => setFetchError("Could not load notification."));
  }, [id]);

  const handleSubmit = async (values: NotificationFormValues) => {
    // Adjust to PATCH or PUT depending on your API contract
    await api.patch(`/api/notifications/${id}`, {
      title: values.title,
      message: values.message,
      userIds: values.userIds,
    });
  };

  if (fetchError) {
    return (
      <div
        style={{
          padding: "28px 32px",
          color: "#9b1c1c",
          fontSize: "14px",
          fontWeight: 500,
        }}
      >
        {fetchError}
      </div>
    );
  }

  if (!initial) {
    return (
      <div
        style={{
          padding: "28px 32px",
          color: "#7b7487",
          fontSize: "14px",
        }}
      >
        Loading…
      </div>
    );
  }

  return (
    <SendNotificationForm
      initialValues={initial}
      onSubmit={handleSubmit}
      heading="Edit Notification"
      subheading="Update the message and recipients, then re-send."
      submitLabel="Save & resend"
      loadingLabel="Saving…"
    />
  );
}
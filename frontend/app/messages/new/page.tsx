"use client";
import SendNotificationForm, { NotificationFormValues } from "@/app/components/notifications/SendNotifications";
import api from "@/app/lib/api";

export default function NewNotificationPage() {
  const handleSubmit = async (values: NotificationFormValues) => {
    const res = await api.post("/api/notifications/send", {
      title: values.title,
      message: values.message,
      userIds: values.userIds,
    });

    if (res.status !== 201) {
      throw new Error(res.data?.error || "Failed to send notification");
    }
  };

  return (
    <SendNotificationForm
      onSubmit={handleSubmit}
      heading="Send Notification"
      subheading="Compose and deliver a message to selected residents."
      submitLabel="Send"
      loadingLabel="Sending…"
    />
  );
}
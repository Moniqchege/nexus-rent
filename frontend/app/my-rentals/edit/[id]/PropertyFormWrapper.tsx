"use client";

import { useRouter } from "next/navigation";
import PropertyForm from "@/app/components/properties/PropertyForm";
import { useState } from "react";

interface PropertyFormWrapperProps {
  initialData: any;
  onSubmit: (updatedData: any) => void;
}

export default function PropertyFormWrapper({ initialData, onSubmit  }: any) {
    const [formData, setFormData] = useState(initialData);
  const router = useRouter();

  const handleChange = (field: string, value: any) => {
    setFormData({ ...formData, [field]: value });
  };

  const handleSuccess = () => {
    router.push("/my-rentals");
    router.refresh();
  };

  const handleCancel = () => {
    router.push("/my-rentals");
  };

  return (
    <PropertyForm
      initialData={initialData}
      onSuccess={handleSuccess}
      onCancel={handleCancel}
      submitLabel="Update Rental"
      isEdit
    />
  );
}
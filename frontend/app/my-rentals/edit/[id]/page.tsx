"use client";

import { notFound } from 'next/navigation';
import PropertyForm from "@/app/components/properties/PropertyForm";
import { useRouter } from "next/navigation";
import api from "@/app/lib/api";

interface PropertyApi {
  id: number;
  title: string;
  location: string;
  price: number;
  beds: number;
  baths: number;
  sqft: number;
  status: string;
  image?: string;
}

export default async function EditRentalPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const propertyId = parseInt(params.id);

  if (isNaN(propertyId)) {
    notFound();
  }

  let initialData: Partial<PropertyApi> = {};

  try {
    const response = await api.get(`/api/properties/${propertyId}`);
    initialData = response.data;
  } catch (error) {
    notFound(); // 404 if not found or unauthorized
  }

  const handleSuccess = () => {
    router.push("/my-rentals");
    router.refresh();
  };

  return (
    <PropertyForm 
      initialData={initialData} 
      onSuccess={handleSuccess} 
      submitLabel="Update Rental" 
    />
  );
}


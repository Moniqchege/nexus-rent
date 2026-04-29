"use client";

import { useState, useEffect } from "react";
import { useAdminStore } from "@/app/store/adminStore";
import api from "@/app/lib/api";
import { Lease, BillingCycle, LeaseStatus } from "@/types/lease";
import DatePickerPopup from "../ui/Datepickerpopup";
import { CustomDropdown } from "../ui/CustomDropdown";
import { MultiSelectDropdown } from "../ui/MultiSelectDropdown";

interface LeaseFormProps {
  initialData?: Partial<Lease>;
  onSuccess?: (data: any) => void | Promise<void>;
  submitLabel?: string;
  isEdit?: boolean;
  onCancel: () => void;
}

const BILLING_CYCLE_OPTIONS: { label: string; value: BillingCycle }[] = [
  { label: "Monthly", value: "monthly" },
  { label: "Weekly", value: "weekly" },
];

const STATUS_OPTIONS: { label: string; value: LeaseStatus }[] = [
  { label: "Active", value: "active" },
  { label: "Ended", value: "ended" },
  { label: "Suspended", value: "suspended" },
];

export default function LeaseForm({
  initialData = {},
  onSuccess,
  onCancel,
  isEdit = false,
  submitLabel = "Create Lease",
}: LeaseFormProps) {
  const { properties, fetchProperties } = useAdminStore();
  const [allTenants, setAllTenants] = useState<any[]>([]);
  const [data, setData] = useState({
    propertyId: initialData.propertyId || 0,
    tenantIds: (initialData as any).tenantIds || [],
    startDate: initialData.startDate ? initialData.startDate.slice(0, 10) : "",
    endDate: initialData.endDate ? initialData.endDate.slice(0, 10) : "",
    rentAmount: initialData.rentAmount || 0,
    billingCycle: (initialData.billingCycle as BillingCycle) || "monthly",
    status: (initialData.status as LeaseStatus) || "active",
    lateFeePercent: initialData.lateFeePercent || 0,
    graceDays: initialData.graceDays || 0,
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchProperties();
    fetchUsers();
  }, []);

const fetchUsers = async () => {
  try {
    const res = await api.get('/api/users');
    const users = res.data || [];

    // Filter users who have a Tenant role
    const tenants = users.filter((user: any) =>
      user.userProperties?.some(
        (up: any) => up.role?.name === "Tenant"
      )
    );

    setAllTenants(tenants);
  } catch {
    setAllTenants([]);
  }
};

  const filteredTenants = allTenants.filter((user) =>
  user.userProperties?.some(
    (up: any) => up.property?.id === data.propertyId
  )
);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!onSuccess) return;

    if (!data.propertyId || !data.tenantIds.length || !data.startDate || !data.endDate || !data.rentAmount) {
      setError("Property, tenant, start date, end date, and rent amount are required");
      return;
    }

    setError(null);
    setLoading(true);

    try {
      await onSuccess({
        ...data,
        propertyId: Number(data.propertyId),
        tenantIds: data.tenantIds.map(Number),
        rentAmount: Number(data.rentAmount),
        lateFeePercent: Number(data.lateFeePercent),
        graceDays: Number(data.graceDays),
      });
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = {
    width: "100%",
    backgroundColor: "rgba(17,24,39,0.5)",
    border: "0.5px solid var(--border-glow)",
    borderRadius: "12px",
    padding: "14px 20px",
    fontSize: "14px",
    color: "var(--text-primary)",
  };

  const labelStyle = {
    display: "block",
    fontWeight: 600,
    fontSize: "12px",
    marginBottom: "8px",
    color: "var(--neon-blue)",
  };

  return (
    <div
      style={{
        backgroundColor: "rgba(17,24,39,0.95)",
        backdropFilter: "blur(20px)",
        border: "1px solid var(--border-glow)",
        borderRadius: "24px",
        padding: "25px",
        maxWidth: "950px",
        margin: "0 auto",
        marginBottom: "42px",
      }}
    >
      <h3
        style={{
          fontSize: "20px",
          fontWeight: 700,
          background: "linear-gradient(to right, var(--neon-blue), var(--neon-purple))",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          marginBottom: "14px",
        }}
      >
        {isEdit ? "Edit Lease" : "Create New Lease"}
      </h3>

      {error && <p style={{ color: "#ef4444", marginBottom: "12px" }}>{error}</p>}

      <form onSubmit={handleSubmit} style={{ display: "grid", gap: "10px" }}>
        {/* Property + Tenant */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
          <div>
            <label style={labelStyle}>Property *</label>
            <CustomDropdown
  options={properties.map((prop: any) => ({
    label: `${prop.title} - ${prop.location}`,
    value: prop.id,
  }))}
  value={data.propertyId}
  onChange={(val) =>
    setData({ ...data, propertyId: Number(val), tenantIds: [] })
  }
  labelKey="label"
  valueKey="value"
  placeholder="Select Property"
/>
          </div>
<div>
  <label style={labelStyle}>Tenants *</label>
  <MultiSelectDropdown
    options={filteredTenants.map((t: any) => ({
      label: t.name,
      value: t.id,
    }))}
    values={data.tenantIds}
    onChange={(vals) => setData((prev) => ({ ...prev, tenantIds: vals }))}
    labelKey="label"
    valueKey="value"
    placeholder={data.propertyId ? "Select tenants" : "Select a property first"}
  />
</div>
        </div>

        {/* Start Date + End Date */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
        <div>
           <DatePickerPopup
             label="Start Date"
             required
             value={data.startDate}
             onChange={(val) => setData({ ...data, startDate: val })}
           />
        </div>
          <div>
            <DatePickerPopup
             label="End Date"
             required
             value={data.endDate}
             onChange={(val) => setData({ ...data, endDate: val })}
           />
          </div>
        </div>

        {/* Rent Amount + Billing Cycle */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
          <div>
            <label style={labelStyle}>Rent Amount (KES) *</label>
            <input
              type="number"
              placeholder="e.g. 25000"
              value={data.rentAmount || ""}
              onChange={(e) => setData({ ...data, rentAmount: parseFloat(e.target.value) || 0 })}
              style={inputStyle}
              required
            />
          </div>
          <div>
            <label style={labelStyle}>Billing Cycle *</label>
            <CustomDropdown
  options={BILLING_CYCLE_OPTIONS}
  value={data.billingCycle}
  onChange={(val) =>
    setData({ ...data, billingCycle: val as BillingCycle })
  }
  labelKey="label"
  valueKey="value"
/>
          </div>
        </div>

        {/* Status + Grace Days */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
          <div>
            <label style={labelStyle}>Status *</label>
            <CustomDropdown
  options={STATUS_OPTIONS}
  value={data.status}
  onChange={(val) =>
    setData({ ...data, status: val as LeaseStatus })
  }
  labelKey="label"
  valueKey="value"
/>
          </div>
          <div>
            <label style={labelStyle}>Grace Days</label>
            <input
              type="number"
              placeholder="e.g. 5"
              value={data.graceDays || ""}
              onChange={(e) => setData({ ...data, graceDays: parseInt(e.target.value) || 0 })}
              style={inputStyle}
            />
          </div>
        </div>

        {/* Late Fee Percent */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
          <div>
            <label style={labelStyle}>Late Fee Percent (%)</label>
            <input
              type="number"
              step="0.01"
              placeholder="e.g. 5.0"
              value={data.lateFeePercent || ""}
              onChange={(e) => setData({ ...data, lateFeePercent: parseFloat(e.target.value) || 0 })}
              style={inputStyle}
            />
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px", marginTop: "12px" }}>
          <button
            type="button"
            onClick={onCancel}
            style={{
              backgroundColor: "transparent",
              color: "var(--text-secondary)",
              border: "1px solid var(--border-glow)",
              borderRadius: "12px",
              padding: "14px 28px",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            style={{
              background: "linear-gradient(to right, var(--neon-blue), var(--neon-purple))",
              color: "white",
              border: "none",
              borderRadius: "12px",
              padding: "14px 28px",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            {loading ? "Saving..." : submitLabel}
          </button>
        </div>
      </form>
    </div>
  );
}


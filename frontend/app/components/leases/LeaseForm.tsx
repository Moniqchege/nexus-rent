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

const BILLING_CYCLE_OPTIONS = [
  { label: "Monthly", value: "monthly" },
  { label: "Weekly", value: "weekly" },
  { label: "Quarterly", value: "quarterly" },
  { label: "Annually", value: "annually" },
];

const STATUS_OPTIONS = [
  { label: "Active", value: "active" },
  { label: "Ended", value: "ended" },
  { label: "Suspended", value: "suspended" },
];

const Section = ({ title, icon, children }: any) => (
  <section
    style={{
      backgroundColor: "#ffffff",
      border: "1px solid #e5e7eb",
      borderRadius: "16px",
      overflow: "visible",
      marginBottom: "24px",
      boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
    }}
  >
    <div
      style={{
        padding: "18px 22px",
        borderBottom: "1px solid #e5e7eb",
        backgroundColor: "#fafafa",
        display: "flex",
        alignItems: "center",
        gap: "10px",
        fontWeight: 700,
        color: "#111827",
      }}
    >
      <span className="material-symbols-outlined" style={{ color: "#2563eb" }}>
        {icon}
      </span>
      {title}
    </div>

    <div style={{ padding: "22px" }}>{children}</div>
  </section>
);

export default function LeaseForm({
  initialData = {},
  onSuccess,
  onCancel,
  isEdit = false,
  submitLabel = "Create Lease",
}: LeaseFormProps) {
  const { properties, fetchProperties } = useAdminStore();

  const [allTenants, setAllTenants] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

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

  useEffect(() => {
    fetchProperties();
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await api.get("/api/users");
      const users = res.data || [];

      const tenants = users.filter((user: any) =>
        user.userProperties?.some((up: any) => up.role?.name === "Tenant")
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
    height: "48px",
    backgroundColor: "#ffffff",
    border: "1px solid #d1d5db",
    borderRadius: "10px",
    padding: "0 14px",
    fontSize: "14px",
    color: "#111827",
    outline: "none",
  };

  const labelStyle = {
    fontSize: "12px",
    fontWeight: 700,
    color: "#374151",
    marginBottom: "6px",
    display: "block",
    textTransform: "uppercase" as const,
    letterSpacing: "0.05em",
  };

  return (
    <form onSubmit={handleSubmit} style={{ width: "100%", marginBottom: "34px" }}>

      {/* ERROR */}
      {error && (
        <div
          style={{
            backgroundColor: "#fef2f2",
            border: "1px solid #fecaca",
            color: "#991b1b",
            padding: "12px 16px",
            borderRadius: "12px",
            marginBottom: "16px",
          }}
        >
          {error}
        </div>
      )}

      {/* AGREEMENT */}
      <Section title="Agreement Details" icon="description">
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" }}>
          <div>
            <label style={labelStyle}>Property *</label>
            <CustomDropdown
              options={properties.map((p: any) => ({
                label: `${p.title} - ${p.location}`,
                value: p.id,
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
              onChange={(vals) => setData((p) => ({ ...p, tenantIds: vals }))}
              labelKey="label"
              valueKey="value"
              placeholder="Select Tenants"
            />
          </div>

          <div>
  <label style={labelStyle}>Start Date *</label>
  <DatePickerPopup
    value={data.startDate}
    onChange={(val) => setData({ ...data, startDate: val })}
  />
</div>

<div>
  <label style={labelStyle}>End Date *</label>
  <DatePickerPopup
    value={data.endDate}
    onChange={(val) => setData({ ...data, endDate: val })}
  />
</div>
        </div>
      </Section>

      {/* FINANCIAL */}
      <Section title="Financial Terms" icon="payments">
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "24px" }}>
          <div>
            <label style={labelStyle}>Rent Amount (KES)</label>
            <input
              style={inputStyle}
              type="number"
              value={data.rentAmount}
              onChange={(e) =>
                setData({ ...data, rentAmount: Number(e.target.value) })
              }
            />
          </div>

          <div>
            <label style={labelStyle}>Billing Cycle</label>
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

          <div>
            <label style={labelStyle}>Grace Days</label>
            <input
              style={inputStyle}
              type="number"
              value={data.graceDays}
              onChange={(e) =>
                setData({ ...data, graceDays: Number(e.target.value) })
              }
            />
          </div>
        </div>
      </Section>

      {/* POLICY */}
      <Section title="Policy & Status" icon="gavel">
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" }}>
          <div>
            <label style={labelStyle}>Late Fee (%)</label>
            <input
              style={inputStyle}
              type="number"
              value={data.lateFeePercent}
              onChange={(e) =>
                setData({ ...data, lateFeePercent: Number(e.target.value) })
              }
            />
          </div>

          <div style={{ position: 'relative', zIndex: 5000 }}>
            <label style={labelStyle}>Status</label>
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
        </div>
      </Section>

      {/* ACTIONS */}
      <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px" }}>
        <button
          type="button"
          onClick={onCancel}
          style={{
            backgroundColor: "#ffffff",
            border: "1px solid #d1d5db",
            color: "#111827",
            padding: "12px 20px",
            borderRadius: "12px",
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
            backgroundColor: "#2563eb",
            color: "#ffffff",
            padding: "12px 20px",
            borderRadius: "12px",
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          {loading ? "Saving..." : submitLabel}
        </button>
      </div>
    </form>
  );
}
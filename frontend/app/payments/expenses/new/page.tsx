"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import api from "@/app/lib/api";
import { CustomDropdown } from "@/app/components/ui/CustomDropdown";
import { ArrowLeft } from "lucide-react";

interface Property {
  id: number;
  title: string;
}

const CATEGORIES = [
  { label: "Maintenance & Repairs", value: "Maintenance" },
  { label: "Utilities", value: "Utilities" },
  { label: "Insurance", value: "Insurance" },
  { label: "Tax", value: "Tax" },
  { label: "Admin", value: "Admin" },
  { label: "Other", value: "Other" },
];

// Local YYYY-MM-DD (not UTC) so the date input shows "today" correctly
// regardless of the user's timezone offset.
function todayISODate() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export default function NewExpensePage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [properties, setProperties] = useState<Property[]>([]);
  const [loadingProperties, setLoadingProperties] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [attemptedSubmit, setAttemptedSubmit] = useState(false);

  // Expense details
  const [formProperty, setFormProperty] = useState("");
  const [formUnit, setFormUnit] = useState("");
  const [formCategory, setFormCategory] = useState("Maintenance");
  const [formAmount, setFormAmount] = useState<number>(0);
  const [formDate, setFormDate] = useState(""); // optional — blank defaults to today on save
  const [formInvoiceNumber, setFormInvoiceNumber] = useState("");
  const [formDescription, setFormDescription] = useState("");

  // Vendor information
  const [formVendor, setFormVendor] = useState("");
  const [formVendorPhone, setFormVendorPhone] = useState(""); // sent as mpesaPaidTo
  const [formVendorEmail, setFormVendorEmail] = useState("");
  const [formVendorDescription, setFormVendorDescription] = useState("");

  // Supporting document
  const [formReceipt, setFormReceipt] = useState<File | null>(null);

  const propertyOptions = useMemo(
    () => [
      { label: "Select Property", value: "" },
      ...properties.map((p) => ({ label: p.title, value: String(p.id) })),
    ],
    [properties]
  );

  const fetchProperties = useCallback(async () => {
    setLoadingProperties(true);
    try {
      const res = await api.get("/api/properties");
      setProperties(res.data ?? []);
    } catch (e) {
      console.error("Failed to load properties", e);
    } finally {
      setLoadingProperties(false);
    }
  }, []);

  useEffect(() => {
    fetchProperties();
  }, [fetchProperties]);

  const propertyMissing = formProperty === "";
  const amountInvalid = !formAmount || formAmount <= 0;
  const phoneMissing = formVendorPhone.trim() === "";
  const isValid = !propertyMissing && !amountInvalid && !phoneMissing;

  const handleFile = (file: File | null) => {
    if (file && file.size > 5 * 1024 * 1024) {
      alert("File size must be less than 5MB");
      return;
    }
    setFormReceipt(file);
  };

  const handleCancel = () => {
    router.push("/payments/expenses");
  };

  const handleSave = async () => {
    setAttemptedSubmit(true);
    if (!isValid || saving) return;

    setSaving(true);
    try {
      const formData = new FormData();
      formData.append("propertyId", formProperty);
      formData.append("unit", formUnit);
      formData.append("amount", String(formAmount));
      formData.append("category", formCategory);
      formData.append("description", formDescription);
      formData.append("invoiceNumber", formInvoiceNumber);
      formData.append("mpesaPaidTo", formVendorPhone.trim());
      formData.append("vendor", formVendor);
      formData.append("vendorEmail", formVendorEmail);
      formData.append("vendorDescription", formVendorDescription);

      // Date is optional — an empty field defaults to today.
      const dateToSend = formDate ? new Date(`${formDate}T00:00:00`) : new Date();
      formData.append("date", dateToSend.toISOString());

      if (formReceipt) {
        formData.append("receipt", formReceipt);
      }

      await api.post("/api/expenses", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      router.push("/payments/expenses");
    } catch (e: any) {
      alert(e?.response?.data?.error ?? "Failed to create expense");
    } finally {
      setSaving(false);
    }
  };

  const s = {
    page: {
      background: "#f8fafc",
      minHeight: "100vh",
      fontFamily: "'Inter', system-ui, sans-serif",
      padding: "28px 24px 60px",
    },
    container: {
      maxWidth: 880,
      margin: "0 auto",
      display: "flex",
      flexDirection: "column" as const,
      gap: 20,
    },
    backLink: {
      display: "inline-flex",
      alignItems: "center",
      gap: 6,
      background: "none",
      border: "none",
      padding: 0,
      color: "#4f46e5",
      fontSize: 13,
      fontWeight: 600,
      cursor: "pointer",
      marginBottom: 10,
    },
    title: {
      fontSize: 20,
      fontWeight: 700,
      color: "#0f172a",
      margin: 0,
      letterSpacing: "-0.01em",
    },
    subtitle: {
      fontSize: 11,
      color: "#64748b",
      margin: "6px 0 0",
    },
    card: {
      background: "#fff",
      border: "1px solid #e2e8f0",
      borderRadius: 14,
      padding: "14px 18px 18px",
    },
    cardHeader: {
      display: "flex",
      alignItems: "center",
      gap: 8,
      borderBottom: "1px solid #f1f5f9",
      paddingBottom: 12,
      marginBottom: 18,
    },
    cardIcon: {
      width: 25,
      height: 25,
      borderRadius: 8,
      background: "#eef2ff",
      color: "#4f46e5",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontSize: 16,
      flexShrink: 0,
    },
    cardTitle: {
      fontSize: 14,
      fontWeight: 700,
      color: "#0f172a",
      margin: 0,
    },
    grid: {
      display: "grid",
      gridTemplateColumns: "1fr 1fr",
      gap: 18,
    },
    field: {
      display: "flex",
      flexDirection: "column" as const,
      gap: 6,
    },
    fieldFull: {
      display: "flex",
      flexDirection: "column" as const,
      gap: 6,
      gridColumn: "1 / -1",
    },
    label: {
      fontSize: 9,
      fontWeight: 600,
      color: "#64748b",
      textTransform: "uppercase" as const,
      letterSpacing: "0.04em",
    },
    required: { color: "#ef4444" },
    input: (invalid?: boolean) => ({
      width: "100%",
      padding: "10px 14px",
      border: `1px solid ${invalid ? "#fca5a5" : "#e2e8f0"}`,
      borderRadius: 10,
      fontSize: 14,
      color: "#0f172a",
      outline: "none",
      boxSizing: "border-box" as const,
      background: "#fff",
    }),
    textarea: {
      width: "100%",
      padding: "10px 14px",
      border: "1px solid #e2e8f0",
      borderRadius: 10,
      fontSize: 14,
      color: "#0f172a",
      outline: "none",
      boxSizing: "border-box" as const,
      resize: "vertical" as const,
      fontFamily: "inherit",
    },
    errorText: {
      fontSize: 11,
      color: "#ef4444",
      marginTop: 2,
    },
    dropzone: (active: boolean) => ({
      border: `2px dashed ${active ? "#4f46e5" : "#cbd5e1"}`,
      borderRadius: 12,
      padding: "26px 20px",
      display: "flex",
      flexDirection: "column" as const,
      alignItems: "center",
      justifyContent: "center",
      background: active ? "#f5f6ff" : "#fff",
      cursor: "pointer",
      transition: "all 0.15s ease",
      textAlign: "center" as const,
    }),
    dropzoneIcon: (hasFile: boolean) => ({
      fontSize: 34,
      color: hasFile ? "#10b981" : "#4f46e5",
      marginBottom: 8,
    }),
    dropzoneTitle: { fontSize: 14, fontWeight: 700, color: "#0f172a" },
    dropzoneSub: { fontSize: 12, color: "#64748b", marginTop: 4 },
    filePill: {
      marginTop: 12,
      padding: "6px 14px",
      background: "#eef2ff",
      color: "#4f46e5",
      borderRadius: 999,
      fontSize: 12,
      fontWeight: 600,
      maxWidth: "100%",
      overflow: "hidden",
      textOverflow: "ellipsis",
      whiteSpace: "nowrap" as const,
    },
    noticeBox: {
      display: "flex",
      gap: 10,
      alignItems: "flex-start",
      padding: "14px 16px",
      background: "#eef2ff",
      color: "#3730a3",
      borderRadius: 12,
    },
    footer: {
      display: "flex",
      justifyContent: "flex-end",
      gap: 10,
      paddingTop: 4,
      paddingBottom: 20,
    },
    cancelBtn: {
      padding: "11px 24px",
      borderRadius: 10,
      border: "1px solid #e2e8f0",
      background: "#fff",
      fontSize: 14,
      fontWeight: 600,
      color: "#334155",
      cursor: "pointer",
    },
    saveBtn: (disabled: boolean) => ({
      padding: "11px 26px",
      borderRadius: 10,
      border: "none",
      background: "#4f46e5",
      color: "#fff",
      fontSize: 14,
      fontWeight: 700,
      cursor: disabled ? "not-allowed" : "pointer",
      opacity: disabled ? 0.6 : 1,
    }),
  };

  return (
    <div style={s.page}>
      <div style={s.container}>
        {/* Header */}
       <div>
  <div
    style={{
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: "8px",
    }}
  >
    <h1 style={{ ...s.title, margin: 0 }}>Record New Expense</h1>

    <button
      onClick={() => router.back()}
      style={{
        display: "flex",
        alignItems: "center",
        gap: "8px",
        color: "var(--neon-blue)",
        border: "1px solid var(--neon-blue)",
        padding: "8px 16px",
        borderRadius: "8px",
        fontWeight: 600,
        fontSize: "14px",
        background: "none",
        cursor: "pointer",
        fontFamily: "'Inter', sans-serif",
      }}
    >
      <ArrowLeft size={18} />
      Back
    </button>
  </div>
  <p style={s.subtitle}>
    Fill in the details below to log a property expense.
  </p>
</div>

        {/* Expense Details */}
        <div style={s.card}>
          <div style={s.cardHeader}>
            <span style={s.cardIcon}>🧾</span>
            <h3 style={s.cardTitle}>Expense Details</h3>
          </div>
          <div style={s.grid}>
            <div style={s.field}>
              <label style={s.label}>
                Property <span style={s.required}>*</span>
              </label>
              <CustomDropdown
                options={propertyOptions}
                value={formProperty}
                onChange={setFormProperty}
                labelKey="label"
                valueKey="value"
              />
              {attemptedSubmit && propertyMissing && (
                <span style={s.errorText}>Please select a property.</span>
              )}
            </div>

            <div style={s.field}>
              <label style={s.label}>Unit (Optional)</label>
              <input
                type="text"
                value={formUnit}
                onChange={(e) => setFormUnit(e.target.value)}
                placeholder="e.g. Unit 402B"
                style={s.input()}
              />
            </div>

            <div style={s.field}>
              <label style={s.label}>
                Category <span style={s.required}>*</span>
              </label>
              <CustomDropdown
                options={CATEGORIES}
                value={formCategory}
                onChange={setFormCategory}
                labelKey="label"
                valueKey="value"
              />
            </div>

            <div style={s.field}>
              <label style={s.label}>
                Amount (Ksh) <span style={s.required}>*</span>
              </label>
              <input
                type="number"
                min={0}
                value={Number.isFinite(formAmount) ? formAmount : 0}
                onChange={(e) => setFormAmount(Number(e.target.value))}
                placeholder="0.00"
                style={s.input(attemptedSubmit && amountInvalid)}
              />
              {attemptedSubmit && amountInvalid && (
                <span style={s.errorText}>Enter an amount greater than 0.</span>
              )}
            </div>

            <div style={s.field}>
              <label style={s.label}>Expense Date (Optional)</label>
              <input
                type="date"
                value={formDate}
                max={todayISODate()}
                onChange={(e) => setFormDate(e.target.value)}
                style={s.input()}
              />
              <span style={{ fontSize: 11, color: "#94a3b8" }}>
                Leave blank to use today&apos;s date.
              </span>
            </div>

            <div style={s.field}>
              <label style={s.label}>Invoice Number (Optional)</label>
              <input
                type="text"
                value={formInvoiceNumber}
                onChange={(e) => setFormInvoiceNumber(e.target.value)}
                placeholder="INV-2026-XXXX"
                style={s.input()}
              />
            </div>

            <div style={s.fieldFull}>
              <label style={s.label}>Description</label>
              <textarea
                rows={3}
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                placeholder="Provide a brief summary of the expense..."
                style={s.textarea}
              />
            </div>
          </div>
        </div>

        {/* Vendor Information */}
        <div style={s.card}>
          <div style={s.cardHeader}>
            <span style={s.cardIcon}>🛠️</span>
            <h3 style={s.cardTitle}>Vendor Information</h3>
          </div>
          <div style={s.grid}>
            <div style={s.fieldFull}>
              <label style={s.label}>Vendor Name</label>
              <input
                type="text"
                value={formVendor}
                onChange={(e) => setFormVendor(e.target.value)}
                placeholder="e.g. ABC Plumbing Services"
                style={s.input()}
              />
            </div>

            <div style={s.field}>
              <label style={s.label}>
                Phone Number <span style={s.required}>*</span>
              </label>
              <input
                type="tel"
                value={formVendorPhone}
                onChange={(e) => setFormVendorPhone(e.target.value)}
                placeholder="e.g. 0712 345 678"
                style={s.input(attemptedSubmit && phoneMissing)}
              />
              {attemptedSubmit && phoneMissing && (
                <span style={s.errorText}>Vendor phone number is required.</span>
              )}
            </div>

            <div style={s.field}>
              <label style={s.label}>Email Address (Optional)</label>
              <input
                type="email"
                value={formVendorEmail}
                onChange={(e) => setFormVendorEmail(e.target.value)}
                placeholder="vendor@email.com"
                style={s.input()}
              />
            </div>

            <div style={s.fieldFull}>
              <label style={s.label}>Vendor Description (Optional)</label>
              <textarea
                rows={2}
                value={formVendorDescription}
                onChange={(e) => setFormVendorDescription(e.target.value)}
                placeholder="Notes regarding vendor interactions or specialized services..."
                style={s.textarea}
              />
            </div>
          </div>
        </div>

        {/* Supporting Document */}
        <div style={s.card}>
          <div style={s.cardHeader}>
            <span style={s.cardIcon}>📎</span>
            <h3 style={s.cardTitle}>Supporting Documents</h3>
          </div>

          <label
            htmlFor="receipt-upload"
            style={s.dropzone(dragActive)}
            onDragOver={(e) => {
              e.preventDefault();
              setDragActive(true);
            }}
            onDragLeave={() => setDragActive(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragActive(false);
              const file = e.dataTransfer.files?.[0] ?? null;
              handleFile(file);
            }}
          >
            <span style={s.dropzoneIcon(!!formReceipt)}>
              {formReceipt ? "✅" : "⬆️"}
            </span>
            <div style={s.dropzoneTitle}>
              {formReceipt ? "Receipt attached" : "Click or drag to upload"}
            </div>
            <div style={s.dropzoneSub}>PDF, JPG, or PNG (Max 5MB)</div>
            {formReceipt && <div style={s.filePill}>{formReceipt.name}</div>}
          </label>
          <input
            id="receipt-upload"
            ref={fileInputRef}
            type="file"
            accept=".pdf,.jpg,.jpeg,.png"
            hidden
            onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
          />

          <div style={{ marginTop: 16 }}>
            <div style={s.noticeBox}>
              <span>ℹ️</span>
              <p style={{ fontSize: 12, lineHeight: 1.5, margin: 0 }}>
                Uploaded documents are stored securely and attached to this
                expense record for future reference and audits.
              </p>
            </div>
          </div>
        </div>

        {/* Save / Cancel — at the end of the page, as requested */}
        <div style={s.footer}>
          <button style={s.cancelBtn} onClick={handleCancel} disabled={saving}>
            Cancel
          </button>
          <button
            style={s.saveBtn(saving)}
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? "Saving…" : "Save Expense"}
          </button>
        </div>
      </div>
    </div>
  );
}
"use client";

import { Lease } from "@/types/lease";
import { useRef } from "react";

interface LeaseAgreementTemplateProps {
  lease: Lease;
  landlordName?: string;
}

export default function LeaseAgreementTemplate({ lease, landlordName = "[Landlord Name]" }: LeaseAgreementTemplateProps) {
  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    const printContents = printRef.current?.innerHTML;
    if (!printContents) return;

    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    printWindow.document.write(`
      <html>
        <head>
          <title>Lease Agreement - ${lease.property?.title || ""}</title>
          <style>
            body { font-family: Georgia, serif; padding: 40px; max-width: 800px; margin: 0 auto; color: #000; background: #fff; }
            h1 { text-align: center; font-size: 24px; margin-bottom: 8px; }
            .subtitle { text-align: center; font-size: 14px; color: #555; margin-bottom: 32px; }
            .section { margin-bottom: 20px; }
            .section-title { font-weight: bold; font-size: 14px; margin-bottom: 6px; text-transform: uppercase; letter-spacing: 0.5px; }
            .field-row { display: flex; margin-bottom: 10px; }
            .field-label { width: 180px; font-weight: 600; font-size: 13px; }
            .field-value { flex: 1; border-bottom: 1px solid #333; padding-bottom: 2px; font-size: 13px; min-height: 18px; }
            .signature-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; margin-top: 60px; }
            .signature-box { border-top: 1px solid #333; padding-top: 8px; margin-top: 40px; }
            .signature-label { font-size: 12px; font-weight: 600; margin-bottom: 4px; }
            .note { font-size: 11px; color: #666; margin-top: 4px; }
            .page-break { page-break-after: always; }
          </style>
        </head>
        <body>
          ${printContents}
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);
  };

  const startDate = lease.startDate ? new Date(lease.startDate).toLocaleDateString() : "[START DATE]";
  const endDate = lease.endDate ? new Date(lease.endDate).toLocaleDateString() : "[END DATE]";

  return (
    <div>
      <div style={{ display: "flex", gap: "12px", marginBottom: "24px", justifyContent: "flex-end" }}>
        <button
          onClick={handlePrint}
          style={{
            background: "linear-gradient(to right, var(--neon-blue), var(--neon-purple))",
            color: "white",
            border: "none",
            borderRadius: "12px",
            padding: "12px 24px",
            fontWeight: 600,
            cursor: "pointer",
            fontSize: "14px",
          }}
        >
          🖨️ Print Agreement
        </button>
      </div>

      <div
        ref={printRef}
        style={{
          backgroundColor: "rgba(17,24,39,0.95)",
          border: "1px solid var(--border-glow)",
          borderRadius: "24px",
          padding: "40px",
          maxWidth: "800px",
          margin: "0 auto",
          color: "var(--text-primary)",
          lineHeight: 1.6,
        }}
      >
        <h1 style={{ textAlign: "center", fontSize: "22px", marginBottom: "8px", color: "var(--neon-blue)" }}>
          RESIDENTIAL LEASE AGREEMENT
        </h1>
        <div style={{ textAlign: "center", fontSize: "12px", color: "var(--text-secondary)", marginBottom: "32px" }}>
          Property: {lease.property?.title || "[PROPERTY TITLE]"} — {lease.property?.location || "[LOCATION]"}
        </div>

        <div style={{ marginBottom: "20px" }}>
          <div style={{ fontWeight: "bold", fontSize: "13px", marginBottom: "10px", textTransform: "uppercase", color: "var(--neon-purple)" }}>
            1. Parties
          </div>
          <div style={{ display: "flex", marginBottom: "10px" }}>
            <span style={{ width: "160px", fontWeight: 600, fontSize: "13px" }}>Landlord:</span>
            <span style={{ flex: 1, borderBottom: "1px solid var(--border-glow)", paddingBottom: "2px", fontSize: "13px" }}>
              {landlordName}
            </span>
          </div>
          <div style={{ display: "flex", marginBottom: "10px" }}>
            <span style={{ width: "160px", fontWeight: 600, fontSize: "13px" }}>Tenant:</span>
            <span style={{ flex: 1, borderBottom: "1px solid var(--border-glow)", paddingBottom: "2px", fontSize: "13px" }}>
              {lease.tenant?.name || "[TENANT NAME]"}
            </span>
          </div>
          <div style={{ display: "flex", marginBottom: "10px" }}>
            <span style={{ width: "160px", fontWeight: 600, fontSize: "13px" }}>Tenant Phone:</span>
            <span style={{ flex: 1, borderBottom: "1px solid var(--border-glow)", paddingBottom: "2px", fontSize: "13px" }}>
              {lease.tenant?.phone || "[PHONE]"}
            </span>
          </div>
          <div style={{ display: "flex", marginBottom: "10px" }}>
            <span style={{ width: "160px", fontWeight: 600, fontSize: "13px" }}>Tenant Email:</span>
            <span style={{ flex: 1, borderBottom: "1px solid var(--border-glow)", paddingBottom: "2px", fontSize: "13px" }}>
              {lease.tenant?.email || "[EMAIL]"}
            </span>
          </div>
        </div>

        <div style={{ marginBottom: "20px" }}>
          <div style={{ fontWeight: "bold", fontSize: "13px", marginBottom: "10px", textTransform: "uppercase", color: "var(--neon-purple)" }}>
            2. Premises
          </div>
          <p style={{ fontSize: "13px", color: "var(--text-secondary)" }}>
            The Landlord hereby leases to the Tenant the residential property located at{" "}
            <strong>{lease.property?.location || "[ADDRESS]"}</strong>, known as{" "}
            <strong>{lease.property?.title || "[PROPERTY NAME]"}</strong>.
          </p>
        </div>

        <div style={{ marginBottom: "20px" }}>
          <div style={{ fontWeight: "bold", fontSize: "13px", marginBottom: "10px", textTransform: "uppercase", color: "var(--neon-purple)" }}>
            3. Lease Term
          </div>
          <div style={{ display: "flex", marginBottom: "10px" }}>
            <span style={{ width: "160px", fontWeight: 600, fontSize: "13px" }}>Start Date:</span>
            <span style={{ flex: 1, borderBottom: "1px solid var(--border-glow)", paddingBottom: "2px", fontSize: "13px" }}>{startDate}</span>
          </div>
          <div style={{ display: "flex", marginBottom: "10px" }}>
            <span style={{ width: "160px", fontWeight: 600, fontSize: "13px" }}>End Date:</span>
            <span style={{ flex: 1, borderBottom: "1px solid var(--border-glow)", paddingBottom: "2px", fontSize: "13px" }}>{endDate}</span>
          </div>
        </div>

        <div style={{ marginBottom: "20px" }}>
          <div style={{ fontWeight: "bold", fontSize: "13px", marginBottom: "10px", textTransform: "uppercase", color: "var(--neon-purple)" }}>
            4. Rent
          </div>
          <div style={{ display: "flex", marginBottom: "10px" }}>
            <span style={{ width: "160px", fontWeight: 600, fontSize: "13px" }}>Rent Amount:</span>
            <span style={{ flex: 1, borderBottom: "1px solid var(--border-glow)", paddingBottom: "2px", fontSize: "13px" }}>
              KES {lease.rentAmount?.toLocaleString() || "[AMOUNT]"} per {lease.billingCycle || "[CYCLE]"}
            </span>
          </div>
          <div style={{ display: "flex", marginBottom: "10px" }}>
            <span style={{ width: "160px", fontWeight: 600, fontSize: "13px" }}>Billing Cycle:</span>
            <span style={{ flex: 1, borderBottom: "1px solid var(--border-glow)", paddingBottom: "2px", fontSize: "13px", textTransform: "capitalize" }}>
              {lease.billingCycle || "[CYCLE]"}
            </span>
          </div>
          <div style={{ display: "flex", marginBottom: "10px" }}>
            <span style={{ width: "160px", fontWeight: 600, fontSize: "13px" }}>Grace Days:</span>
            <span style={{ flex: 1, borderBottom: "1px solid var(--border-glow)", paddingBottom: "2px", fontSize: "13px" }}>
              {lease.graceDays ?? "[GRACE DAYS]"} days
            </span>
          </div>
          <div style={{ display: "flex", marginBottom: "10px" }}>
            <span style={{ width: "160px", fontWeight: 600, fontSize: "13px" }}>Late Fee:</span>
            <span style={{ flex: 1, borderBottom: "1px solid var(--border-glow)", paddingBottom: "2px", fontSize: "13px" }}>
              {lease.lateFeePercent ?? "[LATE FEE]"}%
            </span>
          </div>
        </div>

        <div style={{ marginBottom: "20px" }}>
          <div style={{ fontWeight: "bold", fontSize: "13px", marginBottom: "10px", textTransform: "uppercase", color: "var(--neon-purple)" }}>
            5. Terms & Conditions
          </div>
          <p style={{ fontSize: "13px", color: "var(--text-secondary)", marginBottom: "8px" }}>
            a) The Tenant shall use the premises solely for residential purposes.
          </p>
          <p style={{ fontSize: "13px", color: "var(--text-secondary)", marginBottom: "8px" }}>
            b) The Tenant shall not sublet the premises without prior written consent from the Landlord.
          </p>
          <p style={{ fontSize: "13px", color: "var(--text-secondary)", marginBottom: "8px" }}>
            c) The Tenant shall maintain the premises in good condition and notify the Landlord of any necessary repairs promptly.
          </p>
          <p style={{ fontSize: "13px", color: "var(--text-secondary)", marginBottom: "8px" }}>
            d) Rent is due on the first day of each {lease.billingCycle || "billing cycle"}. A late fee of{" "}
            {lease.lateFeePercent ?? "___"}% will apply after {lease.graceDays ?? "___"} grace days.
          </p>
          <p style={{ fontSize: "13px", color: "var(--text-secondary)", marginBottom: "8px" }}>
            e) Either party may terminate this agreement with reasonable notice as per applicable law.
          </p>
          <p style={{ fontSize: "13px", color: "var(--text-secondary)" }}>
            f) This agreement is governed by the laws of the jurisdiction where the property is located.
          </p>
        </div>

        <div style={{ marginBottom: "20px" }}>
          <div style={{ fontWeight: "bold", fontSize: "13px", marginBottom: "10px", textTransform: "uppercase", color: "var(--neon-purple)" }}>
            6. Signatures
          </div>
          <p style={{ fontSize: "12px", color: "var(--text-secondary)", marginBottom: "16px" }}>
            IN WITNESS WHEREOF, the parties have signed this agreement on the dates indicated below.
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "40px", marginTop: "40px" }}>
            <div>
              <div style={{ borderTop: "1px solid var(--border-glow)", paddingTop: "8px", marginTop: "40px" }}>
                <div style={{ fontSize: "12px", fontWeight: 600, marginBottom: "4px" }}>Landlord Signature</div>
                <div style={{ fontSize: "11px", color: "var(--text-secondary)" }}>Date: _______________</div>
              </div>
            </div>
            <div>
              <div style={{ borderTop: "1px solid var(--border-glow)", paddingTop: "8px", marginTop: "40px" }}>
                <div style={{ fontSize: "12px", fontWeight: 600, marginBottom: "4px" }}>Tenant Signature</div>
                <div style={{ fontSize: "11px", color: "var(--text-secondary)" }}>Date: _______________</div>
              </div>
            </div>
          </div>
        </div>

        <div style={{ marginTop: "32px", paddingTop: "16px", borderTop: "1px solid var(--border-glow)", fontSize: "11px", color: "var(--text-secondary)", textAlign: "center" }}>
          Generated by Nexus Rent &bull; Lease ID: {lease.id || "[ID]"}
        </div>
      </div>
    </div>
  );
}


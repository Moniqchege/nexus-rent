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

  const start = lease.startDate ? new Date(lease.startDate) : null;
const end = lease.endDate ? new Date(lease.endDate) : null;

const leaseMonths =
  start && end
    ? Math.max(
        1,
        Math.round(
          (end.getFullYear() - start.getFullYear()) * 12 +
            (end.getMonth() - start.getMonth())
        )
      )
    : null;

const rent = lease.rentAmount || 0;
const securityDeposit = rent; 

const normalizeBillingCycle = (cycle?: string) => {
  switch ((cycle || "").toLowerCase()) {
    case "monthly":
    case "month":
      return "month";
    case "weekly":
    case "week":
      return "week";
    case "yearly":
    case "annual":
    case "annually":
      return "year";
    default:
      return "month";
  }
};

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
          backgroundColor: "#ffffff",
          border: "1px solid var(--border-glow)",
          borderRadius: "24px",
          padding: "40px",
          maxWidth: "8000px",
          margin: "0",
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

        <div style={{ marginBottom: "48px" }}>
          <h3
            style={{
              fontFamily: "'Libre Baskerville', serif",
              fontWeight: 700,
              fontSize: "20px",
              marginBottom: "16px",
              borderBottom: "1px solid rgba(0,0,0,0.1)",
              paddingBottom: "8px",
              color: "var(--neon-blue)",
            }}
          >
              1. Parties
         </h3>

         <p
           style={{
            fontSize: "15px",
            lineHeight: 1.7,
            marginBottom: "24px",
            color: "#374151",
           }}
         >
           This Residential Lease Agreement ("Lease") is entered into on{" "}
         <span
           style={{
             fontWeight: 600,
             padding: "0 8px",
         }}
    >
      {startDate}
    </span>{" "}
    by and between:
  </p>

  <div
    style={{
      display: "grid",
      gridTemplateColumns: "1fr 1fr",
      gap: "32px",
    }}
  >
    {/* Landlord */}
    <div>
      <span
        style={{
          display: "block",
          marginBottom: "6px",
          fontSize: "12px",
          textTransform: "uppercase",
          letterSpacing: "0.05em",
          color: "#6B7280",
          fontWeight: 600,
        }}
      >
        Landlord / Lessor
      </span>

      <p
        style={{
          fontWeight: 700,
          borderBottom: "1px dotted rgba(0,0,0,0.4)",
          paddingBottom: "6px",
          marginBottom: "12px",
        }}
      >
        {landlordName}
      </p>
       <div
      style={{
        fontSize: "13px",
        color: "#4B5563",
        lineHeight: 1.8,
      }}
    >
        <div>
          <strong>Phone:</strong>{" "}
          {(lease as any).landlord?.phone ||
            (lease as any).landlords?.[0]?.landlord?.phone ||
            "[PHONE]"}
        </div>

        <div>
          <strong>Email:</strong>{" "}
          {(lease as any).landlord?.email ||
            (lease as any).landlords?.[0]?.landlord?.email ||
            "[EMAIL]"}
        </div>
    </div>
    </div>

    {/* Tenant */}
    <div>
      <span
        style={{
          display: "block",
          marginBottom: "6px",
          fontSize: "12px",
          textTransform: "uppercase",
          letterSpacing: "0.05em",
          color: "#6B7280",
          fontWeight: 600,
        }}
      >
        Tenant / Lessee
      </span>

      <p
        style={{
          fontWeight: 700,
          borderBottom: "1px dotted rgba(0,0,0,0.4)",
          paddingBottom: "6px",
          marginBottom: "12px",
        }}
      >
        {(lease as any).tenant?.name ||
          (lease as any).tenants?.[0]?.tenant?.name ||
          "[TENANT NAME]"}
      </p>

      <div
        style={{
          fontSize: "13px",
          color: "#4B5563",
          lineHeight: 1.8,
        }}
      >
        <div>
          <strong>Phone:</strong>{" "}
          {(lease as any).tenant?.phone ||
            (lease as any).tenants?.[0]?.tenant?.phone ||
            "[PHONE]"}
        </div>

        <div>
          <strong>Email:</strong>{" "}
          {(lease as any).tenant?.email ||
            (lease as any).tenants?.[0]?.tenant?.email ||
            "[EMAIL]"}
        </div>
      </div>
    </div>
  </div>
</div>

        <div style={{ marginBottom: "20px" }}>
          <div style={{ marginBottom: "48px" }}>
  <h3
    style={{
      fontFamily: "'Libre Baskerville', serif",
      fontWeight: 700,
      fontSize: "20px",
      marginBottom: "16px",
      borderBottom: "1px solid rgba(0,0,0,0.1)",
      paddingBottom: "8px",
      color: "var(--neon-blue)",
    }}
  >
    2. Premises
  </h3>

  <p
    style={{
      fontSize: "15px",
      lineHeight: 1.8,
      color: "#374151",
      margin: 0,
    }}
  >
    The Landlord hereby leases to the Tenant the residential property known as {" "}
    <span
      style={{
        fontWeight: 700,
        color: "#111827",
      }}
    >
      {lease.property.title}
    </span>
    {""} located at
    the following municipal address:{" "}
    <span
      style={{
        fontWeight: 700,
        color: "#111827",
      }}
    >
      {lease.property?.location || "[PROPERTY ADDRESS]"}
    </span>
    . The leased premises shall include the interior living space, structural
    components, and all standard built-in architectural features inherent to
    the unit, excluding any movable personal property unless expressly included
    as part of this Lease Agreement.
  </p>
</div>
        </div>

        <div style={{ marginBottom: "48px" }}>
  <h3
    style={{
      fontFamily: "'Libre Baskerville', serif",
      fontWeight: 700,
      fontSize: "20px",
      marginBottom: "16px",
      borderBottom: "1px solid rgba(0,0,0,0.1)",
      paddingBottom: "8px",
      color: "var(--neon-blue)",
    }}
  >
    3. Lease Term
  </h3>

  <p
    style={{
      fontSize: "15px",
      lineHeight: 1.8,
      color: "#374151",
      margin: 0,
    }}
  >
    The term of this Lease shall be for a period of{" "}
    <span
      style={{
        fontWeight: 600,
        // borderBottom: "1px solid #111827",
        color: "#111827",
      }}
    >
      {leaseMonths || "[TERM]"} months
    </span>
    , {" "} beginning on{" "}
    <span
      style={{
        fontWeight: 700,
        color: "#111827",
      }}
    >
      {startDate}
    </span>{" "}
    and terminating on{" "}
    <span
      style={{
        fontWeight: 700,
        color: "#111827",
      }}
    >
      {endDate}
    </span>
    , unless sooner terminated in accordance with the provisions of this
    Lease Agreement.
  </p>
</div>

       <div style={{ marginBottom: "48px" }}>
  <h3
    style={{
      fontFamily: "'Libre Baskerville', serif",
      fontWeight: 700,
      fontSize: "20px",
      marginBottom: "16px",
      borderBottom: "1px solid rgba(0,0,0,0.1)",
      paddingBottom: "8px",
      color: "var(--neon-blue)",
    }}
  >
    4. Rent
  </h3>

  <p
    style={{
      fontSize: "15px",
      lineHeight: 1.8,
      color: "#374151",
      marginBottom: "16px",
    }}
  >
    Tenant agrees to pay Landlord the sum of{" "}
    <span
      style={{
        fontWeight: 700,
        color: "#111827",
      }}
    >
      ksh {rent.toLocaleString() || "[AMOUNT]"}
    </span>{" "}
    per{" "}
    <span
      style={{
        fontWeight: 600,
      }}
    >
      {normalizeBillingCycle(lease.billingCycle) || "[MONTH"}
    </span>{" "}
    as rent, payable in advance on the first day of each {normalizeBillingCycle(lease.billingCycle)}.
  </p>

  {/* Financial Breakdown Box */}
  <div
    style={{
      borderLeft: "4px solid #4f46e5",
      background: "#f9fafb",
      padding: "16px 20px",
      borderRadius: "8px",
    }}
  >
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        rowGap: "10px",
        columnGap: "20px",
        fontSize: "13px",
        color: "#374151",
      }}
    >
      <div>Security Deposit:</div>
      <div style={{ textAlign: "right", fontWeight: 700 }}>
        ksh {securityDeposit.toLocaleString()} (One Month Rent)
      </div>

      <div>Late Fee Policy:</div>
      <div style={{ textAlign: "right", fontWeight: 700 }}>
        {lease.lateFeePercent ?? "[X]"}% after{" "}
        {lease.graceDays ?? "[X]"} days
      </div>
    </div>
  </div>
</div>

        <div style={{ marginBottom: "48px" }}>
  <h3
    style={{
      fontFamily: "'Libre Baskerville', serif",
      fontWeight: 700,
      fontSize: "20px",
      marginBottom: "16px",
      borderBottom: "1px solid rgba(0,0,0,0.1)",
      paddingBottom: "8px",
      color: "var(--neon-blue)",
    }}
  >
    5. Terms & Conditions
  </h3>

  <div
    style={{
      fontSize: "14px",
      color: "#4B5563",
      fontFamily: "'Libre Baskerville', serif",
      fontStyle: "italic",
      lineHeight: 1.9,
    }}
  >
    <p style={{ marginBottom: "10px" }}>
      a) The Tenant shall use the premises solely for residential purposes.
    </p>

    <p style={{ marginBottom: "10px" }}>
      b) The Tenant shall not sublet the premises without prior written consent
      from the Landlord.
    </p>

    <p style={{ marginBottom: "10px" }}>
      c) The Tenant shall maintain the premises in good condition and notify the
      Landlord of any necessary repairs promptly.
    </p>

    <p style={{ marginBottom: "10px" }}>
  d) Rent is due on the first day of each{" "}
  <span style={{ fontWeight: 600, }}>
    {normalizeBillingCycle(lease.billingCycle)}
  </span>
  . A late fee of{" "}
  <span style={{ fontWeight: 600 }}>
    {lease.lateFeePercent ?? "___"}%
  </span>{" "}
  will apply after{" "}
  <span style={{ fontWeight: 600 }}>
    {lease.graceDays ?? "___"}
  </span>{" "}
  grace days.
</p>

    <p style={{ marginBottom: "10px" }}>
      e) Either party may terminate this agreement with reasonable notice as per
      applicable law.
    </p>

    <p style={{ marginBottom: "0" }}>
      f) This agreement is governed by the laws of the jurisdiction where the
      property is located.
    </p>
  </div>
</div>

<div style={{ marginBottom: "48px" }}>
  <h3
    style={{
      fontFamily: "'Libre Baskerville', serif",
      fontWeight: 700,
      fontSize: "20px",
      marginBottom: "16px",
      borderBottom: "1px solid rgba(0,0,0,0.1)",
      paddingBottom: "8px",
      color: "var(--neon-blue)",
    }}
  >
    6. Signatures
  </h3>

  <p
    style={{
      fontSize: "13px",
      color: "#6B7280",
      marginBottom: "40px",
    }}
  >
    IN WITNESS WHEREOF, the parties have executed this Agreement on the dates
    indicated below.
  </p>

  <div
    style={{
      display: "grid",
      gridTemplateColumns: "1fr 1fr",
      gap: "80px",
    }}
  >
    {/* LANDLORD */}
    <div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-end",
          fontSize: "12px",
          fontWeight: 600,
          marginBottom: "10px",
        }}
      >
        <span>Landlord Signature:</span>
        <span style={{ flex: 1, borderBottom: "1px solid #111827", marginLeft: 12 }} />
      </div>

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-end",
          fontSize: "11px",
          color: "#6B7280",
        }}
      >
        <span>Date:</span>
        <span style={{ flex: 1, borderBottom: "1px solid #111827", marginLeft: 12 }} />
      </div>
    </div>

    {/* TENANT */}
    <div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-end",
          fontSize: "12px",
          fontWeight: 600,
          marginBottom: "10px",
        }}
      >
        <span>Tenant Signature:</span>
        <span style={{ flex: 1, borderBottom: "1px solid #111827", marginLeft: 12 }} />
      </div>

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-end",
          fontSize: "11px",
          color: "#6B7280",
        }}
      >
        <span>Date:</span>
        <span style={{ flex: 1, borderBottom: "1px solid #111827", marginLeft: 12 }} />
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


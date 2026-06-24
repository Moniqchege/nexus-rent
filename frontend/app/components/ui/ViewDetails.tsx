"use client";

import { useState } from "react";
import DynamicTable from "@/app/components/ui/DynamicTable";

export interface Action {
  label: string;
  icon?: React.ReactNode;
  variant?: "default" | "primary";
  onClick: () => void;
  disabled?: boolean;
}

interface Metric {
  label: string;
  value: React.ReactNode;
}

type SearchConfig<T> = {
  enabled: boolean;
  placeholder?: string;
  getSearchText?: (row: T) => string;
};

interface TabConfig {
  key: string;
  label: string;
  table?: {
    rows: any[];
    columns: any[];
    getRowId?: (row: any) => string | number;
    search?: SearchConfig<any>;
  };
  content?: React.ReactNode;
}

interface ViewDetailsProps {
  title: string;
  subtitle?: string;

  backLabel?: string;
  onBack?: () => void;

  entity: {
    avatar?: string;
    title: string;
    subtitle?: string;
    status?: string;
  };

  metrics?: Metric[];

  actions?: Action[];

  tabs?: TabConfig[];
}

export default function ViewDetails({
  title,
  subtitle,
  backLabel = "Back",
  onBack,
  entity,
  metrics = [],
  actions = [],
  tabs = [],
}: ViewDetailsProps) {
  const [activeTab, setActiveTab] = useState(
    tabs[0]?.key ?? ""
  );

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        {onBack && (
          <button
            onClick={onBack}
            style={styles.backBtn}
          >
            <span className="material-symbols-outlined">
              arrow_back
            </span>
            {backLabel}
          </button>
        )}

        {/* Header */}

        <div style={styles.header}>
          <div>
            <h1 style={styles.title}>{title}</h1>

            {subtitle && (
              <div style={styles.subtitle}>
                {subtitle}
              </div>
            )}
          </div>

          <div style={styles.actionRow}>
            {actions.map((action) => (
              <button
                key={action.label}
                onClick={action.onClick}
                disabled={action.disabled}
                style={{
                  ...styles.actionBtn,
                  ...(action.variant === "primary"
                    ? styles.primaryBtn
                    : {}),
                }}
              >
                {action.icon && (
                  <span
                    className="material-symbols-outlined"
                    style={{ fontSize: 18 }}
                  >
                    {action.icon}
                  </span>
                )}

                {action.label}
              </button>
            ))}
          </div>
        </div>

        {/* Summary Card */}

        <div style={styles.card}>
          <div style={styles.entitySection}>
            <div style={styles.avatar}>
              {entity.avatar}
            </div>

            <div>
              <div style={styles.entityTitle}>
                {entity.title}
              </div>

              {entity.subtitle && (
                <div style={styles.entitySubtitle}>
                  {entity.subtitle}
                </div>
              )}
              {entity.status && (() => {
  const isActive = entity.status.toLowerCase() === "active";

  return (
    <div
      style={{
        ...styles.badge,
        background: isActive ? "#f3f4f6" : "#0F52BA",
        color: isActive ? "#0F52BA" : "#ffffff",
        border: isActive ? "1px solid #0F52BA" : "1px solid #0F52BA",
      }}
    >
      {entity.status.toUpperCase()}
    </div>
  );
})()}
            </div>
          </div>

          {metrics.length > 0 && (
            <>
              <div style={styles.divider} />

              <div style={styles.metrics}>
                {metrics.map((metric) => (
                  <div key={metric.label}>
                    <div style={styles.metricLabel}>
                      {metric.label}
                    </div>

                    <div style={styles.metricValue}>
                      {metric.value}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Tabs */}

        {tabs.length > 0 && (
          <div style={styles.tabs}>
            <div style={styles.tabHeader}>
              {tabs.map((tab) => {
  const isActive = activeTab === tab.key;

  return (
    <button
      key={tab.key}
      onClick={() => setActiveTab(tab.key)}
      style={{
        ...styles.tabBtn,
        color: isActive ? "#0F52BA" : undefined,
        borderBottom: isActive
          ? "2px solid #0F52BA"
          : "2px solid transparent",
      }}
    >
      {tab.label}
    </button>
  );
})}
            </div>

            <div style={styles.tabContent}>
              {tabs.map((tab) => {
                if (tab.key !== activeTab)
                  return null;

                if (tab.content)
                  return (
                    <div key={tab.key}>
                      {tab.content}
                    </div>
                  );

                if (tab.table) {
                  return (
                    <DynamicTable
                      key={tab.key}
                      rows={tab.table.rows}
                      columns={tab.table.columns}
                      getRowId={
                        tab.table.getRowId ??
                        ((r) => r.id)
                      }
                      search={tab.table.search}
                      pagination={{
                        enabled: true,
                        defaultPageSize: 10,
                        pageSizeOptions: [
                          10,
                          20,
                          50,
                        ],
                      }}
                      noRecordsMessage="No records found"
                    />
                  );
                }

                return null;
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: "100vh",
    background: "#fcf8ff",
    color: "#1b1b24",
    fontFamily: "Inter, sans-serif",
  },

  container: {
    padding: "20px 1px",
  },

   back: {
    color: "#0F52BA",
    cursor: "pointer",
    fontWeight: 500,
    marginBottom: "16px",
    display: "inline-block",
  },

  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-end",
    gap: 16,
    flexWrap: "wrap",
  },

  title: {
    margin: 0,
    fontSize: "20px",
    fontWeight: 700,
  },

  subtitle: {
    marginTop: 6,
    color: "#464555",
    fontSize: "12px",
  },

  actionRow: {
    display: "flex",
    gap: 10,
    flexWrap: "wrap",
  },

  actionBtn: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    padding: "8px 12px",
    borderRadius: 10,
    border: "1px solid #d1d5db",
    background: "#fff",
    cursor: "pointer",
  },

  primaryBtn: {
    background: "#0F52BA",
    color: "#fff",
    border: "none",
  },

  backBtn: {
    marginBottom: 10,
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    padding: "1px 10px",
    borderRadius: 10,
    border: "1px solid #0F52BA",
    color: "#0F52BA",
    background: "#fff",
    cursor: "pointer",
  },

  card: {
    marginTop: 10,
    padding: 14,
    borderRadius: 16,
    background: "#fff",
    border: "1px solid #e5e7eb",
    display: "grid",
    gridTemplateColumns: "1fr auto 1fr",
    gap: 24,
    alignItems: "center",
  },

  entitySection: {
    display: "flex",
    alignItems: "center",
    gap: 16,
  },

  avatar: {
    width: 40,
    height: 40,
    borderRadius: 16,
    background: "#0F52BA",
    color: "#fff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 22,
    fontWeight: 700,
  },

  entityTitle: {
    fontSize: 14,
    fontWeight: 600,
  },

  entitySubtitle: {
    marginTop: 4,
    color: "#666",
    fontSize: 12,
  },

  badge: {
    marginTop: 4,
    display: "inline-block",
    padding: "2px 20px",
    borderRadius: 999,
    background: "#f3f4f6",
    color: "#0F52BA",
    border: "1px solid #0F52BA",
    fontWeight: 600,
    fontSize: 12,
  },

  divider: {
    width: 1,
    background: "#e5e7eb",
    height: "70%",
  },

  metrics: {
    display: "flex",
    gap: 98,
  },

  metricLabel: {
    fontSize: 12,
    color: "#777",
  },

  metricValue: {
    marginTop: 4,
    fontWeight: 600,
    fontSize: 14,
  },

  tabs: {
    marginTop: 24,
    borderRadius: 16,
    overflow: "hidden",
    background: "#fff",
    border: "1px solid #e5e7eb",
  },

  tabHeader: {
    display: "flex",
    borderBottom: "1px solid #e5e7eb",
  },

  tabBtn: {
    padding: "14px 20px",
    border: "none",
    background: "transparent",
    cursor: "pointer",
  },

  activeTab: {
    color: "#0F52BA",
    borderBottom: "2px solid #0F52BA",
  },

  tabContent: {
    padding: 20,
  },
};
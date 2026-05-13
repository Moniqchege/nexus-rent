"use client";
import React, { useMemo, useState } from "react";
import SearchBar from "./SearchBar";
import { PaginationCustomDropdown } from "./PaginationCustomDropdown";

export type DynamicTableColumn<T> = {
  key: string;
  header: React.ReactNode;
  width?: number | string;
  align?: "left" | "right" | "center";
  render: (row: T, rowIndex: number) => React.ReactNode;
  sortValue?: (row: T) => string | number;
};

export type DynamicTableRowAction<T> = {
  key: string;
  label?: string;
  icon?: React.ReactNode;
  disabled?: (row: T) => boolean;
  onClick: (row: T) => void;
};

type Pagination = {
  enabled: boolean;
  pageSizeOptions: number[];
  defaultPageSize: number;
  pageIndex?: number;
  pageSize?: number;
  onPageChange?: (pageIndex: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
};

type SearchConfig<T> = {
  enabled: boolean;
  placeholder?: string;
  getSearchText?: (row: T) => string;
};


type DynamicTableProps<T> = {

  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  rows: T[];
  getRowId: (row: T) => string | number;
  columns: DynamicTableColumn<T>[];
  rowActions?: DynamicTableRowAction<T>[];
  selection?: {
    enabled: boolean;
    selectedIds: Set<string | number>;
    onToggle: (id: string | number) => void;
    onToggleAll?: (idsOnPage: Array<string | number>) => void;
    getDisabled?: (row: T) => boolean;
  };
  search?: SearchConfig<T>;
  pagination?: Pagination;
  loading?: boolean;
  noRecordsMessage?: string;
  footerSummary?: (args: {
    pageStart: number;
    pageEnd: number;
    totalElements: number;
  }) => React.ReactNode;
  className?: string;
};

export default function DynamicTable<T>({
  title,
  subtitle,
  rows,
  getRowId,
  columns,
  rowActions,
  selection,
  search,
  pagination,
  loading = false,
  noRecordsMessage = "No records found.",
  footerSummary,
  className = "",
}: DynamicTableProps<T>) {
  const [searchText, setSearchText] = useState("");
  const filtered = useMemo(() => {
    if (!search?.enabled) return rows;
    if (!searchText.trim()) return rows;
    const getText = search.getSearchText ?? (() => "");
    const q = searchText.toLowerCase();
    return rows.filter((r) => getText(r).toLowerCase().includes(q));
  }, [rows, search?.enabled, searchText, search?.getSearchText]);

  const sortableColumns = useMemo(() => {
    return columns.filter((c) => typeof c.sortValue === "function");
  }, [columns]);

  const [sortKey, setSortKey] = useState<string | null>(sortableColumns[0]?.key ?? null);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");


  const sorted = useMemo(() => {
    if (!sortKey) return filtered;
    const col = columns.find((c) => c.key === sortKey);
    if (!col?.sortValue) return filtered;
    const value = (r: T) => col.sortValue?.(r);
    const arr = [...filtered];
    arr.sort((a, b) => {
      const va = value(a);
      const vb = value(b);
      if (typeof va === "number" && typeof vb === "number") {
        return sortDir === "asc" ? va - vb : vb - va;
      }
      return sortDir === "asc"
        ? String(va ?? "").localeCompare(String(vb ?? ""))
        : String(vb ?? "").localeCompare(String(va ?? ""));
    });
    return arr;
  }, [filtered, sortDir, sortKey, columns]);

  const [internalPageIndex, setInternalPageIndex] = useState(0);
const [internalPageSize, setInternalPageSize] = useState(
  pagination?.defaultPageSize ?? 20
);

    const setPageIndexSafe = (value: number) => {
  if (pagination?.onPageChange) {
    pagination.onPageChange(value);
  } else {
    setInternalPageIndex(value);
  }
};

const isControlledPageIndex = pagination?.pageIndex !== undefined;
const isControlledPageSize = pagination?.pageSize !== undefined;

const setPageSizeSafe = (value: number) => {
  if (pagination?.onPageSizeChange) {
    pagination.onPageSizeChange(value);
  } else {
    setInternalPageSize(value);
  }
};

  const pageIndex = isControlledPageIndex
  ? pagination!.pageIndex!
  : internalPageIndex;

const pageSize = isControlledPageSize
  ? pagination!.pageSize!
  : internalPageSize;

  const pageSizeOptions =
  pagination?.pageSizeOptions ?? [5, 10, 20, 50, 100];

  const totalElements = sorted.length;
  const totalPages = pagination?.enabled ? Math.max(1, Math.ceil(totalElements / pageSize)) : 1;

  const safePageIndex = Math.min(pageIndex, totalPages - 1);

  const pageStart = totalElements === 0 ? 0 : safePageIndex * pageSize + 1;
  const pageEnd = Math.min((safePageIndex + 1) * pageSize, totalElements);

  const pagedData = pagination?.enabled
    ? sorted.slice(safePageIndex * pageSize, safePageIndex * pageSize + pageSize)
    : sorted;

  const hasActions = Boolean(rowActions?.length);
  const hasSelection = Boolean(selection?.enabled);

  const allPageIds = useMemo(() => pagedData.map((r) => getRowId(r)), [pagedData, getRowId]);

  const selectedCount = hasSelection ? selection!.selectedIds.size : 0;
  const allSelectedOnPage = hasSelection
    ? pagedData.length > 0 && pagedData.every((r) => selection!.selectedIds.has(getRowId(r)))
    : false;

  const indeterminate = hasSelection
    ? pagedData.length > 0 && !allSelectedOnPage && pagedData.some((r) => selection!.selectedIds.has(getRowId(r)))
    : false;

  const toggleAll = () => {
    if (!selection?.onToggleAll) return;
    selection.onToggleAll(allPageIds);
  };

  const onSearchChange = (v: string) => {
    setSearchText(v);
    setPageIndexSafe(0);
  };

 const nextPage = () =>
  setPageIndexSafe(Math.min(totalPages - 1, pageIndex + 1));

const prevPage = () =>
  setPageIndexSafe(Math.max(0, pageIndex - 1));

const renderHeaderCellStyle = (
  align?: DynamicTableColumn<T>["align"],
  width?: DynamicTableColumn<T>["width"]
) => {
  return {
    textAlign: align ?? "left",
    width,
    whiteSpace: "nowrap" as const,
  };
};

  return (
    <div className={className}>
      {search?.enabled && (
        <div 
        style={{
           padding: "14px 2px", 
           borderBottom: "1px solid rgba(255,255,255,0.06)", 
           }}>
          <SearchBar 
          value={searchText} 
          onChange={onSearchChange} 
          placeholder={search.placeholder ?? "Search…"} 
          />
        </div>
      )}

      <div
       className="futuristic-scrollbar"
       style={{
        overflowX: "auto",
        overflowY: "hidden",
        scrollbarWidth: "thin",
        scrollbarColor:
        "rgba(178, 181, 182, 0.55) rgba(255,255,255,0.04)",
        }}
      >
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead className="table-head">
            <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}>

              {hasSelection && (
                <th style={{ padding: "10px 12px 10px 16px", textAlign: "left" }}>
                  <input
                    type="checkbox"
                    checked={allSelectedOnPage}
                    ref={(el) => {
                      if (el) el.indeterminate = indeterminate;
                    }}
                    onChange={toggleAll}
                  />
                </th>
              )}

              {columns.map((col) => (
                <th
                  key={col.key}
                  style={{
                    ...renderHeaderCellStyle(col.align, col.width),
                    cursor: col.sortValue ? "pointer" : "default",
                    userSelect: "none",
                  }}
                  onClick={() => {
                    if (!col.sortValue) return;
                    setSortKey(col.key);
                    setSortDir((d) => (sortKey === col.key ? (d === "asc" ? "desc" : "asc") : "desc"));
                    setPageIndexSafe(0);
                  }}
                >
                  {col.header}
                  {col.sortValue && (
                    <span style={{ fontSize: 9, marginLeft: 6, color: sortKey === col.key ? "#a78bfa" : "rgba(255,255,255,0.2)" }}>
                      {sortKey === col.key ? (sortDir === "asc" ? "▲" : "▼") : "↕"}
                    </span>
                  )}
                </th>
              ))}

             {hasActions && (
               <th
                style={{
                ...renderHeaderCellStyle("left"),
                width: 140,
                whiteSpace: "nowrap",
                }}
               >
               Actions
               </th>
)}
            </tr>
          </thead>

          <tbody style={{ fontSize: 14, color: "rgba(255,255,255,0.75)" }}>
            {loading ? (
              <tr>
                <td
                  colSpan={columns.length + (hasSelection ? 1 : 0) + (hasActions ? 1 : 0)}
                  style={{ padding: "48px 20px", textAlign: "center", fontSize: "inherit" }}
                >
                  Loading…
                </td>
              </tr>
            ) : pagedData.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length + (hasSelection ? 1 : 0) + (hasActions ? 1 : 0)}
                  style={{ padding: "48px 20px", textAlign: "center" }}
                >
                  <div style={{ fontSize: 14, color: "rgba(255,255,255,0.35)" }}>{noRecordsMessage}</div>
                </td>
              </tr>
            ) : (
              pagedData.map((row, idx) => {
                const id = getRowId(row);
                const disabled = selection?.getDisabled?.(row) ?? false;
                const rowSelected = hasSelection ? selection!.selectedIds.has(id) : false;

                return (
                  <tr
                    key={String(id)}
                    style={{
                      borderBottom: "1px solid rgba(255,255,255,0.04)",
                      background: rowSelected ? "rgba(99,102,241,0.07)" : "transparent",
                      transition: "background .1s",
                    }}
                  >
                    {hasSelection && (
                      <td style={{ padding: "11px 12px 11px 16px", fontSize: "11px" }}>
                        <input
                          type="checkbox"
                          checked={rowSelected}
                          disabled={disabled}
                          onChange={() => {
                            if (disabled) return;
                            selection!.onToggle(id);
                          }}
                        />
                      </td>
                    )}

                    {columns.map((col) => (
                      <td key={col.key} style={{ padding: "11px 14px" }}>
                        <div style={{ textAlign: col.align ?? "left" }}>{col.render(row, idx)}</div>
                      </td>
                    ))}

                    {hasActions && (
                      <td style={{ padding: "11px 14px", whiteSpace: "nowrap" }}>
                        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                          {rowActions!.map((a) => {
                            const isDisabled = a.disabled?.(row) ?? false;
                            return (
                              <button
                                key={a.key}
                                disabled={isDisabled}
                                onClick={() => a.onClick(row)}
                                className="action-btn"
                                style={{
                                  padding: "9px 13px",
                                  fontSize: 12,
                                  opacity: isDisabled ? 0.5 : 1,
                                }}
                              >
                                {a.icon}
                                {a.label}
                              </button>
                            );
                          })}
                        </div>
                      </td>
                    )}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {pagination?.enabled && totalElements > 0 && (
  <div
    style={{
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      width: "100%",
      padding: "12px 16px",
      borderTop: "1px solid var(--border-glow)",
      marginTop: "16px",
      backgroundColor: "rgba(17,24,39,0.6)",
      backdropFilter: "blur(10px)",
    }}
  >
    {/* LEFT: Results summary */}
    <div style={{ flex: 1 }}>
      <span
        style={{
          color: "var(--text-secondary)",
          fontSize: "12px",
        }}
      >
        Showing{" "}
        <span
          style={{
            color: "var(--neon-secondary)",
            fontWeight: 600,
          }}
        >
          {pageStart}
        </span>
        –
        <span
          style={{
            color: "var(--neon-secondary)",
            fontWeight: 600,
          }}
        >
          {pageEnd}
        </span>{" "}
        of{" "}
        <span
          style={{
            color: "var(--neon-secondary)",
            fontWeight: 600,
          }}
        >
          {totalElements}
        </span>
      </span>
    </div>

    {/* RIGHT: Controls */}
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "flex-end",
        gap: "18px",
        flex: 1,
      }}
    >
      {/* Page size selector */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
        }}
      >
        <span
          style={{
            color: "var(--text-secondary)",
            fontSize: "12px",
            whiteSpace: "nowrap",
          }}
        >
          Items Per Page:
        </span>

        <PaginationCustomDropdown
  options={pageSizeOptions.map((size) => ({
    label: String(size),
    value: size,
  }))}
  value={pageSize}
  onChange={(value) => {
    setPageSizeSafe(Number(value));
    setPageIndexSafe(0);
  }}
  labelKey="label"
  valueKey="value"
  minWidth="90px"
/>
      </div>

      {/* Pager */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "6px",
        }}
      >
        {/* Prev */}
        <button
          onClick={prevPage}
          disabled={safePageIndex === 0}
          style={{
            padding: "6px 15px",
            borderRadius: "10px",
            border: "1px solid var(--border-glow)",
            backgroundColor: "rgba(0,0,0,0.2)",
            color: "var(--neon-blue)",
            cursor:
              safePageIndex === 0
                ? "not-allowed"
                : "pointer",
            opacity: safePageIndex === 0 ? 0.4 : 1,
            transition: "all 0.2s ease",
          }}
        >
          ‹
        </button>

        {/* Current page */}
        <div
          style={{
            padding: "4px 15px",
            borderRadius: "10px",
            border: "1px solid var(--neon-blue)",
            background:
              "linear-gradient(135deg, rgba(0,212,255,0.15), rgba(168,85,247,0.15))",
            color: "var(--neon-blue)",
            textAlign: "center",
          }}
        >
          {safePageIndex + 1}
        </div>

        {/* Next */}
        <button
          onClick={nextPage}
          disabled={safePageIndex >= totalPages - 1}
          style={{
            padding: "6px 15px",
            borderRadius: "10px",
            border: "1px solid var(--border-glow)",
            backgroundColor: "rgba(0,0,0,0.2)",
            color: "var(--neon-blue)",
            cursor:
              safePageIndex >= totalPages - 1
                ? "not-allowed"
                : "pointer",
            opacity:
              safePageIndex >= totalPages - 1
                ? 0.4
                : 1,
            transition: "all 0.2s ease",
          }}
        >
          ›
        </button>
      </div>
    </div>
  </div>
)}
    </div>
  );
}


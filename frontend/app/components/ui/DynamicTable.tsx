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
  hideOnMobile?: boolean;
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

  const pageSize = isControlledPageSize ? pagination!.pageSize! : internalPageSize;

  const pageSizeOptions = pagination?.pageSizeOptions ?? [5, 10, 20, 50, 100];

  const totalElements = sorted.length;
  const totalPages = pagination?.enabled
    ? Math.max(1, Math.ceil(totalElements / pageSize))
    : 1;

  const safePageIndex = Math.min(pageIndex, totalPages - 1);

  const pageStart = totalElements === 0 ? 0 : safePageIndex * pageSize + 1;
  const pageEnd = Math.min((safePageIndex + 1) * pageSize, totalElements);

  const pagedData = pagination?.enabled
    ? sorted.slice(safePageIndex * pageSize, safePageIndex * pageSize + pageSize)
    : sorted;

  const hasActions = Boolean(rowActions?.length);
  const hasSelection = Boolean(selection?.enabled);

  const allPageIds = useMemo(
    () => pagedData.map((r) => getRowId(r)),
    [pagedData, getRowId]
  );

  const selectedCount = hasSelection ? selection!.selectedIds.size : 0;
  const allSelectedOnPage = hasSelection
    ? pagedData.length > 0 &&
      pagedData.every((r) => selection!.selectedIds.has(getRowId(r)))
    : false;

  const indeterminate = hasSelection
    ? pagedData.length > 0 &&
      !allSelectedOnPage &&
      pagedData.some((r) => selection!.selectedIds.has(getRowId(r)))
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

  const prevPage = () => setPageIndexSafe(Math.max(0, pageIndex - 1));

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
    <div
      className={className}
      style={{
        background: "var(--bg-card)",
        border: "1px solid var(--border-glow)",
        borderRadius: 16,
        overflow: "hidden",
        boxShadow: "0 1px 3px rgba(15, 23, 42, 0.04)",
      }}
    >
      {search?.enabled && (
        <div
          style={{
            padding: "12px 16px",
            borderBottom: "1px solid var(--border-glow)",
            background: "var(--bg-card)",
          }}
        >
          <SearchBar
            value={searchText}
            onChange={onSearchChange}
            placeholder={search.placeholder ?? "Search…"}
          />
        </div>
      )}

      {/* Desktop table view */}
      <div
        className="futuristic-scrollbar dt-desktop-view"
        style={{
          overflowX: "auto",
          overflowY: "hidden",
        }}
      >
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead className="table-head">
            <tr>
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
                  className={col.hideOnMobile ? "dt-hide-mobile" : ""}
                  style={{
                    ...renderHeaderCellStyle(col.align, col.width),
                    cursor: col.sortValue ? "pointer" : "default",
                    userSelect: "none",
                  }}
                  onClick={() => {
                    if (!col.sortValue) return;
                    setSortKey(col.key);
                    setSortDir((d) =>
                      sortKey === col.key ? (d === "asc" ? "desc" : "asc") : "desc"
                    );
                    setPageIndexSafe(0);
                  }}
                >
                  {col.header}
                  {col.sortValue && (
                    <span
                      style={{
                        fontSize: 9,
                        marginLeft: 6,
                        color:
                          sortKey === col.key
                            ? "var(--neon-blue)"
                            : "var(--text-muted)",
                      }}
                    >
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

          <tbody style={{ fontSize: 14, color: "var(--text-primary)" }}>
            {loading ? (
              <tr>
                <td
                  colSpan={
                    columns.length + (hasSelection ? 1 : 0) + (hasActions ? 1 : 0)
                  }
                  style={{ padding: "48px 20px", textAlign: "center" }}
                >
                  <span style={{ color: "var(--text-secondary)" }}>Loading…</span>
                </td>
              </tr>
            ) : pagedData.length === 0 ? (
              <tr>
                <td
                  colSpan={
                    columns.length + (hasSelection ? 1 : 0) + (hasActions ? 1 : 0)
                  }
                  style={{ padding: "48px 20px", textAlign: "center" }}
                >
                  <div
                    style={{
                      fontSize: 14,
                      color: "var(--text-secondary)",
                    }}
                  >
                    {noRecordsMessage}
                  </div>
                </td>
              </tr>
            ) : (
              pagedData.map((row, idx) => {
                // const id = getRowId(row);
                const rawId = getRowId(row);
                const id = rawId ?? (row as any)?.id ?? (row as any)?.key ?? idx;
                const disabled = selection?.getDisabled?.(row) ?? false;
                const rowSelected = hasSelection
                  ? selection!.selectedIds.has(id)
                  : false;

                return (
                  <tr
                    key={String(id)}
                    style={{
                      borderBottom: "1px solid var(--border-glow)",
                      background: rowSelected
                        ? "rgba(37, 99, 235, 0.04)"
                        : "transparent",
                      transition: "background .1s",
                    }}
                  >
                    {hasSelection && (
                      <td
                        style={{
                          padding: "11px 12px 11px 16px",
                          fontSize: "11px",
                        }}
                      >
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
                      <td
                        key={col.key}
                        className={col.hideOnMobile ? "dt-hide-mobile" : ""}
                        style={{
                          padding: "11px 14px",
                          color: "var(--text-primary)",
                        }}
                      >
                        <div style={{ textAlign: col.align ?? "left" }}>
                          {col.render(row, idx)}
                        </div>
                      </td>
                    ))}

                    {hasActions && (
                      <td
                        style={{
                          padding: "11px 14px",
                          whiteSpace: "nowrap",
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            gap: 6,
                            alignItems: "center",
                            flexWrap: "wrap",
                          }}
                        >
                          {rowActions!.map((a) => {
                            const isDisabled = a.disabled?.(row) ?? false;
                            return (
                              <button
                                key={a.key}
                                disabled={isDisabled}
                                onClick={() => a.onClick(row)}
                                className="action-btn"
                                style={{
                                  padding: "6px 10px",
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

      {/* Mobile card view */}
      <div className="dt-mobile-view" style={{ padding: "12px" }}>
        {loading ? (
          <div
            style={{
              padding: "32px",
              textAlign: "center",
              color: "var(--text-secondary)",
            }}
          >
            Loading…
          </div>
        ) : pagedData.length === 0 ? (
          <div
            style={{
              padding: "32px",
              textAlign: "center",
              color: "var(--text-secondary)",
            }}
          >
            {noRecordsMessage}
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {pagedData.map((row, idx) => {
              // const id = getRowId(row);
              const rawId = getRowId(row);
              const id = rawId ?? (row as any)?.id ?? (row as any)?.key ?? idx;
              return (
                <div
                  key={String(id)}
                  style={{
                    background: "var(--bg-card)",
                    border: "1px solid var(--border-glow)",
                    borderRadius: 12,
                    padding: 12,
                    display: "flex",
                    flexDirection: "column",
                    gap: 6,
                  }}
                >
                  {columns.map((col) => (
                    <div
                      key={col.key}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        gap: 10,
                        fontSize: 13,
                      }}
                    >
                      <span
                        style={{
                          color: "var(--text-secondary)",
                          fontWeight: 600,
                          textTransform: "uppercase",
                          fontSize: 11,
                          letterSpacing: 0.5,
                          flexShrink: 0,
                        }}
                      >
                        {col.header as string}
                      </span>
                      <span
                        style={{
                          color: "var(--text-primary)",
                          textAlign: col.align ?? "left",
                          fontWeight: 500,
                        }}
                      >
                        {col.render(row, idx)}
                      </span>
                    </div>
                  ))}
                  {hasActions && (
                    <div
                      style={{
                        display: "flex",
                        gap: 6,
                        flexWrap: "wrap",
                        marginTop: 6,
                        paddingTop: 8,
                        borderTop: "1px solid var(--border-glow)",
                      }}
                    >
                      {rowActions!.map((a) => {
                        const isDisabled = a.disabled?.(row) ?? false;
                        return (
                          <button
                            key={a.key}
                            disabled={isDisabled}
                            onClick={() => a.onClick(row)}
                            className="action-btn"
                            style={{
                              padding: "6px 10px",
                              fontSize: 12,
                              opacity: isDisabled ? 0.5 : 1,
                            }}
                          >
                            {a.label}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
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
            background: "var(--bg-card)",
            flexWrap: "wrap",
            gap: 10,
          }}
        >
          <div style={{ flex: 1, minWidth: 120 }}>
            <span
              style={{
                color: "var(--text-secondary)",
                fontSize: 12,
              }}
            >
              Showing{" "}
              <span style={{ color: "var(--neon-blue)", fontWeight: 600 }}>
                {pageStart}
              </span>
              –
              <span style={{ color: "var(--neon-blue)", fontWeight: 600 }}>
                {pageEnd}
              </span>{" "}
              of{" "}
              <span style={{ color: "var(--neon-blue)", fontWeight: 600 }}>
                {totalElements}
              </span>
            </span>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "flex-end",
              gap: 12,
              flex: 1,
              flexWrap: "wrap",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              <span
                style={{
                  color: "var(--text-secondary)",
                  fontSize: 12,
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

            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <button
                onClick={prevPage}
                disabled={safePageIndex === 0}
                style={{
                  padding: "6px 12px",
                  borderRadius: 8,
                  border: "1px solid var(--border-glow)",
                  backgroundColor: "var(--bg-card)",
                  color: "var(--neon-blue)",
                  cursor: safePageIndex === 0 ? "not-allowed" : "pointer",
                  opacity: safePageIndex === 0 ? 0.4 : 1,
                  fontWeight: 600,
                  fontSize: 14,
                }}
              >
                ‹
              </button>

              <div
                style={{
                  padding: "5px 12px",
                  borderRadius: 8,
                  border: "1px solid var(--neon-blue)",
                  background: "rgba(37, 99, 235, 0.08)",
                  color: "var(--neon-blue)",
                  textAlign: "center",
                  fontWeight: 600,
                  fontSize: 13,
                  minWidth: 32,
                }}
              >
                {safePageIndex + 1}
              </div>

              <button
                onClick={nextPage}
                disabled={safePageIndex >= totalPages - 1}
                style={{
                  padding: "6px 12px",
                  borderRadius: 8,
                  border: "1px solid var(--border-glow)",
                  backgroundColor: "var(--bg-card)",
                  color: "var(--neon-blue)",
                  cursor:
                    safePageIndex >= totalPages - 1
                      ? "not-allowed"
                      : "pointer",
                  opacity: safePageIndex >= totalPages - 1 ? 0.4 : 1,
                  fontWeight: 600,
                  fontSize: 14,
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

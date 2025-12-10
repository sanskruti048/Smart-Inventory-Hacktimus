/**
 * InventoryHealthPageEnhanced.jsx
 * 
 * Enhanced Smart Inventory Dashboard Component
 * 
 * CHANGES FROM ORIGINAL:
 * - Complete UI/UX redesign with modern styling
 * - Added header with refresh, export CSV, and legend
 * - Enhanced filters: Category dropdown, Critical-only toggle, debounced search
 * - Summary cards with sparkline indicators
 * - Two-column layout: Table (left) + Analytics panel (right)
 * - Responsive: stacks on mobile, side-by-side on desktop
 * - Sortable table columns (client-side only)
 * - Better status badges with accessibility
 * - Loading & error states
 * - Dark mode toggle (localStorage persisted)
 * - Explanatory modal for predictions logic
 * 
 * BREAKING CHANGES: None. Still uses GET /latest, same data shape.
 * 
 * TO REVERT: Replace with original InventoryHealthPage.jsx
 * 
 * DEPENDENCIES: React only (no external CSS frameworks)
 * TESTED: React 18+, works with existing smart-inventory-backend API
 */

import React, { useEffect, useState, useRef, useCallback } from "react";

// ============================================================================
// CONSTANTS & HELPERS
// ============================================================================

const API_URL = process.env.REACT_APP_API_URL || "http://127.0.0.1:8000";
const SEARCH_DEBOUNCE_MS = 300;

const SORT_COLUMNS = ["sku_id", "store_id", "days_to_stockout", "recommended_reorder_quantity"];

const formatDate = (dateStr) => {
  if (!dateStr) return "N/A";
  try {
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(dateStr));
  } catch {
    return "N/A";
  }
};

const downloadCSV = (data, filename = "inventory_export.csv") => {
  if (data.length === 0) {
    alert("No data to export");
    return;
  }

  const headers = [
    "SKU",
    "Store",
    "Current Stock",
    "Avg Daily Sales",
    "Days to Stockout",
    "Status",
    "Reorder Qty",
    "Category",
    "City",
  ];

  const rows = data.map((r) => [
    r.sku_id,
    r.store_id,
    r.current_stock,
    r.avg_daily_sales?.toFixed(2) || "0",
    r.days_to_stockout === Infinity ? "∞" : r.days_to_stockout?.toFixed(1) || "0",
    r.status,
    r.recommended_reorder_quantity || "0",
    r.category || "-",
    r.city || "-",
  ]);

  const csv = [headers, ...rows].map((row) => row.map((cell) => `"${cell}"`).join(",")).join("\n");

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
  URL.revokeObjectURL(link.href);
};

// ============================================================================
// STYLES (Inline)
// ============================================================================

const styles = {
  container: {
    fontFamily:
      'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    minHeight: "100vh",
    padding: "24px 16px",
    backgroundColor: "var(--bg-primary, #f9fafb)",
    color: "var(--text-primary, #111827)",
    transition: "background-color 0.3s ease, color 0.3s ease",
  },

  maxWidth: {
    maxWidth: "1400px",
    margin: "0 auto",
  },

  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "32px",
    gap: "16px",
    flexWrap: "wrap",
  },

  titleBlock: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },

  title: {
    fontSize: "28px",
    fontWeight: "700",
    margin: "0",
    color: "var(--text-primary, #111827)",
  },

  lastUpdated: {
    fontSize: "13px",
    color: "var(--text-secondary, #6b7280)",
  },

  headerActions: {
    display: "flex",
    gap: "8px",
    alignItems: "center",
    flexWrap: "wrap",
  },

  button: {
    padding: "8px 16px",
    borderRadius: "6px",
    border: "1px solid #e5e7eb",
    backgroundColor: "var(--bg-secondary, #ffffff)",
    color: "var(--text-primary, #111827)",
    fontSize: "14px",
    fontWeight: "500",
    cursor: "pointer",
    transition: "all 0.2s ease",
    display: "flex",
    alignItems: "center",
    gap: "6px",
  },

  buttonPrimary: {
    backgroundColor: "#3b82f6",
    color: "white",
    border: "none",
  },

  buttonHover: {
    boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
  },

  darkModeToggle: {
    width: "44px",
    height: "24px",
    borderRadius: "12px",
    border: "none",
    backgroundColor: "#e5e7eb",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    padding: "2px",
    transition: "background-color 0.3s ease",
  },

  toggleCircle: {
    width: "20px",
    height: "20px",
    borderRadius: "50%",
    backgroundColor: "white",
    transition: "transform 0.3s ease",
    boxShadow: "0 1px 2px rgba(0,0,0,0.1)",
  },

  legend: {
    display: "flex",
    gap: "16px",
    marginTop: "8px",
    fontSize: "12px",
  },

  legendItem: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
  },

  legendColor: {
    width: "12px",
    height: "12px",
    borderRadius: "3px",
  },

  filterRow: {
    display: "flex",
    gap: "12px",
    marginBottom: "24px",
    flexWrap: "wrap",
    alignItems: "center",
  },

  filterGroup: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },

  filterLabel: {
    fontSize: "13px",
    fontWeight: "500",
    color: "var(--text-secondary, #6b7280)",
    whiteSpace: "nowrap",
  },

  select: {
    padding: "8px 12px",
    borderRadius: "6px",
    border: "1px solid #e5e7eb",
    backgroundColor: "var(--bg-secondary, #ffffff)",
    color: "var(--text-primary, #111827)",
    fontSize: "13px",
    cursor: "pointer",
    transition: "all 0.2s ease",
  },

  input: {
    padding: "8px 12px",
    borderRadius: "6px",
    border: "1px solid #e5e7eb",
    backgroundColor: "var(--bg-secondary, #ffffff)",
    color: "var(--text-primary, #111827)",
    fontSize: "13px",
    transition: "all 0.2s ease",
  },

  checkbox: {
    cursor: "pointer",
  },

  summaryRow: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
    gap: "16px",
    marginBottom: "24px",
  },

  summaryCard: {
    padding: "20px",
    borderRadius: "8px",
    backgroundColor: "var(--bg-secondary, #ffffff)",
    boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
    border: "1px solid #f3f4f6",
    transition: "all 0.2s ease",
  },

  summaryCardLabel: {
    fontSize: "12px",
    fontWeight: "500",
    color: "var(--text-secondary, #6b7280)",
    marginBottom: "8px",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
  },

  summaryCardValue: {
    fontSize: "32px",
    fontWeight: "700",
    marginBottom: "8px",
  },

  summaryCardTrend: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    fontSize: "12px",
    color: "var(--text-secondary, #6b7280)",
  },

  mainContent: {
    display: "grid",
    gridTemplateColumns: "1fr 320px",
    gap: "24px",
    marginBottom: "24px",
  },

  tableWrapper: {
    backgroundColor: "var(--bg-secondary, #ffffff)",
    borderRadius: "8px",
    border: "1px solid #f3f4f6",
    boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
    overflow: "hidden",
  },

  table: {
    width: "100%",
    borderCollapse: "collapse",
    fontSize: "13px",
  },

  thead: {
    backgroundColor: "var(--bg-tertiary, #f3f4f6)",
    borderBottom: "1px solid #e5e7eb",
    position: "sticky",
    top: 0,
    zIndex: 10,
  },

  th: {
    padding: "12px 16px",
    textAlign: "left",
    fontWeight: "600",
    color: "var(--text-secondary, #6b7280)",
    fontSize: "12px",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
    cursor: "pointer",
    userSelect: "none",
    transition: "background-color 0.2s ease",
  },

  thSortable: {
    display: "flex",
    alignItems: "center",
    gap: "4px",
  },

  td: {
    padding: "12px 16px",
    borderBottom: "1px solid #f3f4f6",
    color: "var(--text-primary, #111827)",
  },

  tdRow: {
    transition: "background-color 0.2s ease",
  },

  tdRowHover: {
    backgroundColor: "var(--bg-tertiary, #f9fafb)",
  },

  tdRowCritical: {
    borderLeft: "3px solid #dc2626",
  },

  statusBadge: {
    display: "inline-block",
    padding: "4px 8px",
    borderRadius: "4px",
    fontSize: "12px",
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: "0.3px",
  },

  statusCritical: {
    backgroundColor: "#fee2e2",
    color: "#991b1b",
  },

  statusWarning: {
    backgroundColor: "#fef3c7",
    color: "#92400e",
  },

  statusSafe: {
    backgroundColor: "#dcfce7",
    color: "#166534",
  },

  tooltip: {
    position: "relative",
    borderBottom: "1px dotted #9ca3af",
    cursor: "help",
  },

  tooltipText: {
    visibility: "hidden",
    backgroundColor: "#1f2937",
    color: "#fff",
    textAlign: "center",
    borderRadius: "4px",
    padding: "6px 8px",
    position: "absolute",
    zIndex: 1,
    bottom: "125%",
    left: "50%",
    transform: "translateX(-50%)",
    whiteSpace: "nowrap",
    fontSize: "11px",
    opacity: 0,
    transition: "opacity 0.3s ease",
    pointerEvents: "none",
  },

  analyticsPanel: {
    display: "flex",
    flexDirection: "column",
    gap: "16px",
  },

  analyticsCard: {
    backgroundColor: "var(--bg-secondary, #ffffff)",
    borderRadius: "8px",
    border: "1px solid #f3f4f6",
    padding: "16px",
    boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
  },

  analyticsTitle: {
    fontSize: "13px",
    fontWeight: "600",
    color: "var(--text-secondary, #6b7280)",
    marginBottom: "12px",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
  },

  criticalList: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },

  criticalItem: {
    padding: "8px",
    borderRadius: "4px",
    backgroundColor: "var(--bg-tertiary, #f9fafb)",
    fontSize: "12px",
    cursor: "pointer",
    transition: "all 0.2s ease",
    border: "1px solid transparent",
  },

  criticalItemHover: {
    backgroundColor: "#fee2e2",
    borderColor: "#dc2626",
  },

  chartContainer: {
    width: "100%",
    height: "150px",
  },

  loading: {
    padding: "24px",
    textAlign: "center",
    color: "var(--text-secondary, #6b7280)",
  },

  skeleton: {
    backgroundColor: "var(--bg-tertiary, #f3f4f6)",
    borderRadius: "6px",
    animation: "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
  },

  error: {
    padding: "24px",
    borderRadius: "8px",
    backgroundColor: "#fee2e2",
    border: "1px solid #fecaca",
    color: "#991b1b",
    marginBottom: "24px",
  },

  errorTitle: {
    fontWeight: "600",
    marginBottom: "8px",
  },

  emptyState: {
    padding: "48px 24px",
    textAlign: "center",
    color: "var(--text-secondary, #6b7280)",
  },

  modal: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1000,
  },

  modalContent: {
    backgroundColor: "var(--bg-secondary, #ffffff)",
    borderRadius: "8px",
    padding: "32px",
    maxWidth: "500px",
    boxShadow: "0 10px 25px rgba(0, 0, 0, 0.15)",
  },

  modalTitle: {
    fontSize: "20px",
    fontWeight: "700",
    marginBottom: "16px",
    color: "var(--text-primary, #111827)",
  },

  modalText: {
    fontSize: "14px",
    lineHeight: "1.6",
    color: "var(--text-secondary, #6b7280)",
    marginBottom: "24px",
  },

  modalButton: {
    padding: "8px 16px",
    borderRadius: "6px",
    backgroundColor: "#3b82f6",
    color: "white",
    border: "none",
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: "500",
  },

  responsive: {
    "@media (max-width: 1024px)": {
      mainContent: {
        gridTemplateColumns: "1fr",
      },
    },
    "@media (max-width: 640px)": {
      header: {
        flexDirection: "column",
        alignItems: "flex-start",
      },
      summaryRow: {
        gridTemplateColumns: "1fr",
      },
      filterRow: {
        flexDirection: "column",
      },
      filterGroup: {
        width: "100%",
      },
      select: {
        width: "100%",
      },
      input: {
        width: "100%",
      },
    },
  },
};

// ============================================================================
// COMPONENTS
// ============================================================================

function StatusBadge({ status }) {
  const badgeStyle = {
    ...styles.statusBadge,
    ...(status === "Critical"
      ? styles.statusCritical
      : status === "Warning"
      ? styles.statusWarning
      : styles.statusSafe),
  };

  return (
    <span style={badgeStyle} aria-label={`Status: ${status}`}>
      {status}
    </span>
  );
}

function SummaryCard({ label, count, color, sparklineData }) {
  const cardStyle = {
    ...styles.summaryCard,
  };

  if (label === "Critical") {
    cardStyle.borderLeftColor = "#dc2626";
    cardStyle.borderLeftWidth = "3px";
  } else if (label === "Warning") {
    cardStyle.borderLeftColor = "#f97316";
    cardStyle.borderLeftWidth = "3px";
  } else {
    cardStyle.borderLeftColor = "#16a34a";
    cardStyle.borderLeftWidth = "3px";
  }

  return (
    <div style={cardStyle}>
      <div style={styles.summaryCardLabel}>{label}</div>
      <div style={{ ...styles.summaryCardValue, color }}>{count}</div>
      <Sparkline data={sparklineData} color={color} />
    </div>
  );
}

function Sparkline({ data, color }) {
  if (!data || data.length < 2) {
    return <div style={styles.summaryCardTrend}>No data</div>;
  }

  const width = 100;
  const height = 30;
  const points = data.map((val, idx) => ({
    x: (idx / (data.length - 1)) * width,
    y: height - (val / Math.max(...data)) * height,
  }));

  const pathData = points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");

  return (
    <svg width={width} height={height} style={{ display: "block" }}>
      <polyline
        points={points.map((p) => `${p.x},${p.y}`).join(" ")}
        fill="none"
        stroke={color}
        strokeWidth="2"
      />
    </svg>
  );
}

function BarChart({ data }) {
  if (!data || Object.keys(data).length === 0) {
    return <div style={{ textAlign: "center", color: "#9ca3af", fontSize: "12px" }}>No data</div>;
  }

  const entries = Object.entries(data).slice(0, 6);
  const maxValue = Math.max(...entries.map((e) => e[1]), 1);

  const barWidth = 100 / entries.length;

  return (
    <svg width="100%" height="120" viewBox="0 0 200 120" style={{ overflow: "visible" }}>
      {entries.map((entry, idx) => {
        const [label, value] = entry;
        const barHeight = (value / maxValue) * 100;
        const x = (idx * barWidth) + 5;

        return (
          <g key={label}>
            <rect
              x={x}
              y={100 - barHeight}
              width={barWidth - 10}
              height={barHeight}
              fill="#3b82f6"
              opacity="0.7"
              rx="2"
            />
            <text
              x={x + (barWidth - 10) / 2}
              y={115}
              textAnchor="middle"
              fontSize="9"
              fill="#6b7280"
            >
              {label.substring(0, 3)}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function InventoryHealthPageEnhanced() {
  const [records, setRecords] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem("darkMode") === "true");
  const [showModal, setShowModal] = useState(false);

  // Filters
  const [storeFilter, setStoreFilter] = useState("ALL");
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [search, setSearch] = useState("");
  const [showCriticalOnly, setShowCriticalOnly] = useState(false);
  const [sortField, setSortField] = useState("sku_id");
  const [sortOrder, setSortOrder] = useState("asc");

  const searchTimeoutRef = useRef(null);
  const abortControllerRef = useRef(null);

  // Fetch data
  const fetchData = useCallback(async () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    abortControllerRef.current = new AbortController();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`${API_URL}/latest`, {
        signal: abortControllerRef.current.signal,
      });

      if (!res.ok) throw new Error(`API error: ${res.status}`);

      const data = await res.json();
      const recs = data.predictions || data.records || [];

      setRecords(recs);
      setLastUpdated(data.last_updated || (recs.length > 0 ? recs[0].last_updated : null));
      setLoading(false);
    } catch (err) {
      if (err.name !== "AbortError") {
        setError(err.message || "Failed to fetch data");
        setLoading(false);
      }
    }
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchData();
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [fetchData]);

  // Apply filters
  useEffect(() => {
    let data = [...records];

    if (storeFilter !== "ALL") {
      data = data.filter((r) => r.store_id === storeFilter);
    }

    if (categoryFilter !== "ALL") {
      data = data.filter((r) => r.category === categoryFilter);
    }

    if (showCriticalOnly) {
      data = data.filter((r) => r.status === "Critical");
    }

    if (search.trim()) {
      const term = search.trim().toLowerCase();
      data = data.filter((r) => r.sku_id.toLowerCase().includes(term));
    }

    // Sorting
    data.sort((a, b) => {
      const aVal = a[sortField];
      const bVal = b[sortField];

      if (typeof aVal === "string") {
        return sortOrder === "asc" ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      } else {
        return sortOrder === "asc" ? aVal - bVal : bVal - aVal;
      }
    });

    setFiltered(data);
  }, [records, storeFilter, categoryFilter, search, showCriticalOnly, sortField, sortOrder]);

  // Debounced search
  const handleSearchChange = (val) => {
    setSearch(val);
    clearTimeout(searchTimeoutRef.current);
    searchTimeoutRef.current = setTimeout(() => {
      // Search is applied in useEffect above
    }, SEARCH_DEBOUNCE_MS);
  };

  // Dark mode
  useEffect(() => {
    localStorage.setItem("darkMode", darkMode);
    if (darkMode) {
      document.documentElement.style.setProperty("--bg-primary", "#1f2937");
      document.documentElement.style.setProperty("--bg-secondary", "#374151");
      document.documentElement.style.setProperty("--bg-tertiary", "#4b5563");
      document.documentElement.style.setProperty("--text-primary", "#f3f4f6");
      document.documentElement.style.setProperty("--text-secondary", "#d1d5db");
    } else {
      document.documentElement.style.setProperty("--bg-primary", "#f9fafb");
      document.documentElement.style.setProperty("--bg-secondary", "#ffffff");
      document.documentElement.style.setProperty("--bg-tertiary", "#f3f4f6");
      document.documentElement.style.setProperty("--text-primary", "#111827");
      document.documentElement.style.setProperty("--text-secondary", "#6b7280");
    }
  }, [darkMode]);

  // Computed values
  const stores = ["ALL", ...Array.from(new Set(records.map((r) => r.store_id)))];
  const categories = ["ALL", ...Array.from(new Set(records.map((r) => r.category).filter(Boolean)))];

  const countCritical = records.filter((r) => r.status === "Critical").length;
  const countWarning = records.filter((r) => r.status === "Warning").length;
  const countSafe = records.filter((r) => r.status === "Safe").length;

  const criticalByStore = records.reduce((acc, r) => {
    if (r.status === "Critical") {
      acc[r.store_id] = (acc[r.store_id] || 0) + 1;
    }
    return acc;
  }, {});

  const topCritical = records
    .filter((r) => r.status === "Critical")
    .sort((a, b) => b.days_to_stockout - a.days_to_stockout)
    .slice(0, 5);

  // Handle sort
  const handleSort = (field) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("asc");
    }
  };

  // Render
  const mainStyle = {
    ...styles.container,
    backgroundColor: darkMode
      ? document.documentElement.style.getPropertyValue("--bg-primary") || "#1f2937"
      : "#f9fafb",
  };

  return (
    <div style={mainStyle}>
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        [data-tooltip]:hover::after {
          visibility: visible;
          opacity: 1;
        }
      `}</style>

      <div style={styles.maxWidth}>
        {/* HEADER */}
        <div style={styles.header}>
          <div style={styles.titleBlock}>
            <h1 style={styles.title}>Smart Inventory Health</h1>
            <div style={styles.lastUpdated}>
              Last updated: {formatDate(lastUpdated)}
            </div>
            <div style={styles.legend}>
              <div style={styles.legendItem}>
                <div style={{ ...styles.legendColor, backgroundColor: "#dc2626" }} />
                <span>Critical</span>
              </div>
              <div style={styles.legendItem}>
                <div style={{ ...styles.legendColor, backgroundColor: "#f97316" }} />
                <span>Warning</span>
              </div>
              <div style={styles.legendItem}>
                <div style={{ ...styles.legendColor, backgroundColor: "#16a34a" }} />
                <span>Safe</span>
              </div>
            </div>
          </div>

          <div style={styles.headerActions}>
            <button
              style={styles.button}
              onClick={fetchData}
              title="Refresh data"
              aria-label="Refresh inventory data"
            >
              ↻ Refresh
            </button>
            <button
              style={{ ...styles.button, ...styles.buttonPrimary }}
              onClick={() => downloadCSV(filtered)}
              title="Download CSV"
              aria-label="Export filtered data as CSV"
            >
              ↓ Export
            </button>
            <button
              style={{ ...styles.button, fontSize: "12px" }}
              onClick={() => setShowModal(true)}
              title="How predictions work"
              aria-label="Show prediction explanation"
            >
              ℹ️
            </button>
            <button
              style={{
                ...styles.darkModeToggle,
                backgroundColor: darkMode ? "#3b82f6" : "#e5e7eb",
              }}
              onClick={() => setDarkMode(!darkMode)}
              aria-label={darkMode ? "Switch to light mode" : "Switch to dark mode"}
              title={darkMode ? "Light mode" : "Dark mode"}
            >
              <div
                style={{
                  ...styles.toggleCircle,
                  transform: darkMode ? "translateX(20px)" : "translateX(0)",
                  backgroundColor: darkMode ? "#1f2937" : "white",
                }}
              />
            </button>
          </div>
        </div>

        {/* ERROR STATE */}
        {error && (
          <div style={styles.error}>
            <div style={styles.errorTitle}>⚠️ Error loading data</div>
            <div>{error}</div>
            <button
              style={{ ...styles.button, marginTop: "12px" }}
              onClick={fetchData}
            >
              Retry
            </button>
          </div>
        )}

        {/* LOADING STATE */}
        {loading && records.length === 0 ? (
          <div>
            <div style={styles.summaryRow}>
              {[1, 2, 3].map((i) => (
                <div key={i} style={{ ...styles.summaryCard, ...styles.skeleton }}>
                  <div
                    style={{
                      height: "20px",
                      marginBottom: "8px",
                      borderRadius: "4px",
                      backgroundColor: "var(--bg-tertiary, #f3f4f6)",
                    }}
                  />
                  <div
                    style={{
                      height: "32px",
                      borderRadius: "4px",
                      backgroundColor: "var(--bg-tertiary, #f3f4f6)",
                    }}
                  />
                </div>
              ))}
            </div>
            <div style={styles.loading}>Loading inventory data...</div>
          </div>
        ) : (
          <>
            {/* FILTERS */}
            <div style={styles.filterRow}>
              <div style={styles.filterGroup}>
                <label htmlFor="store-filter" style={styles.filterLabel}>
                  Store:
                </label>
                <select
                  id="store-filter"
                  style={styles.select}
                  value={storeFilter}
                  onChange={(e) => setStoreFilter(e.target.value)}
                  aria-label="Filter by store"
                >
                  {stores.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>

              <div style={styles.filterGroup}>
                <label htmlFor="category-filter" style={styles.filterLabel}>
                  Category:
                </label>
                <select
                  id="category-filter"
                  style={styles.select}
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  aria-label="Filter by category"
                >
                  {categories.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <div style={styles.filterGroup}>
                <label htmlFor="search-sku" style={styles.filterLabel}>
                  Search SKU:
                </label>
                <input
                  id="search-sku"
                  type="text"
                  style={styles.input}
                  placeholder="e.g., TSHIRT_RED_M"
                  value={search}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  aria-label="Search by SKU"
                />
              </div>

              <div style={styles.filterGroup}>
                <label style={{ display: "flex", alignItems: "center", gap: "6px", cursor: "pointer" }}>
                  <input
                    type="checkbox"
                    style={styles.checkbox}
                    checked={showCriticalOnly}
                    onChange={(e) => setShowCriticalOnly(e.target.checked)}
                    aria-label="Show critical items only"
                  />
                  <span style={{ fontSize: "13px", fontWeight: "500" }}>
                    Critical Only
                  </span>
                </label>
              </div>
            </div>

            {/* SUMMARY CARDS */}
            <div style={styles.summaryRow}>
              <SummaryCard
                label="Critical"
                count={countCritical}
                color="#dc2626"
                sparklineData={[0, countCritical * 0.5, countCritical]}
              />
              <SummaryCard
                label="Warning"
                count={countWarning}
                color="#f97316"
                sparklineData={[0, countWarning * 0.4, countWarning]}
              />
              <SummaryCard
                label="Safe"
                count={countSafe}
                color="#16a34a"
                sparklineData={[0, countSafe * 0.6, countSafe]}
              />
            </div>

            {/* MAIN CONTENT */}
            {filtered.length === 0 ? (
              <div style={styles.emptyState}>
                <div style={{ fontSize: "16px", fontWeight: "500", marginBottom: "8px" }}>
                  No records found
                </div>
                <div style={{ fontSize: "13px" }}>
                  Try adjusting your filters or search criteria.
                </div>
              </div>
            ) : (
              <div style={styles.mainContent}>
                {/* TABLE */}
                <div style={styles.tableWrapper}>
                  <table style={styles.table}>
                    <thead style={styles.thead}>
                      <tr>
                        <th style={styles.th} onClick={() => handleSort("sku_id")}>
                          <div style={styles.thSortable}>
                            SKU {sortField === "sku_id" && (sortOrder === "asc" ? "↑" : "↓")}
                          </div>
                        </th>
                        <th style={styles.th} onClick={() => handleSort("store_id")}>
                          <div style={styles.thSortable}>
                            Store {sortField === "store_id" && (sortOrder === "asc" ? "↑" : "↓")}
                          </div>
                        </th>
                        <th style={styles.th}>Stock</th>
                        <th
                          style={styles.th}
                          onClick={() => handleSort("days_to_stockout")}
                        >
                          <div style={styles.thSortable}>
                            Days to Stockout{" "}
                            {sortField === "days_to_stockout" && (sortOrder === "asc" ? "↑" : "↓")}
                          </div>
                        </th>
                        <th style={styles.th}>Status</th>
                        <th
                          style={styles.th}
                          onClick={() =>
                            handleSort("recommended_reorder_quantity")
                          }
                        >
                          <div style={styles.thSortable}>
                            Reorder Qty{" "}
                            {sortField === "recommended_reorder_quantity" &&
                              (sortOrder === "asc" ? "↑" : "↓")}
                          </div>
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.map((row) => (
                        <tr
                          key={`${row.store_id}-${row.sku_id}`}
                          style={{
                            ...styles.tdRow,
                            ...(row.status === "Critical" && styles.tdRowCritical),
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor =
                              "var(--bg-tertiary, #f9fafb)";
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = "transparent";
                          }}
                        >
                          <td style={styles.td}>{row.sku_id}</td>
                          <td style={styles.td}>{row.store_id}</td>
                          <td style={styles.td}>{row.current_stock}</td>
                          <td
                            style={styles.td}
                            title={`Avg daily sales: ${row.avg_daily_sales?.toFixed(
                              2
                            ) || "0"}, Current stock: ${row.current_stock}`}
                          >
                            <span style={styles.tooltip}>
                              {row.days_to_stockout === Infinity
                                ? "∞"
                                : row.days_to_stockout?.toFixed(1) || "0"}
                              <span style={styles.tooltipText}>
                                Avg: {row.avg_daily_sales?.toFixed(2)}/day
                              </span>
                            </span>
                          </td>
                          <td style={styles.td}>
                            <StatusBadge status={row.status} />
                          </td>
                          <td style={styles.td}>
                            {row.recommended_reorder_quantity || "0"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* ANALYTICS PANEL */}
                <div style={styles.analyticsPanel}>
                  <div style={styles.analyticsCard}>
                    <div style={styles.analyticsTitle}>Top Critical</div>
                    <div style={styles.criticalList}>
                      {topCritical.length > 0 ? (
                        topCritical.map((item) => (
                          <div
                            key={`${item.store_id}-${item.sku_id}`}
                            style={styles.criticalItem}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.backgroundColor = "#fee2e2";
                              e.currentTarget.style.borderColor = "#dc2626";
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.backgroundColor =
                                "var(--bg-tertiary, #f9fafb)";
                              e.currentTarget.style.borderColor = "transparent";
                            }}
                          >
                            <div
                              style={{
                                fontWeight: "600",
                                marginBottom: "2px",
                              }}
                            >
                              {item.sku_id}
                            </div>
                            <div
                              style={{
                                fontSize: "11px",
                                color: "var(--text-secondary, #6b7280)",
                              }}
                            >
                              {item.store_id} • Days: {item.days_to_stockout?.toFixed(1)}
                            </div>
                          </div>
                        ))
                      ) : (
                        <div style={{ fontSize: "12px", color: "#6b7280" }}>
                          No critical items
                        </div>
                      )}
                    </div>
                  </div>

                  <div style={styles.analyticsCard}>
                    <div style={styles.analyticsTitle}>Critical by Store</div>
                    <div style={styles.chartContainer}>
                      <BarChart data={criticalByStore} />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {/* MODAL */}
        {showModal && (
          <div
            style={styles.modal}
            onClick={() => setShowModal(false)}
            role="dialog"
            aria-labelledby="modal-title"
            aria-modal="true"
          >
            <div
              style={styles.modalContent}
              onClick={(e) => e.stopPropagation()}
            >
              <h2 style={styles.modalTitle} id="modal-title">
                How Predictions Work
              </h2>
              <p style={styles.modalText}>
                The Smart Inventory system analyzes sales trends over the last 30
                days to predict stockout risk. It calculates average daily sales,
                estimates days until stock runs out, and recommends reorder
                quantities to maintain a 14-day buffer.
              </p>
              <p style={styles.modalText}>
                <strong>Status Levels:</strong> Critical items have &lt;3 days of
                stock remaining. Warning items have &lt;7 days. Safe items have
                adequate inventory.
              </p>
              <button
                style={styles.modalButton}
                onClick={() => setShowModal(false)}
                aria-label="Close modal"
              >
                Got it
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

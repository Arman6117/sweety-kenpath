import { useState, useEffect, useMemo } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import ThemeToggle from "../components/ThemeToggle";
import ProfileDropdown from "../components/ProfileDropdown";
import NotificationPopover from "../components/NotificationPopover";
import api from "../api/axios";
import AddReadingModal from "../components/AddReadingModal";
import "./Dashboard.css";
import {
  Activity,
  LayoutDashboard,
  Droplets,
  ClipboardList,
  BarChart3,
  Settings,
  Plus,
  TrendingUp,
  TrendingDown,
  CalendarDays,
  Menu,
  LogOut,
  X,
  Loader2,
  AlertCircle,
  RefreshCw,
  ArrowRight,
  ShieldCheck,
  Calendar,
  Clock,
  Sparkles,
} from "lucide-react";

const navigation = [
  { label: "Dashboard", icon: LayoutDashboard, path: "/", active: true },
  { label: "Add Reading", icon: Droplets, isAction: true },
  { label: "Reading History", icon: ClipboardList, path: "/history" },
  { label: "Reports", icon: BarChart3, path: "/reports" },
  { label: "Settings", icon: Settings, path: "/settings" },
];

const SLOT_MAP = {
  MORNING: "Morning (Fasting)",
  AFTER_BREAKFAST: "After breakfast",
  AFTER_LUNCH: "After lunch",
  AFTER_DINNER: "After dinner",
};

const SLOT_SHORT = {
  MORNING: "Fasting",
  AFTER_BREAKFAST: "Post-Breakfast",
  AFTER_LUNCH: "Post-Lunch",
  AFTER_DINNER: "Post-Dinner",
};

function formatReadingDate(dateString) {
  if (!dateString) return "";
  const isoDate = String(dateString).slice(0, 10);
  const [year, month, day] = isoDate.split("-").map(Number);
  if (!year || !month || !day) return dateString;

  const dateObj = new Date(Date.UTC(year, month - 1, day));
  return dateObj.toLocaleDateString("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
    timeZone: "UTC",
  });
}

function formatShortDate(dateString) {
  if (!dateString) return "";
  const isoDate = String(dateString).slice(0, 10);
  const [year, month, day] = isoDate.split("-").map(Number);
  if (!year || !month || !day) return dateString;

  const dateObj = new Date(Date.UTC(year, month - 1, day));
  return dateObj.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
}

function formatSlot(slot) {
  return SLOT_MAP[slot] || slot;
}

function getClinicalAssessment(value, slot) {
  if (value === null || value === undefined) return null;
  const num = Number(value);
  if (isNaN(num)) return null;

  if (num < 70) {
    return {
      label: "Hypoglycemia Risk",
      badgeClass: "badge-low",
      color: "#0369A1",
      category: "low",
    };
  }

  const isFasting = slot === "MORNING";
  const normalThreshold = isFasting ? 100 : 140;

  if (num < normalThreshold) {
    return {
      label: "In Target Range",
      badgeClass: "badge-in-target",
      color: "#174C3A",
      category: "optimal",
    };
  }

  if (num < 200) {
    return {
      label: "Elevated",
      badgeClass: "badge-elevated",
      color: "#92400E",
      category: "elevated",
    };
  }

  return {
    label: "High Glycemia",
    badgeClass: "badge-high",
    color: "#991B1B",
    category: "high",
  };
}

export default function Dashboard() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { isDark } = useTheme();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Live state
  const [readings, setReadings] = useState([]);
  const [summary, setSummary] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [hoveredPoint, setHoveredPoint] = useState(null);

  // Initial load
  useEffect(() => {
    let isMounted = true;

    async function loadDashboardData() {
      try {
        const [readingsRes, reportRes] = await Promise.all([
          api.get("/api/readings"),
          api.get("/api/reports/month-to-date"),
        ]);

        if (isMounted) {
          setReadings(readingsRes.data?.readings || []);
          setSummary(reportRes.data?.report?.summary || null);
          setError(null);
        }
      } catch (err) {
        if (isMounted) {
          console.error("Dashboard fetch error:", err);
          const msg =
            err.response?.data?.message ||
            "Unable to load glucose data. Please check your connection and try again.";
          setError(msg);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadDashboardData();

    return () => {
      isMounted = false;
    };
  }, []);

  // Manual refresh handler
  const handleRefresh = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const [readingsRes, reportRes] = await Promise.all([
        api.get("/api/readings"),
        api.get("/api/reports/month-to-date"),
      ]);

      setReadings(readingsRes.data?.readings || []);
      setSummary(reportRes.data?.report?.summary || null);
    } catch (err) {
      console.error("Dashboard refresh error:", err);
      const msg =
        err.response?.data?.message ||
        "Unable to load glucose data. Please check your connection and try again.";
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  // Submit new reading to backend and refresh dashboard
  const handleSaveReading = async (readingPayload) => {
    const response = await api.post("/api/readings", readingPayload);
    await handleRefresh();
    return response.data;
  };

  const handleLogout = () => {
    setMobileMenuOpen(false);
    logout();
  };

  const displayName = user?.name || "Friend";

  const todayFormatted = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  const currentMonthYear = new Date().toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  // Derived summary values
  const averageValue =
    summary?.average !== null && summary?.average !== undefined
      ? summary.average
      : "--";

  const highestValue =
    summary?.highest !== null && summary?.highest !== undefined
      ? summary.highest
      : "--";

  const lowestValue =
    summary?.lowest !== null && summary?.lowest !== undefined
      ? summary.lowest
      : "--";

  const totalCount =
    summary?.count !== null && summary?.count !== undefined
      ? summary.count
      : 0;

  const averageSubtitle =
    summary?.count && summary.count > 0
      ? `Across ${summary.count} ${summary.count === 1 ? "entry" : "entries"}`
      : "No entries recorded";

  // Chronological readings for trend chart (take up to 10 latest, sort ascending)
  const trendReadings = useMemo(() => {
    if (!readings || readings.length === 0) return [];
    const subset = readings.slice(0, 10);
    const slotWeights = {
      MORNING: 1,
      AFTER_BREAKFAST: 2,
      AFTER_LUNCH: 3,
      AFTER_DINNER: 4,
    };
    return [...subset].sort((a, b) => {
      const dateA = String(a.date).slice(0, 10);
      const dateB = String(b.date).slice(0, 10);
      if (dateA !== dateB) {
        return dateA.localeCompare(dateB);
      }
      return (slotWeights[a.slot] || 0) - (slotWeights[b.slot] || 0);
    });
  }, [readings]);

  // Chart coordinate mapping
  const chartConfig = useMemo(() => {
    const width = 740;
    const height = 230;
    const paddingLeft = 46;
    const paddingRight = 24;
    const paddingTop = 26;
    const paddingBottom = 42;

    const plotWidth = width - paddingLeft - paddingRight;
    const plotHeight = height - paddingTop - paddingBottom;

    const validReadings = trendReadings.filter((r) => {
      const val = Number(r.value);
      return !isNaN(val) && val > 0;
    });

    if (validReadings.length === 0) {
      return {
        width,
        height,
        paddingLeft,
        paddingRight,
        paddingTop,
        paddingBottom,
        plotWidth,
        plotHeight,
        points: [],
        ticks: [],
        linePath: "",
        areaPath: "",
        minY: 0,
        maxY: 0,
        scaleY: () => 0,
      };
    }

    const values = validReadings.map((r) => Number(r.value));
    const rawMin = Math.min(...values);
    const rawMax = Math.max(...values);
    const valRange = rawMax - rawMin;

    let minY, maxY;
    if (valRange === 0) {
      // Single reading or identical values: provide sensible +/- 25 mg/dL padding
      minY = Math.max(0, Math.floor((rawMin - 25) / 10) * 10);
      maxY = Math.ceil((rawMin + 25) / 10) * 10;
    } else {
      // Sensible padding based on actual range (~18%)
      const pad = Math.max(12, Math.ceil(valRange * 0.18));
      minY = Math.max(0, Math.floor((rawMin - pad) / 10) * 10);
      maxY = Math.ceil((rawMax + pad) / 10) * 10;
    }

    const scaleY = (val) => {
      if (maxY === minY) return paddingTop + plotHeight / 2;
      const clamped = Math.max(minY, Math.min(maxY, val));
      const normalized = (clamped - minY) / (maxY - minY);
      return paddingTop + plotHeight * (1 - normalized);
    };

    const scaleX = (index) => {
      if (validReadings.length === 1) {
        return paddingLeft + plotWidth / 2;
      }
      if (validReadings.length === 2) {
        return index === 0
          ? paddingLeft + plotWidth * 0.25
          : paddingLeft + plotWidth * 0.75;
      }
      return paddingLeft + (index / (validReadings.length - 1)) * plotWidth;
    };

    const points = validReadings.map((reading, index) => {
      const val = Number(reading.value);
      return {
        ...reading,
        x: scaleX(index),
        y: scaleY(val),
        val,
      };
    });

    let linePath = "";
    let areaPath = "";

    if (points.length === 2) {
      // Two readings: simple straight line (no exaggerated curve)
      linePath = `M ${points[0].x} ${points[0].y} L ${points[1].x} ${points[1].y}`;
      const groundY = paddingTop + plotHeight;
      areaPath = `M ${points[0].x} ${points[0].y} L ${points[1].x} ${points[1].y} L ${points[1].x} ${groundY} L ${points[0].x} ${groundY} Z`;
    } else if (points.length >= 3) {
      // Three or more readings: smooth curve
      linePath = `M ${points[0].x} ${points[0].y}`;
      for (let i = 1; i < points.length; i++) {
        const prev = points[i - 1];
        const curr = points[i];
        const cpX1 = prev.x + (curr.x - prev.x) / 2;
        const cpY1 = prev.y;
        const cpX2 = prev.x + (curr.x - prev.x) / 2;
        const cpY2 = curr.y;
        linePath += ` C ${cpX1} ${cpY1}, ${cpX2} ${cpY2}, ${curr.x} ${curr.y}`;
      }
      const firstPoint = points[0];
      const lastPoint = points[points.length - 1];
      const groundY = paddingTop + plotHeight;
      areaPath = `${linePath} L ${lastPoint.x} ${groundY} L ${firstPoint.x} ${groundY} Z`;
    }

    // Generate 4 clean, evenly spaced horizontal ticks
    const tickCount = 4;
    const step = (maxY - minY) / (tickCount - 1);
    const ticks = [];
    for (let i = 0; i < tickCount; i++) {
      ticks.push(Math.round(minY + i * step));
    }
    const uniqueTicks = Array.from(new Set(ticks)).sort((a, b) => a - b);

    return {
      width,
      height,
      paddingLeft,
      paddingRight,
      paddingTop,
      paddingBottom,
      plotWidth,
      plotHeight,
      points,
      linePath,
      areaPath,
      ticks: uniqueTicks,
      scaleY,
      minY,
      maxY,
    };
  }, [trendReadings]);

  return (
    <div className="sweety-dashboard-wrapper font-sans antialiased text-[#183D30]">
      <div className="flex min-h-screen">
        {/* ======================================================== */}
        {/* DESKTOP CLINICAL SIDEBAR                                */}
        {/* ======================================================== */}
        <aside className="hidden w-64 shrink-0 border-r border-[#E3EAE3] bg-white px-5 py-7 lg:flex lg:flex-col">
          {/* Brand Header */}
          <div className="mb-9 flex items-center gap-3 px-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#174C3A] text-white shadow-xs">
              <Activity size={22} strokeWidth={2.2} />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xl font-bold tracking-tight text-[#183D30]">
                  Sweety
                </span>
                <span className="rounded-md bg-[#EBF5F0] px-1.5 py-0.5 text-[10px] font-bold text-[#174C3A] uppercase tracking-wider">
                  Care
                </span>
              </div>
              <p className="text-[11px] font-medium text-[#718078]">
                Clinical Intelligence
              </p>
            </div>
          </div>

          <p className="mb-3 px-3 text-[11px] font-semibold uppercase tracking-wider text-[#718078]">
            Navigation
          </p>

          {/* Navigation Links */}
          <nav className="space-y-1.5">
            {navigation.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.label}
                  onClick={() => {
                    if (item.isAction) {
                      setIsAddModalOpen(true);
                    } else if (item.path) {
                      navigate(item.path);
                    }
                  }}
                  className={`nav-item-transition flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-left text-sm font-semibold ${
                    item.active
                      ? "bg-[#174C3A] text-white shadow-xs"
                      : "text-[#718078] hover:bg-[#F3F6F1] hover:text-[#183D30]"
                  }`}
                >
                  <Icon
                    size={18}
                    strokeWidth={item.active ? 2.2 : 2}
                    className={item.active ? "text-white" : "text-[#718078]"}
                  />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Clinical Reference Info Box */}
          <div className="mt-8 rounded-2xl border border-[#E3EAE3] bg-[#F8FAF8] p-4 text-xs">
            <div className="mb-2 flex items-center gap-2 text-[#174C3A] font-semibold">
              <ShieldCheck size={16} />
              <span>Standard Glycemia</span>
            </div>
            <div className="space-y-1.5 text-[11px] text-[#718078]">
              <div className="flex justify-between">
                <span>Fasting Target:</span>
                <span className="font-semibold text-[#183D30]">70–99 mg/dL</span>
              </div>
              <div className="flex justify-between">
                <span>Post-Meal Target:</span>
                <span className="font-semibold text-[#183D30]">&lt; 140 mg/dL</span>
              </div>
            </div>
          </div>

          {/* Sidebar Footer / Sign Out */}
          <div className="mt-auto border-t border-[#E3EAE3] pt-4">
            <button
              onClick={handleLogout}
              className="flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-left text-sm font-semibold text-[#718078] transition hover:bg-red-50 hover:text-red-700"
            >
              <LogOut size={18} />
              <span>Sign Out</span>
            </button>
          </div>
        </aside>

        {/* ======================================================== */}
        {/* MOBILE NAVIGATION DRAWER                                 */}
        {/* ======================================================== */}
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-50 flex lg:hidden">
            <div
              className="fixed inset-0 bg-[#103528]/40 backdrop-blur-xs transition-opacity"
              onClick={() => setMobileMenuOpen(false)}
            />
            <div className="relative flex w-72 flex-col bg-white p-6 shadow-xl">
              <div className="mb-6 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#174C3A] text-white">
                    <Activity size={20} />
                  </div>
                  <span className="text-lg font-bold tracking-tight text-[#183D30]">
                    Sweety
                  </span>
                </div>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="rounded-lg p-1.5 text-[#718078] hover:bg-[#F3F6F1]"
                  aria-label="Close menu"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Patient Badge */}
              <div className="mb-6 rounded-2xl border border-[#E3EAE3] bg-[#F8FAF8] p-3.5">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#EBF5F0] text-[#174C3A] font-bold">
                    {displayName.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold text-[#183D30]">
                      {displayName}
                    </p>
                    <p className="truncate text-xs text-[#718078]">
                      {user?.email}
                    </p>
                  </div>
                </div>
              </div>

              <nav className="space-y-1.5">
                {navigation.map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.label}
                      onClick={() => {
                        setMobileMenuOpen(false);
                        if (item.isAction) {
                          setIsAddModalOpen(true);
                        } else if (item.path) {
                          navigate(item.path);
                        }
                      }}
                      className={`nav-item-transition flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-semibold ${
                        item.active
                          ? "bg-[#174C3A] text-white"
                          : "text-[#718078] hover:bg-[#F3F6F1] hover:text-[#183D30]"
                      }`}
                    >
                      <Icon size={19} />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </nav>

              <div className="mt-auto border-t border-[#E3EAE3] pt-4">
                <button
                  onClick={handleLogout}
                  className="flex w-full items-center gap-3 rounded-xl px-4 py-2.5 text-left text-sm font-semibold text-red-600 transition hover:bg-red-50"
                >
                  <LogOut size={19} />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* MAIN DASHBOARD CONTENT AREA                              */}
        {/* ======================================================== */}
        <main className="min-w-0 flex-1 px-4 py-6 sm:px-8 lg:px-10">
          {/* Header Bar */}
          <header className="animate-fade-in-up mb-7 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setMobileMenuOpen(true)}
                className="rounded-xl border border-[#E3EAE3] bg-white p-2.5 text-[#183D30] shadow-xs lg:hidden"
                aria-label="Open menu"
              >
                <Menu size={20} />
              </button>
              <div>
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-[#EBF5F0] px-2.5 py-0.5 text-[11px] font-semibold text-[#174C3A]">
                    <span className="h-1.5 w-1.5 rounded-full bg-[#2D805B] animate-pulse" />
                    Clinical Telemetry
                  </span>
                  <span className="text-xs text-[#718078] hidden sm:inline">
                    • {todayFormatted}
                  </span>
                </div>
                <h1 className="text-xl font-bold tracking-tight text-[#183D30] sm:text-2xl mt-0.5">
                  Patient Dashboard
                </h1>
              </div>
            </div>

            {/* Header Right Actions */}
            <div className="flex items-center gap-2.5 sm:gap-3">
              {/* Distinctive Add Reading Button */}
              <button
                onClick={() => setIsAddModalOpen(true)}
                className="btn-primary-forest flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-semibold sm:text-sm shadow-xs"
              >
                <Plus size={16} strokeWidth={2.5} />
                <span>Log Reading</span>
              </button>

              {/* Refresh Action */}
              <button
                onClick={handleRefresh}
                disabled={isLoading}
                title="Refresh clinical data"
                className="btn-secondary-clinical rounded-xl p-2.5 text-[#718078] hover:text-[#183D30] disabled:opacity-50"
              >
                <RefreshCw
                  size={17}
                  className={isLoading ? "animate-spin text-[#174C3A]" : ""}
                />
              </button>

              {/* Notification Center */}
              <NotificationPopover />

              {/* Theme Toggle */}
              <ThemeToggle className="btn-secondary-clinical" />

              {/* Portal-based User Profile Dropdown (Guaranteed above all content) */}
              <ProfileDropdown />
            </div>
          </header>

          {/* Global Error Banner */}
          {error && (
            <div className="mb-6 flex items-center justify-between gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
              <div className="flex items-center gap-2.5">
                <AlertCircle size={19} className="shrink-0 text-red-600" />
                <p>{error}</p>
              </div>
              <button
                onClick={handleRefresh}
                className="shrink-0 rounded-xl bg-white px-3.5 py-1.5 text-xs font-semibold text-red-700 border border-red-200 shadow-xs hover:bg-red-100"
              >
                Retry Telemetry
              </button>
            </div>
          )}

          {/* ======================================================== */}
          {/* SECTION 1: CLINICAL HERO BANNER                          */}
          {/* ======================================================== */}
          <section
            className="clinical-hero-banner animate-fade-in-up mb-7 rounded-3xl p-6 text-white sm:p-8"
            style={{ animationDelay: "60ms" }}
          >
            <div className="relative z-10 flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
              <div className="max-w-2xl">
                <div className="flex items-center gap-2 mb-2">
                  <span className="inline-flex items-center gap-1 rounded-md bg-white/10 px-2 py-0.5 text-[11px] font-semibold text-white/90 backdrop-blur-xs">
                    <Sparkles size={12} className="text-[#2D805B]" />
                    Clinical Glycemic Care
                  </span>
                  <span className="text-xs text-white/70">
                    Cycle: {currentMonthYear}
                  </span>
                </div>
                <h2 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
                  Welcome back, {displayName}
                </h2>
                <p className="mt-2 text-xs sm:text-sm leading-relaxed text-white/80">
                  {totalCount > 0
                    ? `${totalCount} verified measurement${totalCount === 1 ? "" : "s"} logged this month. Your average is ${averageValue} mg/dL.`
                    : "No glucose readings recorded for this reporting period yet. Log your first measurement to initiate active telemetry tracking."}
                </p>
              </div>

              <div className="flex shrink-0 items-center gap-3">
                <button
                  onClick={() => setIsAddModalOpen(true)}
                  className="btn-press-animate flex items-center justify-center gap-2 rounded-xl bg-white px-5 py-3 text-xs sm:text-sm font-semibold text-[#103528] shadow-sm transition hover:bg-[#F3F6F1]"
                >
                  <Plus size={17} strokeWidth={2.5} />
                  <span>Record Glucose</span>
                </button>
              </div>
            </div>
          </section>

          {/* ======================================================== */}
          {/* SECTION 2: SUMMARY METRIC CARDS (4 CARDS)                */}
          {/* ======================================================== */}
          <section
            className="animate-fade-in-up mb-7 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4"
            style={{ animationDelay: "120ms" }}
          >
            {/* Card 1: Average Glucose */}
            <SummaryMetricCard
              title="Average Glucose"
              value={averageValue}
              unit="mg/dL"
              subtitle={averageSubtitle}
              badge={
                averageValue !== "--"
                  ? Number(averageValue) < 100
                    ? "Optimal Fasting"
                    : Number(averageValue) <= 140
                    ? "Normal Post-Meal"
                    : "Elevated Average"
                  : "Baseline"
              }
              badgeType={
                averageValue !== "--"
                  ? Number(averageValue) <= 140
                    ? "in-target"
                    : "elevated"
                  : "neutral"
              }
              icon={Activity}
              iconBg="bg-[#EBF5F0]"
              iconColor="text-[#174C3A]"
              isLoading={isLoading}
            />

            {/* Card 2: Highest Reading */}
            <SummaryMetricCard
              title="Highest Reading"
              value={highestValue}
              unit="mg/dL"
              subtitle="Month-to-Date peak"
              badge="Peak Measurement"
              badgeType={highestValue !== "--" && Number(highestValue) > 180 ? "elevated" : "neutral"}
              icon={TrendingUp}
              iconBg="bg-[#FEF7EE]"
              iconColor="text-[#92400E]"
              isLoading={isLoading}
            />

            {/* Card 3: Lowest Reading */}
            <SummaryMetricCard
              title="Lowest Reading"
              value={lowestValue}
              unit="mg/dL"
              subtitle="Month-to-Date trough"
              badge="Trough Measurement"
              badgeType={lowestValue !== "--" && Number(lowestValue) < 70 ? "low" : "neutral"}
              icon={TrendingDown}
              iconBg="bg-[#F0F7FD]"
              iconColor="text-[#0369A1]"
              isLoading={isLoading}
            />

            {/* Card 4: Total Records */}
            <SummaryMetricCard
              title="Total Records"
              value={totalCount}
              unit={totalCount === 1 ? "entry" : "entries"}
              subtitle={currentMonthYear}
              badge="Verified Logs"
              badgeType="neutral"
              icon={ClipboardList}
              iconBg="bg-[#EBF5F0]"
              iconColor="text-[#174C3A]"
              isLoading={isLoading}
            />
          </section>

          {/* ======================================================== */}
          {/* SECTION 3: GLUCOSE TREND SECTION                         */}
          {/* ======================================================== */}
          <section
            className="clinical-card animate-fade-in-up mb-7 p-5 sm:p-7"
            style={{ animationDelay: "180ms" }}
          >
            <div className="mb-6 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base sm:text-lg font-bold text-[#183D30]">
                    Glucose Trend Analysis
                  </h3>
                  {trendReadings.length > 0 && (
                    <span className="rounded-full bg-[#EBF5F0] px-2.5 py-0.5 text-[10px] font-semibold text-[#174C3A]">
                      {trendReadings.length} {trendReadings.length === 1 ? "Record" : "Records"}
                    </span>
                  )}
                </div>
                <p className="mt-0.5 text-xs text-[#718078]">
                  Sequential blood glucose readings over recent sessions
                </p>
              </div>

              {trendReadings.length > 0 && (
                <div className="flex items-center gap-2 text-xs">
                  <span className="rounded-lg border border-[#E3EAE3] bg-[#F8FAF8] px-3 py-1 text-[11px] font-medium text-[#718078]">
                    Latest: <strong className="font-semibold text-[#183D30]">{trendReadings[trendReadings.length - 1].value} mg/dL</strong>
                  </span>
                </div>
              )}
            </div>

            {/* Trend Chart Area */}
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <Loader2 size={28} className="animate-spin text-[#174C3A]" />
                <p className="mt-3 text-xs font-semibold text-[#718078]">
                  Loading glucose trend data...
                </p>
              </div>
            ) : trendReadings.length === 0 ? (
              /* ZERO READINGS EMPTY STATE */
              <div className="rounded-2xl border border-dashed border-[#E3EAE3] bg-[#F8FAF8] py-14 px-4 text-center">
                <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-[#EBF5F0] text-[#174C3A]">
                  <TrendingUp size={20} />
                </div>
                <h4 className="text-sm font-bold text-[#183D30]">
                  Your glucose trend will appear here
                </h4>
                <p className="mx-auto mt-1 max-w-sm text-xs text-[#718078] leading-relaxed">
                  Record your blood glucose measurements to track your trend over time.
                </p>
                <button
                  onClick={() => setIsAddModalOpen(true)}
                  className="btn-primary-forest mt-4 inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-semibold shadow-xs"
                >
                  <Plus size={15} />
                  <span>Add Reading</span>
                </button>
              </div>
            ) : (
              <div className="relative">
                {/* SVG Responsive Trend Visualization */}
                <div className="overflow-x-auto pb-2">
                  <svg
                    viewBox={`0 0 ${chartConfig.width} ${chartConfig.height}`}
                    className="w-full h-auto min-w-[540px] select-none"
                  >
                    <defs>
                      <linearGradient id="glucoseTrendGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#2D805B" stopOpacity="0.18" />
                        <stop offset="100%" stopColor="#2D805B" stopOpacity="0.0" />
                      </linearGradient>
                    </defs>

                    {/* Horizontal Reference Grid Lines & Y-Labels */}
                    {chartConfig.ticks.map((tick) => {
                      const y = chartConfig.scaleY(tick);
                      return (
                        <g key={tick}>
                          <line
                            x1={chartConfig.paddingLeft}
                            y1={y}
                            x2={chartConfig.paddingLeft + chartConfig.plotWidth}
                            y2={y}
                            stroke={isDark ? "#1F3D30" : "#E3EAE3"}
                            strokeWidth="1"
                            strokeDasharray="3 3"
                          />
                          <text
                            x={chartConfig.paddingLeft - 8}
                            y={y + 3.5}
                            textAnchor="end"
                            fontSize="10"
                            fontWeight="500"
                            fill={isDark ? "#93ADA1" : "#718078"}
                          >
                            {tick}
                          </text>
                        </g>
                      );
                    })}

                    {/* Area fill (rendered only for 2 or more readings) */}
                    {chartConfig.areaPath && (
                      <path
                        d={chartConfig.areaPath}
                        fill="url(#glucoseTrendGradient)"
                        className="chart-area-animate"
                      />
                    )}

                    {/* Line path (straight line for 2 readings, smooth curve for 3+) */}
                    {chartConfig.linePath && (
                      <path
                        d={chartConfig.linePath}
                        fill="none"
                        stroke={isDark ? "#48C28D" : "#174C3A"}
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="chart-line-animate"
                      />
                    )}

                    {/* Interactive Data Points */}
                    {chartConfig.points.map((pt, idx) => {
                      const isHovered = hoveredPoint?.id === pt.id;
                      const isSingle = chartConfig.points.length === 1;

                      return (
                        <g
                          key={pt.id || idx}
                          className="cursor-pointer chart-point-node"
                          style={{ animationDelay: `${0.15 + idx * 0.05}s` }}
                          onClick={() => setHoveredPoint((prev) => (prev?.id === pt.id ? null : pt))}
                          onMouseEnter={() => setHoveredPoint(pt)}
                          onMouseLeave={() => setHoveredPoint(null)}
                        >
                          {/* Point halo/glow */}
                          {(isHovered || isSingle) && (
                            <circle
                              cx={pt.x}
                              cy={pt.y}
                              r={isSingle ? "13" : "11"}
                              fill={isDark ? "#34A873" : "#174C3A"}
                              fillOpacity={isSingle ? "0.14" : "0.12"}
                            />
                          )}

                          {/* Outer ring */}
                          <circle
                            cx={pt.x}
                            cy={pt.y}
                            r={isSingle ? "6.5" : isHovered ? "6" : "4.5"}
                            fill={isDark ? "#13261F" : "#FFFFFF"}
                            stroke={isDark ? "#48C28D" : "#174C3A"}
                            strokeWidth={isSingle || isHovered ? "2.5" : "2"}
                            className="transition-all"
                          />

                          {/* Center core */}
                          <circle
                            cx={pt.x}
                            cy={pt.y}
                            r={isSingle ? "3" : "2"}
                            fill={isDark ? "#48C28D" : "#2D805B"}
                          />

                          {/* Reading value displayed above data point */}
                          <text
                            x={pt.x}
                            y={pt.y - (isSingle ? 14 : 9)}
                            textAnchor="middle"
                            fontSize={isSingle ? "11.5" : "10"}
                            fontWeight="700"
                            fill={isDark ? "#E8F2EC" : "#183D30"}
                          >
                            {pt.val}
                            {isSingle && (
                              <tspan fontSize="9" fontWeight="500" fill={isDark ? "#93ADA1" : "#718078"}>
                                {" "}mg/dL
                              </tspan>
                            )}
                          </text>

                          {/* X-axis date label */}
                          <text
                            x={pt.x}
                            y={chartConfig.paddingTop + chartConfig.plotHeight + 16}
                            textAnchor="middle"
                            fontSize="9.5"
                            fontWeight="500"
                            fill={isDark ? "#93ADA1" : "#718078"}
                          >
                            {formatShortDate(pt.date)}
                          </text>

                          {/* X-axis slot label */}
                          <text
                            x={pt.x}
                            y={chartConfig.paddingTop + chartConfig.plotHeight + 28}
                            textAnchor="middle"
                            fontSize="8.5"
                            fontWeight="600"
                            fill={isDark ? "#C6D8CE" : "#183D30"}
                          >
                            {SLOT_SHORT[pt.slot] || pt.slot}
                          </text>
                        </g>
                      );
                    })}
                  </svg>
                </div>

                {/* ONE READING SUBTLE HELPER MESSAGE */}
                {chartConfig.points.length === 1 && (
                  <div className="mt-2.5 flex items-center justify-center gap-2 rounded-xl border border-[#E3EAE3] bg-[#F8FAF8] py-2 px-3 text-xs text-[#718078]">
                    <span>One reading recorded. Add more readings to see your trend.</span>
                  </div>
                )}

                {/* Floating Tooltip Detail Card */}
                {hoveredPoint && (
                  <div
                    className="chart-tooltip-box absolute top-2 right-2 flex items-center gap-2.5 border border-white/10"
                    style={{ zIndex: 10 }}
                  >
                    <div>
                      <p className="font-bold text-sm text-white">
                        {hoveredPoint.val} <span className="text-[10px] text-white/70">mg/dL</span>
                      </p>
                      <p className="text-[10px] text-white/80 mt-0.5">
                        {formatReadingDate(hoveredPoint.date)} • {formatSlot(hoveredPoint.slot)}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </section>

          {/* ======================================================== */}
          {/* SECTION 4: RECENT READINGS AUDIT LOG                     */}
          {/* ======================================================== */}
          <section
            className="clinical-card animate-fade-in-up p-5 sm:p-7"
            style={{ animationDelay: "240ms" }}
          >
            <div className="mb-5 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
              <div>
                <h3 className="text-base sm:text-lg font-bold text-[#183D30]">
                  Recent Clinical Readings
                </h3>
                <p className="mt-0.5 text-xs text-[#718078]">
                  Verified chronological blood glucose records
                </p>
              </div>

              <div className="flex items-center gap-3">
                <span className="hidden sm:inline-flex items-center gap-1.5 rounded-lg border border-[#E3EAE3] bg-[#F8FAF8] px-3 py-1.5 text-xs font-semibold text-[#718078]">
                  <CalendarDays size={14} className="text-[#174C3A]" />
                  {currentMonthYear}
                </span>

                <Link
                  to="/history"
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#174C3A] hover:text-[#103528] transition"
                >
                  <span>Full History</span>
                  <ArrowRight size={14} />
                </Link>
              </div>
            </div>

            {/* Table Content */}
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <Loader2 size={26} className="animate-spin text-[#174C3A]" />
                <p className="mt-3 text-xs font-semibold text-[#718078]">
                  Retrieving patient log...
                </p>
              </div>
            ) : readings.length === 0 ? (
              <div className="py-12 text-center">
                <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-[#EBF5F0] text-[#174C3A]">
                  <Droplets size={22} />
                </div>
                <h4 className="text-sm font-bold text-[#183D30]">
                  No Entries In Current Audit Log
                </h4>
                <p className="mx-auto mt-1 max-w-sm text-xs leading-relaxed text-[#718078]">
                  You have not added any glucose measurements yet. Begin logging your sessions to see clinical records and trends.
                </p>
                <button
                  onClick={() => setIsAddModalOpen(true)}
                  className="btn-primary-forest mt-4 inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-semibold shadow-xs"
                >
                  <Plus size={16} />
                  <span>Log First Measurement</span>
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[560px] text-left text-xs sm:text-sm">
                  <thead>
                    <tr className="border-b border-[#E3EAE3] text-[11px] font-semibold uppercase tracking-wider text-[#718078]">
                      <th className="px-4 py-3.5">Date</th>
                      <th className="px-4 py-3.5">Clinical Slot</th>
                      <th className="px-4 py-3.5">Glucose Level</th>
                      <th className="px-4 py-3.5">Assessment</th>
                    </tr>
                  </thead>
                  <tbody>
                    {readings.slice(0, 8).map((reading) => {
                      const assessment = getClinicalAssessment(reading.value, reading.slot);
                      return (
                        <tr
                          key={reading.id}
                          className="border-b border-[#E3EAE3]/60 last:border-0 hover:bg-[#F8FAF8] transition"
                        >
                          <td className="px-4 py-4 font-medium text-[#183D30]">
                            <div className="flex items-center gap-2">
                              <Calendar size={14} className="text-[#718078]" />
                              <span>{formatReadingDate(reading.date)}</span>
                            </div>
                          </td>
                          <td className="px-4 py-4 text-[#718078]">
                            <div className="flex items-center gap-1.5">
                              <Clock size={14} className="text-[#718078]" />
                              <span>{formatSlot(reading.slot)}</span>
                            </div>
                          </td>
                          <td className="px-4 py-4 font-bold text-[#183D30]">
                            <span className="text-base">{reading.value}</span>{" "}
                            <span className="text-xs font-normal text-[#718078]">mg/dL</span>
                          </td>
                          <td className="px-4 py-4">
                            {assessment ? (
                              <span
                                className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold ${assessment.badgeClass}`}
                              >
                                <span
                                  className="h-1.5 w-1.5 rounded-full"
                                  style={{ backgroundColor: assessment.color }}
                                />
                                {assessment.label}
                              </span>
                            ) : (
                              <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-medium text-slate-600">
                                Recorded
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {readings.length > 0 && (
              <div className="mt-4 flex items-center justify-between border-t border-[#E3EAE3] pt-4 text-xs">
                <span className="text-[#718078]">
                  Showing latest {Math.min(readings.length, 8)} of {readings.length} recorded entries
                </span>
                <button
                  onClick={() => navigate("/history")}
                  className="font-semibold text-[#174C3A] hover:text-[#103528] flex items-center gap-1 transition"
                >
                  <span>View all readings</span>
                  <ArrowRight size={14} />
                </button>
              </div>
            )}
          </section>

          {/* Footer */}
          <footer
            className="animate-fade-in-up py-7 text-center text-xs text-[#718078]"
            style={{ animationDelay: "300ms" }}
          >
            Sweety Clinical Intelligence • Blood Glucose Management Platform
          </footer>
        </main>
      </div>

      {/* ======================================================== */}
      {/* ADD READING MODAL (PRESERVED)                            */}
      {/* ======================================================== */}
      <AddReadingModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSave={handleSaveReading}
      />
    </div>
  );
}

// ==============================================================
// SUMMARY METRIC CARD COMPONENT
// ==============================================================
function SummaryMetricCard({
  title,
  value,
  unit,
  subtitle,
  badge,
  badgeType,
  icon: Icon,
  iconBg,
  iconColor,
  isLoading,
}) {
  const badgeClasses = {
    "in-target": "badge-in-target",
    elevated: "badge-elevated",
    low: "badge-low",
    neutral: "bg-[#F8FAF8] text-[#718078] border border-[#E3EAE3]",
  };

  return (
    <div className="clinical-card clinical-card-hover p-5">
      <div className="mb-3 flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider text-[#718078]">
          {title}
        </span>
        <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${iconBg} ${iconColor}`}>
          <Icon size={18} strokeWidth={2.2} />
        </div>
      </div>

      <div className="flex items-baseline gap-1.5">
        <span className="text-2xl sm:text-3xl font-bold tracking-tight text-[#183D30]">
          {isLoading ? "--" : value}
        </span>
        <span className="text-xs font-medium text-[#718078]">{unit}</span>
      </div>

      <div className="mt-3 flex items-center justify-between gap-2 border-t border-[#E3EAE3]/60 pt-2.5 text-[11px]">
        <span className="text-[#718078] truncate">
          {isLoading ? "Synchronizing..." : subtitle}
        </span>
        {badge && (
          <span
            className={`shrink-0 rounded-md px-2 py-0.5 text-[10px] font-semibold ${
              badgeClasses[badgeType] || badgeClasses.neutral
            }`}
          >
            {badge}
          </span>
        )}
      </div>
    </div>
  );
}

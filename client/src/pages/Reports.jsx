import { useState, useEffect, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../api/axios";
import AddReadingModal from "../components/AddReadingModal";
import ThemeToggle from "../components/ThemeToggle";
import ProfileDropdown from "../components/ProfileDropdown";
import NotificationPopover from "../components/NotificationPopover";
import Logo from "../components/Logo";
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
  UserRound,
  LogOut,
  X,
  Loader2,
  AlertCircle,
  RefreshCw,
  Calendar,
  ArrowLeft,
  FileText,
} from "lucide-react";

const navigation = [
  { label: "Dashboard", icon: LayoutDashboard, path: "/dashboard" },
  { label: "Add Reading", icon: Droplets },
  { label: "Reading History", icon: ClipboardList, path: "/history" },
  { label: "Reports", icon: BarChart3, active: true, path: "/reports" },
  { label: "Settings", icon: Settings },
];

const SLOT_MAP = {
  MORNING: "Morning",
  AFTER_BREAKFAST: "After breakfast",
  AFTER_LUNCH: "After lunch",
  AFTER_DINNER: "After dinner",
};

function getTodayDateString() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

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

function formatSlot(slot) {
  return SLOT_MAP[slot] || slot;
}

export default function Reports() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const today = getTodayDateString();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Tab state: 'daily' | 'month-to-date' | 'previous-month'
  const [activeTab, setActiveTab] = useState(() => {
    return localStorage.getItem("sweety_default_report_view") || "month-to-date";
  });
  const [selectedDate, setSelectedDate] = useState(today);

  // Live report data
  const [report, setReport] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchReport = useCallback(async () => {
    if (!selectedDate || !/^\d{4}-\d{2}-\d{2}$/.test(selectedDate)) {
      setError("Please select a valid calendar date in YYYY-MM-DD format.");
      return;
    }
    if (selectedDate > today) {
      setError("Future dates are not allowed for reports.");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const endpoint = `/api/reports/${activeTab}?date=${selectedDate}`;
      const response = await api.get(endpoint);
      setReport(response.data?.report || null);
    } catch (err) {
      console.error("Fetch report error:", err);
      const msg =
        err.response?.data?.message ||
        "Unable to generate glucose report. Please check your connection and try again.";
      setError(msg);
      setReport(null);
    } finally {
      setIsLoading(false);
    }
  }, [activeTab, selectedDate, today]);

  useEffect(() => {
    let ignore = false;

    async function loadReport() {
      if (!selectedDate || !/^\d{4}-\d{2}-\d{2}$/.test(selectedDate)) {
        if (!ignore) setError("Please select a valid calendar date in YYYY-MM-DD format.");
        return;
      }
      if (selectedDate > today) {
        if (!ignore) setError("Future dates are not allowed for reports.");
        return;
      }

      if (!ignore) {
        setIsLoading(true);
        setError(null);
      }

      try {
        const endpoint = `/api/reports/${activeTab}?date=${selectedDate}`;
        const response = await api.get(endpoint);
        if (!ignore) {
          setReport(response.data?.report || null);
        }
      } catch (err) {
        if (!ignore) {
          console.error("Fetch report error:", err);
          setError(
            err.response?.data?.message ||
              "Unable to generate glucose report. Please check your connection and try again."
          );
          setReport(null);
        }
      } finally {
        if (!ignore) {
          setIsLoading(false);
        }
      }
    }

    loadReport();

    return () => {
      ignore = true;
    };
  }, [activeTab, selectedDate, today]);

  const handleDateChange = (e) => {
    const newDate = e.target.value;
    if (newDate > today) {
      setError("Future dates are not allowed for reports.");
      return;
    }
    setError(null);
    setSelectedDate(newDate);
  };

  const handleLogout = () => {
    setMobileMenuOpen(false);
    logout();
  };

  const handleSaveNewReading = async (readingPayload) => {
    const response = await api.post("/api/readings", readingPayload);
    await fetchReport();
    return response.data;
  };

  const displayName = user?.name || "Friend";

  const todayFormatted = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  const summary = report?.summary;
  const readings = report?.readings || [];

  const getPeriodLabel = () => {
    if (!report) {
      if (activeTab === "daily") return formatReadingDate(selectedDate);
      if (activeTab === "month-to-date") return "Month-to-Date";
      return "Previous Month";
    }
    if (report.type === "daily") {
      return formatReadingDate(report.date || selectedDate);
    }
    if (report.startDate && report.endDate) {
      const start = formatReadingDate(report.startDate);
      const end = formatReadingDate(report.endDate);
      return `${start} – ${end}`;
    }
    return "";
  };

  return (
    <div className="min-h-screen bg-[#f6faf8] text-slate-800">
      <div className="flex min-h-screen">
        {/* Desktop Sidebar */}
        <aside className="hidden w-64 shrink-0 border-r border-slate-100 bg-white px-6 py-8 lg:flex lg:flex-col">
          <div className="mb-12">
            <Logo size="medium" showSubtitle={true} subtitle="Clinical Intelligence" />
          </div>

          <p className="mb-4 text-xs font-semibold uppercase tracking-wider text-slate-400">
            Menu
          </p>

          <nav className="space-y-2">
            {navigation.map((item) => {
              const Icon = item.icon;
              const isAddReading = item.label === "Add Reading";
              const isReports = item.label === "Reports";
              const isHistory = item.label === "Reading History";
              const isDashboard = item.label === "Dashboard";
              const isSettings = item.label === "Settings";

              return (
                <button
                  key={item.label}
                  onClick={() => {
                    if (isAddReading) {
                      setIsAddModalOpen(true);
                    } else if (isDashboard) {
                      navigate("/dashboard");
                    } else if (isHistory) {
                      navigate("/history");
                    } else if (isSettings) {
                      navigate("/settings");
                    }
                  }}
                  className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-medium transition ${
                    isReports
                      ? "bg-emerald-50 text-emerald-700"
                      : "text-slate-500 hover:bg-slate-50 hover:text-slate-800"
                  }`}
                >
                  <Icon size={19} />
                  {item.label}
                </button>
              );
            })}
          </nav>

          {/* User & Logout section in Sidebar */}
          <div className="mt-6 border-t border-slate-100 pt-4">
            <button
              onClick={handleLogout}
              className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-medium text-slate-500 transition hover:bg-red-50 hover:text-red-600"
            >
              <LogOut size={19} />
              Sign Out
            </button>
          </div>

          <div className="mt-auto rounded-2xl bg-emerald-50 p-5">
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-white text-emerald-600">
              <BarChart3 size={20} />
            </div>
            <h3 className="font-semibold text-slate-800">Glucose Insights</h3>
            <p className="mt-2 text-xs leading-5 text-slate-500">
              Analyze glucose patterns and review comprehensive reports across key intervals.
            </p>
          </div>
        </aside>

        {/* Mobile Sidebar Drawer Overlay */}
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-50 flex lg:hidden">
            <div
              className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity"
              onClick={() => setMobileMenuOpen(false)}
            />
            <div className="relative flex w-72 flex-col bg-white p-6 shadow-xl">
              <div className="mb-8 flex items-center justify-between">
                <Logo size="compact" showSubtitle={false} />
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="rounded-lg p-2 text-slate-400 hover:bg-slate-100"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="mb-6 rounded-2xl bg-slate-50 p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700">
                    <UserRound size={18} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold text-slate-900">
                      {displayName}
                    </p>
                    <p className="truncate text-xs text-slate-400">
                      {user?.email}
                    </p>
                  </div>
                </div>
              </div>

              <nav className="space-y-1.5">
                {navigation.map((item) => {
                  const Icon = item.icon;
                  const isAddReading = item.label === "Add Reading";
                  const isDashboard = item.label === "Dashboard";
                  const isHistory = item.label === "Reading History";
                  const isReports = item.label === "Reports";
                  const isSettings = item.label === "Settings";

                  return (
                    <button
                      key={item.label}
                      onClick={() => {
                        setMobileMenuOpen(false);
                        if (isAddReading) {
                          setIsAddModalOpen(true);
                        } else if (isDashboard) {
                          navigate("/dashboard");
                        } else if (isHistory) {
                          navigate("/history");
                        } else if (isSettings) {
                          navigate("/settings");
                        }
                      }}
                      className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-medium transition ${
                        isReports
                          ? "bg-emerald-50 text-emerald-700"
                          : "text-slate-500 hover:bg-slate-50 hover:text-slate-800"
                      }`}
                    >
                      <Icon size={19} />
                      {item.label}
                    </button>
                  );
                })}
              </nav>

              <div className="mt-auto border-t border-slate-100 pt-4">
                <button
                  onClick={handleLogout}
                  className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-medium text-red-600 transition hover:bg-red-50"
                >
                  <LogOut size={19} />
                  Sign Out
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Main Content Area */}
        <main className="min-w-0 flex-1 px-5 py-6 sm:px-8 lg:px-10">
          {/* Top Header */}
          <header className="mb-8 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setMobileMenuOpen(true)}
                className="rounded-xl bg-white p-2 text-slate-600 shadow-sm lg:hidden"
                aria-label="Open menu"
              >
                <Menu size={22} />
              </button>
              <div>
                <p className="text-sm text-slate-400">{todayFormatted}</p>
                <h2 className="text-xl font-bold text-slate-900 sm:text-2xl">
                  Glucose Reports
                </h2>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={fetchReport}
                disabled={isLoading}
                title="Refresh report"
                className="rounded-xl border border-slate-100 bg-white p-3 text-slate-500 transition hover:bg-slate-50 disabled:opacity-50"
              >
                <RefreshCw
                  size={19}
                  className={isLoading ? "animate-spin text-emerald-600" : ""}
                />
              </button>

              {/* Notification Center */}
              <NotificationPopover />

              {/* Theme Toggle */}
              <ThemeToggle className="rounded-xl border border-slate-100 bg-white p-3 text-slate-500 hover:bg-slate-50" />

              {/* User Dropdown */}
              <ProfileDropdown />
            </div>
          </header>

          {/* Subheader Toolbar & Navigation */}
          <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <div className="flex items-center gap-3">
              <Link
                to="/dashboard"
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-600 shadow-sm transition hover:bg-slate-50 hover:text-slate-900"
              >
                <ArrowLeft size={15} />
                Dashboard
              </Link>
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <span>Period:</span>
                <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 font-bold text-emerald-700">
                  {getPeriodLabel()}
                </span>
              </div>
            </div>

            <button
              onClick={() => setIsAddModalOpen(true)}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:opacity-95"
            >
              <Plus size={18} />
              Add Reading
            </button>
          </div>

          {/* Error Alert */}
          {error && (
            <div className="mb-6 flex items-center justify-between gap-3 rounded-2xl border border-red-100 bg-red-50 p-4 text-sm text-red-700">
              <div className="flex items-center gap-2.5">
                <AlertCircle size={19} className="shrink-0 text-red-600" />
                <p>{error}</p>
              </div>
              <button
                onClick={fetchReport}
                className="shrink-0 rounded-xl bg-white px-3 py-1.5 text-xs font-semibold text-red-700 shadow-sm transition hover:bg-red-100/50"
              >
                Retry
              </button>
            </div>
          )}

          {/* Report Tab Selector Card */}
          <section className="mb-8 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm sm:p-5">
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
              {/* Report Tabs */}
              <div className="inline-flex rounded-2xl bg-slate-100 p-1.5 text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => setActiveTab("daily")}
                  className={`rounded-xl px-4 py-2 transition ${
                    activeTab === "daily"
                      ? "bg-white text-emerald-700 shadow-sm"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  Daily Report
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("month-to-date")}
                  className={`rounded-xl px-4 py-2 transition ${
                    activeTab === "month-to-date"
                      ? "bg-white text-emerald-700 shadow-sm"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  Month-to-Date
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("previous-month")}
                  className={`rounded-xl px-4 py-2 transition ${
                    activeTab === "previous-month"
                      ? "bg-white text-emerald-700 shadow-sm"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  Previous Month
                </button>
              </div>

              {/* Date picker for Report mode */}
              <div className="flex items-center gap-2">
                <label
                  htmlFor="report-date-input"
                  className="flex items-center gap-1.5 text-xs font-semibold text-slate-500"
                >
                  <Calendar size={15} className="text-slate-400" />
                  <span>
                    {activeTab === "daily"
                      ? "Report Date:"
                      : activeTab === "month-to-date"
                      ? "As of Date:"
                      : "Reference Date:"}
                  </span>
                </label>
                <input
                  id="report-date-input"
                  type="date"
                  value={selectedDate}
                  max={today}
                  onChange={handleDateChange}
                  className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-sm transition focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>
            </div>
          </section>

          {/* Report Summary Cards */}
          <section className="mb-8 grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
            <SummaryCard
              title="Average Glucose"
              value={
                summary?.average !== null && summary?.average !== undefined
                  ? summary.average
                  : "--"
              }
              unit="mg/dL"
              subtitle={
                summary?.average ? "Healthy target range" : "No readings"
              }
              icon={Activity}
              color="emerald"
              isLoading={isLoading}
            />
            <SummaryCard
              title="Highest Reading"
              value={
                summary?.highest !== null && summary?.highest !== undefined
                  ? summary.highest
                  : "--"
              }
              unit="mg/dL"
              subtitle={
                summary?.highest ? "Peak in period" : "No readings"
              }
              icon={TrendingUp}
              color="orange"
              isLoading={isLoading}
            />
            <SummaryCard
              title="Lowest Reading"
              value={
                summary?.lowest !== null && summary?.lowest !== undefined
                  ? summary.lowest
                  : "--"
              }
              unit="mg/dL"
              subtitle={
                summary?.lowest ? "Lowest in period" : "No readings"
              }
              icon={TrendingDown}
              color="blue"
              isLoading={isLoading}
            />
            <SummaryCard
              title="Total Readings"
              value={summary?.count ?? 0}
              unit="logs"
              subtitle={
                summary?.count === 1
                  ? "1 log recorded"
                  : `${summary?.count ?? 0} logs recorded`
              }
              icon={CalendarDays}
              color="purple"
              isLoading={isLoading}
            />
          </section>

          {/* Readings in Report Table Layout */}
          <section className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm sm:p-7">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  Readings in Report
                </h3>
                <p className="mt-1 text-xs text-slate-400">
                  Detailed blood glucose entries for {getPeriodLabel()}
                </p>
              </div>
              {readings.length > 0 && (
                <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">
                  {readings.length} {readings.length === 1 ? "entry" : "entries"}
                </span>
              )}
            </div>

            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <Loader2 size={30} className="animate-spin text-emerald-600" />
                <p className="mt-3 text-sm font-medium text-slate-600">
                  Generating glucose report...
                </p>
              </div>
            ) : readings.length === 0 ? (
              <div className="py-14 text-center">
                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
                  <FileText size={24} />
                </div>
                <h4 className="text-base font-semibold text-slate-800">
                  No readings found for this period
                </h4>
                <p className="mx-auto mt-1 max-w-sm text-xs leading-5 text-slate-400">
                  There are no glucose measurements logged for {getPeriodLabel()}.
                </p>
                <button
                  onClick={() => setIsAddModalOpen(true)}
                  className="mt-4 inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-semibold text-white shadow-sm transition hover:bg-emerald-700"
                >
                  <Plus size={16} />
                  Add Reading
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[560px] text-left">
                  <thead>
                    <tr className="border-b border-slate-100 text-xs uppercase tracking-wider text-slate-400">
                      <th className="px-3 py-4 font-semibold">Date</th>
                      <th className="px-3 py-4 font-semibold">Reading Slot</th>
                      <th className="px-3 py-4 font-semibold">Glucose Level</th>
                      <th className="px-3 py-4 text-right font-semibold">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {readings.map((reading) => (
                      <tr
                        key={reading.id}
                        className="border-b border-slate-50 last:border-0 hover:bg-slate-50/70"
                      >
                        <td className="px-3 py-5 text-sm font-medium text-slate-700">
                          {formatReadingDate(reading.date)}
                        </td>
                        <td className="px-3 py-5 text-sm text-slate-500">
                          {formatSlot(reading.slot)}
                        </td>
                        <td className="px-3 py-5 text-sm font-bold text-slate-800">
                          {reading.value} mg/dL
                        </td>
                        <td className="px-3 py-5 text-right text-xs">
                          <span className="inline-flex items-center rounded-md bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700">
                            Recorded
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          <footer className="py-7 text-center text-xs text-slate-400">
            © 2026 Sweety Glucose Tracker. Your health, your priority.
          </footer>
        </main>
      </div>

      {/* Add Reading Modal */}
      <AddReadingModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSave={handleSaveNewReading}
      />
    </div>
  );
}

function SummaryCard({ title, value, unit, subtitle, icon: Icon, color, isLoading }) {
  const colors = {
    emerald: "bg-emerald-50 text-emerald-600",
    orange: "bg-orange-50 text-orange-600",
    blue: "bg-blue-50 text-blue-600",
    purple: "bg-purple-50 text-purple-600",
  };

  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-md">
      <div className="mb-5 flex items-center justify-between">
        <p className="text-sm font-medium text-slate-500">{title}</p>
        <div className={`rounded-xl p-3 ${colors[color]}`}>
          <Icon size={20} />
        </div>
      </div>

      <div className="flex items-baseline gap-2">
        <span className="text-3xl font-bold tracking-tight text-slate-900">
          {isLoading ? "--" : value}
        </span>
        <span className="text-xs text-slate-400">{unit}</span>
      </div>

      <p className="mt-2 text-xs text-slate-400">
        {isLoading ? "Loading..." : subtitle}
      </p>
    </div>
  );
}

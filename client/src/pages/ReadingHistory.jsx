import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../api/axios";
import AddReadingModal from "../components/AddReadingModal";
import EditReadingModal from "../components/EditReadingModal";
import DeleteReadingModal from "../components/DeleteReadingModal";
import ThemeToggle from "../components/ThemeToggle";
import ProfileDropdown from "../components/ProfileDropdown";
import NotificationPopover from "../components/NotificationPopover";
import Logo from "../components/Logo";
import {
  LayoutDashboard,
  Droplets,
  ClipboardList,
  BarChart3,
  Settings,
  Plus,
  Heart,
  ChevronDown,
  Menu,
  UserRound,
  LogOut,
  X,
  Loader2,
  AlertCircle,
  RefreshCw,
  Search,
  Filter,
  ArrowLeft,
  RotateCcw,
  Pencil,
  Trash2,
  CheckCircle2,
} from "lucide-react";

const navigation = [
  { label: "Dashboard", icon: LayoutDashboard, path: "/dashboard" },
  { label: "Add Reading", icon: Droplets },
  { label: "Reading History", icon: ClipboardList, active: true, path: "/history" },
  { label: "Reports", icon: BarChart3 },
  { label: "Settings", icon: Settings },
];

const SLOT_MAP = {
  MORNING: "Morning",
  AFTER_BREAKFAST: "After breakfast",
  AFTER_LUNCH: "After lunch",
  AFTER_DINNER: "After dinner",
};

const SLOT_FILTER_OPTIONS = [
  { value: "ALL", label: "All slots" },
  { value: "MORNING", label: "Morning (Fasting)" },
  { value: "AFTER_BREAKFAST", label: "After breakfast" },
  { value: "AFTER_LUNCH", label: "After lunch" },
  { value: "AFTER_DINNER", label: "After dinner" },
];

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

export default function ReadingHistory() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingReading, setEditingReading] = useState(null);
  const [deletingReading, setDeletingReading] = useState(null);
  const [successFeedback, setSuccessFeedback] = useState("");

  // Live readings state
  const [readings, setReadings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filter & Search states
  const [searchDate, setSearchDate] = useState("");
  const [slotFilter, setSlotFilter] = useState("ALL");

  const loadReadings = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await api.get("/api/readings");
      setReadings(response.data?.readings || []);
    } catch (err) {
      console.error("Fetch readings error:", err);
      const msg =
        err.response?.data?.message ||
        "Unable to load reading history. Please check your connection and try again.";
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    let isMounted = true;

    async function initialFetch() {
      try {
        const response = await api.get("/api/readings");
        if (isMounted) {
          setReadings(response.data?.readings || []);
          setError(null);
        }
      } catch (err) {
        if (isMounted) {
          console.error("Fetch readings error:", err);
          const msg =
            err.response?.data?.message ||
            "Unable to load reading history. Please check your connection and try again.";
          setError(msg);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    initialFetch();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleLogout = () => {
    setMobileMenuOpen(false);
    logout();
  };

  const handleSaveNewReading = async (readingPayload) => {
    const response = await api.post("/api/readings", readingPayload);
    await loadReadings();
    return response.data;
  };

  const handleSaveEditedReading = async (readingId, payload) => {
    const response = await api.put(`/api/readings/${readingId}`, payload);
    await loadReadings();
    setSuccessFeedback(
      response.data?.message || "Glucose reading updated successfully."
    );
    setTimeout(() => {
      setSuccessFeedback("");
    }, 4000);
    return response.data;
  };

  const handleDeleteReading = async (readingId) => {
    const response = await api.delete(`/api/readings/${readingId}`);
    await loadReadings();
    setSuccessFeedback(
      response.data?.message || "Glucose reading deleted successfully."
    );
    setTimeout(() => {
      setSuccessFeedback("");
    }, 4000);
    return response.data;
  };

  const displayName = user?.name || "Friend";

  const todayFormatted = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  // Client-side filtering logic
  const filteredReadings = readings.filter((reading) => {
    // 1. Slot filter
    if (slotFilter !== "ALL" && reading.slot !== slotFilter) {
      return false;
    }

    // 2. Date search filter
    if (searchDate.trim()) {
      const searchLower = searchDate.trim().toLowerCase();
      const rawIso = String(reading.date || "").toLowerCase();
      const formatted = formatReadingDate(reading.date).toLowerCase();

      const matchesDate =
        rawIso.includes(searchLower) || formatted.includes(searchLower);

      if (!matchesDate) {
        return false;
      }
    }

    return true;
  });

  const isFiltered = searchDate.trim() !== "" || slotFilter !== "ALL";

  const handleResetFilters = () => {
    setSearchDate("");
    setSlotFilter("ALL");
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
              const isHistory = item.label === "Reading History";
              const isDashboard = item.label === "Dashboard";
              const isReports = item.label === "Reports";
              const isSettings = item.label === "Settings";

              return (
                <button
                  key={item.label}
                  onClick={() => {
                    if (isAddReading) {
                      setIsAddModalOpen(true);
                    } else if (isDashboard) {
                      navigate("/dashboard");
                    } else if (isReports) {
                      navigate("/reports");
                    } else if (isSettings) {
                      navigate("/settings");
                    }
                  }}
                  className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-medium transition ${
                    isHistory
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
              <Heart size={20} />
            </div>
            <h3 className="font-semibold text-slate-800">Stay healthy!</h3>
            <p className="mt-2 text-xs leading-5 text-slate-500">
              Review your historical glucose patterns and track your progress over time.
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
                        } else if (isReports) {
                          navigate("/reports");
                        } else if (isSettings) {
                          navigate("/settings");
                        }
                      }}
                      className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-medium transition ${
                        isHistory
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
                  Reading History
                </h2>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={loadReadings}
                disabled={isLoading}
                title="Refresh readings"
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

          {/* Error Alert */}
          {error && (
            <div className="mb-6 flex items-center justify-between gap-3 rounded-2xl border border-red-100 bg-red-50 p-4 text-sm text-red-700">
              <div className="flex items-center gap-2.5">
                <AlertCircle size={19} className="shrink-0 text-red-600" />
                <p>{error}</p>
              </div>
              <button
                onClick={loadReadings}
                className="shrink-0 rounded-xl bg-white px-3 py-1.5 text-xs font-semibold text-red-700 shadow-sm transition hover:bg-red-100/50"
              >
                Retry
              </button>
            </div>
          )}

          {/* Success Alert */}
          {successFeedback && (
            <div className="mb-6 flex items-center justify-between gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-medium text-emerald-800">
              <div className="flex items-center gap-2.5">
                <CheckCircle2 size={19} className="shrink-0 text-emerald-600" />
                <p>{successFeedback}</p>
              </div>
              <button
                onClick={() => setSuccessFeedback("")}
                className="rounded-lg p-1 text-emerald-700 hover:bg-emerald-100"
                aria-label="Dismiss message"
              >
                <X size={16} />
              </button>
            </div>
          )}

          {/* Subheader Toolbar & Breadcrumb */}
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
                <span>Total:</span>
                <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 font-bold text-emerald-700">
                  {readings.length} {readings.length === 1 ? "reading" : "readings"}
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

          {/* Search & Filter Toolbar */}
          <section className="mb-6 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm sm:p-5">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {/* Search by date */}
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                  <Search size={17} />
                </div>
                <input
                  type="text"
                  value={searchDate}
                  onChange={(e) => setSearchDate(e.target.value)}
                  placeholder="Search date (e.g. Nov 09 or 2026-11)..."
                  className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-xs text-slate-800 placeholder-slate-400 transition focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>

              {/* Slot dropdown filter */}
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                  <Filter size={17} />
                </div>
                <select
                  value={slotFilter}
                  onChange={(e) => setSlotFilter(e.target.value)}
                  className="w-full appearance-none rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-10 text-xs text-slate-800 transition focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                >
                  {SLOT_FILTER_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3.5 text-slate-400">
                  <ChevronDown size={16} />
                </div>
              </div>

              {/* Filter Reset / Status */}
              <div className="flex items-center justify-between gap-3 sm:col-span-2 lg:col-span-1">
                {isFiltered ? (
                  <button
                    onClick={handleResetFilters}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-50"
                  >
                    <RotateCcw size={14} />
                    Reset Filters
                  </button>
                ) : (
                  <span className="text-xs text-slate-400">
                    Filter by slot or search date
                  </span>
                )}

                <span className="text-xs font-medium text-slate-500">
                  Showing {filteredReadings.length} of {readings.length}
                </span>
              </div>
            </div>
          </section>

          {/* Readings Table Card */}
          <section className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm sm:p-7">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  All Readings
                </h3>
                <p className="mt-1 text-xs text-slate-400">
                  Chronological record of your glucose logs
                </p>
              </div>
            </div>

            {/* Table Content */}
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <Loader2 size={30} className="animate-spin text-emerald-600" />
                <p className="mt-3 text-sm font-medium text-slate-600">
                  Loading reading history...
                </p>
              </div>
            ) : readings.length === 0 ? (
              <div className="py-14 text-center">
                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
                  <Droplets size={24} />
                </div>
                <h4 className="text-base font-semibold text-slate-800">
                  No readings recorded yet
                </h4>
                <p className="mx-auto mt-1 max-w-sm text-xs leading-5 text-slate-400">
                  You haven't logged any glucose measurements yet. Click "Add Reading" to start tracking your health.
                </p>
                <button
                  onClick={() => setIsAddModalOpen(true)}
                  className="mt-4 inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-semibold text-white shadow-sm transition hover:bg-emerald-700"
                >
                  <Plus size={16} />
                  Add Your First Reading
                </button>
              </div>
            ) : filteredReadings.length === 0 ? (
              <div className="py-12 text-center">
                <p className="text-sm font-semibold text-slate-700">
                  No readings match your filter criteria
                </p>
                <p className="mt-1 text-xs text-slate-400">
                  Try adjusting your search query or slot filter.
                </p>
                <button
                  onClick={handleResetFilters}
                  className="mt-4 inline-flex items-center gap-1.5 rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-50"
                >
                  <RotateCcw size={14} />
                  Clear Filters
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
                      <th className="px-3 py-4 text-right font-semibold">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredReadings.map((reading) => (
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
                        <td className="px-3 py-5 text-right text-sm">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              type="button"
                              onClick={() => setEditingReading(reading)}
                              className="inline-flex items-center justify-center rounded-lg p-2 text-slate-400 transition hover:bg-emerald-50 hover:text-emerald-700"
                              title="Edit reading"
                              aria-label={`Edit reading for ${formatReadingDate(reading.date)}`}
                            >
                              <Pencil size={16} />
                            </button>
                            <button
                              type="button"
                              onClick={() => setDeletingReading(reading)}
                              className="inline-flex items-center justify-center rounded-lg p-2 text-slate-400 transition hover:bg-red-50 hover:text-red-600"
                              title="Delete reading"
                              aria-label={`Delete reading for ${formatReadingDate(reading.date)}`}
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
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

      {/* Edit Reading Modal */}
      <EditReadingModal
        isOpen={Boolean(editingReading)}
        reading={editingReading}
        onClose={() => setEditingReading(null)}
        onSave={handleSaveEditedReading}
      />

      {/* Delete Reading Modal */}
      <DeleteReadingModal
        isOpen={Boolean(deletingReading)}
        reading={deletingReading}
        onClose={() => setDeletingReading(null)}
        onDelete={handleDeleteReading}
      />
    </div>
  );
}


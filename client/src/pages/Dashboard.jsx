import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import api from "../api/axios";
import {
  Activity,
  LayoutDashboard,
  Droplets,
  ClipboardList,
  BarChart3,
  Settings,
  Bell,
  Plus,
  TrendingUp,
  TrendingDown,
  Heart,
  CalendarDays,
  ChevronDown,
  Menu,
  UserRound,
  LogOut,
  X,
  Loader2,
  AlertCircle,
  RefreshCw,
} from "lucide-react";

const navigation = [
  { label: "Dashboard", icon: LayoutDashboard, active: true },
  { label: "Add Reading", icon: Droplets },
  { label: "Reading History", icon: ClipboardList },
  { label: "Reports", icon: BarChart3 },
  { label: "Settings", icon: Settings },
];

const SLOT_MAP = {
  MORNING: "Morning",
  AFTER_BREAKFAST: "After breakfast",
  AFTER_LUNCH: "After lunch",
  AFTER_DINNER: "After dinner",
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

function formatSlot(slot) {
  return SLOT_MAP[slot] || slot;
}

export default function Dashboard() {
  const { user, logout } = useAuth();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Live state
  const [readings, setReadings] = useState([]);
  const [summary, setSummary] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

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

  const handleLogout = () => {
    setUserMenuOpen(false);
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
      ? `Across ${summary.count} ${summary.count === 1 ? "reading" : "readings"}`
      : "No readings yet";

  return (
    <div className="min-h-screen bg-[#f6faf8] text-slate-800">
      <div className="flex min-h-screen">
        {/* Desktop Sidebar */}
        <aside className="hidden w-64 shrink-0 border-r border-slate-100 bg-white px-6 py-8 lg:flex lg:flex-col">
          <div className="mb-12 flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-500 text-white shadow-md shadow-emerald-100">
              <Heart size={23} fill="white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                Sweety
              </h1>
              <p className="text-xs text-slate-400">Your health companion</p>
            </div>
          </div>

          <p className="mb-4 text-xs font-semibold uppercase tracking-wider text-slate-400">
            Menu
          </p>

          <nav className="space-y-2">
            {navigation.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.label}
                  className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-medium transition ${
                    item.active
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
              Keep track of your readings and take small steps towards better health.
            </p>
          </div>
        </aside>

        {/* Mobile Sidebar Overlay */}
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-50 flex lg:hidden">
            <div
              className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity"
              onClick={() => setMobileMenuOpen(false)}
            />
            <div className="relative flex w-72 flex-col bg-white p-6 shadow-xl">
              <div className="mb-8 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500 text-white">
                    <Heart size={20} fill="white" />
                  </div>
                  <h1 className="text-xl font-bold text-slate-900">Sweety</h1>
                </div>
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
                  return (
                    <button
                      key={item.label}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-medium transition ${
                        item.active
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

        {/* Main Content */}
        <main className="min-w-0 flex-1 px-5 py-6 sm:px-8 lg:px-10">
          {/* Top Navigation */}
          <header className="mb-9 flex items-center justify-between">
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
                  My Dashboard
                </h2>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={handleRefresh}
                disabled={isLoading}
                title="Refresh dashboard data"
                className="rounded-xl border border-slate-100 bg-white p-3 text-slate-500 transition hover:bg-slate-50 disabled:opacity-50"
              >
                <RefreshCw
                  size={19}
                  className={isLoading ? "animate-spin text-emerald-600" : ""}
                />
              </button>

              <button className="rounded-xl border border-slate-100 bg-white p-3 text-slate-500 hover:bg-slate-50">
                <Bell size={19} />
              </button>

              {/* User Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setUserMenuOpen((prev) => !prev)}
                  className="flex items-center gap-2 rounded-xl border border-slate-100 bg-white p-2 transition hover:bg-slate-50"
                  aria-expanded={userMenuOpen}
                >
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700">
                    <UserRound size={19} />
                  </div>
                  <span className="hidden text-sm font-semibold sm:block">
                    {user?.name || "My Account"}
                  </span>
                  <ChevronDown
                    size={15}
                    className={`hidden text-slate-400 transition-transform sm:block ${
                      userMenuOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>

                {userMenuOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-20"
                      onClick={() => setUserMenuOpen(false)}
                    />
                    <div className="absolute right-0 z-30 mt-2 w-64 rounded-2xl border border-slate-100 bg-white p-3 shadow-xl">
                      <div className="border-b border-slate-100 px-3 py-2.5">
                        <p className="truncate text-sm font-bold text-slate-900">
                          {user?.name || "User"}
                        </p>
                        <p className="truncate text-xs text-slate-400">
                          {user?.email}
                        </p>
                      </div>

                      <div className="pt-2">
                        <button
                          onClick={handleLogout}
                          className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-sm font-medium text-red-600 transition hover:bg-red-50"
                        >
                          <LogOut size={16} />
                          Sign Out
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </header>

          {/* Global Error Banner */}
          {error && (
            <div className="mb-6 flex items-center justify-between gap-3 rounded-2xl border border-red-100 bg-red-50 p-4 text-sm text-red-700">
              <div className="flex items-center gap-2.5">
                <AlertCircle size={19} className="shrink-0 text-red-600" />
                <p>{error}</p>
              </div>
              <button
                onClick={handleRefresh}
                className="shrink-0 rounded-xl bg-white px-3 py-1.5 text-xs font-semibold text-red-700 shadow-sm transition hover:bg-red-100/50"
              >
                Retry
              </button>
            </div>
          )}

          {/* Welcome Banner */}
          <section className="mb-8 flex flex-col justify-between gap-5 rounded-3xl bg-gradient-to-r from-emerald-600 to-teal-500 p-7 text-white shadow-lg shadow-emerald-100 sm:flex-row sm:items-center sm:p-9">
            <div>
              <p className="mb-2 text-sm font-medium text-emerald-50">
                YOUR PERSONAL HEALTH SPACE
              </p>
              <h2 className="text-2xl font-bold sm:text-3xl">
                Welcome back, {displayName}! 👋
              </h2>
              <p className="mt-2 max-w-lg text-sm leading-6 text-emerald-50">
                Every small step matters. Keep monitoring your glucose levels
                and stay on top of your health.
              </p>
            </div>

            <button className="flex shrink-0 items-center justify-center gap-2 rounded-xl bg-white px-5 py-3 font-semibold text-emerald-700 shadow-sm transition hover:bg-emerald-50">
              <Plus size={19} />
              Add Reading
            </button>
          </section>

          {/* Summary Cards */}
          <section className="mb-9 grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
            <SummaryCard
              title="Average Glucose"
              value={averageValue}
              unit="mg/dL"
              subtitle={averageSubtitle}
              icon={Activity}
              color="emerald"
              isLoading={isLoading}
            />
            <SummaryCard
              title="Highest Reading"
              value={highestValue}
              unit="mg/dL"
              subtitle="This month"
              icon={TrendingUp}
              color="orange"
              isLoading={isLoading}
            />
            <SummaryCard
              title="Lowest Reading"
              value={lowestValue}
              unit="mg/dL"
              subtitle="This month"
              icon={TrendingDown}
              color="blue"
              isLoading={isLoading}
            />
            <SummaryCard
              title="Total Readings"
              value={totalCount}
              unit={totalCount === 1 ? "reading" : "readings"}
              subtitle={currentMonthYear}
              icon={Droplets}
              color="purple"
              isLoading={isLoading}
            />
          </section>

          {/* Reading History */}
          <section className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm sm:p-7">
            <div className="mb-6 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  Recent Readings
                </h3>
                <p className="mt-1 text-sm text-slate-400">
                  Your latest glucose measurements
                </p>
              </div>

              <button className="flex items-center gap-2 self-start rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50">
                <CalendarDays size={17} />
                {currentMonthYear}
                <ChevronDown size={15} />
              </button>
            </div>

            {/* Table Content */}
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <Loader2 size={30} className="animate-spin text-emerald-600" />
                <p className="mt-3 text-sm font-medium text-slate-600">
                  Loading your glucose readings...
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
                  You haven't added any glucose measurements yet. Once you record readings, your history and monthly statistics will appear here.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[560px] text-left">
                  <thead>
                    <tr className="border-b border-slate-100 text-xs uppercase tracking-wider text-slate-400">
                      <th className="px-3 py-4 font-semibold">Date</th>
                      <th className="px-3 py-4 font-semibold">Time Slot</th>
                      <th className="px-3 py-4 font-semibold">Glucose Level</th>
                      <th className="px-3 py-4 font-semibold">Status</th>
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
                        <td className="px-3 py-5">
                          {reading.status ? (
                            <span className="rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700">
                              {reading.status}
                            </span>
                          ) : (
                            <span className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-600">
                              Recorded
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {readings.length > 0 && (
              <div className="mt-5 flex justify-end">
                <button className="text-sm font-semibold text-emerald-700 hover:text-emerald-800">
                  View all readings →
                </button>
              </div>
            )}
          </section>

          <footer className="py-7 text-center text-xs text-slate-400">
            © 2026 Sweety Glucose Tracker. Your health, your priority.
          </footer>
        </main>
      </div>
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

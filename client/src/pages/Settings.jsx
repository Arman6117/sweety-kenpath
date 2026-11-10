import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import ThemeToggle from "../components/ThemeToggle";
import ProfileDropdown from "../components/ProfileDropdown";
import NotificationPopover from "../components/NotificationPopover";
import AddReadingModal from "../components/AddReadingModal";
import api from "../api/axios";
import {
  LayoutDashboard,
  Droplets,
  ClipboardList,
  BarChart3,
  Settings as SettingsIcon,
  Plus,
  Heart,
  ChevronDown,
  Menu,
  UserRound,
  LogOut,
  X,
  ArrowLeft,
  Lock,
  Eye,
  EyeOff,
  Shield,
  CheckCircle2,
  AlertCircle,
  Calendar,
  Sliders,
  Mail,
  User,
  Loader2,
  Pencil,
  Check,
  Sun,
  Moon,
  Monitor,
} from "lucide-react";

const navigation = [
  { label: "Dashboard", icon: LayoutDashboard, path: "/" },
  { label: "Add Reading", icon: Droplets },
  { label: "Reading History", icon: ClipboardList, path: "/history" },
  { label: "Reports", icon: BarChart3, path: "/reports" },
  { label: "Settings", icon: SettingsIcon, active: true, path: "/settings" },
];

function formatMemberSince(dateString) {
  if (!dateString) return "Recently joined";
  const dateObj = new Date(dateString);
  if (isNaN(dateObj.getTime())) return "Recently joined";
  return dateObj.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

export default function Settings() {
  const navigate = useNavigate();
  const { user, logout, updateUser } = useAuth();
  const { theme, setTheme } = useTheme();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Profile Form State
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileForm, setProfileForm] = useState({
    name: user?.name || "",
    email: user?.email || "",
  });
  const [profileErrors, setProfileErrors] = useState({});
  const [profileSuccessMessage, setProfileSuccessMessage] = useState("");
  const [profileServerError, setProfileServerError] = useState("");
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // Start Profile Edit
  const handleStartEditProfile = () => {
    setProfileForm({
      name: user?.name || "",
      email: user?.email || "",
    });
    setProfileErrors({});
    setProfileSuccessMessage("");
    setProfileServerError("");
    setIsEditingProfile(true);
  };

  // Security Form State
  const [passwords, setPasswords] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [securityErrors, setSecurityErrors] = useState({});
  const [securityMessage, setSecurityMessage] = useState("");
  const [securityServerError, setSecurityServerError] = useState("");
  const [isSubmittingPassword, setIsSubmittingPassword] = useState(false);

  // Preferences State
  const [defaultReportView, setDefaultReportView] = useState(() => {
    return localStorage.getItem("sweety_default_report_view") || "month-to-date";
  });
  const [preferencesSaved, setPreferencesSaved] = useState(false);

  const todayFormatted = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  const displayName = user?.name || "Friend";
  const emailAddress = user?.email || "No email available";
  const memberSince = formatMemberSince(user?.createdAt);

  // Handle Profile Form Input Changes
  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setProfileForm((prev) => ({ ...prev, [name]: value }));
    if (profileErrors[name]) {
      setProfileErrors((prev) => ({ ...prev, [name]: "" }));
    }
    if (profileSuccessMessage) {
      setProfileSuccessMessage("");
    }
    if (profileServerError) {
      setProfileServerError("");
    }
  };

  // Cancel Profile Edit
  const handleCancelProfileEdit = () => {
    setIsEditingProfile(false);
    setProfileForm({
      name: user?.name || "",
      email: user?.email || "",
    });
    setProfileErrors({});
    setProfileServerError("");
  };

  // Submit Profile Update to PUT /api/auth/profile
  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setProfileSuccessMessage("");
    setProfileServerError("");

    const errors = {};
    const trimmedName = profileForm.name.trim();
    const normalizedEmail = profileForm.email.trim().toLowerCase();

    if (!trimmedName) {
      errors.name = "Full name is required.";
    }

    if (!normalizedEmail) {
      errors.email = "Email address is required.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      errors.email = "Please provide a valid email address.";
    }

    setProfileErrors(errors);

    if (Object.keys(errors).length > 0) {
      return;
    }

    setIsSavingProfile(true);

    try {
      const response = await api.put("/api/auth/profile", {
        name: trimmedName,
        email: normalizedEmail,
      });

      // Update AuthContext and localStorage
      updateUser(response.data.user);

      setProfileSuccessMessage(
        response.data?.message || "Profile updated successfully."
      );
      setIsEditingProfile(false);
    } catch (err) {
      console.error("Update profile error:", err);
      const status = err.response?.status;
      const apiMessage = err.response?.data?.message;

      if (status === 409) {
        setProfileServerError(
          apiMessage || "An account with this email already exists."
        );
      } else if (status === 400) {
        setProfileServerError(
          apiMessage || "Invalid profile data. Please check your inputs."
        );
      } else {
        setProfileServerError(
          apiMessage ||
            err.message ||
            "Unable to update profile. Please check your connection and try again."
        );
      }
    } finally {
      setIsSavingProfile(false);
    }
  };

  // Handle Security Form Change
  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswords((prev) => ({ ...prev, [name]: value }));
    if (securityErrors[name]) {
      setSecurityErrors((prev) => ({ ...prev, [name]: "" }));
    }
    if (securityMessage) {
      setSecurityMessage("");
    }
    if (securityServerError) {
      setSecurityServerError("");
    }
  };

  // Submit Password Change to PUT /api/auth/change-password
  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setSecurityMessage("");
    setSecurityServerError("");

    const errors = {};

    if (!passwords.currentPassword) {
      errors.currentPassword = "Current password is required.";
    }

    if (!passwords.newPassword) {
      errors.newPassword = "New password is required.";
    } else if (passwords.newPassword.length < 8) {
      errors.newPassword = "New password must contain at least 8 characters.";
    }

    if (
      passwords.currentPassword &&
      passwords.newPassword &&
      passwords.currentPassword === passwords.newPassword
    ) {
      errors.newPassword = "New password must be different from current password.";
    }

    if (!passwords.confirmPassword) {
      errors.confirmPassword = "Confirm password is required.";
    } else if (passwords.newPassword !== passwords.confirmPassword) {
      errors.confirmPassword = "New passwords do not match.";
    }

    setSecurityErrors(errors);

    if (Object.keys(errors).length > 0) {
      return;
    }

    setIsSubmittingPassword(true);

    try {
      const response = await api.put("/api/auth/change-password", {
        currentPassword: passwords.currentPassword,
        newPassword: passwords.newPassword,
      });

      setSecurityMessage(
        response.data?.message || "Password changed successfully."
      );

      // Clear password fields on success
      setPasswords({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
      setSecurityErrors({});
    } catch (err) {
      console.error("Change password error:", err);
      const status = err.response?.status;
      const apiMessage = err.response?.data?.message;

      if (status === 400) {
        setSecurityServerError(
          apiMessage || "Invalid password data. Please check your inputs."
        );
      } else if (status === 401) {
        setSecurityServerError(
          apiMessage || "Current password is incorrect."
        );
      } else {
        setSecurityServerError(
          apiMessage ||
            err.message ||
            "Unable to change password. Please check your connection and try again."
        );
      }
    } finally {
      setIsSubmittingPassword(false);
    }
  };

  // Handle Preference Save to localStorage
  const handlePreferenceChange = (e) => {
    const newView = e.target.value;
    setDefaultReportView(newView);
    localStorage.setItem("sweety_default_report_view", newView);
    setPreferencesSaved(true);
  };

  useEffect(() => {
    if (preferencesSaved) {
      const timer = setTimeout(() => {
        setPreferencesSaved(false);
      }, 3500);
      return () => clearTimeout(timer);
    }
  }, [preferencesSaved]);

  const handleLogout = () => {
    setMobileMenuOpen(false);
    logout();
  };

  const handleSaveNewReading = async (readingPayload) => {
    const response = await api.post("/api/readings", readingPayload);
    return response.data;
  };

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
              const isAddReading = item.label === "Add Reading";
              const isSettings = item.label === "Settings";
              const isHistory = item.label === "Reading History";
              const isDashboard = item.label === "Dashboard";
              const isReports = item.label === "Reports";

              return (
                <button
                  key={item.label}
                  onClick={() => {
                    if (isAddReading) {
                      setIsAddModalOpen(true);
                    } else if (isDashboard) {
                      navigate("/");
                    } else if (isHistory) {
                      navigate("/history");
                    } else if (isReports) {
                      navigate("/reports");
                    }
                  }}
                  className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-medium transition ${
                    isSettings
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
              <SettingsIcon size={20} />
            </div>
            <h3 className="font-semibold text-slate-800">Account & Security</h3>
            <p className="mt-2 text-xs leading-5 text-slate-500">
              Manage your profile, change device preferences, and review your security settings.
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
                          navigate("/");
                        } else if (isHistory) {
                          navigate("/history");
                        } else if (isReports) {
                          navigate("/reports");
                        }
                      }}
                      className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-medium transition ${
                        isSettings
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
                  Settings
                </h2>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* Notification Center */}
              <NotificationPopover />

              {/* Theme Toggle */}
              <ThemeToggle className="rounded-xl border border-slate-100 bg-white p-3 text-slate-500 hover:bg-slate-50" />

              {/* User Dropdown */}
              <ProfileDropdown />
            </div>
          </header>

          {/* Subheader Toolbar & Breadcrumb */}
          <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <div className="flex items-center gap-3">
              <Link
                to="/"
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-600 shadow-sm transition hover:bg-slate-50 hover:text-slate-900"
              >
                <ArrowLeft size={15} />
                Dashboard
              </Link>
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <span>Account:</span>
                <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 font-bold text-emerald-700">
                  Active
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

          <div className="space-y-8">
            {/* SECTION A: Account Profile */}
            <section className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm sm:p-8">
              <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 shadow-xs">
                    <User size={22} />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">
                      Account Profile
                    </h3>
                    <p className="text-xs text-slate-400">
                      {isEditingProfile
                        ? "Edit your name and email address below"
                        : "Your registered account details"}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                    Verified
                  </span>
                  {!isEditingProfile && (
                    <button
                      type="button"
                      onClick={handleStartEditProfile}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
                    >
                      <Pencil size={14} />
                      Edit Profile
                    </button>
                  )}
                </div>
              </div>

              {profileSuccessMessage && (
                <div className="mb-6 flex items-start gap-2.5 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-medium text-emerald-800">
                  <CheckCircle2 size={18} className="mt-0.5 shrink-0 text-emerald-600" />
                  <p>{profileSuccessMessage}</p>
                </div>
              )}

              {profileServerError && (
                <div className="mb-6 flex items-start gap-2.5 rounded-2xl border border-red-100 bg-red-50 p-4 text-sm text-red-700">
                  <AlertCircle size={18} className="mt-0.5 shrink-0 text-red-600" />
                  <p>{profileServerError}</p>
                </div>
              )}

              <form onSubmit={handleProfileSubmit} noValidate>
                <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                  {/* Full Name */}
                  <div>
                    <label
                      htmlFor="profile-name"
                      className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-500"
                    >
                      Full Name
                    </label>
                    <div className="relative">
                      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                        <UserRound size={17} />
                      </div>
                      <input
                        id="profile-name"
                        name="name"
                        type="text"
                        readOnly={!isEditingProfile}
                        disabled={isSavingProfile}
                        value={isEditingProfile ? profileForm.name : displayName}
                        onChange={handleProfileChange}
                        placeholder="Your full name"
                        className={`w-full rounded-xl border py-3 pl-11 pr-4 text-sm font-medium text-slate-700 transition focus:outline-none ${
                          !isEditingProfile
                            ? "cursor-not-allowed border-slate-200 bg-slate-50/80"
                            : profileErrors.name
                            ? "border-red-300 bg-white focus:border-red-500 focus:ring-2 focus:ring-red-500/20"
                            : "border-slate-200 bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                        }`}
                      />
                    </div>
                    {profileErrors.name && (
                      <div className="mt-1.5 flex items-center gap-1.5 text-xs text-red-600">
                        <AlertCircle size={14} className="shrink-0" />
                        <span>{profileErrors.name}</span>
                      </div>
                    )}
                  </div>

                  {/* Email Address */}
                  <div>
                    <label
                      htmlFor="profile-email"
                      className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-500"
                    >
                      Email Address
                    </label>
                    <div className="relative">
                      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                        <Mail size={17} />
                      </div>
                      <input
                        id="profile-email"
                        name="email"
                        type="email"
                        readOnly={!isEditingProfile}
                        disabled={isSavingProfile}
                        value={isEditingProfile ? profileForm.email : emailAddress}
                        onChange={handleProfileChange}
                        placeholder="name@example.com"
                        className={`w-full rounded-xl border py-3 pl-11 pr-4 text-sm font-medium text-slate-700 transition focus:outline-none ${
                          !isEditingProfile
                            ? "cursor-not-allowed border-slate-200 bg-slate-50/80"
                            : profileErrors.email
                            ? "border-red-300 bg-white focus:border-red-500 focus:ring-2 focus:ring-red-500/20"
                            : "border-slate-200 bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                        }`}
                      />
                    </div>
                    {profileErrors.email && (
                      <div className="mt-1.5 flex items-center gap-1.5 text-xs text-red-600">
                        <AlertCircle size={14} className="shrink-0" />
                        <span>{profileErrors.email}</span>
                      </div>
                    )}
                  </div>

                  {/* Member Since */}
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Member Since
                    </label>
                    <div className="relative">
                      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                        <Calendar size={17} />
                      </div>
                      <input
                        type="text"
                        readOnly
                        value={memberSince}
                        className="w-full cursor-not-allowed rounded-xl border border-slate-200 bg-slate-50/80 py-3 pl-11 pr-4 text-sm font-medium text-slate-700 focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Account Status */}
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Account Status
                    </label>
                    <div className="relative">
                      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-emerald-600">
                        <Shield size={17} />
                      </div>
                      <input
                        type="text"
                        readOnly
                        value="Active & Protected"
                        className="w-full cursor-not-allowed rounded-xl border border-emerald-100 bg-emerald-50/50 py-3 pl-11 pr-4 text-sm font-semibold text-emerald-800 focus:outline-none"
                      />
                    </div>
                  </div>
                </div>

                {/* Edit Mode Action Buttons */}
                {isEditingProfile && (
                  <div className="mt-6 flex items-center justify-end gap-3 border-t border-slate-100 pt-5">
                    <button
                      type="button"
                      onClick={handleCancelProfileEdit}
                      disabled={isSavingProfile}
                      className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSavingProfile}
                      className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-70"
                    >
                      {isSavingProfile ? (
                        <>
                          <Loader2 size={16} className="animate-spin" />
                          <span>Saving Changes...</span>
                        </>
                      ) : (
                        <>
                          <Check size={16} />
                          <span>Save Changes</span>
                        </>
                      )}
                    </button>
                  </div>
                )}
              </form>
            </section>

            {/* SECTION B: Security (Change Password) */}
            <section className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm sm:p-8">
              <div className="mb-6 flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 shadow-xs">
                  <Lock size={22} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">
                    Security & Password
                  </h3>
                  <p className="text-xs text-slate-400">
                    Update your account password
                  </p>
                </div>
              </div>

              {securityMessage && (
                <div className="mb-6 flex items-start gap-2.5 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-medium text-emerald-800">
                  <CheckCircle2 size={18} className="mt-0.5 shrink-0 text-emerald-600" />
                  <p>{securityMessage}</p>
                </div>
              )}

              {securityServerError && (
                <div className="mb-6 flex items-start gap-2.5 rounded-2xl border border-red-100 bg-red-50 p-4 text-sm text-red-700">
                  <AlertCircle size={18} className="mt-0.5 shrink-0 text-red-600" />
                  <p>{securityServerError}</p>
                </div>
              )}

              <form onSubmit={handlePasswordSubmit} className="space-y-5" noValidate>
                <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
                  {/* Current Password */}
                  <div>
                    <label
                      htmlFor="currentPassword"
                      className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-500"
                    >
                      Current Password
                    </label>
                    <div className="relative">
                      <input
                        id="currentPassword"
                        name="currentPassword"
                        type={showCurrentPassword ? "text" : "password"}
                        value={passwords.currentPassword}
                        onChange={handlePasswordChange}
                        disabled={isSubmittingPassword}
                        placeholder="••••••••"
                        className={`w-full rounded-xl border bg-white py-3 pl-4 pr-11 text-sm text-slate-800 transition focus:outline-none focus:ring-2 focus:ring-emerald-500/20 disabled:bg-slate-50 disabled:cursor-not-allowed ${
                          securityErrors.currentPassword
                            ? "border-red-300 focus:border-red-500"
                            : "border-slate-200 focus:border-emerald-500"
                        }`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowCurrentPassword((prev) => !prev)}
                        disabled={isSubmittingPassword}
                        className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-slate-400 hover:text-slate-600 disabled:opacity-50"
                        aria-label="Toggle current password visibility"
                      >
                        {showCurrentPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                    {securityErrors.currentPassword && (
                      <div className="mt-1.5 flex items-center gap-1.5 text-xs text-red-600">
                        <AlertCircle size={14} className="shrink-0" />
                        <span>{securityErrors.currentPassword}</span>
                      </div>
                    )}
                  </div>

                  {/* New Password */}
                  <div>
                    <label
                      htmlFor="newPassword"
                      className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-500"
                    >
                      New Password
                    </label>
                    <div className="relative">
                      <input
                        id="newPassword"
                        name="newPassword"
                        type={showNewPassword ? "text" : "password"}
                        value={passwords.newPassword}
                        onChange={handlePasswordChange}
                        disabled={isSubmittingPassword}
                        placeholder="Min 8 characters"
                        className={`w-full rounded-xl border bg-white py-3 pl-4 pr-11 text-sm text-slate-800 transition focus:outline-none focus:ring-2 focus:ring-emerald-500/20 disabled:bg-slate-50 disabled:cursor-not-allowed ${
                          securityErrors.newPassword
                            ? "border-red-300 focus:border-red-500"
                            : "border-slate-200 focus:border-emerald-500"
                        }`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword((prev) => !prev)}
                        disabled={isSubmittingPassword}
                        className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-slate-400 hover:text-slate-600 disabled:opacity-50"
                        aria-label="Toggle new password visibility"
                      >
                        {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                    {securityErrors.newPassword && (
                      <div className="mt-1.5 flex items-center gap-1.5 text-xs text-red-600">
                        <AlertCircle size={14} className="shrink-0" />
                        <span>{securityErrors.newPassword}</span>
                      </div>
                    )}
                  </div>

                  {/* Confirm New Password */}
                  <div>
                    <label
                      htmlFor="confirmPassword"
                      className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-500"
                    >
                      Confirm New Password
                    </label>
                    <div className="relative">
                      <input
                        id="confirmPassword"
                        name="confirmPassword"
                        type={showConfirmPassword ? "text" : "password"}
                        value={passwords.confirmPassword}
                        onChange={handlePasswordChange}
                        disabled={isSubmittingPassword}
                        placeholder="Re-enter password"
                        className={`w-full rounded-xl border bg-white py-3 pl-4 pr-11 text-sm text-slate-800 transition focus:outline-none focus:ring-2 focus:ring-emerald-500/20 disabled:bg-slate-50 disabled:cursor-not-allowed ${
                          securityErrors.confirmPassword
                            ? "border-red-300 focus:border-red-500"
                            : "border-slate-200 focus:border-emerald-500"
                        }`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword((prev) => !prev)}
                        disabled={isSubmittingPassword}
                        className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-slate-400 hover:text-slate-600 disabled:opacity-50"
                        aria-label="Toggle confirm password visibility"
                      >
                        {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                    {securityErrors.confirmPassword && (
                      <div className="mt-1.5 flex items-center gap-1.5 text-xs text-red-600">
                        <AlertCircle size={14} className="shrink-0" />
                        <span>{securityErrors.confirmPassword}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    type="submit"
                    disabled={isSubmittingPassword}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    {isSubmittingPassword ? (
                      <>
                        <Loader2 size={16} className="animate-spin" />
                        <span>Updating Password...</span>
                      </>
                    ) : (
                      <>
                        <Lock size={16} />
                        <span>Update Password</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </section>

            {/* SECTION C: Preferences */}
            <section className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm sm:p-8">
              <div className="mb-6 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 shadow-xs">
                    <Sliders size={22} />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">
                      Application Preferences
                    </h3>
                    <p className="text-xs text-slate-400">
                      Customize local interface and reporting options
                    </p>
                  </div>
                </div>
                {preferencesSaved && (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 animate-pulse">
                    <CheckCircle2 size={14} />
                    Saved to device
                  </span>
                )}
              </div>

              <div className="max-w-md">
                <label
                  htmlFor="default-report-view"
                  className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-500"
                >
                  Default Report View
                </label>
                <div className="relative">
                  <select
                    id="default-report-view"
                    value={defaultReportView}
                    onChange={handlePreferenceChange}
                    className="w-full appearance-none rounded-xl border border-slate-200 bg-white py-3 pl-4 pr-10 text-sm font-medium text-slate-800 transition focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  >
                    <option value="daily">Daily Report</option>
                    <option value="month-to-date">Month-to-Date</option>
                    <option value="previous-month">Previous Month</option>
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3.5 text-slate-400">
                    <ChevronDown size={16} />
                  </div>
                </div>
                <p className="mt-2 text-xs text-slate-400">
                  Select which tab opens first when navigating to the Reports section.
                </p>

                {/* Theme Mode Preference */}
                <div className="mt-6 border-t border-slate-100 pt-5">
                  <label className="mb-2.5 block text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Theme Appearance
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        setTheme("light");
                        setPreferencesSaved(true);
                      }}
                      className={`flex flex-col items-center gap-2 rounded-2xl border p-3.5 text-center transition ${
                        theme === "light"
                          ? "border-emerald-500 bg-emerald-50 text-emerald-800 shadow-xs"
                          : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                      }`}
                    >
                      <Sun size={20} className={theme === "light" ? "text-emerald-600" : "text-slate-400"} />
                      <span className="text-xs font-semibold">Light</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setTheme("dark");
                        setPreferencesSaved(true);
                      }}
                      className={`flex flex-col items-center gap-2 rounded-2xl border p-3.5 text-center transition ${
                        theme === "dark"
                          ? "border-emerald-500 bg-emerald-50 text-emerald-800 shadow-xs"
                          : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                      }`}
                    >
                      <Moon size={20} className={theme === "dark" ? "text-emerald-600" : "text-slate-400"} />
                      <span className="text-xs font-semibold">Dark</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setTheme("system");
                        setPreferencesSaved(true);
                      }}
                      className={`flex flex-col items-center gap-2 rounded-2xl border p-3.5 text-center transition ${
                        theme === "system"
                          ? "border-emerald-500 bg-emerald-50 text-emerald-800 shadow-xs"
                          : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                      }`}
                    >
                      <Monitor size={20} className={theme === "system" ? "text-emerald-600" : "text-slate-400"} />
                      <span className="text-xs font-semibold">System</span>
                    </button>
                  </div>
                  <p className="mt-2 text-xs text-slate-400">
                    Choose whether Sweety follows your system preference or stays in Light/Dark mode.
                  </p>
                </div>
              </div>
            </section>

            {/* SECTION D: Account Actions */}
            <section className="rounded-3xl border border-red-100 bg-white p-6 shadow-sm sm:p-8">
              <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
                <div>
                  <h3 className="text-lg font-bold text-slate-900">
                    Sign Out of Sweety
                  </h3>
                  <p className="mt-1 text-xs text-slate-500">
                    Safely log out of your current session on this device.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-red-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-red-700"
                >
                  <LogOut size={16} />
                  Sign Out
                </button>
              </div>
            </section>
          </div>

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


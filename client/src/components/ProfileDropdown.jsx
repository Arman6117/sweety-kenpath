import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { ChevronDown, Settings, LogOut, LayoutDashboard } from "lucide-react";

export default function ProfileDropdown({ className = "" }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const buttonRef = useRef(null);
  const [coords, setCoords] = useState({ top: 0, right: 0 });

  const displayName = user?.name || "Patient Account";
  const email = user?.email || "";
  const initial = (displayName.charAt(0) || "U").toUpperCase();

  const updateCoords = () => {
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setCoords({
        top: rect.bottom + 8,
        right: window.innerWidth - rect.right,
      });
    }
  };

  const handleToggle = () => {
    if (!isOpen) {
      updateCoords();
    }
    setIsOpen((prev) => !prev);
  };

  const handleClose = () => {
    setIsOpen(false);
  };

  // Re-position or close on window scroll / resize
  useEffect(() => {
    if (!isOpen) return;

    const handleScrollOrResize = () => {
      updateCoords();
    };

    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        handleClose();
      }
    };

    window.addEventListener("scroll", handleScrollOrResize, true);
    window.addEventListener("resize", handleScrollOrResize);
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("scroll", handleScrollOrResize, true);
      window.removeEventListener("resize", handleScrollOrResize);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  const handleLogout = () => {
    handleClose();
    logout();
  };

  return (
    <div className={`relative inline-block ${className}`}>
      <button
        ref={buttonRef}
        type="button"
        onClick={handleToggle}
        className="profile-trigger-btn flex items-center gap-2 rounded-xl border border-slate-200 dark:border-[#1D382D] bg-white dark:bg-[#11231B] p-1.5 pr-3 text-left transition hover:bg-slate-50 dark:hover:bg-[#162C22] focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-400 font-bold text-xs">
          {initial}
        </div>
        <span className="hidden text-xs font-semibold text-slate-800 dark:text-[#F1F7F4] sm:block">
          {displayName}
        </span>
        <ChevronDown
          size={14}
          className={`hidden text-slate-400 dark:text-[#829F93] transition-transform duration-200 sm:block ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {/* Render Portal into document.body to break free from ALL container stacking contexts */}
      {isOpen &&
        typeof document !== "undefined" &&
        createPortal(
          <>
            {/* Click-away Backdrop */}
            <div
              className="fixed inset-0 z-[99998] bg-transparent"
              onClick={handleClose}
              aria-hidden="true"
            />

            {/* Portal Floating Menu */}
            <div
              style={{
                position: "fixed",
                top: `${coords.top}px`,
                right: `${coords.right}px`,
              }}
              className="profile-portal-menu z-[99999] w-64 rounded-2xl border border-slate-200 dark:border-[#1D382D] bg-white dark:bg-[#11231B] p-2.5 shadow-2xl animate-fade-in-up"
              role="menu"
            >
              {/* User Identity Header */}
              <div className="border-b border-slate-100 dark:border-[#1D382D] px-3 py-2.5">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 font-bold text-sm">
                    {initial}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold text-slate-900 dark:text-[#F1F7F4]">
                      {displayName}
                    </p>
                    <p className="truncate text-xs text-slate-400 dark:text-[#829F93]">
                      {email}
                    </p>
                  </div>
                </div>
              </div>

              {/* Navigation Items */}
              <div className="py-1.5 space-y-0.5">
                <button
                  type="button"
                  onClick={() => {
                    handleClose();
                    navigate("/");
                  }}
                  className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-xs font-semibold text-slate-700 dark:text-[#C2D6CD] transition hover:bg-slate-50 dark:hover:bg-[#162C22] hover:text-slate-900 dark:hover:text-[#F1F7F4]"
                >
                  <LayoutDashboard size={15} className="text-slate-400 dark:text-[#829F93]" />
                  <span>Dashboard</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    handleClose();
                    navigate("/settings");
                  }}
                  className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-xs font-semibold text-slate-700 dark:text-[#C2D6CD] transition hover:bg-slate-50 dark:hover:bg-[#162C22] hover:text-slate-900 dark:hover:text-[#F1F7F4]"
                >
                  <Settings size={15} className="text-slate-400 dark:text-[#829F93]" />
                  <span>Settings</span>
                </button>
              </div>

              {/* Sign Out Action */}
              <div className="border-t border-slate-100 dark:border-[#1D382D] pt-1.5">
                <button
                  type="button"
                  onClick={handleLogout}
                  className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-xs font-semibold text-red-600 dark:text-red-400 transition hover:bg-red-50 dark:hover:bg-red-950/30"
                >
                  <LogOut size={15} />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          </>,
          document.body
        )}
    </div>
  );
}

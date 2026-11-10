import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { Bell, CheckCheck, Info, Sparkles, ShieldCheck, X } from "lucide-react";

const DEFAULT_NOTIFICATIONS = [
  {
    id: "notif-target-guide",
    title: "Clinical Reference Guidelines",
    message: "Standard fasting glycemia is 70–99 mg/dL. Post-prandial (after meal) target is under 140 mg/dL.",
    time: "Clinical Care",
    icon: ShieldCheck,
    tag: "Target Range",
  },
  {
    id: "notif-logging-habit",
    title: "Logging Cadence",
    message: "Log readings consistently across morning, afternoon and evening to unlock complete trend telemetry.",
    time: "Daily Habit",
    icon: Sparkles,
    tag: "Tip",
  },
];

const STORAGE_KEY = "sweety_dismissed_notifications";

export default function NotificationPopover({ className = "" }) {
  const [isOpen, setIsOpen] = useState(false);
  const buttonRef = useRef(null);
  const [coords, setCoords] = useState({ top: 0, right: 0 });

  const [dismissedIds, setDismissedIds] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const activeNotifications = DEFAULT_NOTIFICATIONS.filter(
    (n) => !dismissedIds.includes(n.id)
  );

  const unreadCount = activeNotifications.length;

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

  const handleDismiss = (id) => {
    const updated = [...dismissedIds, id];
    setDismissedIds(updated);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch {
      // ignore
    }
  };

  const handleDismissAll = () => {
    const allIds = DEFAULT_NOTIFICATIONS.map((n) => n.id);
    setDismissedIds(allIds);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(allIds));
    } catch {
      // ignore
    }
  };

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

  return (
    <div className={`relative inline-block ${className}`}>
      <button
        ref={buttonRef}
        type="button"
        onClick={handleToggle}
        className="relative flex items-center justify-center rounded-xl border border-slate-200 dark:border-[#1D382D] bg-white dark:bg-[#11231B] p-2.5 text-slate-500 dark:text-[#829F93] hover:text-slate-800 dark:hover:text-[#F1F7F4] hover:bg-slate-50 dark:hover:bg-[#162C22] transition focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
        title="Notifications & Clinical Reminders"
        aria-label="Notifications"
        aria-expanded={isOpen}
      >
        <Bell size={18} />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
          </span>
        )}
      </button>

      {/* Render via Portal to document.body */}
      {isOpen &&
        typeof document !== "undefined" &&
        createPortal(
          <>
            <div
              className="fixed inset-0 z-[99998] bg-transparent"
              onClick={handleClose}
              aria-hidden="true"
            />

            <div
              style={{
                position: "fixed",
                top: `${coords.top}px`,
                right: `${coords.right}px`,
              }}
              className="z-[99999] w-80 max-w-[calc(100vw-32px)] rounded-2xl border border-slate-200 dark:border-[#1D382D] bg-white dark:bg-[#11231B] p-3 shadow-2xl animate-fade-in-up"
              role="region"
              aria-label="Notification Center"
            >
              {/* Header */}
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-[#1D382D] pb-2.5 px-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-[#F1F7F4]">
                    Notifications
                  </h3>
                  {unreadCount > 0 && (
                    <span className="rounded-full bg-emerald-100 dark:bg-emerald-950/60 px-2 py-0.5 text-[10px] font-bold text-emerald-800 dark:text-emerald-300">
                      {unreadCount} new
                    </span>
                  )}
                </div>

                {unreadCount > 0 && (
                  <button
                    type="button"
                    onClick={handleDismissAll}
                    className="flex items-center gap-1 text-[11px] font-medium text-slate-400 hover:text-slate-700 dark:text-[#829F93] dark:hover:text-[#F1F7F4] transition"
                  >
                    <CheckCheck size={13} />
                    <span>Clear all</span>
                  </button>
                )}
              </div>

              {/* List */}
              <div className="mt-2 space-y-2 max-h-72 overflow-y-auto">
                {activeNotifications.length === 0 ? (
                  <div className="py-6 text-center">
                    <div className="mx-auto mb-2 flex h-8 w-8 items-center justify-center rounded-full bg-slate-50 dark:bg-[#162C22] text-slate-400 dark:text-[#829F93]">
                      <Info size={16} />
                    </div>
                    <p className="text-xs font-semibold text-slate-700 dark:text-[#C2D6CD]">
                      All caught up!
                    </p>
                    <p className="mt-0.5 text-[11px] text-slate-400 dark:text-[#829F93]">
                      No active alerts or reminders right now.
                    </p>
                  </div>
                ) : (
                  activeNotifications.map((notif) => {
                    const Icon = notif.icon;
                    return (
                      <div
                        key={notif.id}
                        className="group relative rounded-xl border border-slate-100 dark:border-[#1D382D] bg-slate-50/60 dark:bg-[#14281F] p-2.5 transition hover:bg-slate-50 dark:hover:bg-[#183327]"
                      >
                        <div className="flex items-start gap-2.5">
                          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400">
                            <Icon size={14} />
                          </div>
                          <div className="min-w-0 flex-1 pr-4">
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs font-bold text-slate-900 dark:text-[#F1F7F4]">
                                {notif.title}
                              </span>
                            </div>
                            <p className="mt-0.5 text-[11px] leading-relaxed text-slate-500 dark:text-[#829F93]">
                              {notif.message}
                            </p>
                            <span className="mt-1 inline-block text-[10px] font-medium text-emerald-600 dark:text-emerald-400">
                              {notif.time}
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleDismiss(notif.id)}
                            className="rounded p-1 text-slate-300 dark:text-[#5E7A6E] hover:text-slate-600 dark:hover:text-[#F1F7F4] transition"
                            title="Dismiss"
                            aria-label="Dismiss notification"
                          >
                            <X size={12} />
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </>,
          document.body
        )}
    </div>
  );
}


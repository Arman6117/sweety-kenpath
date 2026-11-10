import { Activity } from "lucide-react";
import { Link } from "react-router-dom";

export default function Logo({
  size = "medium",
  showSubtitle = true,
  subtitle = "Clinical Intelligence",
  inverted = false,
  layout = "horizontal",
  to = null,
  className = "",
}) {
  // Size-specific styles
  const sizeConfig = {
    compact: {
      container: "h-8 w-8 rounded-lg",
      iconSize: 18,
      title: "text-lg",
      badge: "px-1.5 py-0.5 text-[9px]",
      subtitle: "text-[10px]",
      gap: "gap-2",
    },
    medium: {
      container: "h-10 w-10 rounded-xl",
      iconSize: 22,
      title: "text-xl",
      badge: "px-1.5 py-0.5 text-[10px]",
      subtitle: "text-[11px]",
      gap: "gap-3",
    },
    large: {
      container: "h-14 w-14 rounded-2xl shadow-md",
      iconSize: 30,
      title: "text-2xl sm:text-3xl",
      badge: "px-2 py-0.5 text-[11px]",
      subtitle: "text-xs",
      gap: "gap-3.5",
    },
  };

  const config = sizeConfig[size] || sizeConfig.medium;

  // Color schemes: standard (light/dark adaptive) vs inverted (on dark hero banners)
  const colors = inverted
    ? {
      title: "text-white",
      badge: "bg-white/15 text-emerald-200 border border-white/20",
      subtitle: "text-emerald-100/80",
      iconBg: "bg-[#174F3D] text-white shadow-xs border border-white/10",
    }
    : {
      title: "text-[#183D30] dark:text-[#F0F6F2]",
      badge:
        "bg-[#EBF5F0] dark:bg-[#162E25] text-[#174C3A] dark:text-[#68B18C] border border-transparent dark:border-[#1E3E32]",
      subtitle: "text-[#718078] dark:text-[#8AA497]",
      iconBg: "bg-[#174C3A] text-white shadow-xs",
    };

  const isStacked = layout === "stacked";

  const content = (
    <div
      className={`flex ${isStacked
          ? "flex-col items-center text-center gap-2.5"
          : `items-center ${config.gap}`
        } ${className}`}
    >
      {/* Dark Forest Green Rounded Square with White ECG / Pulse Icon */}
      <div
        className={`flex shrink-0 items-center justify-center ${config.container} ${colors.iconBg} transition-transform group-hover:scale-105`}
      >
        <Activity size={config.iconSize} strokeWidth={2.2} />
      </div>

      {/* Brand Typography & CARE Badge */}
      <div className={isStacked ? "flex flex-col items-center" : ""}>
        <div className="flex items-center gap-1.5">
          <span
            className={`font-bold tracking-tight ${config.title} ${colors.title}`}
          >
            Sweety
          </span>
          <span
            className={`rounded-md font-bold uppercase tracking-wider ${config.badge} ${colors.badge}`}
          >
            Care
          </span>
        </div>

        {showSubtitle && subtitle && (
          <p
            className={`font-medium leading-tight ${config.subtitle} ${colors.subtitle}`}
          >
            {subtitle}
          </p>
        )}
      </div>
    </div>
  );

  if (to) {
    return (
      <Link to={to} className="group inline-flex focus:outline-none">
        {content}
      </Link>
    );
  }

  return content;
}
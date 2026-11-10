import { Sun, Moon } from "lucide-react";
import { useTheme } from "../context/ThemeContext";

export default function ThemeToggle({ className = "" }) {
  const { resolvedTheme, toggleTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={`theme-toggle-btn flex items-center justify-center rounded-xl p-2.5 transition-all focus:outline-none focus:ring-2 focus:ring-emerald-500/20 ${className}`}
      title={isDark ? "Switch to light mode" : "Switch to dark mode"}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
    >
      {isDark ? (
        <Sun size={17} className="text-amber-400 hover:rotate-45 transition-transform" />
      ) : (
        <Moon size={17} className="text-[#718078] hover:text-[#183D30] transition-colors" />
      )}
    </button>
  );
}


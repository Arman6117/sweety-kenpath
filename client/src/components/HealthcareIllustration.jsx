export default function HealthcareIllustration({ className = "", showBanner = true }) {
  return (
    <div
      className={`relative rounded-3xl border border-[#E0E9E2] dark:border-[#1E3E32] bg-white/95 dark:bg-[#12241D]/95 p-6 sm:p-8 shadow-xl backdrop-blur-md ${className}`}
    >
      {/* Mock Glucose Meter & Friendly Healthcare Visual (SVG) */}
      <svg
        viewBox="0 0 380 320"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-auto drop-shadow-sm select-none"
      >
        {/* Soft circular aura */}
        <circle
          cx="190"
          cy="150"
          r="120"
          fill="url(#healthcareAuraGrad)"
          opacity="0.5"
        />

        {/* Friendly Healthcare Professional */}
        {/* Torso / Lab Coat */}
        <path
          d="M120 280 C120 225, 145 195, 190 195 C235 195, 260 225, 260 280 Z"
          fill="#174F3D"
          opacity="0.95"
        />
        <path
          d="M150 200 L190 280 L230 200 Z"
          fill="#EAF3ED"
          opacity="0.95"
        />

        {/* Stethoscope Accent */}
        <path
          d="M155 205 C155 235, 175 250, 190 250 C205 250, 225 235, 225 205"
          stroke="#103528"
          strokeWidth="3.5"
          strokeLinecap="round"
        />
        <circle cx="190" cy="254" r="5" fill="#103528" />

        {/* Friendly Face */}
        <circle cx="190" cy="140" r="38" fill="#FCD34D" />
        {/* Hair */}
        <path
          d="M155 135 C155 105, 170 95, 190 95 C210 95, 225 105, 225 135 C220 120, 210 115, 190 115 C170 115, 160 120, 155 135 Z"
          fill="#78350F"
        />
        {/* Smiling Eyes */}
        <path
          d="M176 138 Q181 133 186 138"
          stroke="#78350F"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
        <path
          d="M194 138 Q199 133 204 138"
          stroke="#78350F"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
        {/* Warm Smile */}
        <path
          d="M182 153 Q190 162 198 153"
          stroke="#78350F"
          strokeWidth="2.5"
          strokeLinecap="round"
          fill="none"
        />

        {/* Hand Holding Modern Glucose Monitor */}
        <g transform="translate(200, 140)">
          {/* Glucose Meter Body */}
          <rect
            x="10"
            y="10"
            width="95"
            height="125"
            rx="20"
            fill="#103528"
            stroke="#28765D"
            strokeWidth="3"
          />
          {/* Meter Digital Screen */}
          <rect
            x="22"
            y="24"
            width="71"
            height="52"
            rx="10"
            fill="#081C15"
          />
          {/* Screen Digits: 108 mg/dL */}
          <text
            x="57"
            y="52"
            fill="#34D399"
            fontSize="20"
            fontWeight="bold"
            textAnchor="middle"
            fontFamily="sans-serif"
          >
            108
          </text>
          <text
            x="57"
            y="66"
            fill="#A7F3D0"
            fontSize="8"
            fontWeight="600"
            textAnchor="middle"
            fontFamily="sans-serif"
          >
            mg/dL • Fasting
          </text>
          {/* Strip Slot & Test Strip */}
          <rect x="47" y="1" width="20" height="12" rx="3" fill="#EAF3ED" />
          {/* Glucose Droplet Icon on Strip */}
          <circle cx="57" cy="7" r="2.5" fill="#EF4444" />
          {/* Control Button on Meter */}
          <circle cx="57" cy="100" r="10" fill="#174F3D" />
          <circle cx="57" cy="100" r="4" fill="#EAF3ED" />
        </g>

        {/* Floating Health Metric Badge 1 (In Target) */}
        <g transform="translate(15, 65)">
          <rect
            width="125"
            height="42"
            rx="14"
            fill="#FFFFFF"
            stroke="#E0E9E2"
            strokeWidth="1"
            filter="drop-shadow(0 4px 10px rgba(0,0,0,0.06))"
          />
          <circle cx="24" cy="21" r="12" fill="#DEF7EC" />
          <path
            d="M20 21 L23 24 L28 18"
            stroke="#059669"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <text
            x="44"
            y="18"
            fill="#183D30"
            fontSize="11"
            fontWeight="bold"
            fontFamily="sans-serif"
          >
            Optimal
          </text>
          <text
            x="44"
            y="30"
            fill="#718078"
            fontSize="9"
            fontWeight="500"
            fontFamily="sans-serif"
          >
            70–99 mg/dL
          </text>
        </g>

        {/* Floating Health Metric Badge 2 (Weekly Trend) */}
        <g transform="translate(240, 240)">
          <rect
            width="125"
            height="42"
            rx="14"
            fill="#FFFFFF"
            stroke="#E0E9E2"
            strokeWidth="1"
            filter="drop-shadow(0 4px 10px rgba(0,0,0,0.06))"
          />
          <circle cx="24" cy="21" r="12" fill="#EAF3ED" />
          <path
            d="M19 24 L23 18 L26 21 L29 16"
            stroke="#174F3D"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <text
            x="44"
            y="18"
            fill="#183D30"
            fontSize="11"
            fontWeight="bold"
            fontFamily="sans-serif"
          >
            Trending Down
          </text>
          <text
            x="44"
            y="30"
            fill="#718078"
            fontSize="9"
            fontWeight="500"
            fontFamily="sans-serif"
          >
            Stable average
          </text>
        </g>

        <defs>
          <radialGradient id="healthcareAuraGrad" cx="0.5" cy="0.5" r="0.5">
            <stop offset="0%" stopColor="#28765D" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#A7F3D0" stopOpacity="0" />
          </radialGradient>
        </defs>
      </svg>

      {/* Card Micro-Banner */}
      {showBanner && (
        <div className="mt-4 flex items-center justify-between rounded-2xl bg-[#EAF3ED] dark:bg-[#162E25] p-3 text-xs border border-[#E0E9E2] dark:border-[#1E3E32]">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="font-semibold text-[#183D30] dark:text-[#F0F6F2]">
              Continuous Logging Active
            </span>
          </div>
          <span className="font-bold text-[#174F3D] dark:text-[#68B18C]">
            Clinical Telemetry
          </span>
        </div>
      )}
    </div>
  );
}

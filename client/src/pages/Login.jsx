import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ThemeToggle from '../components/ThemeToggle';
import Logo from '../components/Logo';
import HealthcareIllustration from '../components/HealthcareIllustration';
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  AlertCircle,
  Loader2,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';
import './Landing.css';
import './Auth.css';

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Authenticated user redirected to /dashboard by default
  const from = location.state?.from?.pathname || '/dashboard';

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
    if (serverError) {
      setServerError('');
    }
  };

  const validate = () => {
    const newErrors = {};

    if (!formData.email.trim()) {
      newErrors.email = 'Email address is required.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      newErrors.email = 'Please provide a valid email address.';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError('');

    if (!validate()) {
      return;
    }

    setIsLoading(true);

    try {
      await login(formData.email, formData.password);
      navigate(from, { replace: true });
    } catch (err) {
      const message =
        err.response?.data?.message ||
        'Unable to connect to the server. Please check your connection and try again.';
      setServerError(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-split-wrapper">
      {/* ======================================================== */}
      {/* LEFT COLUMN: BRANDED HEALTHCARE HERO PANEL (Desktop)     */}
      {/* ======================================================== */}
      <div className="auth-hero-column">
        {/* Glow orbs */}
        <div className="auth-glow-orb top-10 left-10 w-72 h-72 bg-emerald-400/20" />
        <div className="auth-glow-orb bottom-10 right-10 w-80 h-80 bg-teal-500/20" />

        {/* Top bar with Unified Logo & Back to Home */}
        <div className="relative z-10 flex items-center justify-between">
          <Logo to="/" size="medium" inverted={true} showSubtitle={false} />

          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-100/90 hover:text-white transition"
          >
            <ArrowLeft size={14} />
            <span>Back to Home</span>
          </Link>
        </div>

        {/* Center: Headline & Custom Healthcare Illustration */}
        <div className="relative z-10 my-8 flex flex-col items-center text-center lg:items-start lg:text-left">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-semibold text-emerald-100 mb-4 backdrop-blur-xs">
            <Sparkles size={13} className="text-emerald-200" />
            <span>Continuous Glycemic Telemetry</span>
          </div>

          <h2 className="text-2xl font-extrabold tracking-tight sm:text-3xl lg:text-4xl text-white leading-tight">
            Your glucose in focus.{' '}
            <span className="bg-gradient-to-r from-emerald-100 via-teal-100 to-white bg-clip-text text-transparent">
              Every day.
            </span>
          </h2>

          <p className="mt-3 text-sm text-emerald-100/80 max-w-md">
            Sign in to review your latest readings, observe long-term trends, and keep your metabolic health in balance.
          </p>

          {/* Healthcare Illustration */}
          <div className="mt-6 w-full max-w-sm">
            <HealthcareIllustration className="animate-float-gentle" showBanner={true} />
          </div>

          {/* Micro Benefits Checklist */}
          <div className="mt-6 hidden lg:flex flex-col gap-2.5 text-xs text-emerald-100/90">
            <div className="flex items-center gap-2">
              <CheckCircle2 size={15} className="text-emerald-300 shrink-0" />
              <span>Real-time reading logging with meal context tags</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 size={15} className="text-emerald-300 shrink-0" />
              <span>Interactive 7, 14, and 30-day glycemic charts</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 size={15} className="text-emerald-300 shrink-0" />
              <span>Clean PDF and CSV clinical export reports</span>
            </div>
          </div>
        </div>

        {/* Footer info in Hero panel */}
        <div className="relative z-10 hidden lg:block pt-4 border-t border-white/10 text-xs text-emerald-100/70">
          <p>© 2026 Sweety. Clinical Intelligence & Glycemic Care.</p>
        </div>
      </div>

      {/* ======================================================== */}
      {/* RIGHT COLUMN: LOGIN FORM CARD                            */}
      {/* ======================================================== */}
      <div className="auth-form-column">
        {/* Top bar controls */}
        <div className="absolute top-5 right-5 flex items-center gap-3">
          <ThemeToggle className="rounded-xl border border-[#E0E9E2] dark:border-[#1E3E32] bg-white dark:bg-[#12241D] p-2.5 text-[#174F3D] dark:text-[#68B18C] shadow-xs hover:bg-[#EAF3ED] dark:hover:bg-[#162E25]" />
        </div>

        <div className="auth-form-container">
          {/* Mobile Logo display */}
          <div className="mb-6 flex justify-center lg:hidden">
            <Logo to="/" size="medium" showSubtitle={true} subtitle="Clinical Intelligence" />
          </div>

          {/* Card */}
          <div className="auth-card">
            <div className="mb-6">
              <h1 className="text-2xl font-bold tracking-tight text-[#193D32] dark:text-[#F0F6F2]">
                Welcome back
              </h1>
              <p className="mt-1 text-xs text-[#788A80] dark:text-[#8AA497]">
                Sign in to manage and monitor your daily glucose readings
              </p>
            </div>

            {/* Server Error Alert */}
            {serverError && (
              <div className="mb-6 flex items-start gap-3 rounded-2xl border border-red-200 dark:border-red-900/60 bg-red-50 dark:bg-red-950/40 p-4 text-sm text-red-700 dark:text-red-300">
                <AlertCircle size={19} className="mt-0.5 shrink-0 text-red-600 dark:text-red-400" />
                <p className="leading-5">{serverError}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
              {/* Email Field */}
              <div>
                <label
                  htmlFor="email"
                  className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-[#193D32] dark:text-[#F0F6F2]"
                >
                  Email Address
                </label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400 dark:text-[#8AA497]">
                    <Mail size={18} />
                  </div>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="you@example.com"
                    className={`auth-input ${errors.email ? 'has-error' : ''}`}
                  />
                </div>
                {errors.email && (
                  <p className="mt-1.5 text-xs text-red-600 dark:text-red-400">{errors.email}</p>
                )}
              </div>

              {/* Password Field */}
              <div>
                <div className="mb-1.5 flex items-center justify-between">
                  <label
                    htmlFor="password"
                    className="block text-xs font-semibold uppercase tracking-wider text-[#193D32] dark:text-[#F0F6F2]"
                  >
                    Password
                  </label>
                </div>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400 dark:text-[#8AA497]">
                    <Lock size={18} />
                  </div>
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Enter your password"
                    className={`auth-input pr-11 ${errors.password ? 'has-error' : ''}`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-slate-400 hover:text-[#174F3D] dark:text-[#8AA497] dark:hover:text-[#F0F6F2]"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {errors.password && (
                  <p className="mt-1.5 text-xs text-red-600 dark:text-red-400">{errors.password}</p>
                )}
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="btn-forest-gradient mt-2 flex w-full items-center justify-center gap-2 rounded-xl py-3.5 px-4 font-semibold text-white shadow-md transition disabled:cursor-not-allowed disabled:opacity-70 cursor-pointer"
              >
                {isLoading ? (
                  <>
                    <Loader2 size={19} className="animate-spin" />
                    <span>Signing in...</span>
                  </>
                ) : (
                  <>
                    <span>Sign In</span>
                    <ArrowRight size={17} />
                  </>
                )}
              </button>
            </form>

            {/* Switch to Signup */}
            <div className="mt-7 border-t border-[#E0E9E2] dark:border-[#1E3E32] pt-6 text-center">
              <p className="text-xs text-[#788A80] dark:text-[#8AA497]">
                Don't have an account yet?{' '}
                <Link
                  to="/signup"
                  className="font-bold text-[#174F3D] dark:text-[#68B18C] hover:underline transition"
                >
                  Create an account
                </Link>
              </p>
            </div>
          </div>

          {/* Footer on mobile */}
          <div className="mt-6 text-center text-xs text-[#788A80] dark:text-[#8AA497] lg:hidden">
            <Link to="/" className="inline-flex items-center gap-1 hover:underline text-[#174F3D] dark:text-[#68B18C]">
              <ArrowLeft size={13} />
              <span>Back to Sweety Home</span>
            </Link>
            <p className="mt-2">© 2026 Sweety • Clinical Intelligence</p>
          </div>
        </div>
      </div>
    </div>
  );
}

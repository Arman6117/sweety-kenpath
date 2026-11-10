import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ThemeToggle from '../components/ThemeToggle';
import Logo from '../components/Logo';
import HealthcareIllustration from '../components/HealthcareIllustration';
import {
  User,
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

export default function Signup() {
  const navigate = useNavigate();
  const { register } = useAuth();
  const redirectTimerRef = useRef(null);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    return () => {
      if (redirectTimerRef.current) {
        clearTimeout(redirectTimerRef.current);
      }
    };
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
    if (serverError) {
      setServerError('');
    }
    if (successMessage) {
      setSuccessMessage('');
    }
  };

  const validate = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Full name is required.';
    } else if (formData.name.trim().length < 2) {
      newErrors.name = 'Full name must be at least 2 characters.';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email address is required.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      newErrors.email = 'Please provide a valid email address.';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required.';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must contain at least 8 characters.';
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Confirm your password.';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError('');
    setSuccessMessage('');

    if (!validate()) {
      return;
    }

    setIsLoading(true);

    try {
      const responseData = await register(
        formData.name,
        formData.email,
        formData.password
      );

      const msg =
        responseData?.message ||
        'Account created successfully! Redirecting to your dashboard...';
      setSuccessMessage(msg);

      redirectTimerRef.current = setTimeout(() => {
        navigate('/dashboard', { replace: true });
      }, 1000);
    } catch (err) {
      const status = err.response?.status;
      const message =
        err.response?.data?.message ||
        'Unable to create your account. Please check your connection and try again.';

      setServerError(message);

      if (status === 409) {
        setErrors((prev) => ({
          ...prev,
          email: message,
        }));
      }
    } finally {
      setIsLoading(false);
    }
  };

  const isPasswordLongEnough = formData.password.length >= 8;
  const doPasswordsMatch =
    formData.confirmPassword.length > 0 &&
    formData.password === formData.confirmPassword;

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
            <span>Join Sweety Healthcare Telemetry</span>
          </div>

          <h2 className="text-2xl font-extrabold tracking-tight sm:text-3xl lg:text-4xl text-white leading-tight">
            Take control of your{' '}
            <span className="bg-gradient-to-r from-emerald-100 via-teal-100 to-white bg-clip-text text-transparent">
              metabolic health.
            </span>
          </h2>

          <p className="mt-3 text-sm text-emerald-100/80 max-w-md">
            Sign up in seconds and gain full visibility into your blood glucose patterns with clinical precision.
          </p>

          {/* Healthcare Illustration */}
          <div className="mt-6 w-full max-w-sm">
            <HealthcareIllustration className="animate-float-gentle" showBanner={true} />
          </div>

          {/* Micro Benefits Checklist */}
          <div className="mt-6 hidden lg:flex flex-col gap-2.5 text-xs text-emerald-100/90">
            <div className="flex items-center gap-2">
              <CheckCircle2 size={15} className="text-emerald-300 shrink-0" />
              <span>Free account setup with zero configuration</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 size={15} className="text-emerald-300 shrink-0" />
              <span>Full privacy and encrypted reading storage</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 size={15} className="text-emerald-300 shrink-0" />
              <span>Export doctor-ready reports at any time</span>
            </div>
          </div>
        </div>

        {/* Footer info in Hero panel */}
        <div className="relative z-10 hidden lg:block pt-4 border-t border-white/10 text-xs text-emerald-100/70">
          <p>© 2026 Sweety. Clinical Intelligence & Glycemic Care.</p>
        </div>
      </div>

      {/* ======================================================== */}
      {/* RIGHT COLUMN: SIGNUP FORM CARD                           */}
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
                Create an account
              </h1>
              <p className="mt-1 text-xs text-[#788A80] dark:text-[#8AA497]">
                Start tracking your glucose levels and take control of your health
              </p>
            </div>

            {/* Success Alert */}
            {successMessage && (
              <div className="mb-6 flex items-start gap-3 rounded-2xl border border-emerald-200 dark:border-emerald-900/60 bg-emerald-50 dark:bg-emerald-950/40 p-4 text-sm text-emerald-800 dark:text-emerald-300">
                <CheckCircle2
                  size={19}
                  className="mt-0.5 shrink-0 text-emerald-600 dark:text-emerald-400"
                />
                <div className="leading-5 font-medium">
                  <p>{successMessage}</p>
                  <p className="mt-1 text-xs text-emerald-700 dark:text-emerald-400">
                    Redirecting to your dashboard...
                  </p>
                </div>
              </div>
            )}

            {/* Server Error Alert */}
            {serverError && (
              <div className="mb-6 flex items-start gap-3 rounded-2xl border border-red-200 dark:border-red-900/60 bg-red-50 dark:bg-red-950/40 p-4 text-sm text-red-700 dark:text-red-300">
                <AlertCircle size={19} className="mt-0.5 shrink-0 text-red-600 dark:text-red-400" />
                <p className="leading-5">{serverError}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
              {/* Full Name Field */}
              <div>
                <label
                  htmlFor="name"
                  className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-[#193D32] dark:text-[#F0F6F2]"
                >
                  Full Name
                </label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400 dark:text-[#8AA497]">
                    <User size={18} />
                  </div>
                  <input
                    id="name"
                    name="name"
                    type="text"
                    autoComplete="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="e.g. Jane Doe"
                    disabled={isLoading || Boolean(successMessage)}
                    className={`auth-input ${errors.name ? 'has-error' : ''}`}
                  />
                </div>
                {errors.name && (
                  <p className="mt-1.5 text-xs text-red-600 dark:text-red-400">{errors.name}</p>
                )}
              </div>

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
                    disabled={isLoading || Boolean(successMessage)}
                    className={`auth-input ${errors.email ? 'has-error' : ''}`}
                  />
                </div>
                {errors.email && (
                  <p className="mt-1.5 text-xs text-red-600 dark:text-red-400">{errors.email}</p>
                )}
              </div>

              {/* Password Field */}
              <div>
                <label
                  htmlFor="password"
                  className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-[#193D32] dark:text-[#F0F6F2]"
                >
                  Password
                </label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400 dark:text-[#8AA497]">
                    <Lock size={18} />
                  </div>
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="At least 8 characters"
                    disabled={isLoading || Boolean(successMessage)}
                    className={`auth-input pr-11 ${errors.password ? 'has-error' : ''}`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-slate-400 hover:text-[#174F3D] dark:text-[#8AA497] dark:hover:text-[#F0F6F2]"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    disabled={isLoading || Boolean(successMessage)}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {errors.password && (
                  <p className="mt-1.5 text-xs text-red-600 dark:text-red-400">{errors.password}</p>
                )}
              </div>

              {/* Confirm Password Field */}
              <div>
                <label
                  htmlFor="confirmPassword"
                  className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-[#193D32] dark:text-[#F0F6F2]"
                >
                  Confirm Password
                </label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400 dark:text-[#8AA497]">
                    <Lock size={18} />
                  </div>
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    placeholder="Re-type your password"
                    disabled={isLoading || Boolean(successMessage)}
                    className={`auth-input pr-11 ${errors.confirmPassword ? 'has-error' : ''}`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword((prev) => !prev)}
                    className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-slate-400 hover:text-[#174F3D] dark:text-[#8AA497] dark:hover:text-[#F0F6F2]"
                    aria-label={
                      showConfirmPassword ? 'Hide password' : 'Show password'
                    }
                    disabled={isLoading || Boolean(successMessage)}
                  >
                    {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <p className="mt-1.5 text-xs text-red-600 dark:text-red-400">
                    {errors.confirmPassword}
                  </p>
                )}
              </div>

              {/* Password Requirements Helper Checklist */}
              <div className="space-y-1.5 rounded-xl bg-[#EAF3ED]/60 dark:bg-[#162E25] border border-[#E0E9E2] dark:border-[#1E3E32] p-3 text-xs text-[#193D32] dark:text-[#F0F6F2]">
                <div className="flex items-center gap-2">
                  <CheckCircle2
                    size={14}
                    className={
                      isPasswordLongEnough
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : 'text-slate-300 dark:text-slate-600'
                    }
                  />
                  <span
                    className={
                      isPasswordLongEnough
                        ? 'text-[#193D32] dark:text-[#F0F6F2] font-medium'
                        : 'text-[#788A80] dark:text-[#8AA497]'
                    }
                  >
                    At least 8 characters
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2
                    size={14}
                    className={
                      doPasswordsMatch
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : 'text-slate-300 dark:text-slate-600'
                    }
                  />
                  <span
                    className={
                      doPasswordsMatch
                        ? 'text-[#193D32] dark:text-[#F0F6F2] font-medium'
                        : 'text-[#788A80] dark:text-[#8AA497]'
                    }
                  >
                    Passwords match
                  </span>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading || Boolean(successMessage)}
                className="btn-forest-gradient mt-2 flex w-full items-center justify-center gap-2 rounded-xl py-3.5 px-4 font-semibold text-white shadow-md transition disabled:cursor-not-allowed disabled:opacity-70 cursor-pointer"
              >
                {isLoading ? (
                  <>
                    <Loader2 size={19} className="animate-spin" />
                    <span>Creating account...</span>
                  </>
                ) : successMessage ? (
                  <>
                    <CheckCircle2 size={19} />
                    <span>Account Created!</span>
                  </>
                ) : (
                  <>
                    <span>Create Account</span>
                    <ArrowRight size={17} />
                  </>
                )}
              </button>
            </form>

            {/* Switch to Login */}
            <div className="mt-7 border-t border-[#E0E9E2] dark:border-[#1E3E32] pt-6 text-center">
              <p className="text-xs text-[#788A80] dark:text-[#8AA497]">
                Already have an account?{' '}
                <Link
                  to="/login"
                  className="font-bold text-[#174F3D] dark:text-[#68B18C] hover:underline transition"
                >
                  Sign in
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

import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Heart,
  User,
  Mail,
  Lock,
  Eye,
  EyeOff,
  AlertCircle,
  Loader2,
  ArrowRight,
  CheckCircle2,
} from 'lucide-react';

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

  // Clean up timer on unmount
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

    // Clear field-specific error as user types
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
      // Reuses AuthContext register method which sends POST http://localhost:5000/api/auth/register
      // with { name, email, password } and saves the token to localStorage ('sweety_token')
      const responseData = await register(
        formData.name,
        formData.email,
        formData.password
      );

      const msg =
        responseData?.message ||
        'Account created successfully! Redirecting to your dashboard...';
      setSuccessMessage(msg);

      // Short delay so user sees the success feedback before redirecting to Dashboard
      redirectTimerRef.current = setTimeout(() => {
        navigate('/', { replace: true });
      }, 1000);
    } catch (err) {
      const status = err.response?.status;
      const message =
        err.response?.data?.message ||
        'Unable to create your account. Please check your connection and try again.';

      setServerError(message);

      // Specifically flag the email field if duplicate email error (HTTP 409)
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
    <div className="flex min-h-screen items-center justify-center bg-[#f6faf8] px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md">
        {/* Brand Header */}
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500 text-white shadow-lg shadow-emerald-100">
            <Heart size={30} fill="white" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">
            Sweety
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            Your personal blood glucose companion
          </p>
        </div>

        {/* Card */}
        <div className="rounded-3xl border border-slate-100 bg-white p-7 shadow-sm sm:p-9">
          <div className="mb-6">
            <h2 className="text-xl font-bold text-slate-900 sm:text-2xl">
              Create an account
            </h2>
            <p className="mt-1 text-xs text-slate-400">
              Start tracking your glucose levels and take control of your health
            </p>
          </div>

          {/* Success Alert */}
          {successMessage && (
            <div className="mb-6 flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
              <CheckCircle2
                size={19}
                className="mt-0.5 shrink-0 text-emerald-600"
              />
              <div className="leading-5 font-medium">
                <p>{successMessage}</p>
                <p className="mt-1 text-xs text-emerald-700">
                  Redirecting to your dashboard...
                </p>
              </div>
            </div>
          )}

          {/* Server Error Alert */}
          {serverError && (
            <div className="mb-6 flex items-start gap-3 rounded-2xl border border-red-100 bg-red-50 p-4 text-sm text-red-700">
              <AlertCircle size={19} className="mt-0.5 shrink-0 text-red-600" />
              <p className="leading-5">{serverError}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            {/* Full Name Field */}
            <div>
              <label
                htmlFor="name"
                className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-500"
              >
                Full Name
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
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
                  className={`w-full rounded-xl border bg-white py-3 pl-11 pr-4 text-sm text-slate-800 placeholder-slate-400 transition focus:outline-none focus:ring-2 focus:ring-emerald-500/20 disabled:bg-slate-50 ${
                    errors.name
                      ? 'border-red-300 focus:border-red-500'
                      : 'border-slate-200 focus:border-emerald-500'
                  }`}
                />
              </div>
              {errors.name && (
                <p className="mt-1.5 text-xs text-red-600">{errors.name}</p>
              )}
            </div>

            {/* Email Field */}
            <div>
              <label
                htmlFor="email"
                className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-500"
              >
                Email Address
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
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
                  className={`w-full rounded-xl border bg-white py-3 pl-11 pr-4 text-sm text-slate-800 placeholder-slate-400 transition focus:outline-none focus:ring-2 focus:ring-emerald-500/20 disabled:bg-slate-50 ${
                    errors.email
                      ? 'border-red-300 focus:border-red-500'
                      : 'border-slate-200 focus:border-emerald-500'
                  }`}
                />
              </div>
              {errors.email && (
                <p className="mt-1.5 text-xs text-red-600">{errors.email}</p>
              )}
            </div>

            {/* Password Field */}
            <div>
              <label
                htmlFor="password"
                className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-500"
              >
                Password
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
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
                  className={`w-full rounded-xl border bg-white py-3 pl-11 pr-11 text-sm text-slate-800 placeholder-slate-400 transition focus:outline-none focus:ring-2 focus:ring-emerald-500/20 disabled:bg-slate-50 ${
                    errors.password
                      ? 'border-red-300 focus:border-red-500'
                      : 'border-slate-200 focus:border-emerald-500'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-slate-400 hover:text-slate-600"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  disabled={isLoading || Boolean(successMessage)}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1.5 text-xs text-red-600">{errors.password}</p>
              )}
            </div>

            {/* Confirm Password Field */}
            <div>
              <label
                htmlFor="confirmPassword"
                className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-500"
              >
                Confirm Password
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
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
                  className={`w-full rounded-xl border bg-white py-3 pl-11 pr-11 text-sm text-slate-800 placeholder-slate-400 transition focus:outline-none focus:ring-2 focus:ring-emerald-500/20 disabled:bg-slate-50 ${
                    errors.confirmPassword
                      ? 'border-red-300 focus:border-red-500'
                      : 'border-slate-200 focus:border-emerald-500'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword((prev) => !prev)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-slate-400 hover:text-slate-600"
                  aria-label={
                    showConfirmPassword ? 'Hide password' : 'Show password'
                  }
                  disabled={isLoading || Boolean(successMessage)}
                >
                  {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="mt-1.5 text-xs text-red-600">
                  {errors.confirmPassword}
                </p>
              )}
            </div>

            {/* Password Requirements Helper Checklist */}
            <div className="space-y-1.5 rounded-xl bg-slate-50 p-3 text-xs text-slate-500">
              <div className="flex items-center gap-2">
                <CheckCircle2
                  size={14}
                  className={
                    isPasswordLongEnough ? 'text-emerald-600' : 'text-slate-300'
                  }
                />
                <span
                  className={
                    isPasswordLongEnough ? 'text-slate-700' : 'text-slate-400'
                  }
                >
                  At least 8 characters
                </span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2
                  size={14}
                  className={
                    doPasswordsMatch ? 'text-emerald-600' : 'text-slate-300'
                  }
                />
                <span
                  className={
                    doPasswordsMatch ? 'text-slate-700' : 'text-slate-400'
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
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 py-3.5 px-4 font-semibold text-white shadow-md shadow-emerald-100 transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-70"
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
          <div className="mt-7 border-t border-slate-100 pt-6 text-center">
            <p className="text-xs text-slate-500">
              Already have an account?{' '}
              <Link
                to="/login"
                className="font-semibold text-emerald-700 transition hover:text-emerald-800"
              >
                Sign in
              </Link>
            </p>
          </div>
        </div>

        {/* Footer info */}
        <p className="mt-8 text-center text-xs text-slate-400">
          © 2026 Sweety Glucose Tracker. Your health, your priority.
        </p>
      </div>
    </div>
  );
}

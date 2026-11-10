import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  ClipboardList,
  BarChart3,
  ShieldCheck,
  ArrowRight,
  CheckCircle2,
  Sparkles,
  TrendingUp,
  Heart,
  Lock,
  Menu,
  X,
  ChevronRight,
  Clock,
  Layers,
  Activity,
} from "lucide-react";
import ThemeToggle from "../components/ThemeToggle";
import Logo from "../components/Logo";
import HealthcareIllustration from "../components/HealthcareIllustration";
import "./Landing.css";

export default function Landing() {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navLinks = [
    { label: "Home", href: "#hero" },
    { label: "Features", href: "#features" },
    { label: "How It Works", href: "#how-it-works" },
    { label: "About", href: "#about" },
  ];

  return (
    <div className="landing-wrapper min-h-screen bg-[#F4F7F2] text-[#193D32] transition-colors duration-200">
      {/* ======================================================== */}
      {/* 1. NAVIGATION BAR                                        */}
      {/* ======================================================== */}
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-200 ${
          scrolled ? "landing-glass-nav py-3 shadow-xs" : "bg-transparent py-5"
        }`}
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            {/* Unified Sweety Care Logo */}
            <Logo to="/" size="medium" showSubtitle={false} />

            {/* Desktop Navigation Links */}
            <div className="hidden md:flex items-center gap-8 text-sm font-semibold text-[#788A80] dark:text-[#8AA497]">
              {navLinks.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  className="transition hover:text-[#174F3D] dark:hover:text-[#F0F6F2]"
                >
                  {link.label}
                </a>
              ))}
            </div>

            {/* Right Side Actions */}
            <div className="hidden md:flex items-center gap-3">
              {/* Theme Toggle */}
              <ThemeToggle className="rounded-xl border border-[#E0E9E2] dark:border-[#1E3E32] bg-white dark:bg-[#12241D] p-2 text-[#174F3D] dark:text-[#68B18C] hover:bg-[#EAF3ED] dark:hover:bg-[#162E25]" />

              <Link
                to="/login"
                className="btn-forest-outline rounded-xl px-4 py-2 text-xs font-semibold sm:text-sm"
              >
                Log In
              </Link>

              <Link
                to="/signup"
                className="btn-forest-gradient rounded-xl px-4 py-2 text-xs font-semibold sm:text-sm flex items-center gap-1.5"
              >
                <span>Get Started</span>
                <ArrowRight size={15} />
              </Link>
            </div>

            {/* Mobile Hamburger Button */}
            <div className="flex items-center gap-2 md:hidden">
              <ThemeToggle className="rounded-xl border border-[#E0E9E2] dark:border-[#1E3E32] bg-white dark:bg-[#12241D] p-2 text-[#174F3D] dark:text-[#68B18C]" />
              <button
                type="button"
                onClick={() => setMobileNavOpen(true)}
                className="rounded-xl border border-[#E0E9E2] dark:border-[#1E3E32] bg-white dark:bg-[#12241D] p-2.5 text-[#193D32] dark:text-[#F0F6F2]"
                aria-label="Open mobile menu"
              >
                <Menu size={20} />
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Menu Drawer */}
      {mobileNavOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <div
            className="fixed inset-0 bg-[#103528]/40 backdrop-blur-xs transition-opacity"
            onClick={() => setMobileNavOpen(false)}
          />
          <div className="relative flex w-72 flex-col bg-white dark:bg-[#12241D] p-6 shadow-2xl">
            <div className="mb-8 flex items-center justify-between">
              <Logo size="compact" showSubtitle={false} />
              <button
                type="button"
                onClick={() => setMobileNavOpen(false)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-[#EAF3ED] dark:hover:bg-[#162E25]"
              >
                <X size={20} />
              </button>
            </div>

            <nav className="space-y-2">
              {navLinks.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  onClick={() => setMobileNavOpen(false)}
                  className="flex items-center justify-between rounded-xl px-4 py-3 text-sm font-semibold text-slate-700 dark:text-[#8AA497] hover:bg-[#EAF3ED] dark:hover:bg-[#162E25] hover:text-[#174F3D] dark:hover:text-[#F0F6F2]"
                >
                  <span>{link.label}</span>
                  <ChevronRight size={16} />
                </a>
              ))}
            </nav>

            <div className="mt-auto border-t border-[#E0E9E2] dark:border-[#1E3E32] pt-4 space-y-2.5">
              <Link
                to="/login"
                onClick={() => setMobileNavOpen(false)}
                className="btn-forest-outline flex w-full items-center justify-center rounded-xl py-2.5 text-sm font-semibold"
              >
                Log In
              </Link>
              <Link
                to="/signup"
                onClick={() => setMobileNavOpen(false)}
                className="btn-forest-gradient flex w-full items-center justify-center rounded-xl py-2.5 text-sm font-semibold"
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 2. HERO SECTION                                          */}
      {/* ======================================================== */}
      <section
        id="hero"
        className="relative overflow-hidden pt-32 pb-20 sm:pt-40 sm:pb-28 lg:pt-44 lg:pb-32"
      >
        {/* Ambient Gradient Orbs */}
        <div className="pointer-events-none absolute -top-24 left-1/2 -translate-x-1/2 w-[700px] h-[500px] rounded-full bg-gradient-to-tr from-emerald-400/20 via-teal-300/15 to-emerald-200/10 blur-3xl animate-glow-pulse" />
        <div className="pointer-events-none absolute top-40 right-10 w-72 h-72 rounded-full bg-emerald-500/10 blur-2xl" />

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-12 lg:gap-8">
            {/* Left Content Column */}
            <div className="lg:col-span-7 text-center lg:text-left">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 rounded-full border border-[#E0E9E2] dark:border-[#1E3E32] bg-[#EAF3ED]/80 dark:bg-[#162E25] px-3.5 py-1.5 text-xs font-semibold text-[#174F3D] dark:text-[#68B18C] backdrop-blur-xs mb-6">
                <Sparkles size={14} className="text-[#28765D] dark:text-[#68B18C]" />
                <span>Clinical Glycemic Intelligence</span>
              </div>

              {/* Headline */}
              <h1 className="text-3xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl text-[#193D32] dark:text-[#F0F6F2] leading-tight sm:leading-tight">
                Track Your Glucose.{" "}
                <span className="bg-gradient-to-r from-[#174F3D] via-[#21634D] to-[#28765D] dark:from-[#3AA375] dark:via-[#68B18C] dark:to-[#A7F3D0] bg-clip-text text-transparent">
                  Understand Your Health Better.
                </span>
              </h1>

              {/* Supporting Text */}
              <p className="mt-5 text-base sm:text-lg text-[#788A80] dark:text-[#8AA497] leading-relaxed max-w-2xl mx-auto lg:mx-0">
                Sweety helps you record your daily glucose readings, visualize
                trends, and stay informed with simple and powerful clinical reports.
              </p>

              {/* Action Buttons */}
              <div className="mt-8 flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
                <Link
                  to="/signup"
                  className="btn-forest-gradient flex items-center justify-center gap-2 rounded-2xl px-7 py-3.5 text-sm sm:text-base font-bold w-full sm:w-auto"
                >
                  <span>Get Started for Free</span>
                  <ArrowRight size={18} />
                </Link>

                <Link
                  to="/login"
                  className="btn-forest-outline flex items-center justify-center gap-2 rounded-2xl px-7 py-3.5 text-sm sm:text-base font-semibold w-full sm:w-auto shadow-xs"
                >
                  <span>Sign In</span>
                </Link>
              </div>

              {/* Feature Highlight Pills */}
              <div className="mt-10 pt-8 border-t border-[#E0E9E2] dark:border-[#1E3E32] flex flex-wrap items-center justify-center lg:justify-start gap-6 text-xs font-semibold text-[#788A80] dark:text-[#8AA497]">
                <div className="flex items-center gap-2">
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[#EAF3ED] dark:bg-[#162E25] text-[#174F3D] dark:text-[#68B18C]">
                    <CheckCircle2 size={14} />
                  </div>
                  <span>Track Readings</span>
                </div>

                <div className="flex items-center gap-2">
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[#EAF3ED] dark:bg-[#162E25] text-[#174F3D] dark:text-[#68B18C]">
                    <CheckCircle2 size={14} />
                  </div>
                  <span>View Reports</span>
                </div>

                <div className="flex items-center gap-2">
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[#EAF3ED] dark:bg-[#162E25] text-[#174F3D] dark:text-[#68B18C]">
                    <CheckCircle2 size={14} />
                  </div>
                  <span>Stay Secure</span>
                </div>
              </div>
            </div>

            {/* Right Column: Premium Healthcare SaaS Illustration */}
            <div className="lg:col-span-5 flex justify-center">
              <div className="relative w-full max-w-md lg:max-w-none">
                {/* Decorative Background Blob */}
                <div className="absolute inset-0 rounded-3xl bg-gradient-to-tr from-emerald-600/15 via-teal-500/10 to-emerald-700/15 blur-xl -rotate-2 transform" />

                {/* Main Illustration Card */}
                <HealthcareIllustration className="animate-float-gentle" showBanner={true} />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ======================================================== */}
      {/* 3. FEATURES SECTION                                      */}
      {/* ======================================================== */}
      <section
        id="features"
        className="relative py-24 sm:py-32 bg-white dark:bg-[#0E1D18] transition-colors border-y border-[#E0E9E2] dark:border-[#1E3E32]"
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {/* Section Header */}
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="inline-block rounded-full bg-[#EAF3ED] dark:bg-[#162E25] px-3.5 py-1 text-xs font-bold text-[#174F3D] dark:text-[#68B18C] uppercase tracking-wider mb-3">
              Core Capabilities
            </span>
            <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl text-[#193D32] dark:text-[#F0F6F2]">
              Engineered for Complete Glycemic Control
            </h2>
            <p className="mt-3 text-base sm:text-lg text-[#788A80] dark:text-[#8AA497]">
              Sweety combines intuitive measurement tracking with clinical intelligence, giving you clear insights at every step.
            </p>
          </div>

          {/* 4 Feature Cards */}
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4">
            {/* Card 1: Daily Glucose Tracking */}
            <div className="landing-card rounded-3xl border border-[#E0E9E2] dark:border-[#1E3E32] bg-[#F4F7F2] dark:bg-[#12241D] p-7 flex flex-col justify-between">
              <div>
                <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#174F3D] text-white shadow-md shadow-emerald-900/15">
                  <Activity size={26} strokeWidth={2.2} />
                </div>
                <h3 className="text-xl font-bold text-[#193D32] dark:text-[#F0F6F2]">
                  Daily Glucose Tracking
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-[#788A80] dark:text-[#8AA497]">
                  Record your blood sugar measurements effortlessly across key slots: Fasting, After Breakfast, After Lunch, and After Dinner.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-[#E0E9E2] dark:border-[#1E3E32] flex items-center gap-1.5 text-xs font-semibold text-[#174F3D] dark:text-[#68B18C]">
                <Clock size={14} />
                <span>Time-slot tagging</span>
              </div>
            </div>

            {/* Card 2: Reading History */}
            <div className="landing-card rounded-3xl border border-[#E0E9E2] dark:border-[#1E3E32] bg-[#F4F7F2] dark:bg-[#12241D] p-7 flex flex-col justify-between">
              <div>
                <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#21634D] text-white shadow-md shadow-emerald-900/15">
                  <ClipboardList size={26} />
                </div>
                <h3 className="text-xl font-bold text-[#193D32] dark:text-[#F0F6F2]">
                  Reading History
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-[#788A80] dark:text-[#8AA497]">
                  Review your sequential logs with fast search, slot filters, and quick inline edit and delete controls right when you need them.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-[#E0E9E2] dark:border-[#1E3E32] flex items-center gap-1.5 text-xs font-semibold text-[#174F3D] dark:text-[#68B18C]">
                <Layers size={14} />
                <span>Full audit trail</span>
              </div>
            </div>

            {/* Card 3: Smart Reports */}
            <div className="landing-card rounded-3xl border border-[#E0E9E2] dark:border-[#1E3E32] bg-[#F4F7F2] dark:bg-[#12241D] p-7 flex flex-col justify-between">
              <div>
                <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#28765D] text-white shadow-md shadow-emerald-900/15">
                  <BarChart3 size={26} />
                </div>
                <h3 className="text-xl font-bold text-[#193D32] dark:text-[#F0F6F2]">
                  Smart Reports
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-[#788A80] dark:text-[#8AA497]">
                  Get instant daily summaries, month-to-date analysis, and historical comparative reports with highest, lowest, and average calculations.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-[#E0E9E2] dark:border-[#1E3E32] flex items-center gap-1.5 text-xs font-semibold text-[#174F3D] dark:text-[#68B18C]">
                <TrendingUp size={14} />
                <span>Interactive SVG trend charts</span>
              </div>
            </div>

            {/* Card 4: Secure Personal Account */}
            <div className="landing-card rounded-3xl border border-[#E0E9E2] dark:border-[#1E3E32] bg-[#F4F7F2] dark:bg-[#12241D] p-7 flex flex-col justify-between">
              <div>
                <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#103528] text-white shadow-md shadow-emerald-900/15">
                  <ShieldCheck size={26} />
                </div>
                <h3 className="text-xl font-bold text-[#193D32] dark:text-[#F0F6F2]">
                  Secure Personal Account
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-[#788A80] dark:text-[#8AA497]">
                  Protected with 12-round bcrypt password hashing, encrypted JWT tokens, and private data isolation for total peace of mind.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-[#E0E9E2] dark:border-[#1E3E32] flex items-center gap-1.5 text-xs font-semibold text-[#174F3D] dark:text-[#68B18C]">
                <Lock size={14} />
                <span>Encrypted private vault</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ======================================================== */}
      {/* 4. HOW IT WORKS SECTION                                  */}
      {/* ======================================================== */}
      <section
        id="how-it-works"
        className="relative py-24 sm:py-32 overflow-hidden"
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="inline-block rounded-full bg-[#EAF3ED] dark:bg-[#162E25] px-3.5 py-1 text-xs font-bold text-[#174F3D] dark:text-[#68B18C] uppercase tracking-wider mb-3">
              Simple 3-Step Flow
            </span>
            <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl text-[#193D32] dark:text-[#F0F6F2]">
              How Sweety Works
            </h2>
            <p className="mt-3 text-base sm:text-lg text-[#788A80] dark:text-[#8AA497]">
              Getting started takes less than a minute. Here is how you take charge of your numbers.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            {/* Step 1 */}
            <div className="relative rounded-3xl border border-[#E0E9E2] dark:border-[#1E3E32] bg-white dark:bg-[#12241D] p-8 text-center shadow-xs">
              <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#EAF3ED] dark:bg-[#162E25] text-[#174F3D] dark:text-[#68B18C] font-extrabold text-2xl shadow-inner">
                1
              </div>
              <h3 className="text-xl font-bold text-[#193D32] dark:text-[#F0F6F2]">
                Create your account
              </h3>
              <p className="mt-3 text-sm text-[#788A80] dark:text-[#8AA497] leading-relaxed">
                Sign up with your name and email in seconds. Your secure medical telemetry space is instantly provisioned.
              </p>
            </div>

            {/* Step 2 */}
            <div className="relative rounded-3xl border border-[#E0E9E2] dark:border-[#1E3E32] bg-white dark:bg-[#12241D] p-8 text-center shadow-xs">
              <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#EAF3ED] dark:bg-[#162E25] text-[#174F3D] dark:text-[#68B18C] font-extrabold text-2xl shadow-inner">
                2
              </div>
              <h3 className="text-xl font-bold text-[#193D32] dark:text-[#F0F6F2]">
                Record your glucose readings
              </h3>
              <p className="mt-3 text-sm text-[#788A80] dark:text-[#8AA497] leading-relaxed">
                Enter your mg/dL measurements after meals or fasting. Sweety automatically organizes them by date and time slot.
              </p>
            </div>

            {/* Step 3 */}
            <div className="relative rounded-3xl border border-[#E0E9E2] dark:border-[#1E3E32] bg-white dark:bg-[#12241D] p-8 text-center shadow-xs">
              <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#EAF3ED] dark:bg-[#162E25] text-[#174F3D] dark:text-[#68B18C] font-extrabold text-2xl shadow-inner">
                3
              </div>
              <h3 className="text-xl font-bold text-[#193D32] dark:text-[#F0F6F2]">
                Monitor your progress
              </h3>
              <p className="mt-3 text-sm text-[#788A80] dark:text-[#8AA497] leading-relaxed">
                Inspect trends, review weekly distributions, and export comprehensive reports for your next doctor or clinic visit.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ======================================================== */}
      {/* 5. ABOUT SECTION                                         */}
      {/* ======================================================== */}
      <section
        id="about"
        className="py-24 sm:py-32 bg-white dark:bg-[#0E1D18] border-t border-[#E0E9E2] dark:border-[#1E3E32]"
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Left Column: Purpose & Mission */}
            <div className="lg:col-span-6">
              <span className="inline-block rounded-full bg-[#EAF3ED] dark:bg-[#162E25] px-3.5 py-1 text-xs font-bold text-[#174F3D] dark:text-[#68B18C] uppercase tracking-wider mb-3">
                Our Purpose
              </span>
              <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl text-[#193D32] dark:text-[#F0F6F2] leading-tight">
                Designed to Give You Clarity, Not Confusion
              </h2>
              <p className="mt-4 text-base sm:text-lg text-[#788A80] dark:text-[#8AA497] leading-relaxed">
                Sweety was created with a single objective: to replace messy paper logs and complicated medical apps with a clean, dependable digital companion.
              </p>
              <p className="mt-3 text-sm sm:text-base text-[#788A80] dark:text-[#8AA497] leading-relaxed">
                Whether you are managing diabetes, monitoring pre-diabetes, or simply optimizing metabolic wellness, Sweety helps you understand what is working and keeps your healthcare provider informed.
              </p>

              <div className="mt-8 grid grid-cols-2 gap-4">
                <div className="rounded-2xl border border-[#E0E9E2] dark:border-[#1E3E32] bg-[#F4F7F2] dark:bg-[#12241D] p-4">
                  <p className="text-2xl font-extrabold text-[#174F3D] dark:text-[#68B18C]">100%</p>
                  <p className="mt-1 text-xs text-[#788A80] dark:text-[#8AA497]">Private & Encrypted Data</p>
                </div>
                <div className="rounded-2xl border border-[#E0E9E2] dark:border-[#1E3E32] bg-[#F4F7F2] dark:bg-[#12241D] p-4">
                  <p className="text-2xl font-extrabold text-[#174F3D] dark:text-[#68B18C]">4 Slots</p>
                  <p className="mt-1 text-xs text-[#788A80] dark:text-[#8AA497]">Daily Measurement Structure</p>
                </div>
              </div>
            </div>

            {/* Right Column: Highlight Card */}
            <div className="lg:col-span-6">
              <div className="rounded-3xl border border-[#E0E9E2] dark:border-[#1E3E32] bg-gradient-to-br from-[#F4F7F2] via-white to-[#EAF3ED]/60 dark:from-[#12241D] dark:to-[#162E25] p-8 shadow-xl">
                <div className="flex items-center gap-3 mb-6">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#174F3D] text-white">
                    <Heart size={22} fill="white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-[#193D32] dark:text-[#F0F6F2]">
                      Your Health, Your Priority
                    </h3>
                    <p className="text-xs text-[#788A80] dark:text-[#8AA497]">
                      Built for everyday patients and practitioners
                    </p>
                  </div>
                </div>

                <ul className="space-y-3.5 text-sm text-[#193D32] dark:text-[#F0F6F2]">
                  <li className="flex items-start gap-3">
                    <CheckCircle2 size={18} className="text-[#174F3D] dark:text-[#68B18C] shrink-0 mt-0.5" />
                    <span>No medical jargon or confusing ads — pure, focused logging.</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 size={18} className="text-[#174F3D] dark:text-[#68B18C] shrink-0 mt-0.5" />
                    <span>Interactive charts show trends without exaggerated curves.</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 size={18} className="text-[#174F3D] dark:text-[#68B18C] shrink-0 mt-0.5" />
                    <span>Comprehensive reports ready for consultation with your physician.</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 size={18} className="text-[#174F3D] dark:text-[#68B18C] shrink-0 mt-0.5" />
                    <span>Seamless light & dark theme support across all device screens.</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ======================================================== */}
      {/* 6. CALL TO ACTION BANNER                                 */}
      {/* ======================================================== */}
      <section className="py-20 relative overflow-hidden bg-gradient-to-r from-[#103528] via-[#174F3D] to-[#1E6B47] text-white">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl text-white">
            Take Control of Your Glycemic Health Today
          </h2>
          <p className="mt-4 text-base sm:text-lg text-emerald-100 max-w-2xl mx-auto">
            Join users who record their glucose readings with ease, understand their trends, and take proactive steps toward wellness.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/signup"
              className="rounded-2xl bg-white px-8 py-4 text-sm sm:text-base font-bold text-[#174F3D] shadow-xl transition hover:bg-[#EAF3ED] hover:scale-105"
            >
              Start Tracking for Free
            </Link>
            <Link
              to="/login"
              className="rounded-2xl border border-white/40 bg-white/10 px-8 py-4 text-sm sm:text-base font-semibold text-white backdrop-blur-xs transition hover:bg-white/20"
            >
              Sign In to Account
            </Link>
          </div>
        </div>
      </section>

      {/* ======================================================== */}
      {/* 7. FOOTER                                                */}
      {/* ======================================================== */}
      <footer className="border-t border-[#E0E9E2] dark:border-[#1E3E32] bg-[#F4F7F2] dark:bg-[#0B1612] py-12 transition-colors">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            {/* Branding */}
            <Logo to="/" size="medium" showSubtitle={true} subtitle="Clinical Intelligence" />

            {/* Quick Links */}
            <div className="flex flex-wrap items-center justify-center gap-6 text-xs sm:text-sm font-semibold text-[#788A80] dark:text-[#8AA497]">
              <a href="#hero" className="hover:text-[#174F3D] dark:hover:text-[#F0F6F2] transition">Home</a>
              <a href="#features" className="hover:text-[#174F3D] dark:hover:text-[#F0F6F2] transition">Features</a>
              <a href="#how-it-works" className="hover:text-[#174F3D] dark:hover:text-[#F0F6F2] transition">How It Works</a>
              <a href="#about" className="hover:text-[#174F3D] dark:hover:text-[#F0F6F2] transition">About</a>
              <Link to="/login" className="hover:text-[#174F3D] dark:hover:text-[#F0F6F2] transition">Login</Link>
              <Link to="/signup" className="hover:text-[#174F3D] dark:hover:text-[#F0F6F2] transition">Sign Up</Link>
            </div>
          </div>

          <div className="mt-8 pt-8 border-t border-[#E0E9E2] dark:border-[#1E3E32] text-center text-xs text-[#788A80] dark:text-[#8AA497]">
            <p>© 2026 Sweety Glucose Tracker. All rights reserved. Clinical Intelligence.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

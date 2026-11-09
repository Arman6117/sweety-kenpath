import { useState, useEffect } from 'react';
import api from '../api/axios';
import {
  X,
  Pencil,
  Calendar,
  Clock,
  Activity,
  AlertCircle,
  ChevronDown,
  Loader2,
  CheckCircle2,
} from 'lucide-react';

const SLOT_OPTIONS = [
  { value: 'MORNING', label: 'Morning (Fasting)' },
  { value: 'AFTER_BREAKFAST', label: 'After breakfast' },
  { value: 'AFTER_LUNCH', label: 'After lunch' },
  { value: 'AFTER_DINNER', label: 'After dinner' },
];

function getTodayDateString() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function formatIsoDate(dateString) {
  if (!dateString) return '';
  return String(dateString).slice(0, 10);
}

function EditReadingModalDialog({ reading, onClose, onSave }) {
  const today = getTodayDateString();

  const [formData, setFormData] = useState({
    date: formatIsoDate(reading.date) || today,
    slot: reading.slot || 'MORNING',
    value: reading.value !== undefined && reading.value !== null ? String(reading.value) : '',
  });

  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Close modal on Escape key press (unless submitting)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && !isSubmitting) {
        onClose?.();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose, isSubmitting]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    // Clear field error as user modifies input
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

    if (!formData.date) {
      newErrors.date = 'Date is required.';
    } else if (formData.date > today) {
      newErrors.date = 'Date cannot be in the future.';
    }

    if (!formData.slot) {
      newErrors.slot = 'Please select a reading slot.';
    }

    const numValue = Number(formData.value);
    if (!formData.value || String(formData.value).trim() === '') {
      newErrors.value = 'Glucose value is required.';
    } else if (
      isNaN(numValue) ||
      !Number.isInteger(numValue) ||
      numValue < 40 ||
      numValue > 600
    ) {
      newErrors.value = 'Glucose value must be a whole number between 40 and 600.';
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

    setIsSubmitting(true);

    try {
      const payload = {
        date: formData.date,
        slot: formData.slot,
        value: parseInt(formData.value, 10),
      };

      let result;
      if (onSave) {
        result = await onSave(reading.id, payload);
      } else {
        const response = await api.put(`/api/readings/${reading.id}`, payload);
        result = response.data;
      }

      setSuccessMessage(
        result?.message || 'Glucose reading updated successfully!'
      );

      // Brief delay to display success feedback before closing
      setTimeout(() => {
        onClose?.();
      }, 700);
    } catch (err) {
      console.error('Update reading error:', err);

      const status = err.response?.status;
      const apiMessage = err.response?.data?.message;

      if (status === 400) {
        setServerError(
          apiMessage || 'Invalid glucose reading data. Please check your inputs.'
        );
      } else if (status === 401) {
        setServerError('Session expired. Please log in again.');
      } else if (status === 404) {
        setServerError(
          apiMessage || 'The reading you are trying to edit could not be found.'
        );
      } else if (status === 409) {
        setServerError(
          apiMessage || 'A reading already exists for this slot on this date.'
        );
      } else {
        setServerError(
          apiMessage ||
            err.message ||
            'Unable to update glucose reading. Please check your connection and try again.'
        );
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="edit-modal-title"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity"
        onClick={!isSubmitting ? onClose : undefined}
      />

      {/* Modal Dialog Card */}
      <div className="relative w-full max-w-lg rounded-3xl border border-slate-100 bg-white p-6 shadow-2xl sm:p-8">
        {/* Header */}
        <div className="mb-6 flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-500 text-white shadow-md shadow-emerald-100">
              <Pencil size={22} />
            </div>
            <div>
              <h2
                id="edit-modal-title"
                className="text-xl font-bold tracking-tight text-slate-900"
              >
                Edit Glucose Reading
              </h2>
              <p className="text-xs text-slate-400">
                Update your blood sugar measurement
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="rounded-xl p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 disabled:opacity-50"
            aria-label="Close dialog"
          >
            <X size={20} />
          </button>
        </div>

        {/* Success Alert Banner */}
        {successMessage && (
          <div className="mb-4 flex items-center gap-2.5 rounded-2xl border border-emerald-200 bg-emerald-50 p-3.5 text-sm font-medium text-emerald-800">
            <CheckCircle2 size={18} className="shrink-0 text-emerald-600" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Server Error Alert Banner */}
        {serverError && (
          <div className="mb-4 flex items-start gap-2.5 rounded-2xl border border-red-100 bg-red-50 p-3.5 text-sm text-red-700">
            <AlertCircle size={18} className="mt-0.5 shrink-0 text-red-600" />
            <p className="leading-5">{serverError}</p>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          {/* Date Input */}
          <div>
            <label
              htmlFor="edit-reading-date"
              className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-500"
            >
              Date
            </label>
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                <Calendar size={18} />
              </div>
              <input
                id="edit-reading-date"
                name="date"
                type="date"
                max={today}
                value={formData.date}
                onChange={handleChange}
                disabled={isSubmitting || Boolean(successMessage)}
                className={`w-full rounded-xl border bg-white py-3 pl-11 pr-4 text-sm text-slate-800 transition focus:outline-none focus:ring-2 focus:ring-emerald-500/20 disabled:bg-slate-50 ${
                  errors.date
                    ? 'border-red-300 focus:border-red-500'
                    : 'border-slate-200 focus:border-emerald-500'
                }`}
              />
            </div>
            {errors.date && (
              <div className="mt-1.5 flex items-center gap-1.5 text-xs text-red-600">
                <AlertCircle size={14} className="shrink-0" />
                <span>{errors.date}</span>
              </div>
            )}
          </div>

          {/* Reading Slot Dropdown */}
          <div>
            <label
              htmlFor="edit-reading-slot"
              className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-500"
            >
              Reading Slot
            </label>
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                <Clock size={18} />
              </div>
              <select
                id="edit-reading-slot"
                name="slot"
                value={formData.slot}
                onChange={handleChange}
                disabled={isSubmitting || Boolean(successMessage)}
                className={`w-full appearance-none rounded-xl border bg-white py-3 pl-11 pr-10 text-sm text-slate-800 transition focus:outline-none focus:ring-2 focus:ring-emerald-500/20 disabled:bg-slate-50 ${
                  errors.slot
                    ? 'border-red-300 focus:border-red-500'
                    : 'border-slate-200 focus:border-emerald-500'
                }`}
              >
                {SLOT_OPTIONS.map((slot) => (
                  <option key={slot.value} value={slot.value}>
                    {slot.label}
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3.5 text-slate-400">
                <ChevronDown size={16} />
              </div>
            </div>
            {errors.slot && (
              <div className="mt-1.5 flex items-center gap-1.5 text-xs text-red-600">
                <AlertCircle size={14} className="shrink-0" />
                <span>{errors.slot}</span>
              </div>
            )}
          </div>

          {/* Glucose Value Input */}
          <div>
            <label
              htmlFor="edit-reading-value"
              className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-500"
            >
              Glucose Level
            </label>
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                <Activity size={18} />
              </div>
              <input
                id="edit-reading-value"
                name="value"
                type="number"
                min="40"
                max="600"
                step="1"
                placeholder="e.g. 110"
                value={formData.value}
                onChange={handleChange}
                disabled={isSubmitting || Boolean(successMessage)}
                className={`w-full rounded-xl border bg-white py-3 pl-11 pr-20 text-sm text-slate-800 transition focus:outline-none focus:ring-2 focus:ring-emerald-500/20 disabled:bg-slate-50 ${
                  errors.value
                    ? 'border-red-300 focus:border-red-500'
                    : 'border-slate-200 focus:border-emerald-500'
                }`}
              />
              <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-4 text-xs font-semibold text-slate-400">
                mg/dL
              </span>
            </div>
            {errors.value && (
              <div className="mt-1.5 flex items-center gap-1.5 text-xs text-red-600">
                <AlertCircle size={14} className="shrink-0" />
                <span>{errors.value}</span>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || Boolean(successMessage)}
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>Updating...</span>
                </>
              ) : successMessage ? (
                <>
                  <CheckCircle2 size={16} />
                  <span>Updated!</span>
                </>
              ) : (
                <span>Update Reading</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function EditReadingModal({ isOpen, reading, onClose, onSave }) {
  if (!isOpen || !reading) return null;

  return (
    <EditReadingModalDialog
      reading={reading}
      onClose={onClose}
      onSave={onSave}
    />
  );
}


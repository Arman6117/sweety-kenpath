import { useState, useEffect } from 'react';
import api from '../api/axios';
import {
  X,
  Trash2,
  AlertTriangle,
  Loader2,
  CheckCircle2,
} from 'lucide-react';

const SLOT_MAP = {
  MORNING: 'Morning',
  AFTER_BREAKFAST: 'After breakfast',
  AFTER_LUNCH: 'After lunch',
  AFTER_DINNER: 'After dinner',
};

function formatReadingDate(dateString) {
  if (!dateString) return '';
  const isoDate = String(dateString).slice(0, 10);
  const [year, month, day] = isoDate.split('-').map(Number);
  if (!year || !month || !day) return dateString;

  const dateObj = new Date(Date.UTC(year, month - 1, day));
  return dateObj.toLocaleDateString('en-US', {
    month: 'short',
    day: '2-digit',
    year: 'numeric',
    timeZone: 'UTC',
  });
}

function DeleteReadingModalDialog({ reading, onClose, onDelete }) {
  const [serverError, setServerError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  // Close modal on Escape key press (unless deleting)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && !isDeleting) {
        onClose?.();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose, isDeleting]);

  const handleDelete = async () => {
    setServerError('');
    setSuccessMessage('');
    setIsDeleting(true);

    try {
      let result;
      if (onDelete) {
        result = await onDelete(reading.id);
      } else {
        const response = await api.delete(`/api/readings/${reading.id}`);
        result = response.data;
      }

      setSuccessMessage(
        result?.message || 'Glucose reading deleted successfully!'
      );

      // Brief delay to display feedback before closing
      setTimeout(() => {
        onClose?.();
      }, 600);
    } catch (err) {
      console.error('Delete reading error:', err);

      const status = err.response?.status;
      const apiMessage = err.response?.data?.message;

      if (status === 401) {
        setServerError('Session expired. Please log in again.');
      } else if (status === 404) {
        setServerError(
          apiMessage || 'This reading no longer exists or has already been deleted.'
        );
      } else {
        setServerError(
          apiMessage ||
          err.message ||
          'Unable to delete glucose reading. Please check your connection and try again.'
        );
      }
    } finally {
      setIsDeleting(false);
    }
  };

  const slotLabel = SLOT_MAP[reading.slot] || reading.slot;
  const formattedDate = formatReadingDate(reading.date);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="delete-modal-title"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity"
        onClick={!isDeleting ? onClose : undefined}
      />

      {/* Modal Dialog Card */}
      <div className="relative w-full max-w-md rounded-3xl border border-slate-100 bg-white p-6 shadow-2xl sm:p-7">
        {/* Header */}
        <div className="mb-5 flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-red-50 text-red-600 shadow-sm">
              <AlertTriangle size={22} />
            </div>
            <div>
              <h2
                id="delete-modal-title"
                className="text-lg font-bold tracking-tight text-slate-900"
              >
                Delete Reading
              </h2>
              <p className="text-xs text-slate-400">
                This action cannot be undone
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
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
            <AlertTriangle size={18} className="mt-0.5 shrink-0 text-red-600" />
            <p className="leading-5">{serverError}</p>
          </div>
        )}

        {/* Reading Details Box */}
        <div className="mb-6 rounded-2xl border border-slate-100 bg-slate-50 p-4">
          <p className="text-xs text-slate-500">
            Are you sure you want to permanently delete this reading?
          </p>
          <div className="mt-3 flex items-center justify-between border-t border-slate-200/60 pt-3 text-xs">
            <div>
              <span className="font-semibold text-slate-800">{formattedDate}</span>
              <span className="mx-1.5 text-slate-300">•</span>
              <span className="text-slate-600">{slotLabel}</span>
            </div>
            <span className="rounded-lg bg-white px-2.5 py-1 font-bold text-slate-800 shadow-sm">
              {reading.value} mg/dL
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleDelete}
            disabled={isDeleting || Boolean(successMessage)}
            className="flex items-center gap-2 rounded-xl bg-red-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isDeleting ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                <span>Deleting...</span>
              </>
            ) : (
              <>
                <Trash2 size={16} />
                <span>Delete Reading</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function DeleteReadingModal({ isOpen, reading, onClose, onDelete }) {
  if (!isOpen || !reading) return null;

  return (
    <DeleteReadingModalDialog
      reading={reading}
      onClose={onClose}
      onDelete={onDelete}
    />
  );
}

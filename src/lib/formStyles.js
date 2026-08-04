// Shared Tailwind classes for the plain text/email/tel/select inputs used
// across the checkout and account forms, so the focus/error styling only
// needs to change in one place.
const BASE = 'w-full bg-slate-50 border rounded-xl p-3 text-sm outline-none transition-all';
const ERROR_STATE = 'border-red-400 ring-1 ring-red-400 bg-red-50/30';
const NORMAL_STATE = 'border-transparent focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:shadow-soft hover:bg-slate-100';

// `extra` appends any field-specific classes (e.g. 'pr-10' for a field with a
// trailing icon button, or 'appearance-none cursor-pointer' for a <select>).
export function fieldClass(hasError, extra = '') {
  return [BASE, hasError ? ERROR_STATE : NORMAL_STATE, extra].filter(Boolean).join(' ');
}

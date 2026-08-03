import { describe, it, expect } from 'vitest';
import { fieldClass } from './formStyles';

describe('fieldClass', () => {
  it('applies the normal (non-error) state by default', () => {
    expect(fieldClass(false)).toBe(
      'w-full bg-slate-50 border rounded-xl p-3 text-sm outline-none transition-all border-transparent focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:shadow-soft hover:bg-slate-100'
    );
  });

  it('applies the error state when hasError is true', () => {
    const result = fieldClass(true);
    expect(result).toContain('border-red-400 ring-1 ring-red-400 bg-red-50/30');
    expect(result).not.toContain('focus:ring-indigo-500');
  });

  it('appends extra classes when provided', () => {
    expect(fieldClass(false, 'pr-10')).toContain('pr-10');
    expect(fieldClass(true, 'appearance-none cursor-pointer')).toContain('appearance-none cursor-pointer');
  });

  it('omits the extra segment when not provided', () => {
    expect(fieldClass(false).trim().endsWith('hover:bg-slate-100')).toBe(true);
  });
});

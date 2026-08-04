import { describe, it, expect, vi, beforeEach } from 'vitest';

const { fromMock, rpcMock } = vi.hoisted(() => ({
  fromMock: vi.fn(),
  rpcMock: vi.fn(),
}));

vi.mock('./supabase', () => ({
  supabase: { from: fromMock, rpc: rpcMock },
}));

import {
  getMyCauses,
  saveMyCauses,
  submitCauseRequest,
  getPendingCauses,
  setPendingCauses,
  clearPendingCauses,
  applyPendingCauses,
} from './charities';

const PENDING_KEY = 'amplify_pending_causes';

beforeEach(() => {
  fromMock.mockReset();
  rpcMock.mockReset();
  localStorage.clear();
});

describe('getMyCauses', () => {
  it('returns the ordered list of org slugs', async () => {
    const order = vi.fn().mockResolvedValue({ data: [{ org_slug: 'a' }, { org_slug: 'b' }], error: null });
    const select = vi.fn(() => ({ order }));
    fromMock.mockReturnValue({ select });

    const result = await getMyCauses();

    expect(fromMock).toHaveBeenCalledWith('member_causes');
    expect(select).toHaveBeenCalledWith('org_slug');
    expect(order).toHaveBeenCalledWith('rank', { ascending: true });
    expect(result).toEqual(['a', 'b']);
  });

  it('returns an empty array when there is no data', async () => {
    const order = vi.fn().mockResolvedValue({ data: null, error: null });
    fromMock.mockReturnValue({ select: vi.fn(() => ({ order })) });

    expect(await getMyCauses()).toEqual([]);
  });

  it('throws when the query errors', async () => {
    const order = vi.fn().mockResolvedValue({ data: null, error: new Error('boom') });
    fromMock.mockReturnValue({ select: vi.fn(() => ({ order })) });

    await expect(getMyCauses()).rejects.toThrow('boom');
  });
});

describe('saveMyCauses', () => {
  it('calls the set_my_causes RPC with the given slugs', async () => {
    rpcMock.mockResolvedValue({ error: null });

    await saveMyCauses(['a', 'b', 'c']);

    expect(rpcMock).toHaveBeenCalledWith('set_my_causes', { p_slugs: ['a', 'b', 'c'] });
  });

  it('throws when the RPC errors', async () => {
    rpcMock.mockResolvedValue({ error: new Error('rpc failed') });

    await expect(saveMyCauses(['a'])).rejects.toThrow('rpc failed');
  });
});

describe('submitCauseRequest', () => {
  it('calls the request_cause RPC with the given fields', async () => {
    rpcMock.mockResolvedValue({ error: null });

    await submitCauseRequest({ name: 'Acme', url: 'https://acme.org', note: 'great org' });

    expect(rpcMock).toHaveBeenCalledWith('request_cause', {
      p_org_name: 'Acme',
      p_org_url: 'https://acme.org',
      p_note: 'great org',
    });
  });

  it('defaults note to null when omitted', async () => {
    rpcMock.mockResolvedValue({ error: null });

    await submitCauseRequest({ name: 'Acme', url: 'https://acme.org' });

    expect(rpcMock).toHaveBeenCalledWith('request_cause', {
      p_org_name: 'Acme',
      p_org_url: 'https://acme.org',
      p_note: null,
    });
  });

  it('throws when the RPC errors', async () => {
    rpcMock.mockResolvedValue({ error: new Error('rejected') });

    await expect(submitCauseRequest({ name: 'Acme', url: 'https://acme.org' })).rejects.toThrow('rejected');
  });
});

describe('pending causes (localStorage bridge)', () => {
  it('round-trips through set/get', () => {
    setPendingCauses(['x', 'y']);
    expect(getPendingCauses()).toEqual(['x', 'y']);
  });

  it('returns null when nothing is stored', () => {
    expect(getPendingCauses()).toBeNull();
  });

  it('returns null for malformed stored data', () => {
    localStorage.setItem(PENDING_KEY, 'not json');
    expect(getPendingCauses()).toBeNull();
  });

  it('returns null when stored data is not an array', () => {
    localStorage.setItem(PENDING_KEY, JSON.stringify({ not: 'an array' }));
    expect(getPendingCauses()).toBeNull();
  });

  it('clears the stored selection', () => {
    setPendingCauses(['x']);
    clearPendingCauses();
    expect(getPendingCauses()).toBeNull();
  });
});

describe('applyPendingCauses', () => {
  it('does nothing and returns null when there is no pending selection', async () => {
    const result = await applyPendingCauses();
    expect(result).toBeNull();
    expect(rpcMock).not.toHaveBeenCalled();
  });

  it('does nothing and returns null when the pending selection is empty', async () => {
    setPendingCauses([]);
    const result = await applyPendingCauses();
    expect(result).toBeNull();
    expect(rpcMock).not.toHaveBeenCalled();
  });

  it('saves the pending selection and clears it on success', async () => {
    rpcMock.mockResolvedValue({ error: null });
    setPendingCauses(['a', 'b']);

    const result = await applyPendingCauses();

    expect(rpcMock).toHaveBeenCalledWith('set_my_causes', { p_slugs: ['a', 'b'] });
    expect(result).toEqual(['a', 'b']);
    expect(getPendingCauses()).toBeNull();
  });

  it('leaves the pending selection in place if saving fails', async () => {
    rpcMock.mockResolvedValue({ error: new Error('offline') });
    setPendingCauses(['a', 'b']);

    await expect(applyPendingCauses()).rejects.toThrow('offline');
    expect(getPendingCauses()).toEqual(['a', 'b']);
  });
});

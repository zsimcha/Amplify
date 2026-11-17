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
  saveCheckoutCauses,
} from './charities';

beforeEach(() => {
  fromMock.mockReset();
  rpcMock.mockReset();
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

describe('saveCheckoutCauses', () => {
  it('sends the selection with the checkout token and reports whether it applied', async () => {
    rpcMock.mockResolvedValue({ data: { applied: false }, error: null });

    const result = await saveCheckoutCauses({ subscriptionId: 25, token: 'tok', slugs: ['aish'] });

    expect(rpcMock).toHaveBeenCalledWith('set_checkout_causes', {
      p_subscription_id: 25,
      p_token: 'tok',
      p_slugs: ['aish'],
    });
    expect(result).toEqual({ applied: false });
  });

  it('reports applied when the account was already confirmed', async () => {
    rpcMock.mockResolvedValue({ data: { applied: true }, error: null });
    expect(await saveCheckoutCauses({ subscriptionId: 25, token: 'tok', slugs: [] })).toEqual({ applied: true });
  });

  it('throws when the RPC errors (e.g. an expired token)', async () => {
    rpcMock.mockResolvedValue({ data: null, error: new Error('expired') });
    await expect(saveCheckoutCauses({ subscriptionId: 25, token: 'tok', slugs: ['aish'] })).rejects.toThrow('expired');
  });
});

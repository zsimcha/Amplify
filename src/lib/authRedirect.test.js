import { describe, it, expect } from 'vitest';
import { parseAuthRedirectError } from './authRedirect';

describe('parseAuthRedirectError', () => {
  it('reads an expired-link error from the URL fragment', () => {
    expect(parseAuthRedirectError({
      hash: '#error=access_denied&error_code=otp_expired&error_description=Email+link+is+invalid+or+has+expired',
      search: '',
    })).toEqual({ code: 'otp_expired', description: 'Email link is invalid or has expired' });
  });

  it('reads an error from the query string', () => {
    expect(parseAuthRedirectError({ hash: '', search: '?error=server_error&error_description=Oops' }))
      .toEqual({ code: 'server_error', description: 'Oops' });
  });

  it('returns null for a successful session redirect', () => {
    expect(parseAuthRedirectError({ hash: '#access_token=abc&type=signup', search: '' })).toBeNull();
  });

  it('returns null for a plain URL', () => {
    expect(parseAuthRedirectError({ hash: '', search: '' })).toBeNull();
    expect(parseAuthRedirectError()).toBeNull();
  });
});

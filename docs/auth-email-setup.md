# Auth email setup (Supabase)

These three settings live only in the **Supabase dashboard** — they can't be set
from code or migrations. Doing all three makes the confirmation and
password-reset emails come from an Amplify address, look branded, and — most
importantly — makes their links actually work.

Project: **Backend** (`gloncuhgefzrpuwbzoke`).

---

## 1. Fix the broken "localhost refused to connect" links  ← do this first

The links break because the confirmation/reset URLs are built from the project's
**Site URL**, which is still the default `http://localhost:3000`. So every link
points at localhost.

**Dashboard → Authentication → URL Configuration**

- **Site URL**: set to your production domain, e.g. `https://amplifygive.com`
- **Redirect URLs**: add every origin the app runs on (one per line):
  - `https://amplifygive.com/**`
  - your Vercel preview domain, e.g. `https://*.vercel.app/**` (so you can test
    on PR previews)
  - `http://localhost:5173/**` (optional, local dev only)

The app already requests `/<origin>/reset-password` and `/<origin>/account` as
redirect targets, so those just need to be covered by the patterns above.

Once Site URL is a real domain, the confirm + reset links work.

---

## 2. Send from an Amplify address (Support@AmplifyGive.com)

By default Supabase sends auth mail from its own shared address (and rate-limits
it hard). To send from `Support@AmplifyGive.com`, point Supabase at **Resend** —
the same provider the `send-welcome-email` function already uses with the
verified `amplifygive.com` domain.

**Dashboard → Authentication → Emails → SMTP Settings → Enable Custom SMTP**

| Field | Value |
|---|---|
| Host | `smtp.resend.com` |
| Port | `465` |
| Username | `resend` |
| Password | your Resend API key (same one in the `RESEND_API_KEY` secret) |
| Sender email | `Support@AmplifyGive.com` |
| Sender name | `Amplify` |

Make sure `Support@AmplifyGive.com` is allowed to send under your verified Resend
domain. Since `amplifygive.com` is already verified, this works out of the box.

---

## 3. Brand the email bodies

**Dashboard → Authentication → Emails → Templates**

Supabase templates support these variables — keep `{{ .ConfirmationURL }}`
exactly as-is; it's the working link.

### "Confirm signup"

Subject: `Confirm your Amplify account`

```html
<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px; background-color: #f8fafc;">
  <div style="background-color: #ffffff; padding: 40px; border-radius: 24px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); border: 1px solid #f1f5f9;">
    <div style="text-align: center; margin-bottom: 32px;">
      <img src="https://amplifygive.com/amplify-logo.png" alt="Amplify" style="max-height: 60px; height: auto; width: auto; display: inline-block;" />
    </div>
    <h1 style="color: #1e1b4b; font-size: 28px; font-weight: 900; margin-bottom: 24px; text-transform: uppercase; font-style: italic; text-align: center;">
      Confirm your account
    </h1>
    <p style="color: #475569; font-size: 16px; line-height: 1.6; margin-bottom: 24px;">
      Welcome to <strong>Amplify</strong>. Confirm your email address to activate your account and manage your membership, receipts, and payment details anytime.
    </p>
    <div style="text-align: center; margin: 32px 0;">
      <a href="{{ .ConfirmationURL }}" style="background-color: #312e81; color: #ffffff; text-decoration: none; padding: 16px 40px; border-radius: 12px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; font-size: 14px; display: inline-block;">
        Confirm My Account
      </a>
    </div>
    <p style="color: #94a3b8; font-size: 12px; line-height: 1.6; margin-bottom: 24px;">
      If the button doesn't work, copy and paste this link into your browser:<br/>
      <a href="{{ .ConfirmationURL }}" style="color: #6366f1; word-break: break-all;">{{ .ConfirmationURL }}</a>
    </p>
    <hr style="border: none; border-top: 1px solid #e2e8f0; margin-bottom: 24px;" />
    <p style="color: #94a3b8; font-size: 11px; text-align: center; line-height: 1.5; margin: 0;">
      You're receiving this because someone signed up for Amplify with this email. If that wasn't you, you can safely ignore it.<br/>
      &copy; 2026 Amplify. All rights reserved.
    </p>
  </div>
</div>
```

### "Reset password"

Subject: `Reset your Amplify password`

```html
<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px; background-color: #f8fafc;">
  <div style="background-color: #ffffff; padding: 40px; border-radius: 24px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); border: 1px solid #f1f5f9;">
    <div style="text-align: center; margin-bottom: 32px;">
      <img src="https://amplifygive.com/amplify-logo.png" alt="Amplify" style="max-height: 60px; height: auto; width: auto; display: inline-block;" />
    </div>
    <h1 style="color: #1e1b4b; font-size: 28px; font-weight: 900; margin-bottom: 24px; text-transform: uppercase; font-style: italic; text-align: center;">
      Reset your password
    </h1>
    <p style="color: #475569; font-size: 16px; line-height: 1.6; margin-bottom: 24px;">
      We received a request to reset the password for your <strong>Amplify</strong> account. Click below to choose a new one. This link expires shortly for your security.
    </p>
    <div style="text-align: center; margin: 32px 0;">
      <a href="{{ .ConfirmationURL }}" style="background-color: #312e81; color: #ffffff; text-decoration: none; padding: 16px 40px; border-radius: 12px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; font-size: 14px; display: inline-block;">
        Reset My Password
      </a>
    </div>
    <p style="color: #94a3b8; font-size: 12px; line-height: 1.6; margin-bottom: 24px;">
      If the button doesn't work, copy and paste this link into your browser:<br/>
      <a href="{{ .ConfirmationURL }}" style="color: #6366f1; word-break: break-all;">{{ .ConfirmationURL }}</a>
    </p>
    <hr style="border: none; border-top: 1px solid #e2e8f0; margin-bottom: 24px;" />
    <p style="color: #94a3b8; font-size: 11px; text-align: center; line-height: 1.5; margin: 0;">
      If you didn't request this, you can safely ignore this email — your password won't change.<br/>
      &copy; 2026 Amplify. All rights reserved.
    </p>
  </div>
</div>
```

> Note: the logo `src` points at `https://amplifygive.com/amplify-logo.png`, the
> same asset the welcome email uses. If that path 404s, swap in the correct
> hosted logo URL.

---

## Alternative: full code control via a Send Email auth hook

If you'd rather have every auth email rendered and sent by our own code (from
`Support@AmplifyGive.com` via Resend, matching `send-welcome-email`) instead of
Supabase templates, we can add a **Send Email** auth hook edge function. It's
more moving parts (an edge function + enabling the hook + a hook secret), but it
keeps all email content in the repo. Ask and we'll wire it up.

// supabase/functions/send-auth-email/index.ts
//
// Supabase "Send Email" auth hook. When enabled, Supabase stops sending its
// own auth emails and POSTs here instead, letting us render + send them from
// an Amplify address via Resend (the same provider send-welcome-email uses).
//
// Handles: signup confirmation, password recovery, magic link, email change,
// and reauthentication OTP.
//
// ── Activation (one-time, in the Supabase dashboard) ────────────────────────
//   1. Authentication → Hooks → "Send Email" hook → enable, point at this
//      function (https://<ref>.supabase.co/functions/v1/send-auth-email),
//      and generate the signing secret.
//   2. Set the function secrets (Edge Functions → Secrets, or CLI
//      `supabase secrets set`):
//        RESEND_API_KEY          – already set for send-welcome-email
//        SEND_EMAIL_HOOK_SECRET  – the "v1,whsec_..." secret from step 1
//   3. Authentication → URL Configuration: set Site URL to the production
//      domain and add the app origins to Redirect URLs, so the redirect_to
//      target after verification is allowed (e.g. https://amplifygive.com/**
//      and the Vercel preview domain). The link itself lives on supabase.co
//      and works regardless, but the post-verify redirect must be allowlisted.
//
// Deployed with verify_jwt = false: auth hooks authenticate with a Standard
// Webhooks signature (verified below), not a user JWT.

import { Webhook } from "https://esm.sh/standardwebhooks@1.0.0";
import { Resend } from "https://esm.sh/resend@3.2.0";

const FROM = "Amplify <Support@AmplifyGive.com>";
const LOGO_URL = "https://amplifygive.com/amplify-logo.png";
const YEAR = new Date().getFullYear();

// Escapes the four characters that let a string become live HTML.
const esc = (s: unknown) => String(s ?? "")
  .replace(/&/g, "&amp;")
  .replace(/</g, "&lt;")
  .replace(/>/g, "&gt;")
  .replace(/"/g, "&quot;");

type EmailData = {
  token: string;
  token_hash: string;
  token_new: string;
  token_hash_new: string;
  redirect_to: string;
  email_action_type: string;
  site_url: string;
  old_email?: string;
};

// The verification link lives on the Supabase Auth server (always reachable);
// after verifying the token it redirects the user to redirect_to.
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const buildConfirmationURL = (d: EmailData, tokenHash: string) => {
  const params = new URLSearchParams({
    token: tokenHash,
    type: d.email_action_type,
    redirect_to: d.redirect_to,
  });
  return `${SUPABASE_URL}/auth/v1/verify?${params.toString()}`;
};

// Branded shell shared by every message, mirroring send-welcome-email.
const shell = (opts: {
  heading: string;
  bodyHtml: string;
  footerNote: string;
}) => `
  <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px; background-color: #f8fafc;">
    <div style="background-color: #ffffff; padding: 40px; border-radius: 24px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); border: 1px solid #f1f5f9;">
      <div style="text-align: center; margin-bottom: 32px;">
        <img src="${LOGO_URL}" alt="Amplify" style="max-height: 60px; height: auto; width: auto; display: inline-block;" />
      </div>
      <h1 style="color: #1e1b4b; font-size: 28px; font-weight: 900; margin-bottom: 24px; text-transform: uppercase; font-style: italic; text-align: center;">
        ${opts.heading}
      </h1>
      ${opts.bodyHtml}
      <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 8px 0 24px;" />
      <p style="color: #94a3b8; font-size: 11px; text-align: center; line-height: 1.5; margin: 0;">
        ${opts.footerNote}<br/>
        &copy; ${YEAR} Amplify. All rights reserved.
      </p>
    </div>
  </div>
`;

const button = (url: string, label: string) => `
  <div style="text-align: center; margin: 32px 0;">
    <a href="${url}" style="background-color: #312e81; color: #ffffff; text-decoration: none; padding: 16px 40px; border-radius: 12px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; font-size: 14px; display: inline-block;">
      ${label}
    </a>
  </div>
  <p style="color: #94a3b8; font-size: 12px; line-height: 1.6; margin-bottom: 24px;">
    If the button doesn't work, copy and paste this link into your browser:<br/>
    <a href="${url}" style="color: #6366f1; word-break: break-all;">${url}</a>
  </p>
`;

const para = (html: string) =>
  `<p style="color: #475569; font-size: 16px; line-height: 1.6; margin-bottom: 24px;">${html}</p>`;

const otpBlock = (token: string) => `
  <div style="background-color: #f8fafc; padding: 24px; border-radius: 16px; text-align: center; margin: 8px 0 30px; border: 1px solid #e2e8f0;">
    <p style="color: #64748b; font-size: 12px; font-weight: bold; text-transform: uppercase; letter-spacing: 2px; margin: 0 0 8px 0;">Your Code</p>
    <p style="color: #1e1b4b; font-size: 32px; font-weight: 900; letter-spacing: 6px; margin: 0;">${esc(token)}</p>
  </div>
`;

// Returns { subject, html } for the given auth email event.
function renderMessage(d: EmailData) {
  switch (d.email_action_type) {
    case "signup":
      return {
        subject: "Confirm your Amplify account",
        html: shell({
          heading: "Confirm your account",
          bodyHtml:
            para("Welcome to <strong>Amplify</strong>. Confirm your email address to activate your account and manage your membership, receipts, and payment details anytime.") +
            button(buildConfirmationURL(d, d.token_hash), "Confirm My Account"),
          footerNote: "You're receiving this because someone signed up for Amplify with this email. If that wasn't you, you can safely ignore it.",
        }),
      };

    case "recovery":
      return {
        subject: "Reset your Amplify password",
        html: shell({
          heading: "Reset your password",
          bodyHtml:
            para("We received a request to reset the password for your <strong>Amplify</strong> account. Click below to choose a new one. This link expires shortly for your security.") +
            button(buildConfirmationURL(d, d.token_hash), "Reset My Password"),
          footerNote: "If you didn't request this, you can safely ignore this email — your password won't change.",
        }),
      };

    case "magiclink":
      return {
        subject: "Your Amplify sign-in link",
        html: shell({
          heading: "Sign in to Amplify",
          bodyHtml:
            para("Click below to sign in to your <strong>Amplify</strong> account. This link expires shortly for your security.") +
            button(buildConfirmationURL(d, d.token_hash), "Sign In"),
          footerNote: "If you didn't request this, you can safely ignore this email.",
        }),
      };

    // Secure email change sends one message per address. The message to the
    // NEW address carries token_hash_new; the one to the current address
    // carries token_hash. Fall back to token_hash when the new hash is absent.
    case "email_change":
    case "email_change_new":
    case "email_change_current": {
      const tokenHash = d.token_hash_new || d.token_hash;
      return {
        subject: "Confirm your new Amplify email",
        html: shell({
          heading: "Confirm your email change",
          bodyHtml:
            para("Confirm this email address to finish updating the address on your <strong>Amplify</strong> account.") +
            button(buildConfirmationURL(d, tokenHash), "Confirm Email Change"),
          footerNote: "If you didn't request this change, please contact us at Support@AmplifyGive.com right away.",
        }),
      };
    }

    case "reauthentication":
      return {
        subject: "Your Amplify verification code",
        html: shell({
          heading: "Verify it's you",
          bodyHtml:
            para("Use the code below to verify your identity. It expires shortly.") +
            otpBlock(d.token),
          footerNote: "If you didn't request this, you can safely ignore this email.",
        }),
      };

    default:
      return {
        subject: "Amplify account notification",
        html: shell({
          heading: "Account notification",
          bodyHtml:
            para("There's an action pending on your <strong>Amplify</strong> account.") +
            button(buildConfirmationURL(d, d.token_hash), "Continue"),
          footerNote: "If you didn't request this, you can safely ignore this email.",
        }),
      };
  }
}

const resend = new Resend(Deno.env.get("RESEND_API_KEY") as string);
const rawHookSecret = Deno.env.get("SEND_EMAIL_HOOK_SECRET") ?? "";
const hookSecret = rawHookSecret.replace("v1,whsec_", "");

Deno.serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("not allowed", { status: 405 });
  }

  const payload = await req.text();
  const headers = Object.fromEntries(req.headers);

  let user: { email: string };
  let email_data: EmailData;
  try {
    if (!hookSecret) throw new Error("SEND_EMAIL_HOOK_SECRET is not configured.");
    const wh = new Webhook(hookSecret);
    const verified = wh.verify(payload, headers) as { user: typeof user; email_data: EmailData };
    user = verified.user;
    email_data = verified.email_data;
  } catch (error) {
    // Reject unsigned/invalid calls — this is the auth boundary.
    return new Response(
      JSON.stringify({ error: { http_code: 401, message: (error as Error).message } }),
      { status: 401, headers: { "Content-Type": "application/json" } },
    );
  }

  try {
    const { subject, html } = renderMessage(email_data);
    const { error } = await resend.emails.send({ from: FROM, to: [user.email], subject, html });
    if (error) throw error;
  } catch (error) {
    // Surface send failures to GoTrue so it can retry / show an error.
    return new Response(
      JSON.stringify({ error: { http_code: 500, message: (error as Error).message } }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }

  return new Response(JSON.stringify({}), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
});

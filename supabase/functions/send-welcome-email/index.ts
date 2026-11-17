// supabase/functions/send-welcome-email/index.ts
//
// Called by the database (pg_net) when a membership is created, and again by
// the retry_welcome_emails() cron job for any active membership whose email
// hasn't been confirmed as sent. Each call:
//   1. checks the row's welcome_email_sent_at and skips it if already sent,
//   2. sends through Resend with an Idempotency-Key, so a retry of a send that
//      actually went through can't produce a second email,
//   3. stamps welcome_email_sent_at once Resend accepts the message.
// A failure returns a non-2xx status and leaves the row unstamped, which is
// what the retry job looks for.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3"

// Escapes the four characters that let a string become live HTML.
// Always returns a string, even for null/undefined input.
const esc = (s: string) => String(s ?? "")
  .replace(/&/g, "&amp;")
  .replace(/</g, "&lt;")
  .replace(/>/g, "&gt;")
  .replace(/"/g, "&quot;");

// Constant-time comparison, so response timing can't be used to guess the
// shared secret one character at a time.
const secretsMatch = (provided: string | null, expected: string) => {
  const a = new TextEncoder().encode(provided ?? "");
  const b = new TextEncoder().encode(expected);
  let diff = a.length ^ b.length;
  for (let i = 0; i < b.length; i++) diff |= (a[i] ?? 0) ^ b[i];
  return diff === 0;
};

Deno.serve(async (req) => {
  // Reject anything that doesn't carry our shared secret
  const expectedSecret = Deno.env.get("WELCOME_HOOK_SECRET");
  const providedSecret = req.headers.get("x-webhook-secret");
  if (!expectedSecret || !secretsMatch(providedSecret, expectedSecret)) {
    console.log("Unauthorized webhook call");
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    // 1. Load Environment Variables
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!resendApiKey) throw new Error("RESEND_API_KEY is missing.");
    if (!supabaseUrl || !supabaseKey) throw new Error("Supabase environment variables missing.");

    // 2. Initialize Client
    const supabase = createClient(supabaseUrl, supabaseKey);

    // 3. Parse Webhook Payload, then read the row's current state: the payload
    // may be a snapshot from a retry, and the row is the source of truth for
    // whether this email already went out.
    const payload = await req.json();
    const subscriptionId = payload?.record?.id;
    if (!subscriptionId) {
      throw new Error("No subscription id found in payload.");
    }

    const { data: row, error: rowError } = await supabase
      .from('Subscriptions')
      .select('id, email, "full name", tier, community_id, status, welcome_email_sent_at')
      .eq('id', subscriptionId)
      .maybeSingle();
    if (rowError) throw new Error(`Could not load subscription ${subscriptionId}: ${rowError.message}`);
    if (!row) {
      return new Response(JSON.stringify({ skipped: "subscription not found" }), {
        headers: { "Content-Type": "application/json" },
        status: 200,
      });
    }
    if (row.welcome_email_sent_at) {
      return new Response(JSON.stringify({ skipped: "already sent" }), {
        headers: { "Content-Type": "application/json" },
        status: 200,
      });
    }

    const email = row.email;
    const fullName = row['full name'];
    const tier = row.tier?.toLowerCase() || 'silver'; // Default to silver if missing
    const communityId = row.community_id;

    if (!email) {
      throw new Error("No email found for subscription.");
    }

    // "Your monthly contribution has been secured" is only true of an active
    // membership. Once billing goes live, rows that are inserted before
    // payment clears must not trigger this email.
    if (row.status !== 'active') {
      return new Response(JSON.stringify({ skipped: "not active" }), {
        headers: { "Content-Type": "application/json" },
        status: 200,
      });
    }

    // 4. Fetch Community Name
    let communityName = "Amplify"; // Fallback name
    if (communityId) {
      const { data, error } = await supabase
        .from('communities')
        .select('name')
        .eq('id', communityId)
        .single();

      if (data?.name) {
        communityName = data.name;
      } else if (error) {
        console.error("Error fetching community name:", error);
      }
    }

    // 5. Define Tier Rewards
    const tierData = {
      silver: { prize: '$25,000', odds: '1/100', price: '$250' },
      gold: { prize: '$50,000', odds: '1/50', price: '$500' },
      diamond: { prize: '$100,000', odds: '1/25', price: '$1,000' }
    };
    // Ensure we have valid data even if a weird tier string comes through
    const currentTierDetails = tierData[tier as keyof typeof tierData] || tierData.silver;

    // 6. Send Email
    const message = {
      from: 'Simcha from Amplify <simcha@amplifygive.com>',
      to: [email],
      subject: 'Welcome to the Circle!',
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px; background-color: #f8fafc;">

          <div style="background-color: #ffffff; padding: 40px; border-radius: 24px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); border: 1px solid #f1f5f9;">

            <div style="text-align: center; margin-bottom: 32px;">
              <img src="https://amplifygive.com/amplify-logo.png" alt="Amplify Logo" style="max-height: 60px; height: auto; width: auto; display: inline-block;" />
            </div>

            <h1 style="color: #1e1b4b; font-size: 28px; font-weight: 900; margin-bottom: 24px; text-transform: uppercase; font-style: italic; text-align: center;">
              You're in the Circle.
            </h1>

            <p style="color: #475569; font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
              Hi <strong>${esc(fullName) || 'there'}</strong>,
            </p>

            <p style="color: #475569; font-size: 16px; line-height: 1.6; margin-bottom: 30px;">
              Thank you for joining Amplify. Your monthly contribution has been secured, and your impact starts today. By combining our giving, we are capable of issuing transformational grants to organizations that need it most.
            </p>

            <div style="background-color: #f8fafc; padding: 24px; border-radius: 16px; margin-bottom: 30px; border: 1px solid #e2e8f0;">
              <p style="color: #64748b; font-size: 12px; font-weight: bold; text-transform: uppercase; letter-spacing: 2px; margin: 0 0 16px 0;">Your Circle Details</p>

              <table style="width: 100%; border-collapse: collapse; font-size: 15px;">
                <tr>
                  <td style="padding: 10px 0; border-bottom: 1px solid #e2e8f0; color: #475569; font-weight: 500;">Community</td>
                  <td style="padding: 10px 0; border-bottom: 1px solid #e2e8f0; color: #1e293b; font-weight: 700; text-align: right;">${esc(communityName)}</td>
                </tr>
                <tr>
                  <td style="padding: 10px 0; border-bottom: 1px solid #e2e8f0; color: #475569; font-weight: 500;">Impact Tier</td>
                  <td style="padding: 10px 0; border-bottom: 1px solid #e2e8f0; color: #1e293b; font-weight: 700; text-align: right; text-transform: capitalize;">${esc(tier)}</td>
                </tr>
                <tr>
                  <td style="padding: 10px 0; border-bottom: 1px solid #e2e8f0; color: #475569; font-weight: 500;">Monthly Grand Prize</td>
                  <td style="padding: 10px 0; border-bottom: 1px solid #e2e8f0; color: #1e293b; font-weight: 700; text-align: right;">${currentTierDetails.prize}</td>
                </tr>
                <tr>
                  <td style="padding: 10px 0; color: #475569; font-weight: 500;">Winning Odds</td>
                  <td style="padding: 10px 0; color: #1e293b; font-weight: 700; text-align: right;">Up to ${currentTierDetails.odds}*</td>
                </tr>
              </table>
            </div>

            <div style="background-color: #f8fafc; padding: 24px; border-radius: 16px; text-align: center; margin-bottom: 30px; border: 1px solid #e2e8f0;">
              <p style="color: #64748b; font-size: 12px; font-weight: bold; text-transform: uppercase; letter-spacing: 2px; margin: 0 0 8px 0;">What happens next?</p>
              <p style="color: #1e293b; font-size: 16px; font-weight: 600; margin: 0; line-height: 1.5;">
                The drawing activates the moment your circle reaches 400 members.
                <span style="display: block; margin-top: 8px; font-weight: 400; color: #475569; font-size: 14px;">
                  We'll email you the moment your circle fills!
                </span>
              </p>
            </div>

            <p style="color: #64748b; font-size: 13px; text-align: center; line-height: 1.6; margin: 0 0 24px 0;">
              <span style="text-transform: capitalize;">${esc(tier)}</span> Circle &middot; ${currentTierDetails.price}/month. Charged today, then monthly once your circle fills. Cancel anytime at <a href="https://amplifygive.com/account" style="color: #64748b; text-decoration: underline;">amplifygive.com/account</a>.
            </p>

            <hr style="border: none; border-top: 1px solid #e2e8f0; margin-bottom: 24px;" />

            <p style="color: #94a3b8; font-size: 11px; text-align: center; line-height: 1.5; margin: 0 0 12px 0;">
              * Actual odds of winning depend on the total number of eligible entries received in your active circle. See <a href="https://amplifygive.com/rules" style="color: #94a3b8; text-decoration: underline;">official rules</a> for details.
            </p>

            <p style="color: #94a3b8; font-size: 11px; text-align: center; line-height: 1.5; margin: 0;">
              You are receiving this email because you signed up for an Amplify membership.<br/>
              &copy; ${new Date().getFullYear()} Amplify. All rights reserved.
            </p>
          </div>
        </div>
      `,
    };

    const sendResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
        // Resend returns the original result instead of sending again when the
        // same key is reused within 24 hours.
        "Idempotency-Key": `welcome-email-${row.id}`,
      },
      body: JSON.stringify(message),
    });
    const sendResult = await sendResponse.json().catch(() => ({}));
    if (!sendResponse.ok) {
      throw new Error(`Resend rejected the welcome email (${sendResponse.status}): ${JSON.stringify(sendResult)}`);
    }

    // 7. Record the send. If this update fails the email still went out; the
    // idempotency key keeps a retry within 24h from sending it twice.
    const { error: stampError } = await supabase
      .from('Subscriptions')
      .update({ welcome_email_sent_at: new Date().toISOString() })
      .eq('id', row.id);
    if (stampError) console.error("Sent, but could not record welcome_email_sent_at:", stampError.message);

    return new Response(JSON.stringify(sendResult), {
      headers: { "Content-Type": "application/json" },
      status: 200,
    })
  } catch (error) {
    console.error("Welcome email failed:", (error as Error).message);
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      headers: { "Content-Type": "application/json" },
      status: 500,
    })
  }
})
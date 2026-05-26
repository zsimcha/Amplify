// supabase/functions/send-welcome-email/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { Resend } from "https://esm.sh/resend@3.2.0"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3" // Added Supabase client

serve(async (req) => {
  console.log("Function invoked!");

// Reject anything that doesn't carry our shared secret
const expectedSecret = Deno.env.get("WELCOME_HOOK_SECRET");
const providedSecret = req.headers.get("x-webhook-secret");
if (!expectedSecret || providedSecret !== expectedSecret) {
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
    
    // 2. Initialize Clients
    const resend = new Resend(resendApiKey);
    const supabase = createClient(supabaseUrl, supabaseKey);
    console.log("Clients initialized successfully.");

    // 3. Parse Webhook Payload
    const payload = await req.json();
    const email = payload?.record?.email;
    const fullName = payload?.record?.['full name']; 
    const tier = payload?.record?.tier?.toLowerCase() || 'silver'; // Default to silver if missing
    const communityId = payload?.record?.community_id;

    if (!email) {
      throw new Error("No email found in payload.");
    }

    // 4. Fetch Community Name
    let communityName = "Amplify Global"; // Fallback name
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
      silver: { prize: '$25,000', odds: '1/100' },
      gold: { prize: '$50,000', odds: '1/50' },
      diamond: { prize: '$100,000', odds: '1/25' }
    };
    // Ensure we have valid data even if a weird tier string comes through
    const currentTierDetails = tierData[tier as keyof typeof tierData] || tierData.silver;

    console.log(`Sending to: ${email} for tier: ${tier} in community: ${communityName}`);

    // 6. Send Email
    const data = await resend.emails.send({
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
              Hi <strong>${fullName || 'there'}</strong>,
            </p>
            
            <p style="color: #475569; font-size: 16px; line-height: 1.6; margin-bottom: 30px;">
              Thank you for joining Amplify. Your monthly contribution has been secured, and your impact starts today. By combining our giving, we are capable of issuing transformational grants to organizations that need it most.
            </p>

            <div style="background-color: #f8fafc; padding: 24px; border-radius: 16px; margin-bottom: 30px; border: 1px solid #e2e8f0;">
              <p style="color: #64748b; font-size: 12px; font-weight: bold; text-transform: uppercase; letter-spacing: 2px; margin: 0 0 16px 0;">Your Circle Details</p>
              
              <table style="width: 100%; border-collapse: collapse; font-size: 15px;">
                <tr>
                  <td style="padding: 10px 0; border-bottom: 1px solid #e2e8f0; color: #475569; font-weight: 500;">Community</td>
                  <td style="padding: 10px 0; border-bottom: 1px solid #e2e8f0; color: #1e293b; font-weight: 700; text-align: right;">${communityName}</td>
                </tr>
                <tr>
                  <td style="padding: 10px 0; border-bottom: 1px solid #e2e8f0; color: #475569; font-weight: 500;">Impact Tier</td>
                  <td style="padding: 10px 0; border-bottom: 1px solid #e2e8f0; color: #1e293b; font-weight: 700; text-align: right; text-transform: capitalize;">${tier}</td>
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
                  Each circle is filled in chronological order, which typically takes a few weeks. We’ll email you the moment yours unlocks!
                </span>
              </p>
            </div>

            <hr style="border: none; border-top: 1px solid #e2e8f0; margin-bottom: 24px;" />
            
            <p style="color: #94a3b8; font-size: 11px; text-align: center; line-height: 1.5; margin: 0 0 12px 0;">
              * Actual odds of winning depend on the total number of eligible entries received in your active circle. See <a href="https://amplifygive.com/rules" style="color: #94a3b8; text-decoration: underline;">official rules</a> for details.
            </p>

            <p style="color: #94a3b8; font-size: 11px; text-align: center; line-height: 1.5; margin: 0;">
              You are receiving this email because you signed up for an Amplify membership.<br/>
              © ${new Date().getFullYear()} Amplify. All rights reserved.
            </p>
          </div>
        </div>
      `,
    });

    console.log("Email sent successfully!");

    return new Response(JSON.stringify(data), {
      headers: { "Content-Type": "application/json" },
      status: 200,
    })
  } catch (error) {
    console.error("CATCH BLOCK ERROR:", error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { "Content-Type": "application/json" },
      status: 400,
    })
  }
})
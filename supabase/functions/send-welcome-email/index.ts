// supabase/functions/send-welcome-email/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { Resend } from "https://esm.sh/resend@3.2.0"

serve(async (req) => {
  console.log("Function invoked!");

  try {
    // Force Deno to explicitly read the environment variable process
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    
    console.log("Checking API Key status...");
    if (!resendApiKey) {
        throw new Error("RESEND_API_KEY environment variable is missing.");
    }
    
    // Initialize Resend with the key
    const resend = new Resend(resendApiKey);
    console.log("Resend initialized successfully.");

    const payload = await req.json();
    const email = payload?.record?.email;
    const fullName = payload?.record?.['full name']; 

    if (!email) {
      throw new Error("No email found in payload.");
    }

    console.log(`Sending to: ${email}`);

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
            
            <p style="color: #94a3b8; font-size: 12px; text-align: center; line-height: 1.5; margin: 0;">
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
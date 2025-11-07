import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, email, company, phone, employees, plan, message } = body;

    // Validate required fields
    if (!name || !email || !company || !employees || !plan) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "Invalid email address" },
        { status: 400 }
      );
    }

    // Save to database for tracking
    const supabase = await createClient();
    const { error: dbError } = await supabase.from("sales_contacts").insert({
      name,
      email,
      company,
      phone: phone || null,
      company_size: employees,
      interested_in: plan,
      message: message || null,
      created_at: new Date().toISOString(),
      status: "new",
    });

    if (dbError) {
      console.error("Failed to save contact to database:", dbError);
      // Continue even if DB save fails - we'll still send emails
    }

    // TODO: Send email to sales team
    // Example using Resend:
    // await resend.emails.send({
    //   from: 'noreply@aios-platform.com',
    //   to: 'sales@aios-platform.com',
    //   subject: `New ${plan} inquiry from ${company}`,
    //   html: `
    //     <h2>New Sales Contact</h2>
    //     <p><strong>Name:</strong> ${name}</p>
    //     <p><strong>Email:</strong> ${email}</p>
    //     <p><strong>Company:</strong> ${company}</p>
    //     <p><strong>Phone:</strong> ${phone || 'Not provided'}</p>
    //     <p><strong>Company Size:</strong> ${employees}</p>
    //     <p><strong>Interested In:</strong> ${plan}</p>
    //     <p><strong>Message:</strong> ${message || 'None'}</p>
    //   `,
    // });

    // TODO: Send confirmation email to prospect
    // await resend.emails.send({
    //   from: 'sales@aios-platform.com',
    //   to: email,
    //   subject: 'Thanks for your interest in Perpetual Core Platform',
    //   html: `
    //     <h2>Thank you for contacting us!</h2>
    //     <p>Hi ${name},</p>
    //     <p>We've received your inquiry about the ${plan} plan and will get back to you within 24 hours.</p>
    //     <p>In the meantime, feel free to explore our <a href="https://aios-platform.com/docs">documentation</a>.</p>
    //     <p>Best regards,<br>The Perpetual Core Team</p>
    //   `,
    // });

    // TODO: Integrate with CRM (HubSpot, Salesforce, etc.)
    // Example HubSpot:
    // await fetch('https://api.hubapi.com/contacts/v1/contact', {
    //   method: 'POST',
    //   headers: {
    //     'Authorization': `Bearer ${process.env.HUBSPOT_API_KEY}`,
    //     'Content-Type': 'application/json',
    //   },
    //   body: JSON.stringify({
    //     properties: [
    //       { property: 'email', value: email },
    //       { property: 'firstname', value: name.split(' ')[0] },
    //       { property: 'lastname', value: name.split(' ').slice(1).join(' ') },
    //       { property: 'company', value: company },
    //       { property: 'phone', value: phone },
    //       { property: 'interested_plan', value: plan },
    //     ],
    //   }),
    // });

    // Log for now (until email service is configured)
    console.log("New sales contact:", {
      name,
      email,
      company,
      phone,
      employees,
      plan,
      message,
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      message: "Contact information received. Our team will reach out within 24 hours.",
    });
  } catch (error: any) {
    console.error("Contact sales error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to submit contact form" },
      { status: 500 }
    );
  }
}

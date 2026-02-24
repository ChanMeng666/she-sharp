import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { sendEmail } from "@/lib/email/service";
import { submitContactForm } from "@/lib/forms/contact-service";

const CONTACT_EMAIL = "info@shesharp.org.nz";

const contactFormSchema = z.object({
  fullName: z.string().min(1, "Full name is required").max(100),
  email: z.string().email("Invalid email address").max(100),
  organisation: z.string().max(200).optional(),
  message: z.string().min(1, "Message is required").max(5000),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate input
    const validation = contactFormSchema.safeParse(body);
    if (!validation.success) {
      const errors = validation.error.errors.map((e) => e.message).join(", ");
      return NextResponse.json({ error: errors }, { status: 400 });
    }

    const { fullName, email, organisation, message } = validation.data;

    // Build email HTML
    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1f1e44;">New Contact Form Submission</h2>
        <div style="background: #f7e5f3; padding: 20px; border-radius: 12px; margin: 20px 0;">
          <p style="margin: 0 0 10px;"><strong>Name:</strong> ${fullName}</p>
          <p style="margin: 0 0 10px;"><strong>Email:</strong> <a href="mailto:${email}">${email}</a></p>
          ${organisation ? `<p style="margin: 0 0 10px;"><strong>Organisation:</strong> ${organisation}</p>` : ""}
        </div>
        <div style="background: #fff; padding: 20px; border: 1px solid #eee; border-radius: 12px;">
          <h3 style="color: #1f1e44; margin-top: 0;">Message:</h3>
          <p style="white-space: pre-wrap; color: #333;">${message}</p>
        </div>
        <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;" />
        <p style="color: #888; font-size: 12px;">
          This email was sent from the She Sharp website contact form.
        </p>
      </div>
    `;

    // Build plain text version
    const emailText = `
New Contact Form Submission

Name: ${fullName}
Email: ${email}
${organisation ? `Organisation: ${organisation}` : ""}

Message:
${message}

---
This email was sent from the She Sharp website contact form.
    `.trim();

    // Send email
    const emailSent = await sendEmail({
      to: CONTACT_EMAIL,
      subject: `Contact Form: Message from ${fullName}`,
      html: emailHtml,
      text: emailText,
    });

    if (!emailSent) {
      console.error("Failed to send contact form email");
      return NextResponse.json(
        { error: "Failed to send message. Please try again later." },
        { status: 500 }
      );
    }

    // Save to database and send Slack notification (non-blocking)
    let submissionId: number | undefined;
    try {
      const result = await submitContactForm({ fullName, email, organisation, message });
      submissionId = result.submissionId;
    } catch (err) {
      console.error("Failed to save contact form submission:", err);
    }

    return NextResponse.json({
      success: true,
      message: "Your message has been sent successfully.",
      submissionId,
    });
  } catch (error) {
    console.error("Error processing contact form:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}


import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { submitContactForm } from "@/lib/forms/contact-service";

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

    // Save to database and send Slack notification
    const result = await submitContactForm({ fullName, email, organisation, message });

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || "Failed to submit message. Please try again later." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Your message has been sent successfully.",
      submissionId: result.submissionId,
    });
  } catch (error) {
    console.error("Error processing contact form:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

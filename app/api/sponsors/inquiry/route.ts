import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { submitContactForm } from "@/lib/forms/contact-service";

const inquirySchema = z.object({
  fullName: z.string().min(1, "Full name is required").max(100),
  email: z.string().email("Invalid email address").max(100),
  organisation: z.string().max(200).optional(),
  message: z.string().min(1, "Message is required").max(5000),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = inquirySchema.safeParse(body);
    if (!parsed.success) {
      const errors = parsed.error.errors.map((e) => e.message).join(", ");
      return NextResponse.json({ error: errors }, { status: 400 });
    }

    const { fullName, email, organisation, message } = parsed.data;

    const prefixedMessage = [
      "[Sponsor Inquiry]",
      organisation ? `Organisation: ${organisation}` : null,
      "",
      message,
    ]
      .filter((line) => line !== null)
      .join("\n");

    const result = await submitContactForm({
      fullName,
      email,
      organisation,
      message: prefixedMessage,
      source: 'sponsor-inquiry',
    });

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || "Failed to submit inquiry. Please try again later." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Sponsor inquiry received.",
      submissionId: result.submissionId,
    });
  } catch (error) {
    console.error("Error processing sponsor inquiry:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

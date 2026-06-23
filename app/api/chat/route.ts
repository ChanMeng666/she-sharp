import { after } from "next/server";
import { createAgentUIStreamResponse, type UIMessage } from "ai";
import { createSheSharpAgent } from "@/lib/chatbot/agent";
import { checkChatRateLimit } from "@/lib/chatbot/rate-limit";
import { logChatQuestion } from "@/lib/chatbot/analytics";

// Fluid Compute: streaming spends most of its wall-clock waiting on the model
// (billed as I/O, not active CPU), so a generous duration is cheap and lets
// multi-step tool loops finish comfortably.
export const maxDuration = 60;

/** Best-effort client identifier for rate limiting. */
function getClientId(req: Request): string {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  return req.headers.get("x-real-ip") || "anonymous";
}

/** Extract the latest user question text from UI messages. */
function lastUserText(messages: UIMessage[]): string {
  const lastUser = [...messages].reverse().find((m) => m.role === "user");
  if (!lastUser) return "";
  return lastUser.parts
    .map((p) => (p.type === "text" ? p.text : ""))
    .join(" ")
    .trim();
}

export async function POST(req: Request) {
  try {
    const { messages }: { messages: UIMessage[] } = await req.json();

    if (!messages || !Array.isArray(messages)) {
      return new Response("Invalid request: messages array is required", {
        status: 400,
      });
    }

    // Rate limit per client to prevent abuse / runaway cost.
    const { success } = await checkChatRateLimit(getClientId(req));
    if (!success) {
      return new Response(
        JSON.stringify({
          error: "Too many requests. Please slow down and try again shortly.",
        }),
        { status: 429, headers: { "Content-Type": "application/json" } }
      );
    }

    // Log the visitor's question after the response streams (non-blocking).
    const question = lastUserText(messages);
    if (question) {
      after(() => logChatQuestion(question));
    }

    // Fresh agent per request so its instructions embed the latest live data.
    const agent = createSheSharpAgent();
    return createAgentUIStreamResponse({ agent, uiMessages: messages });
  } catch (error) {
    console.error("[Chat API] Error occurred:", error);
    const errorMessage =
      error instanceof Error ? error.message : "An unknown error occurred";
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

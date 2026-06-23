/**
 * She Sharp chatbot agent definition (AI SDK 6 ToolLoopAgent).
 *
 * The agent is rebuilt per request so its instructions embed the freshest
 * knowledge context (e.g. newly added events). It runs a tool loop, calling the
 * data tools as needed, then answers in friendly, link-rich markdown.
 */

import { ToolLoopAgent, stepCountIs, type LanguageModel } from "ai";
import { openai } from "@ai-sdk/openai";
import { buildKnowledgeContext } from "./knowledge";
import { chatbotTools } from "./tools";

/**
 * Resolve the chat model.
 *
 * Prefers the Vercel AI Gateway (string model id) for fallback/observability/
 * caching. Falls back to a direct OpenAI provider for local development when
 * only OPENAI_API_KEY is configured. On Vercel without an explicit gateway key,
 * the string id still routes through the Gateway via OIDC auth.
 */
export function getChatModel(): LanguageModel {
  // Prefer the AI Gateway (fallback, observability, caching). On Vercel it
  // authenticates automatically via OIDC — no API key required; locally an
  // AI_GATEWAY_API_KEY also routes through the Gateway. Otherwise fall back to a
  // direct OpenAI provider for local development with only OPENAI_API_KEY.
  if (process.env.VERCEL || process.env.AI_GATEWAY_API_KEY) {
    return "openai/gpt-4o-mini";
  }
  if (process.env.OPENAI_API_KEY) {
    return openai("gpt-4o-mini");
  }
  return "openai/gpt-4o-mini";
}

/** Build the full system instructions: persona + guardrails + live knowledge. */
export function buildInstructions(): string {
  return `You are the She Sharp Assistant — a friendly, professional guide on the She Sharp website (a New Zealand non-profit bridging the gender gap in STEM).

Your job is to help visitors discover events, understand the mentorship programme, learn about the team, and find ways to get involved (sponsor, donate, volunteer, resources).

How to behave:
- Be warm, concise, and encouraging. Write in English (British/NZ spelling, e.g. "programme", "organisation").
- ALWAYS guide visitors with clickable site links in markdown, e.g. [the event](/events/<slug>) or [our events](/events). Use the url/slug returned by the tools — never invent links or slugs.
- Answer ONLY from the knowledge base below and the tool results. If you don't know or it's outside She Sharp, say so briefly and point to /resources or hello@shesharp.org.nz. Do not make up events, dates, speakers, mentors, or policies.
- Prefer calling a tool over guessing when a question needs specific event/mentor/team data. For event detail questions, call findEvents (to get the slug) then getEventDetails if needed.
- Keep answers focused; use short paragraphs or bullet lists. Offer a relevant next step or link.

${buildKnowledgeContext()}`;
}

/** Create a fresh agent instance for a single request. */
export function createSheSharpAgent() {
  return new ToolLoopAgent({
    model: getChatModel(),
    instructions: buildInstructions(),
    tools: chatbotTools,
    stopWhen: stepCountIs(5),
    temperature: 0.5,
    maxOutputTokens: 900,
  });
}

import type { Metadata } from "next";

import { MermaidRenderer } from "@/components/docs/mermaid-renderer";
import { PromptCopyButtons } from "@/components/docs/prompt-copy";
import { EMAIL_PLAYBOOK_HTML } from "@/lib/docs/email-playbook";
import { absoluteUrl } from "@/lib/seo/site";

/**
 * The She Sharp email playbook: who may be emailed, which system sends it, and
 * what has to happen before anything goes out.
 *
 * It is a sibling of `/internal/event-playbook` rather than a section inside
 * it. That page is one evening's work, and its navigation is a single diagram
 * a reader finds their team's colour in; email is not event-scoped — the
 * newsletter, marketing and events teams all send it, and a rule about consent
 * does not belong under a heading about running an event. Two short pages, each
 * answering one question, beat one page answering two.
 *
 * The reader is the person who runs the newsletter or promotes an event, not an
 * engineer. So the body carries no repository paths; the pointers to the three
 * documents that are each the sole authority on their subject sit at the end of
 * a section, where somebody following one up will look for them.
 *
 * The HTML is compiled at authoring time by
 * `scripts/docs/build-email-playbook.mts` from the markdown named in
 * `EMAIL_PLAYBOOK_SOURCES`, so nothing here reads the filesystem or parses
 * markdown, and the markdown renderer never reaches the deployed bundle.
 * `lib/docs/email-playbook.test.ts` is what stops this page drifting behind the
 * document it claims to be.
 */

export const metadata: Metadata = {
  title: { absolute: "Email Playbook | She Sharp" },
  description:
    "One page telling She Sharp staff who may be emailed, which system sends what, and what has to happen before a send goes out.",
  // The layout's noindex needs a self-canonical beside it, for the same reason
  // the event playbook carries one: a future `/internal` canonical would
  // otherwise pair this noindex child with a parent-pointing canonical, which
  // is the combination that lets Google apply the noindex to the parent.
  alternates: { canonical: absoluteUrl("/internal/email-playbook") },
  robots: { index: false, follow: false },
};

export default function EmailPlaybookPage() {
  return (
    <main className="playbook-page">
      <article
        className="legal-content playbook"
        // Trusted input: the string is generated from a file in this repository
        // at authoring time, never from a request, a database or a user.
        dangerouslySetInnerHTML={{ __html: EMAIL_PLAYBOOK_HTML }}
      />

      {/* Both are DOM-driven and render nothing themselves — the containers
          they attach to come from the generated HTML above. */}
      <MermaidRenderer />
      <PromptCopyButtons />
    </main>
  );
}

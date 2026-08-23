import type { Metadata } from "next";

import { MermaidRenderer } from "@/components/docs/mermaid-renderer";
import { PromptCopyButtons } from "@/components/docs/prompt-copy";
import { PLAYBOOK_HTML } from "@/lib/docs/playbook";
import { absoluteUrl } from "@/lib/seo/site";

/**
 * The She Sharp event playbook: which part of running an event belongs to which
 * team, and the exact words to type.
 *
 * The reader is an unpaid volunteer with an hour, not an engineer with an
 * afternoon, which is what shapes the page — one short document, one diagram,
 * and a copy-paste prompt at the end of nearly every section.
 *
 * There is deliberately no table of contents. The document has nine sections,
 * every one of them named after a colour in the diagram, and its own opening
 * instruction is "Look at the picture. Find your team's colour." A contents
 * list was a second answer to a question the diagram already answers, and it
 * cost the whole of the first screen: at 1440×900 the reader met a stack of
 * links and met the diagram only by scrolling. The diagram is the navigation.
 *
 * The HTML is compiled at authoring time by `scripts/docs/build-playbook.mts`
 * from the markdown named in `PLAYBOOK_SOURCES`, so nothing here reads the
 * filesystem or parses markdown, and the markdown renderer never reaches the
 * deployed bundle. `lib/docs/playbook.test.ts` is what stops this page drifting
 * behind the document it claims to be.
 */

export const metadata: Metadata = {
  // The URL and the title are stable: this page is already shared with people.
  title: { absolute: "Event Playbook | She Sharp" },
  description:
    "One page telling each She Sharp team which part of running an event is theirs, and the exact words to type to get it done.",
  // The layout's noindex needs a self-canonical beside it. Nothing cascades a
  // canonical today, but a future `/internal` canonical would otherwise pair
  // this noindex child with a parent-pointing canonical — the combination that
  // lets Google apply the noindex to the parent.
  alternates: { canonical: absoluteUrl("/internal/event-playbook") },
  robots: { index: false, follow: false },
};

export default function EventPlaybookPage() {
  return (
    <main className="playbook-page">
      <article
        className="legal-content playbook"
        // Trusted input: the string is generated from files in this repository
        // at authoring time, never from a request, a database or a user.
        dangerouslySetInnerHTML={{ __html: PLAYBOOK_HTML }}
      />

      {/* Both are DOM-driven and render nothing themselves — the containers
          they attach to come from the generated HTML above. */}
      <MermaidRenderer />
      <PromptCopyButtons />
    </main>
  );
}

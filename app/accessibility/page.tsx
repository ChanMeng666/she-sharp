import { LegalPageLayout } from "@/components/legal-page-layout";
import "@/styles/components/legal-page.css";

export const metadata = {
  title: "Accessibility Statement | She Sharp",
  description: "She Sharp's commitment to digital accessibility and making our website usable for everyone.",
};

export default function AccessibilityPage() {
  return (
    <LegalPageLayout title="Accessibility Statement" navTitle="Accessibility">
      <div className="legal-content">
        <section className="legal-section">
          <h2>Our Commitment to Inclusion</h2>
          <p>
            She Sharp is committed to ensuring digital accessibility for people with disabilities.
            We are continually improving the user experience for everyone and applying the relevant
            accessibility standards.
          </p>
          <p>
            <strong>Our Goal:</strong> Conform to WCAG 2.1 Level AA standards to ensure our content
            is accessible to a wide range of people with disabilities.
          </p>
        </section>

        <section className="legal-section">
          <h2>Accessibility Features</h2>
          <p>Our website includes the following accessibility features:</p>
          <ul>
            <li><strong>Screen Reader Support</strong> — Semantic HTML markup for better compatibility</li>
            <li><strong>Visual Design</strong> — High contrast ratios and clear typography</li>
            <li><strong>Keyboard Navigation</strong> — Full keyboard support throughout the site</li>
            <li><strong>Responsive Design</strong> — Works across all devices and screen sizes</li>
            <li><strong>Alternative Content</strong> — Alt text for images and video captions</li>
            <li><strong>Clear Structure</strong> — Consistent navigation and page layout</li>
          </ul>

          <h3>Additional Features</h3>
          <ul>
            <li>Form labels and error messages</li>
            <li>Skip navigation links</li>
            <li>Focus indicators</li>
            <li>Consistent heading structure</li>
            <li>Descriptive link text</li>
            <li>ARIA landmarks</li>
          </ul>
        </section>

        <section className="legal-section">
          <h2>Assistive Technology Compatibility</h2>
          <p>Our website is designed to be compatible with the following assistive technologies:</p>

          <h3>Screen Readers</h3>
          <ul>
            <li>JAWS (Windows)</li>
            <li>NVDA (Windows)</li>
            <li>VoiceOver (macOS/iOS)</li>
            <li>TalkBack (Android)</li>
          </ul>

          <h3>Other Technologies</h3>
          <ul>
            <li>Screen magnification software</li>
            <li>Speech recognition software</li>
            <li>Keyboard-only navigation</li>
            <li>Voice control systems</li>
          </ul>
        </section>

        <section className="legal-section">
          <h2>Known Limitations</h2>
          <p>While we strive for full accessibility, some areas may have limitations:</p>

          <h3>Third-Party Content</h3>
          <p>
            Embedded videos and social media content may not fully meet accessibility standards.
            We're working with providers to improve accessibility.
          </p>

          <h3>Legacy Documents</h3>
          <p>
            Some older PDF documents may not be fully accessible.
            We're converting documents to accessible formats.
          </p>

          <h3>User-Generated Content</h3>
          <p>
            Community-submitted content may not always meet guidelines.
            We provide accessibility guidelines to contributors.
          </p>
        </section>

        <section className="legal-section">
          <h2>Accessibility Feedback</h2>
          <p>
            Encountered an accessibility barrier? We want to hear from you. Please include:
          </p>
          <ul>
            <li>Page URL</li>
            <li>Description of the issue</li>
            <li>Assistive technology used</li>
            <li>Your contact information</li>
          </ul>
          <p>
            <strong>Email:</strong> <a href="mailto:accessibility@shesharp.org.nz">accessibility@shesharp.org.nz</a>
          </p>

          <h3>Our Promise</h3>
          <ul>
            <li>Response within 2 business days</li>
            <li>Regular accessibility audits</li>
            <li>Ongoing staff training</li>
            <li>User feedback implementation</li>
          </ul>
        </section>

        <section className="legal-section">
          <h2>Accessibility Resources</h2>
          <p>Learn more about web accessibility and assistive technologies:</p>
          <ul>
            <li><a href="https://www.w3.org/WAI/" target="_blank" rel="noopener noreferrer">W3C Web Accessibility Initiative</a> — International standards</li>
            <li><a href="https://www.govt.nz/standards/web-accessibility-standard-1-1/" target="_blank" rel="noopener noreferrer">NZ Government Web Standards</a> — Local guidelines</li>
            <li><a href="https://webaim.org/" target="_blank" rel="noopener noreferrer">WebAIM</a> — Resources and tools</li>
          </ul>
        </section>

        <section className="legal-section">
          <h2>Together, We Make Tech Accessible</h2>
          <p>
            Accessibility is not just about compliance—it's about ensuring everyone in our
            community can participate fully in our mission to empower women in STEM.
          </p>
          <p>Thank you for helping us improve.</p>
        </section>
      </div>
    </LegalPageLayout>
  );
}

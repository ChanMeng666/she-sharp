import { LegalPageLayout } from "@/components/legal-page-layout";
import "@/styles/components/legal-page.css";

export const metadata = {
  title: "Terms of Service | She Sharp",
  description: "Terms of service for using She Sharp's website and participating in our programmes.",
};

export default function TermsOfServicePage() {
  return (
    <LegalPageLayout title="Terms of Service">
      <div className="legal-content">
        <section className="legal-section">
          <h2>Agreement to Terms</h2>
          <p>
            By accessing or using the She Sharp website and services, you agree to be bound by these
            Terms of Service. If you do not agree to these terms, please do not use our services.
          </p>
          <p>
            These terms constitute a legally binding agreement between you and She Sharp (Registered NZ Charity CC57025).
          </p>
        </section>

        <section className="legal-section">
          <h2>About She Sharp</h2>
          <p>
            She Sharp is a registered New Zealand charity dedicated to bridging the gender gap in STEM fields.
            We provide networking, mentorship, and career development opportunities for women in technology.
            Since 2014, we have hosted 84+ events empowering women in tech.
          </p>
        </section>

        <section className="legal-section">
          <h2>Use of Services</h2>

          <h3>Eligibility Requirements</h3>
          <p>
            Our services are available to individuals who are 16 years of age or older.
            By using our services, you represent that you meet this age requirement.
          </p>
          <p>
            <strong>Note:</strong> Some programmes may have additional eligibility criteria
            specific to the programme objectives.
          </p>

          <h3>Acceptable Use Policy</h3>
          <p>When using our services, you agree to:</p>
          <ul>
            <li>Provide accurate information</li>
            <li>Respect other members</li>
            <li>Follow event guidelines</li>
            <li>Comply with laws</li>
          </ul>

          <p>You agree NOT to:</p>
          <ul>
            <li>Engage in harassment</li>
            <li>Share false information</li>
            <li>Solicit without permission</li>
            <li>Violate privacy</li>
          </ul>
        </section>

        <section className="legal-section">
          <h2>Event Participation</h2>

          <h3>Registration & Attendance</h3>
          <p>
            Event registration is subject to availability. We reserve the right to refuse or
            cancel registrations at our discretion. Registered attendees are expected to honor
            their commitment or cancel in advance.
          </p>

          <h3>Code of Conduct</h3>
          <p>
            All participants must maintain professional behaviour and respect for others.
            Violations may result in removal from events and suspension from future activities.
          </p>

          <h3>Photography & Recording</h3>
          <p>
            By attending our events, you consent to being photographed or recorded.
            We may use these materials for promotional purposes.
          </p>
          <p>
            If you prefer not to be photographed, please notify event staff upon arrival.
          </p>
        </section>

        <section className="legal-section">
          <h2>Intellectual Property</h2>

          <h3>Our Content</h3>
          <p>
            All content on our website, including text, graphics, logos, and images, is the
            property of She Sharp or its content suppliers and is protected by copyright laws.
          </p>
          <p>You may not:</p>
          <ul>
            <li>Reproduce without permission</li>
            <li>Create derivative works</li>
            <li>Use for commercial purposes</li>
          </ul>

          <h3>Your Content</h3>
          <p>
            By submitting content to our website or services, you grant She Sharp a
            non-exclusive, royalty-free license to use, reproduce, and display such content.
          </p>
          <p>You retain:</p>
          <ul>
            <li>Ownership of your content</li>
            <li>Right to use elsewhere</li>
            <li>Right to request removal</li>
          </ul>
        </section>

        <section className="legal-section">
          <h2>Disclaimers & Limitations</h2>

          <h3>Service Disclaimer</h3>
          <p>
            Our services are provided "as is" without warranties of any kind. We do not guarantee
            specific outcomes from participation in our programmes or the accuracy of all information
            on our website.
          </p>

          <h3>Limitation of Liability</h3>
          <p>
            To the fullest extent permitted by law, She Sharp shall not be liable for any indirect,
            incidental, special, or consequential damages arising from your use of our services.
          </p>

          <h3>Indemnification</h3>
          <p>
            You agree to indemnify and hold harmless She Sharp, its officers, directors, employees,
            and volunteers from any claims arising from your use of our services or violation of
            these terms.
          </p>
        </section>

        <section className="legal-section">
          <h2>General Provisions</h2>

          <h3>Modifications to Terms</h3>
          <p>
            We reserve the right to modify these Terms of Service at any time. Material changes
            will be communicated through our website or email notifications.
          </p>

          <h3>Governing Law</h3>
          <p>
            These Terms are governed by the laws of New Zealand. Any disputes shall be resolved
            in the courts of New Zealand.
          </p>
        </section>

        <section className="legal-section">
          <h2>Questions?</h2>
          <p>
            If you have questions about these Terms of Service or need clarification on any
            policies, please contact us:
          </p>
          <ul>
            <li><strong>Email:</strong> <a href="mailto:legal@shesharp.org.nz">legal@shesharp.org.nz</a></li>
            <li><strong>Charity Number:</strong> CC57025</li>
          </ul>
        </section>
      </div>
    </LegalPageLayout>
  );
}

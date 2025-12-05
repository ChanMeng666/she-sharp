import { LegalPageLayout } from "@/components/legal-page-layout";
import "@/styles/components/legal-page.css";

export const metadata = {
  title: "Security Policy | She Sharp",
  description: "Learn about She Sharp's security practices and how to report security vulnerabilities.",
};

export default function SecurityPolicyPage() {
  return (
    <LegalPageLayout title="Security Policy">
      <div className="legal-content">
        <section className="legal-section">
          <h2>Our Security Commitment</h2>
          <p>
            At She Sharp, we take the security of our members' data seriously. This policy outlines
            our security practices, how we protect your information, and how you can help us maintain
            a secure environment for our community.
          </p>
        </section>

        <section className="legal-section">
          <h2>Security Measures We Implement</h2>

          <h3>Data Encryption</h3>
          <ul>
            <li>SSL/TLS encryption for all data in transit</li>
            <li>Encrypted storage for sensitive information</li>
            <li>Secure password hashing with Argon2</li>
          </ul>

          <h3>Access Control</h3>
          <ul>
            <li>Multi-factor authentication available</li>
            <li>Role-based access permissions</li>
            <li>Regular access reviews and audits</li>
          </ul>

          <h3>Additional Measures</h3>
          <ul>
            <li>Regular security patches and system updates</li>
            <li>Real-time threat detection and activity monitoring</li>
            <li>Protected API endpoints with authentication</li>
          </ul>
        </section>

        <section className="legal-section">
          <h2>Reporting Security Vulnerabilities</h2>
          <p>
            We appreciate the security research community's efforts in helping keep our members safe.
            If you discover a security vulnerability, please report it responsibly.
          </p>

          <h3>How to Report</h3>
          <ol>
            <li>Email security@shesharp.org.nz with details</li>
            <li>Include steps to reproduce the issue</li>
            <li>Allow us time to investigate and fix</li>
            <li>Avoid public disclosure until resolved</li>
          </ol>

          <h3>What to Include</h3>
          <ul>
            <li>Type of vulnerability</li>
            <li>Affected URLs or components</li>
            <li>Proof of concept (if applicable)</li>
            <li>Your contact information</li>
          </ul>

          <p>
            <strong>Response Time:</strong> We aim to acknowledge receipt within 48 hours and provide
            an initial assessment within 5 business days.
          </p>
        </section>

        <section className="legal-section">
          <h2>Security Best Practices for Members</h2>
          <p>Help us maintain a secure environment by following these best practices:</p>

          <h3>Account Security</h3>
          <ul>
            <li>Use a strong, unique password</li>
            <li>Enable two-factor authentication when available</li>
            <li>Don't share your login credentials</li>
            <li>Log out when using shared computers</li>
          </ul>

          <h3>Staying Safe Online</h3>
          <ul>
            <li>Verify emails claiming to be from She Sharp</li>
            <li>Don't click suspicious links</li>
            <li>Report phishing attempts immediately</li>
            <li>Keep your devices updated</li>
          </ul>
        </section>

        <section className="legal-section">
          <h2>Data Breach Response</h2>
          <p>
            In the unlikely event of a data breach, we have procedures in place to respond quickly
            and transparently:
          </p>
          <ol>
            <li><strong>Immediate Containment</strong> — Isolate affected systems and prevent further unauthorized access</li>
            <li><strong>Assessment & Investigation</strong> — Determine the scope and impact of the breach</li>
            <li><strong>Notification</strong> — Inform affected users within 72 hours as required by law</li>
            <li><strong>Remediation</strong> — Implement fixes and strengthen security measures</li>
          </ol>
        </section>

        <section className="legal-section">
          <h2>Security Updates & Transparency</h2>
          <p>We conduct regular security assessments including:</p>
          <ul>
            <li>Quarterly security audits</li>
            <li>Penetration testing</li>
            <li>Code reviews</li>
            <li>Dependency updates</li>
          </ul>
        </section>

        <section className="legal-section">
          <h2>Security Contact</h2>
          <p>
            For security-related questions, vulnerability reports, or concerns about your account security,
            please contact our security team:
          </p>
          <ul>
            <li><strong>Security Team:</strong> <a href="mailto:security@shesharp.org.nz">security@shesharp.org.nz</a></li>
            <li><strong>General Support:</strong> <a href="mailto:support@shesharp.org.nz">support@shesharp.org.nz</a></li>
          </ul>
          <p>
            We support PGP encryption for sensitive communications. Request our public key when
            contacting security@shesharp.org.nz.
          </p>
        </section>
      </div>
    </LegalPageLayout>
  );
}

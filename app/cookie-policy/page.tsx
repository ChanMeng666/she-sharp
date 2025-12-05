import { LegalPageLayout } from "@/components/legal-page-layout";
import "@/styles/components/legal-page.css";

export const metadata = {
  title: "Cookie Policy | She Sharp",
  description: "Learn about how She Sharp uses cookies and similar technologies on our website.",
};

export default function CookiePolicyPage() {
  return (
    <LegalPageLayout title="Cookie Policy">
      <div className="legal-content">
        <section className="legal-section">
          <h2>Understanding Cookies</h2>
          <p>
            Cookies are small text files that are placed on your device when you visit our website.
            They help us provide you with a better experience by remembering your preferences and
            understanding how you use our site.
          </p>
          <p>
            This policy explains what cookies are, how we use them, and how you can manage your cookie preferences.
          </p>
        </section>

        <section className="legal-section">
          <h2>Types of Cookies We Use</h2>

          <h3>Necessary Cookies (Always Active)</h3>
          <p>These cookies are essential for the website to function properly and cannot be disabled.</p>
          <table>
            <thead>
              <tr>
                <th>Cookie Name</th>
                <th>Purpose</th>
                <th>Duration</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>cookie-consent</td>
                <td>Stores your cookie preferences</td>
                <td>1 year</td>
              </tr>
              <tr>
                <td>session_id</td>
                <td>Maintains user session</td>
                <td>Session</td>
              </tr>
              <tr>
                <td>csrf_token</td>
                <td>Security protection</td>
                <td>Session</td>
              </tr>
            </tbody>
          </table>

          <h3>Analytics Cookies (Optional)</h3>
          <p>Help us understand how visitors interact with our website by collecting anonymous data.</p>
          <table>
            <thead>
              <tr>
                <th>Cookie Name</th>
                <th>Purpose</th>
                <th>Duration</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>_ga</td>
                <td>Google Analytics tracking</td>
                <td>2 years</td>
              </tr>
              <tr>
                <td>_gid</td>
                <td>Google Analytics session</td>
                <td>24 hours</td>
              </tr>
              <tr>
                <td>_gat</td>
                <td>Rate limiting</td>
                <td>1 minute</td>
              </tr>
            </tbody>
          </table>

          <h3>Marketing Cookies (Optional)</h3>
          <p>Track visitors across websites to display relevant advertisements and measure campaign effectiveness.</p>
          <table>
            <thead>
              <tr>
                <th>Cookie Name</th>
                <th>Purpose</th>
                <th>Duration</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>_fbp</td>
                <td>Facebook Pixel tracking</td>
                <td>3 months</td>
              </tr>
              <tr>
                <td>_gcl_au</td>
                <td>Google Ads conversion</td>
                <td>3 months</td>
              </tr>
              <tr>
                <td>li_sugr</td>
                <td>LinkedIn insights</td>
                <td>3 months</td>
              </tr>
            </tbody>
          </table>
        </section>

        <section className="legal-section">
          <h2>Managing Your Cookie Preferences</h2>
          <p>
            You can manage your cookie preferences at any time through our cookie consent banner
            or by clicking the "Cookie Settings" link in our footer.
          </p>
          <p>
            Most browsers also allow you to control cookies through their settings. You can block or
            delete cookies, but this may affect website functionality.
          </p>

          <h3>Browser-Specific Instructions</h3>
          <ul>
            <li><a href="https://support.google.com/chrome/answer/95647" target="_blank" rel="noopener noreferrer">Google Chrome</a></li>
            <li><a href="https://support.mozilla.org/en-US/kb/enable-and-disable-cookies-website-preferences" target="_blank" rel="noopener noreferrer">Mozilla Firefox</a></li>
            <li><a href="https://support.apple.com/guide/safari/manage-cookies-and-website-data-sfri11471/mac" target="_blank" rel="noopener noreferrer">Safari</a></li>
            <li><a href="https://support.microsoft.com/en-us/help/17442/windows-internet-explorer-delete-manage-cookies" target="_blank" rel="noopener noreferrer">Microsoft Edge</a></li>
          </ul>
        </section>

        <section className="legal-section">
          <h2>Impact of Disabling Cookies</h2>
          <p>Disabling certain cookies may affect your experience on our website:</p>
          <ul>
            <li><strong>Necessary cookies:</strong> Cannot be disabled. Required for basic functionality.</li>
            <li><strong>Analytics cookies:</strong> Disabling may limit our ability to improve services.</li>
            <li><strong>Marketing cookies:</strong> You may see less relevant advertisements.</li>
          </ul>
        </section>

        <section className="legal-section">
          <h2>Questions About Cookies?</h2>
          <p>If you have questions about our use of cookies or this policy, please contact us:</p>
          <ul>
            <li><strong>Email:</strong> <a href="mailto:privacy@shesharp.org.nz">privacy@shesharp.org.nz</a></li>
            <li><strong>Website:</strong> <a href="https://www.shesharp.org.nz">www.shesharp.org.nz</a></li>
          </ul>
          <p>
            We may update this Cookie Policy from time to time. Check the "Last Updated" date
            at the top of this page for the latest version.
          </p>
        </section>
      </div>
    </LegalPageLayout>
  );
}

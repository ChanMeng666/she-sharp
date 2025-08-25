import { Cookie, Settings, Shield, BarChart, Megaphone, CheckCircle, Chrome, Globe } from "lucide-react";
import { LegalPageLayout } from "@/components/legal-page-layout";
import "@/components/legal-page-styles.css";

export const metadata = {
  title: "Cookie Policy | She Sharp",
  description: "Learn about how She Sharp uses cookies and similar technologies on our website.",
};

export default function CookiePolicyPage() {
  return (
    <LegalPageLayout 
      title="Cookie Policy" 
      icon={<Cookie className="h-12 w-12 text-white" />}
    >
      <div className="legal-content">
        {/* Introduction */}
        <section className="legal-section">
          <div className="legal-info-box">
            <h2 className="!mt-0">Understanding Cookies</h2>
            <p className="text-lg mb-4">
              Cookies are small text files that are placed on your device when you visit our website. 
              They help us provide you with a better experience by remembering your preferences and 
              understanding how you use our site.
            </p>
            <p className="text-sm text-navy-dark/80 mb-0">
              This policy explains what cookies are, how we use them, and how you can manage your cookie preferences.
            </p>
            <div className="mt-6 p-4 bg-white/50 rounded-xl border border-purple-light/20">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 bg-purple-dark rounded-full animate-pulse"></div>
                <p className="text-sm text-navy-dark mb-0 font-medium">
                  <strong>Quick Tip:</strong> You can control your cookie preferences at any time using our cookie banner or browser settings.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Cookie Types */}
        <section className="legal-section">
          <h2>Types of Cookies We Use</h2>
          
          <div className="space-y-6">
            {/* Necessary Cookies */}
            <div className="bg-gradient-to-r from-mint-light/30 to-mint-dark/10 rounded-2xl p-8 border border-mint-dark/20 shadow-lg hover:shadow-xl transition-all duration-300">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-white rounded-lg shadow-sm">
                  <Shield className="h-6 w-6 text-mint-dark" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <h3 className="!mt-0 text-xl">Necessary Cookies</h3>
                    <span className="px-3 py-1 bg-mint-dark/20 text-mint-dark text-sm font-medium rounded-full">
                      Always Active
                    </span>
                  </div>
                  <p className="text-gray mb-4">
                    These cookies are essential for the website to function properly and cannot be disabled.
                  </p>
                  
                  <table className="legal-table !my-0">
                    <thead>
                      <tr>
                        <th>Cookie Name</th>
                        <th>Purpose</th>
                        <th>Duration</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className="font-mono text-sm">cookie-consent</td>
                        <td>Stores your cookie preferences</td>
                        <td>1 year</td>
                      </tr>
                      <tr>
                        <td className="font-mono text-sm">session_id</td>
                        <td>Maintains user session</td>
                        <td>Session</td>
                      </tr>
                      <tr>
                        <td className="font-mono text-sm">csrf_token</td>
                        <td>Security protection</td>
                        <td>Session</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Analytics Cookies */}
            <div className="bg-gradient-to-r from-periwinkle-light/30 to-purple-light/20 rounded-2xl p-8 border border-periwinkle-dark/20 shadow-lg hover:shadow-xl transition-all duration-300">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-white rounded-lg shadow-sm">
                  <BarChart className="h-6 w-6 text-periwinkle-dark" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <h3 className="!mt-0 text-xl">Analytics Cookies</h3>
                    <span className="px-3 py-1 bg-periwinkle-dark/20 text-periwinkle-dark text-sm font-medium rounded-full">
                      Optional
                    </span>
                  </div>
                  <p className="text-gray mb-4">
                    Help us understand how visitors interact with our website by collecting anonymous data.
                  </p>
                  
                  <table className="legal-table !my-0">
                    <thead>
                      <tr>
                        <th>Cookie Name</th>
                        <th>Purpose</th>
                        <th>Duration</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className="font-mono text-sm">_ga</td>
                        <td>Google Analytics tracking</td>
                        <td>2 years</td>
                      </tr>
                      <tr>
                        <td className="font-mono text-sm">_gid</td>
                        <td>Google Analytics session</td>
                        <td>24 hours</td>
                      </tr>
                      <tr>
                        <td className="font-mono text-sm">_gat</td>
                        <td>Rate limiting</td>
                        <td>1 minute</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Marketing Cookies */}
            <div className="bg-gradient-to-r from-purple-light/30 to-purple-mid/10 rounded-2xl p-8 border border-purple-mid/20 shadow-lg hover:shadow-xl transition-all duration-300">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-white rounded-lg shadow-sm">
                  <Megaphone className="h-6 w-6 text-purple-dark" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <h3 className="!mt-0 text-xl">Marketing Cookies</h3>
                    <span className="px-3 py-1 bg-purple-dark/20 text-purple-dark text-sm font-medium rounded-full">
                      Optional
                    </span>
                  </div>
                  <p className="text-gray mb-4">
                    Track visitors across websites to display relevant advertisements and measure campaign effectiveness.
                  </p>
                  
                  <table className="legal-table !my-0">
                    <thead>
                      <tr>
                        <th>Cookie Name</th>
                        <th>Purpose</th>
                        <th>Duration</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className="font-mono text-sm">_fbp</td>
                        <td>Facebook Pixel tracking</td>
                        <td>3 months</td>
                      </tr>
                      <tr>
                        <td className="font-mono text-sm">_gcl_au</td>
                        <td>Google Ads conversion</td>
                        <td>3 months</td>
                      </tr>
                      <tr>
                        <td className="font-mono text-sm">li_sugr</td>
                        <td>LinkedIn insights</td>
                        <td>3 months</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Managing Cookies */}
        <section className="legal-section">
          <h2>Managing Your Cookie Preferences</h2>
          
          <div className="grid md:grid-cols-2 gap-6 mb-8">
            <div className="legal-highlight-box">
              <Settings className="h-8 w-8 text-purple-dark mb-4" />
              <h3 className="!mt-0">Cookie Settings</h3>
              <p className="mb-4">
                You can manage your cookie preferences at any time through our cookie consent banner 
                or by clicking the "Cookie Settings" link in our footer.
              </p>
              <button className="px-4 py-2 bg-purple-dark text-white rounded-lg hover:bg-purple-mid transition-colors">
                Manage Cookie Settings
              </button>
            </div>
            
            <div className="legal-highlight-box">
              <Chrome className="h-8 w-8 text-periwinkle-dark mb-4" />
              <h3 className="!mt-0">Browser Controls</h3>
              <p className="mb-4">
                Most browsers allow you to control cookies through their settings. You can block or 
                delete cookies, but this may affect website functionality.
              </p>
              <a href="#browser-settings" className="text-purple-dark hover:text-purple-mid">
                View browser instructions →
              </a>
            </div>
          </div>

          <div id="browser-settings" className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-8 shadow-lg">
            <h3 className="text-lg mb-4">Browser-Specific Instructions</h3>
            <div className="grid sm:grid-cols-2 gap-4">
              {[
                { name: "Google Chrome", url: "https://support.google.com/chrome/answer/95647" },
                { name: "Mozilla Firefox", url: "https://support.mozilla.org/en-US/kb/enable-and-disable-cookies-website-preferences" },
                { name: "Safari", url: "https://support.apple.com/guide/safari/manage-cookies-and-website-data-sfri11471/mac" },
                { name: "Microsoft Edge", url: "https://support.microsoft.com/en-us/help/17442/windows-internet-explorer-delete-manage-cookies" },
              ].map((browser) => (
                <a
                  key={browser.name}
                  href={browser.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-3 bg-white rounded-lg border border-purple-light/20 hover:border-purple-mid transition-colors"
                >
                  <Globe className="h-5 w-5 text-purple-dark" />
                  <span className="text-navy-dark">{browser.name}</span>
                </a>
              ))}
            </div>
          </div>
        </section>

        {/* Impact of Disabling Cookies */}
        <section className="legal-section">
          <h2>Impact of Disabling Cookies</h2>
          
          <div className="legal-warning-box">
            <h3 className="!mt-0 flex items-center gap-3">
              <CheckCircle className="h-6 w-6 text-mint-dark" />
              What You Should Know
            </h3>
            <p className="mb-4">
              Disabling certain cookies may affect your experience on our website:
            </p>
            <ul className="space-y-2">
              <li className="flex items-start gap-3">
                <span className="text-mint-dark mt-1">•</span>
                <span><strong>Necessary cookies:</strong> Cannot be disabled. Required for basic functionality.</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-mint-dark mt-1">•</span>
                <span><strong>Analytics cookies:</strong> Disabling may limit our ability to improve services.</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-mint-dark mt-1">•</span>
                <span><strong>Marketing cookies:</strong> You may see less relevant advertisements.</span>
              </li>
            </ul>
          </div>
        </section>

        {/* Contact Information */}
        <section className="legal-section">
          <h2>Questions About Cookies?</h2>
          
          <div className="legal-contact-card">
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <h3 className="!mt-0 text-xl mb-4">Get in Touch</h3>
                <p className="mb-4">
                  If you have questions about our use of cookies or this policy, we're here to help.
                </p>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-gray mb-1">Email</p>
                    <a href="mailto:privacy@shesharp.org.nz" className="text-purple-dark hover:text-purple-mid">
                      privacy@shesharp.org.nz
                    </a>
                  </div>
                  <div>
                    <p className="text-sm text-gray mb-1">Website</p>
                    <a href="https://www.shesharp.org.nz" className="text-purple-dark hover:text-purple-mid">
                      www.shesharp.org.nz
                    </a>
                  </div>
                </div>
              </div>
              
              <div>
                <h3 className="!mt-0 text-xl mb-4">Policy Updates</h3>
                <p className="mb-4">
                  We may update this Cookie Policy from time to time. Check the "Last Updated" date 
                  at the top of this page for the latest version.
                </p>
                <div className="p-4 bg-purple-light/20 rounded-lg">
                  <p className="text-sm text-navy-dark mb-0">
                    <strong>Note:</strong> Material changes will be communicated through our website 
                    or email notifications.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </LegalPageLayout>
  );
}
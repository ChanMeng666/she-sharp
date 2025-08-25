import { Shield, Lock, AlertTriangle, UserCheck, FileWarning, Bug, Key, RefreshCw, CheckCircle, Mail } from "lucide-react";
import { LegalPageLayout } from "@/components/legal-page-layout";
import "@/components/legal-page-styles.css";

export const metadata = {
  title: "Security Policy | She Sharp",
  description: "Learn about She Sharp's security practices and how to report security vulnerabilities.",
};

export default function SecurityPolicyPage() {
  return (
    <LegalPageLayout 
      title="Security Policy" 
      icon={<Lock className="h-12 w-12 text-white" />}
    >
      <div className="legal-content">
        {/* Introduction */}
        <section className="legal-section">
          <div className="legal-info-box">
            <h2 className="!mt-0">Our Security Commitment</h2>
            <p className="text-lg mb-4">
              At She Sharp, we take the security of our members' data seriously. This policy outlines 
              our security practices, how we protect your information, and how you can help us maintain 
              a secure environment for our community.
            </p>
            <div className="flex items-center gap-3 p-4 bg-white/50 rounded-lg">
              <Shield className="h-5 w-5 text-purple-dark flex-shrink-0" />
              <p className="text-sm text-navy-dark mb-0">
                Security is a shared responsibility. We implement best practices and encourage our community 
                to follow security guidelines.
              </p>
            </div>
          </div>
        </section>

        {/* Security Measures */}
        <section className="legal-section">
          <h2>Security Measures We Implement</h2>
          
          <div className="grid md:grid-cols-2 gap-8 mb-8">
            <div className="bg-gradient-to-br from-purple-light/20 to-periwinkle-light/20 rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-purple-dark/10 rounded-lg">
                  <Lock className="h-6 w-6 text-purple-dark" />
                </div>
                <div>
                  <h3 className="!mt-0 text-lg">Data Encryption</h3>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-purple-dark mt-0.5 flex-shrink-0" />
                      <span>SSL/TLS encryption for all data in transit</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-purple-dark mt-0.5 flex-shrink-0" />
                      <span>Encrypted storage for sensitive information</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-purple-dark mt-0.5 flex-shrink-0" />
                      <span>Secure password hashing with Argon2</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
            
            <div className="bg-gradient-to-br from-periwinkle-light/20 to-mint-light/20 rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-periwinkle-dark/10 rounded-lg">
                  <UserCheck className="h-6 w-6 text-periwinkle-dark" />
                </div>
                <div>
                  <h3 className="!mt-0 text-lg">Access Control</h3>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-periwinkle-dark mt-0.5 flex-shrink-0" />
                      <span>Multi-factor authentication available</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-periwinkle-dark mt-0.5 flex-shrink-0" />
                      <span>Role-based access permissions</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-periwinkle-dark mt-0.5 flex-shrink-0" />
                      <span>Regular access reviews and audits</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            {[
              { icon: RefreshCw, title: "Regular Updates", desc: "Security patches and system updates", color: "mint" },
              { icon: FileWarning, title: "Activity Monitoring", desc: "Real-time threat detection", color: "purple" },
              { icon: Key, title: "Secure APIs", desc: "Protected endpoints with authentication", color: "periwinkle" },
            ].map((measure) => (
              <div 
                key={measure.title} 
                className={`p-4 rounded-lg border ${
                  measure.color === "purple" 
                    ? "bg-purple-light/10 border-purple-light/30"
                    : measure.color === "periwinkle"
                    ? "bg-periwinkle-light/10 border-periwinkle-light/30"
                    : "bg-mint-light/10 border-mint-light/30"
                }`}
              >
                <measure.icon className={`h-6 w-6 mb-3 ${
                  measure.color === "purple" 
                    ? "text-purple-dark"
                    : measure.color === "periwinkle"
                    ? "text-periwinkle-dark"
                    : "text-mint-dark"
                }`} />
                <h4 className="font-semibold text-navy-dark mb-1">{measure.title}</h4>
                <p className="text-sm text-gray">{measure.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Vulnerability Reporting */}
        <section className="legal-section">
          <h2>Reporting Security Vulnerabilities</h2>
          
          <div className="legal-warning-box">
            <div className="flex items-start gap-4">
              <Bug className="h-6 w-6 text-mint-dark mt-1" />
              <div className="flex-1">
                <h3 className="!mt-0 text-lg">Responsible Disclosure Program</h3>
                <p className="mb-4">
                  We appreciate the security research community's efforts in helping keep our members safe. 
                  If you discover a security vulnerability, please report it responsibly.
                </p>
                
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-semibold text-navy-dark mb-3">How to Report</h4>
                    <ol className="space-y-2 text-sm">
                      <li className="flex items-start gap-2">
                        <span className="font-semibold text-mint-dark">1.</span>
                        <span>Email security@shesharp.org.nz with details</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="font-semibold text-mint-dark">2.</span>
                        <span>Include steps to reproduce the issue</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="font-semibold text-mint-dark">3.</span>
                        <span>Allow us time to investigate and fix</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="font-semibold text-mint-dark">4.</span>
                        <span>Avoid public disclosure until resolved</span>
                      </li>
                    </ol>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold text-navy-dark mb-3">What to Include</h4>
                    <ul className="space-y-2 text-sm">
                      <li className="flex items-start gap-2">
                        <span className="text-mint-dark">•</span>
                        <span>Type of vulnerability</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-mint-dark">•</span>
                        <span>Affected URLs or components</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-mint-dark">•</span>
                        <span>Proof of concept (if applicable)</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-mint-dark">•</span>
                        <span>Your contact information</span>
                      </li>
                    </ul>
                  </div>
                </div>
                
                <div className="mt-6 p-4 bg-white/50 rounded-lg">
                  <p className="text-sm text-navy-dark mb-0">
                    <strong>Response Time:</strong> We aim to acknowledge receipt within 48 hours and provide 
                    an initial assessment within 5 business days.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Security Best Practices for Users */}
        <section className="legal-section">
          <h2>Security Best Practices for Members</h2>
          
          <div className="space-y-6">
            <p className="mb-6">
              Help us maintain a secure environment by following these best practices:
            </p>
            
            <div className="grid md:grid-cols-2 gap-6">
              <div className="legal-highlight-box">
                <h3 className="!mt-0 flex items-center gap-3">
                  <Key className="h-6 w-6 text-purple-dark" />
                  Account Security
                </h3>
                <ul className="space-y-3">
                  <li className="flex items-start gap-3">
                    <CheckCircle className="h-4 w-4 text-purple-dark mt-0.5 flex-shrink-0" />
                    <span className="text-sm">Use a strong, unique password</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle className="h-4 w-4 text-purple-dark mt-0.5 flex-shrink-0" />
                    <span className="text-sm">Enable two-factor authentication when available</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle className="h-4 w-4 text-purple-dark mt-0.5 flex-shrink-0" />
                    <span className="text-sm">Don't share your login credentials</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle className="h-4 w-4 text-purple-dark mt-0.5 flex-shrink-0" />
                    <span className="text-sm">Log out when using shared computers</span>
                  </li>
                </ul>
              </div>
              
              <div className="legal-highlight-box">
                <h3 className="!mt-0 flex items-center gap-3">
                  <AlertTriangle className="h-6 w-6 text-purple-dark" />
                  Staying Safe Online
                </h3>
                <ul className="space-y-3">
                  <li className="flex items-start gap-3">
                    <CheckCircle className="h-4 w-4 text-periwinkle-dark mt-0.5 flex-shrink-0" />
                    <span className="text-sm">Verify emails claiming to be from She Sharp</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle className="h-4 w-4 text-periwinkle-dark mt-0.5 flex-shrink-0" />
                    <span className="text-sm">Don't click suspicious links</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle className="h-4 w-4 text-periwinkle-dark mt-0.5 flex-shrink-0" />
                    <span className="text-sm">Report phishing attempts immediately</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle className="h-4 w-4 text-periwinkle-dark mt-0.5 flex-shrink-0" />
                    <span className="text-sm">Keep your devices updated</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* Data Breach Response */}
        <section className="legal-section">
          <h2>Data Breach Response</h2>
          
          <div className="bg-gradient-to-r from-purple-light/30 to-periwinkle-light/30 rounded-xl p-6">
            <h3 className="!mt-0">Our Incident Response Commitment</h3>
            <p className="mb-4">
              In the unlikely event of a data breach, we have procedures in place to respond quickly 
              and transparently:
            </p>
            
            <div className="legal-numbered-list">
              <div className="flex items-start gap-4">
                <span className="number">1</span>
                <div>
                  <h4 className="font-semibold text-navy-dark mb-2">Immediate Containment</h4>
                  <p className="text-sm text-gray">Isolate affected systems and prevent further unauthorized access.</p>
                </div>
              </div>
              
              <div className="flex items-start gap-4">
                <span className="number">2</span>
                <div>
                  <h4 className="font-semibold text-navy-dark mb-2">Assessment & Investigation</h4>
                  <p className="text-sm text-gray">Determine the scope and impact of the breach.</p>
                </div>
              </div>
              
              <div className="flex items-start gap-4">
                <span className="number">3</span>
                <div>
                  <h4 className="font-semibold text-navy-dark mb-2">Notification</h4>
                  <p className="text-sm text-gray">Inform affected users within 72 hours as required by law.</p>
                </div>
              </div>
              
              <div className="flex items-start gap-4">
                <span className="number">4</span>
                <div>
                  <h4 className="font-semibold text-navy-dark mb-2">Remediation</h4>
                  <p className="text-sm text-gray">Implement fixes and strengthen security measures.</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Security Updates */}
        <section className="legal-section">
          <h2>Security Updates & Transparency</h2>
          
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h3>Regular Security Reviews</h3>
              <p className="mb-4">
                We conduct regular security assessments including:
              </p>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start gap-2">
                  <span className="text-purple-dark">•</span>
                  <span>Quarterly security audits</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-purple-dark">•</span>
                  <span>Penetration testing</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-purple-dark">•</span>
                  <span>Code reviews</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-purple-dark">•</span>
                  <span>Dependency updates</span>
                </li>
              </ul>
            </div>
            
            <div>
              <h3>Transparency Reports</h3>
              <p className="mb-4">
                We believe in transparency about our security practices:
              </p>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start gap-2">
                  <span className="text-periwinkle-dark">•</span>
                  <span>Annual security summary</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-periwinkle-dark">•</span>
                  <span>Incident statistics (anonymized)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-periwinkle-dark">•</span>
                  <span>Security improvements made</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-periwinkle-dark">•</span>
                  <span>Community security tips</span>
                </li>
              </ul>
            </div>
          </div>
        </section>

        {/* Contact Information */}
        <section className="legal-section">
          <h2>Security Contact</h2>
          
          <div className="legal-contact-card">
            <div className="flex items-start gap-4">
              <Mail className="h-8 w-8 text-purple-dark mt-1" />
              <div className="flex-1">
                <h3 className="!mt-0 text-xl mb-4">Get in Touch</h3>
                <p className="mb-6">
                  For security-related questions, vulnerability reports, or concerns about your account security, 
                  please contact our security team.
                </p>
                
                <div className="grid sm:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-semibold text-navy-dark mb-2">Security Team</h4>
                    <a href="mailto:security@shesharp.org.nz" className="text-purple-dark hover:text-purple-mid transition-colors">
                      security@shesharp.org.nz
                    </a>
                    <p className="text-sm text-gray mt-2">
                      For vulnerability reports and security incidents
                    </p>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold text-navy-dark mb-2">General Support</h4>
                    <a href="mailto:support@shesharp.org.nz" className="text-purple-dark hover:text-purple-mid transition-colors">
                      support@shesharp.org.nz
                    </a>
                    <p className="text-sm text-gray mt-2">
                      For account help and general questions
                    </p>
                  </div>
                </div>
                
                <div className="mt-6 p-4 bg-purple-light/20 rounded-lg">
                  <p className="text-sm text-navy-dark mb-0">
                    <strong>Encryption Available:</strong> We support PGP encryption for sensitive communications. 
                    Request our public key when contacting security@shesharp.org.nz.
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
import { FileText, Users, Calendar, Camera, Scale, AlertTriangle, Briefcase, HelpCircle } from "lucide-react";
import { LegalPageLayout } from "@/components/legal-page-layout";
import "@/components/legal-page-styles.css";

export const metadata = {
  title: "Terms of Service | She Sharp",
  description: "Terms of service for using She Sharp's website and participating in our programs.",
};

export default function TermsOfServicePage() {
  return (
    <LegalPageLayout 
      title="Terms of Service" 
      icon={<FileText className="h-12 w-12 text-white" />}
    >
      <div className="legal-content">
        {/* Introduction */}
        <section className="legal-section">
          <div className="legal-info-box">
            <h2 className="!mt-0">Agreement to Terms</h2>
            <p className="text-lg mb-4">
              By accessing or using the She Sharp website and services, you agree to be bound by these 
              Terms of Service. If you do not agree to these terms, please do not use our services.
            </p>
            <div className="flex items-center gap-3 p-4 bg-white/50 rounded-lg">
              <Scale className="h-5 w-5 text-foreground flex-shrink-0" />
              <p className="text-sm text-foreground mb-0">
                These terms constitute a legally binding agreement between you and She Sharp (Registered NZ Charity CC57025).
              </p>
            </div>
          </div>
        </section>

        {/* About She Sharp */}
        <section className="legal-section">
          <h2>About She Sharp</h2>
          
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            <div className="text-center p-8 bg-muted rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
              <div className="mx-auto w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
                <Users className="h-8 w-8 text-foreground" />
              </div>
              <h3 className="!mt-0 text-lg">Our Mission</h3>
              <p className="text-sm text-gray mb-0">
                Bridging the gender gap in STEM fields
              </p>
            </div>
            
            <div className="text-center p-8 bg-muted rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
              <div className="mx-auto w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
                <Briefcase className="h-8 w-8 text-foreground" />
              </div>
              <h3 className="!mt-0 text-lg">What We Do</h3>
              <p className="text-sm text-gray mb-0">
                Networking, mentorship, and career development
              </p>
            </div>
            
            <div className="text-center p-8 bg-muted rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
              <div className="mx-auto w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
                <Calendar className="h-8 w-8 text-foreground" />
              </div>
              <h3 className="!mt-0 text-lg">Since 2014</h3>
              <p className="text-sm text-gray mb-0">
                84+ events empowering women in tech
              </p>
            </div>
          </div>
        </section>

        {/* Use of Services */}
        <section className="legal-section">
          <h2>Use of Services</h2>
          
          <div className="space-y-6">
            <div className="legal-highlight-box">
              <h3 className="!mt-0 flex items-center gap-3">
                <Users className="h-6 w-6 text-foreground" />
                Eligibility Requirements
              </h3>
              <p className="mb-4">
                Our services are available to individuals who are 16 years of age or older. 
                By using our services, you represent that you meet this age requirement.
              </p>
              <div className="p-4 bg-white/50 rounded-lg">
                <p className="text-sm text-foreground mb-0">
                  <strong>Note:</strong> Some programs may have additional eligibility criteria 
                  specific to the program objectives.
                </p>
              </div>
            </div>

            <div className="legal-highlight-box">
              <h3 className="!mt-0 flex items-center gap-3">
                <AlertTriangle className="h-6 w-6 text-foreground" />
                Acceptable Use Policy
              </h3>
              <p className="mb-4">When using our services, you agree to:</p>
              
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="bg-muted rounded-lg p-4">
                  <h4 className="font-semibold text-foreground mb-3 text-sm">DO</h4>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-start gap-2">
                      <span className="text-foreground mt-0.5">✓</span>
                      <span>Provide accurate information</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-foreground mt-0.5">✓</span>
                      <span>Respect other members</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-foreground mt-0.5">✓</span>
                      <span>Follow event guidelines</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-foreground mt-0.5">✓</span>
                      <span>Comply with laws</span>
                    </li>
                  </ul>
                </div>
                
                <div className="bg-error/10 rounded-lg p-4">
                  <h4 className="font-semibold text-foreground mb-3 text-sm">DON'T</h4>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-start gap-2">
                      <span className="text-error mt-0.5">✗</span>
                      <span>Engage in harassment</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-error mt-0.5">✗</span>
                      <span>Share false information</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-error mt-0.5">✗</span>
                      <span>Solicit without permission</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-error mt-0.5">✗</span>
                      <span>Violate privacy</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Event Participation */}
        <section className="legal-section">
          <h2>Event Participation</h2>
          
          <div className="space-y-6">
            <div className="flex items-start gap-4">
              <div className="number">1</div>
              <div className="flex-1">
                <h3 className="!mt-0 text-lg">Registration & Attendance</h3>
                <p>
                  Event registration is subject to availability. We reserve the right to refuse or 
                  cancel registrations at our discretion. Registered attendees are expected to honor 
                  their commitment or cancel in advance.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="number">2</div>
              <div className="flex-1">
                <h3 className="!mt-0 text-lg">Code of Conduct</h3>
                <p>
                  All participants must maintain professional behavior and respect for others. 
                  Violations may result in removal from events and suspension from future activities.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="number">3</div>
              <div className="flex-1">
                <h3 className="!mt-0 text-lg">Photography & Recording</h3>
                <div className="legal-warning-box !my-4">
                  <div className="flex items-start gap-3">
                    <Camera className="h-5 w-5 text-foreground mt-1 flex-shrink-0" />
                    <div>
                      <p className="mb-2">
                        By attending our events, you consent to being photographed or recorded. 
                        We may use these materials for promotional purposes.
                      </p>
                      <p className="text-sm mb-0">
                        If you prefer not to be photographed, please notify event staff upon arrival.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Intellectual Property */}
        <section className="legal-section">
          <h2>Intellectual Property</h2>
          
          <div className="grid md:grid-cols-2 gap-6">
            <div className="legal-highlight-box">
              <h3 className="!mt-0">Our Content</h3>
              <p className="mb-4">
                All content on our website, including text, graphics, logos, and images, is the 
                property of She Sharp or its content suppliers and is protected by copyright laws.
              </p>
              <div className="text-sm text-foreground/80">
                <strong>You may not:</strong>
                <ul className="mt-2 space-y-1">
                  <li>• Reproduce without permission</li>
                  <li>• Create derivative works</li>
                  <li>• Use for commercial purposes</li>
                </ul>
              </div>
            </div>
            
            <div className="legal-highlight-box">
              <h3 className="!mt-0">Your Content</h3>
              <p className="mb-4">
                By submitting content to our website or services, you grant She Sharp a 
                non-exclusive, royalty-free license to use, reproduce, and display such content.
              </p>
              <div className="text-sm text-foreground/80">
                <strong>You retain:</strong>
                <ul className="mt-2 space-y-1">
                  <li>• Ownership of your content</li>
                  <li>• Right to use elsewhere</li>
                  <li>• Right to request removal</li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* Limitation of Liability */}
        <section className="legal-section">
          <h2>Disclaimers & Limitations</h2>
          
          <div className="legal-warning-box">
            <h3 className="!mt-0 flex items-center gap-3">
              <AlertTriangle className="h-6 w-6 text-foreground" />
              Important Legal Notice
            </h3>
            
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold text-foreground mb-2">Service Disclaimer</h4>
                <p className="text-sm">
                  Our services are provided "as is" without warranties of any kind. We do not guarantee 
                  specific outcomes from participation in our programs or the accuracy of all information 
                  on our website.
                </p>
              </div>
              
              <div>
                <h4 className="font-semibold text-foreground mb-2">Limitation of Liability</h4>
                <p className="text-sm">
                  To the fullest extent permitted by law, She Sharp shall not be liable for any indirect, 
                  incidental, special, or consequential damages arising from your use of our services.
                </p>
              </div>
              
              <div>
                <h4 className="font-semibold text-foreground mb-2">Indemnification</h4>
                <p className="text-sm mb-0">
                  You agree to indemnify and hold harmless She Sharp, its officers, directors, employees, 
                  and volunteers from any claims arising from your use of our services or violation of 
                  these terms.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Modifications & Governing Law */}
        <section className="legal-section">
          <h2>General Provisions</h2>
          
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h3>Modifications to Terms</h3>
              <p>
                We reserve the right to modify these Terms of Service at any time. Material changes 
                will be communicated through our website or email notifications.
              </p>
            </div>
            
            <div>
              <h3>Governing Law</h3>
              <p>
                These Terms are governed by the laws of New Zealand. Any disputes shall be resolved 
                in the courts of New Zealand.
              </p>
            </div>
          </div>
        </section>

        {/* Contact Information */}
        <section className="legal-section">
          <h2>Questions?</h2>
          
          <div className="legal-contact-card">
            <div className="flex items-start gap-4">
              <HelpCircle className="h-8 w-8 text-foreground mt-1" />
              <div className="flex-1">
                <h3 className="!mt-0 text-xl mb-4">We're Here to Help</h3>
                <p className="mb-6">
                  If you have questions about these Terms of Service or need clarification on any 
                  policies, please don't hesitate to contact us.
                </p>
                
                <div className="grid sm:grid-cols-3 gap-6">
                  <div>
                    <p className="text-sm text-gray mb-1">Email</p>
                    <a href="mailto:legal@shesharp.org.nz" className="text-foreground hover:text-foreground/80">
                      legal@shesharp.org.nz
                    </a>
                  </div>
                  
                  <div>
                    <p className="text-sm text-gray mb-1">Charity Number</p>
                    <p className="text-foreground">CC57025</p>
                  </div>
                  
                  <div>
                    <p className="text-sm text-gray mb-1">Updated</p>
                    <p className="text-foreground">
                      {new Date().toLocaleDateString('en-NZ', { month: 'long', year: 'numeric' })}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </LegalPageLayout>
  );
}
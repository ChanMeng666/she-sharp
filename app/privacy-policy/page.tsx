import { Shield, Lock, Eye, Users, Database, Mail, Globe, AlertCircle, Info, CheckCircle } from "lucide-react";
import { LegalPageLayout } from "@/components/legal-page-layout";
import "@/components/legal-page-styles.css";

export const metadata = {
  title: "Privacy Policy | She Sharp",
  description: "She Sharp's privacy policy - how we collect, use, and protect your personal information.",
};

export default function PrivacyPolicyPage() {
  return (
    <LegalPageLayout 
      title="Privacy Policy" 
      icon={<Shield className="h-12 w-12 text-white" />}
    >
      <div className="legal-content">
        {/* Introduction */}
        <section className="legal-section">
          <div className="legal-info-box">
            <h2 className="!mt-0">Your Privacy Matters</h2>
            <p className="text-lg mb-0">
              At She Sharp, we're committed to handling your personal information with care and transparency, 
              in line with the New Zealand Privacy Act 2020.
            </p>
          </div>
          
          <p className="mt-6">
            This policy outlines how we collect, use, store, and protect the personal information you share 
            with us when you engage with our events, volunteer activities, or other initiatives.
          </p>
        </section>

        {/* What We Collect */}
        <section className="legal-section">
          <h2>What We Collect</h2>
          
          <p className="mb-6">
            We collect personal information when you engage with us — whether you're attending an event, 
            speaking, or volunteering. This may include:
          </p>
          
          <div className="space-y-6 mb-8">
            {/* Event Attendees */}
            <div className="bg-gradient-to-r from-purple-light/30 to-purple-light/10 rounded-2xl p-8 border border-purple-light/20 shadow-lg hover:shadow-xl transition-all duration-300">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-white rounded-lg shadow-sm flex-shrink-0">
                  <Users className="h-6 w-6 text-purple-dark" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-3">
                    <h3 className="!mt-0 text-xl">Event Attendees</h3>
                    <span className="px-3 py-1 bg-purple-dark/20 text-purple-dark text-sm font-medium rounded-full">
                      Registration Data
                    </span>
                  </div>
                  <p className="text-gray mb-4">
                    Information collected during ticket purchase and event registration.
                  </p>
                  <p className="text-sm text-gray mb-0">
                    <em>Collected during ticket purchase</em>
                  </p>
                  
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-purple-dark rounded-full"></div>
                        <span className="text-sm text-navy-dark">Name</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-purple-dark rounded-full"></div>
                        <span className="text-sm text-navy-dark">Company</span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-purple-dark rounded-full"></div>
                        <span className="text-sm text-navy-dark">Email address</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-purple-dark rounded-full"></div>
                        <span className="text-sm text-navy-dark">Dietary requirements</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Speakers */}
            <div className="bg-gradient-to-r from-periwinkle-light/30 to-periwinkle-light/10 rounded-2xl p-8 border border-periwinkle-dark/20 shadow-lg hover:shadow-xl transition-all duration-300">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-white rounded-lg shadow-sm flex-shrink-0">
                  <Globe className="h-6 w-6 text-periwinkle-dark" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-3">
                    <h3 className="!mt-0 text-xl">Speakers</h3>
                    <span className="px-3 py-1 bg-periwinkle-dark/20 text-periwinkle-dark text-sm font-medium rounded-full">
                      Professional Info
                    </span>
                  </div>
                  <p className="text-gray mb-4">
                    Information used to promote your involvement and manage event logistics.
                  </p>
                  <p className="text-sm text-gray mb-0">
                    <em>To promote your involvement and manage event logistics</em>
                  </p>
                  
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-periwinkle-dark rounded-full"></div>
                        <span className="text-sm text-navy-dark">Name</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-periwinkle-dark rounded-full"></div>
                        <span className="text-sm text-navy-dark">Company</span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-periwinkle-dark rounded-full"></div>
                        <span className="text-sm text-navy-dark">Job title</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-periwinkle-dark rounded-full"></div>
                        <span className="text-sm text-navy-dark">Photo</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Volunteers/Ambassadors */}
            <div className="bg-gradient-to-r from-mint-light/30 to-mint-light/10 rounded-2xl p-8 border border-mint-light/20 shadow-lg hover:shadow-xl transition-all duration-300">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-white rounded-lg shadow-sm flex-shrink-0">
                  <Database className="h-6 w-6 text-mint-dark" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-3">
                    <h3 className="!mt-0 text-xl">Volunteers/Ambassadors</h3>
                    <span className="px-3 py-1 bg-mint-dark/20 text-mint-dark text-sm font-medium rounded-full">
                      CV & Background
                    </span>
                  </div>
                  <p className="text-gray mb-4">
                    Information to help us match you with suitable opportunities.
                  </p>
                  <p className="text-sm text-gray mb-0">
                    <em>To help us match you with suitable opportunities</em>
                  </p>
                  
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-mint-dark rounded-full"></div>
                        <span className="text-sm text-navy-dark">Your CV</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-mint-dark rounded-full"></div>
                        <span className="text-sm text-navy-dark">Name</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-mint-dark rounded-full"></div>
                        <span className="text-sm text-navy-dark">Address</span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-mint-dark rounded-full"></div>
                        <span className="text-sm text-navy-dark">Mobile number</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-mint-dark rounded-full"></div>
                        <span className="text-sm text-navy-dark">Work history</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Why We Collect Your Information */}
        <section className="legal-section">
          <h2>Why We Collect Your Information</h2>
          
          <p className="mb-6">
            We collect your personal information in order to:
          </p>
          
          <div className="legal-numbered-list">
            <div className="flex items-start gap-4">
              <span className="number">1</span>
              <div>
                <h4 className="font-semibold text-navy-dark mb-2">Event Management</h4>
                <p className="text-gray">Organise and manage events effectively</p>
              </div>
            </div>
            
            <div className="flex items-start gap-4">
              <span className="number">2</span>
              <div>
                <h4 className="font-semibold text-navy-dark mb-2">Communication</h4>
                <p className="text-gray">Communicate important event details with attendees, speakers, and volunteers</p>
              </div>
            </div>
            
            <div className="flex items-start gap-4">
              <span className="number">3</span>
              <div>
                <h4 className="font-semibold text-navy-dark mb-2">Promotion</h4>
                <p className="text-gray">Promote speaker involvement on our website, social media, and other materials</p>
              </div>
            </div>
            
            <div className="flex items-start gap-4">
              <span className="number">4</span>
              <div>
                <h4 className="font-semibold text-navy-dark mb-2">Volunteer Matching</h4>
                <p className="text-gray">Match volunteers to relevant activities based on experience and skills</p>
              </div>
            </div>
            
            <div className="flex items-start gap-4">
              <span className="number">5</span>
              <div>
                <h4 className="font-semibold text-navy-dark mb-2">Service Improvement</h4>
                <p className="text-gray">Improve our event planning and engagement strategies</p>
              </div>
            </div>
            
            <div className="flex items-start gap-4">
              <span className="number">6</span>
              <div>
                <h4 className="font-semibold text-navy-dark mb-2">Future Engagement</h4>
                <p className="text-gray">Keep you informed about future events, initiatives, and opportunities related to She Sharp</p>
              </div>
            </div>
          </div>
        </section>

        {/* Who We Share Your Information With */}
        <section className="legal-section">
          <h2>Who We Share Your Information With</h2>
          
          <p className="mb-6">
            In general, your information is only shared internally with our organising team. However, 
            in some cases, we may share relevant details with:
          </p>
          
          <div className="space-y-6 mb-8">
            {/* Event Partners & Sponsors */}
            <div className="bg-gradient-to-r from-purple-light/30 to-purple-light/10 rounded-2xl p-8 border border-purple-light/20 shadow-lg hover:shadow-xl transition-all duration-300">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-white rounded-lg shadow-sm flex-shrink-0">
                  <Users className="h-6 w-6 text-purple-dark" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-3">
                    <h3 className="!mt-0 text-xl">Event Partners & Sponsors</h3>
                    <span className="px-3 py-1 bg-purple-dark/20 text-purple-dark text-sm font-medium rounded-full">
                      Event Coordination
                    </span>
                  </div>
                  <p className="text-gray mb-0">
                    For example, for dietary planning or speaker coordination
                  </p>
                  <p className="text-sm text-gray mt-2 mb-0">
                    <em>For example, for dietary planning or speaker coordination</em>
                  </p>
                </div>
              </div>
            </div>
            
            {/* Third-Party Platforms */}
            <div className="bg-gradient-to-r from-periwinkle-light/30 to-periwinkle-light/10 rounded-2xl p-8 border border-periwinkle-dark/20 shadow-lg hover:shadow-xl transition-all duration-300">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-white rounded-lg shadow-sm flex-shrink-0">
                  <Globe className="h-6 w-6 text-periwinkle-dark" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-3">
                    <h3 className="!mt-0 text-xl">Third-Party Platforms</h3>
                    <span className="px-3 py-1 bg-periwinkle-dark/20 text-periwinkle-dark text-sm font-medium rounded-full">
                      Service Providers
                    </span>
                  </div>
                  <p className="text-gray mb-0">
                    Used for ticketing, email communications, or event registrations (such as Humanitix, 
                    Google Forms, or Mailchimp)
                  </p>
                  <p className="text-sm text-gray mt-2 mb-0">
                    <em>Such as Humanitix, Google Forms, or Mailchimp</em>
                  </p>
                </div>
              </div>
            </div>
            
            {/* Website & Social Media */}
            <div className="bg-gradient-to-r from-mint-light/30 to-mint-light/10 rounded-2xl p-8 border border-mint-light/20 shadow-lg hover:shadow-xl transition-all duration-300">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-white rounded-lg shadow-sm flex-shrink-0">
                  <Globe className="h-6 w-6 text-mint-dark" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-3">
                    <h3 className="!mt-0 text-xl">Website & Social Media</h3>
                    <span className="px-3 py-1 bg-mint-dark/20 text-mint-dark text-sm font-medium rounded-full">
                      Promotion
                    </span>
                  </div>
                  <p className="text-gray mb-0">
                    When promoting event speakers or highlighting community stories
                  </p>
                  <p className="text-sm text-gray mt-2 mb-0">
                    <em>When promoting event speakers or highlighting community stories</em>
                  </p>
                </div>
              </div>
            </div>
            
            {/* Regulatory Authorities */}
            <div className="bg-gradient-to-r from-purple-light/30 to-purple-light/10 rounded-2xl p-8 border border-purple-light/20 shadow-lg hover:shadow-xl transition-all duration-300">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-white rounded-lg shadow-sm flex-shrink-0">
                  <Shield className="h-6 w-6 text-purple-dark" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-3">
                    <h3 className="!mt-0 text-xl">Regulatory Authorities</h3>
                    <span className="px-3 py-1 bg-purple-dark/20 text-purple-dark text-sm font-medium rounded-full">
                      Legal Requirements
                    </span>
                  </div>
                  <p className="text-gray mb-0">
                    Or law enforcement agencies, if required by law
                  </p>
                  <p className="text-sm text-gray mt-2 mb-0">
                    <em>If required by law</em>
                  </p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="legal-warning-box">
            <div className="flex items-start gap-4">
              <Lock className="h-6 w-6 text-mint-dark mt-1" />
              <div>
                <h3 className="!mt-0 text-lg">Important Note</h3>
                <p className="mb-0">
                  We do not sell or share your personal information with unauthorised third parties.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Optional Information */}
        <section className="legal-section">
          <h2>Optional Information</h2>
          
          <div className="legal-info-box">
            <div className="flex items-start gap-4">
              <Info className="h-6 w-6 text-purple-dark mt-1" />
              <div>
                <h3 className="!mt-0 text-lg">Your Choice</h3>
                <p className="mb-4">
                  Providing your information is entirely optional, but if you choose not to supply essential 
                  details (e.g. contact details, dietary needs), we may not be able to:
                </p>
                <ul className="space-y-2">
                  <li className="flex items-start gap-2">
                    <span className="text-purple-dark mt-0.5">•</span>
                    <span>Confirm your event registration</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-purple-dark mt-0.5">•</span>
                    <span>Tailor your event experience (e.g. catering to dietary restrictions)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-purple-dark mt-0.5">•</span>
                    <span>Connect you with appropriate volunteer opportunities</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* How We Keep Your Information Safe */}
        <section className="legal-section">
          <h2>How We Keep Your Information Safe</h2>
          
          <div className="space-y-6">
            <div className="legal-highlight-box">
              <div className="flex items-start gap-4">
                <Lock className="h-6 w-6 text-purple-dark" />
                <div>
                  <h3 className="!mt-0 text-lg">Access Control</h3>
                  <p className="mb-0">
                    We take your privacy seriously. Access to your personal information is limited to 
                    authorised She Sharp team members who have signed confidentiality agreements or 
                    non-disclosure agreements (NDAs).
                  </p>
                </div>
              </div>
            </div>
            
            <div className="legal-highlight-box">
              <div className="flex items-start gap-4">
                <Database className="h-6 w-6 text-periwinkle-dark" />
                <div>
                  <h3 className="!mt-0 text-lg">Data Retention</h3>
                  <p className="mb-0">
                    We retain your information only for as long as necessary to fulfil the purpose it 
                    was collected for, or to meet legal and operational requirements.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Accessing or Correcting Your Information */}
        <section className="legal-section">
          <h2>Accessing or Correcting Your Information</h2>
          
          <div className="grid md:grid-cols-2 gap-6 mb-8">
            <div className="legal-highlight-box">
              <div className="flex items-start gap-4">
                <Eye className="h-6 w-6 text-purple-dark" />
                <div>
                  <h3 className="!mt-0 text-lg">Your Rights</h3>
                  <p className="mb-0">
                    You have the right to access and correct any personal information we hold about you.
                  </p>
                </div>
              </div>
            </div>
            
            <div className="legal-highlight-box">
              <div className="flex items-start gap-4">
                <Mail className="h-6 w-6 text-periwinkle-dark" />
                <div>
                  <h3 className="!mt-0 text-lg">How to Request</h3>
                  <p className="mb-0">
                    To request a copy or update of your information, please contact us at 
                    <a href="mailto:info@shesharp.co.nz" className="text-purple-dark hover:text-purple-mid ml-1">
                      info@shesharp.co.nz
                    </a>
                  </p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="legal-warning-box">
            <div className="flex items-start gap-4">
              <AlertCircle className="h-6 w-6 text-mint-dark mt-1" />
              <div>
                <h3 className="!mt-0 text-lg">Identity Verification</h3>
                <p className="mb-0">
                  We may take steps to verify your identity before processing your request to ensure 
                  your privacy is protected.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Updates to This Policy */}
        <section className="legal-section">
          <h2>Updates to This Policy</h2>
          
          <div className="legal-info-box">
            <div className="flex items-start gap-4">
              <Info className="h-6 w-6 text-purple-dark mt-1" />
              <div>
                <h3 className="!mt-0 text-lg">Policy Changes</h3>
                <p className="mb-0">
                  This privacy policy may be updated from time to time. Any changes will be published 
                  on our website. By continuing to engage with She Sharp, you agree to the most recent 
                  version of this policy.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Contact Information */}
        <section className="legal-section">
          <h2>Contact Us</h2>
          
          <div className="legal-contact-card">
            <h3 className="!mt-0 text-xl mb-4">Privacy Questions or Concerns?</h3>
            <p className="mb-6">
              If you have questions about this Privacy Policy or our privacy practices, we're here to help.
            </p>
            
            <div className="grid sm:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold text-navy-dark mb-2">Email Us</h4>
                <a href="mailto:info@shesharp.co.nz" className="text-purple-dark hover:text-purple-mid transition-colors">
                  info@shesharp.co.nz
                </a>
              </div>
              
              <div>
                <h4 className="font-semibold text-navy-dark mb-2">Website</h4>
                <a href="https://www.shesharp.co.nz" className="text-purple-dark hover:text-purple-mid transition-colors">
                  www.shesharp.co.nz
                </a>
              </div>
            </div>
            
            <div className="mt-6 p-4 bg-purple-light/30 rounded-lg">
              <p className="text-sm text-navy-dark mb-0">
                <strong>Response Time:</strong> We aim to respond to all privacy inquiries within 5 business days.
              </p>
            </div>
          </div>
        </section>
      </div>
    </LegalPageLayout>
  );
}
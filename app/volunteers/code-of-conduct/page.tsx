import { FileText, Users, Shield, Lock, AlertTriangle, CheckCircle, Pen, Calendar, Mail } from "lucide-react";
import { LegalPageLayout } from "@/components/legal-page-layout";
import "@/components/legal-page-styles.css";

export const metadata = {
  title: "Ambassador Code of Conduct | She Sharp",
  description: "Code of Conduct for She Sharp volunteers and ambassadors outlining expected standards and responsibilities.",
};

export default function AmbassadorCodeOfConductPage() {
  return (
    <LegalPageLayout 
      title="Ambassador Code of Conduct"
      navTitle="Ambassador Code of Conduct"
      lastUpdated={new Date('2021-07-16')}
      icon={<Users className="h-12 w-12 text-white" />}
    >
      <div className="legal-content">
        {/* Organization Header */}
        <section className="legal-section">
          <div className="legal-info-box">
            <h2 className="!mt-0">She Sharp Charitable Trust</h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <p className="text-lg mb-4">
                  <strong>New Zealand Registered Charity No. CC57025</strong>
                </p>
                <p className="text-sm text-navy-dark">
                  Website: <a href="https://shesharp.org.nz" className="text-purple-dark hover:text-purple-mid">shesharp.org.nz</a>
                </p>
                <p className="text-sm text-navy-dark">
                  Contact: <a href="mailto:governance@shesharp.org.nz" className="text-purple-dark hover:text-purple-mid">governance@shesharp.org.nz</a>
                </p>
              </div>
              <div className="flex items-center gap-4 p-4 bg-white/50 rounded-lg">
                <Shield className="h-6 w-6 text-purple-dark flex-shrink-0" />
                <div>
                  <p className="text-sm text-navy-dark mb-0">
                    <strong>Purpose:</strong> This Code of Conduct informs volunteers and ambassadors 
                    on the standards of conduct required when representing She Sharp.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Agreement */}
        <section className="legal-section">
          <h2>Agreement</h2>
          <div className="legal-highlight-box">
            <p className="mb-4">
              The purpose of this Code of Conduct is to inform volunteers on the standards of conduct 
              required. Volunteers are expected to act honestly, conscientiously, reasonably and in good 
              faith at all times when carrying out their duties and in their relationships or interactions 
              with other people.
            </p>
            <div className="flex items-center gap-3 p-4 bg-white/50 rounded-lg">
              <Calendar className="h-5 w-5 text-purple-dark flex-shrink-0" />
              <p className="text-sm text-navy-dark mb-0">
                <strong>Effective Date:</strong> This agreement is effective from the date of joining our organisation.
              </p>
            </div>
          </div>
        </section>

        {/* Expected Behaviours */}
        <section className="legal-section">
          <h2>Expected Behaviours</h2>
          
          <div className="space-y-6">
            <p className="mb-6">
              At all times, we expect volunteers to:
            </p>
            
            <div className="legal-highlight-box">
              <h3 className="!mt-0 flex items-center gap-3">
                <CheckCircle className="h-6 w-6 text-purple-dark" />
                Professional Standards
              </h3>
              <ul className="space-y-3">
                <li className="flex items-start gap-3">
                  <span className="text-purple-dark mt-0.5">✓</span>
                  <span className="text-sm">Be present at the agreed times and tell us if you are not able to volunteer</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-purple-dark mt-0.5">✓</span>
                  <span className="text-sm">Carry out duties and responsibilities in a safe, efficient and competent way</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-purple-dark mt-0.5">✓</span>
                  <span className="text-sm">Maintain a good standard of dress and attire</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-purple-dark mt-0.5">✓</span>
                  <span className="text-sm">Comply with lawful and/or reasonable direction, instructions and policies</span>
                </li>
              </ul>
            </div>

            <div className="legal-highlight-box">
              <h3 className="!mt-0 flex items-center gap-3">
                <Lock className="h-6 w-6 text-periwinkle-dark" />
                Confidentiality & Resources
              </h3>
              <ul className="space-y-3">
                <li className="flex items-start gap-3">
                  <span className="text-periwinkle-dark mt-0.5">✓</span>
                  <span className="text-sm">Respect the privacy of individuals and the organisation and only use confidential information for the purposes for which it was intended</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-periwinkle-dark mt-0.5">✓</span>
                  <span className="text-sm">Neither use, nor allow the use of, our organisation's property, resources, information, intellectual property or funds other than for authorised purposes</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-periwinkle-dark mt-0.5">✓</span>
                  <span className="text-sm">Maintain the confidentiality of any information obtained while volunteering</span>
                </li>
              </ul>
            </div>

            <div className="legal-warning-box">
              <h3 className="!mt-0 flex items-center gap-3">
                <Shield className="h-6 w-6 text-mint-dark" />
                Safety Procedures
              </h3>
              <p className="mb-4 text-sm">Observe safety procedures including:</p>
              <ul className="space-y-3">
                <li className="flex items-start gap-3">
                  <span className="text-mint-dark mt-0.5">•</span>
                  <span className="text-sm">Keeping yourself and others safe at all times</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-mint-dark mt-0.5">•</span>
                  <span className="text-sm">Notifying the organisation about hazards or potential hazards in the working environment and event venues</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-mint-dark mt-0.5">•</span>
                  <span className="text-sm">Notifying the organisation about any accident, incident or property damage</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-mint-dark mt-0.5">•</span>
                  <span className="text-sm">Complying with New Zealand laws and regulations</span>
                </li>
              </ul>
            </div>
          </div>
        </section>

        {/* Prohibited Behaviours */}
        <section className="legal-section">
          <h2>Prohibited Behaviours</h2>
          
          <div className="legal-warning-box">
            <div className="flex items-start gap-4">
              <AlertTriangle className="h-6 w-6 text-error mt-1" />
              <div className="flex-1">
                <h3 className="!mt-0 text-lg">Volunteers will not:</h3>
                
                <div className="grid md:grid-cols-2 gap-6 mt-6">
                  <div>
                    <h4 className="font-semibold text-navy-dark mb-3">Organisational Integrity</h4>
                    <ul className="space-y-2 text-sm">
                      <li className="flex items-start gap-2">
                        <span className="text-error">✗</span>
                        <span>Create any liability for our organisation without authorisation</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-error">✗</span>
                        <span>Act in a way that may bring our organisation into disrepute (including use of brand, IP, email, social media, data, and other internet sites, engaging with media etc.)</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-error">✗</span>
                        <span>Seek or accept any offers, gifts, rewards or benefits</span>
                      </li>
                    </ul>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold text-navy-dark mb-3">Personal Conduct</h4>
                    <ul className="space-y-2 text-sm">
                      <li className="flex items-start gap-2">
                        <span className="text-error">✗</span>
                        <span>Engage in any activity that may or causes physical or mental harm of another person (such as verbal abuse, physical abuse, assault, sexual or racial harassment, bullying)</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-error">✗</span>
                        <span>Be affected by alcohol, medication or non-prescription drugs while volunteering</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-error">✗</span>
                        <span>Provide a false or misleading statement, declaration or claim</span>
                      </li>
                    </ul>
                  </div>
                  
                  <div className="md:col-span-2">
                    <h4 className="font-semibold text-navy-dark mb-3">Property & Legal Compliance</h4>
                    <ul className="space-y-2 text-sm">
                      <li className="flex items-start gap-2">
                        <span className="text-error">✗</span>
                        <span>Falsify or change any documents or records</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-error">✗</span>
                        <span>Engage in any activity that may damage both our tangible and intangible property</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-error">✗</span>
                        <span>Have unauthorised possession of property belonging to anyone else</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-error">✗</span>
                        <span>Engage in criminal activity in our workplace and event venues</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Conflicts of Interest */}
        <section className="legal-section">
          <h2>Conflicts of Interest</h2>
          
          <div className="space-y-6">
            <p>
              Volunteers should avoid situations that may lead to conflicts of interest (potential, actual or perceived) by:
            </p>
            
            <div className="legal-highlight-box">
              <h3 className="!mt-0">Prevention & Disclosure</h3>
              <ul className="space-y-4">
                <li className="flex items-start gap-3">
                  <span className="text-purple-dark mt-0.5">•</span>
                  <span className="text-sm">Consulting with your director/trustee/manager/supervisor before undertaking other roles in organisations whose goals, purposes or activities conflict with our organisation</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-purple-dark mt-0.5">•</span>
                  <span className="text-sm">Making sure your other commitments do not conflict with the performance of your duties at our organisation</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-purple-dark mt-0.5">•</span>
                  <span className="text-sm">Advising your director/trustee/manager/supervisor immediately if a conflict of interest exists, occurs or could possibly occur</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-purple-dark mt-0.5">•</span>
                  <span className="text-sm">Notify the organisation where personal interests or obligations conflict with responsibilities of the position, meaning independence, objectivity or impartiality may be questioned</span>
                </li>
              </ul>
              
              <div className="mt-6 p-4 bg-white/50 rounded-lg">
                <p className="text-sm text-navy-dark mb-0">
                  <strong>Important:</strong> Failure to disclose conflicts of interest may result in investigative and disciplinary action.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Data Protection */}
        <section className="legal-section">
          <h2>Data Protection</h2>
          
          <div className="space-y-6">
            <div className="legal-info-box">
              <h3 className="!mt-0">Our Responsibility</h3>
              <p className="mb-4">
                We all have a responsibility to ensure individuals and other organisations can trust us. 
                Through our roles you may come into contact with information about people and our 
                organisation that we need to keep confidential.
              </p>
              
              <div className="grid md:grid-cols-2 gap-6">
                <div className="p-4 bg-white/50 rounded-lg">
                  <h4 className="font-semibold text-navy-dark mb-2">Legal Framework</h4>
                  <p className="text-sm text-gray mb-0">
                    How organisations collect, manage and work with people's information is covered by the 
                    Privacy Act 1993, which has been subsequently strengthened by the Privacy Act 2020.
                  </p>
                </div>
                
                <div className="p-4 bg-white/50 rounded-lg">
                  <h4 className="font-semibold text-navy-dark mb-2">Data Types</h4>
                  <p className="text-sm text-gray mb-0">
                    In your role as a Volunteer, you will have contact with Personally Identifiable Information 
                    ('PII') and Sensitive Personal Information ('SPI').
                  </p>
                </div>
              </div>
            </div>
            
            <div className="legal-highlight-box">
              <h3 className="!mt-0">Key Principles</h3>
              <ul className="space-y-3">
                <li className="flex items-start gap-3">
                  <span className="text-purple-dark mt-0.5">•</span>
                  <span className="text-sm">Information should only be gathered from individuals that are specifically needed for any given purpose</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-purple-dark mt-0.5">•</span>
                  <span className="text-sm">Those who collect data need robust procedures to ensure it is held in a safe and secure format</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-purple-dark mt-0.5">•</span>
                  <span className="text-sm">We owe a duty of confidentiality to the people we hold information about</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-purple-dark mt-0.5">•</span>
                  <span className="text-sm">Access to information is restricted to those who 'need to know'</span>
                </li>
              </ul>
              
              <div className="mt-6 p-4 bg-white/50 rounded-lg">
                <p className="text-sm text-navy-dark mb-0">
                  <strong>When in doubt:</strong> Please speak to the organisation director/trustee/manager/supervisor 
                  about data protection procedures and requirements.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Breaches & Consequences */}
        <section className="legal-section">
          <h2>Breaches of the Code of Conduct</h2>
          
          <div className="legal-warning-box">
            <h3 className="!mt-0">Enforcement</h3>
            <p className="mb-4">
              We expect all of our staff and volunteers to follow this Code of Conduct, and the standards 
              and behaviours contained within it.
            </p>
            
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold text-navy-dark mb-3">Potential Consequences</h4>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-start gap-2">
                    <AlertTriangle className="h-4 w-4 text-error mt-0.5" />
                    <span>Notification of unacceptable behaviour and warning</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <AlertTriangle className="h-4 w-4 text-error mt-0.5" />
                    <span>Immediate end to volunteer services</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <AlertTriangle className="h-4 w-4 text-error mt-0.5" />
                    <span>Disciplinary action up to and including dismissal</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <AlertTriangle className="h-4 w-4 text-error mt-0.5" />
                    <span>Required and reasonable legal action</span>
                  </li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-semibold text-navy-dark mb-3">Resolution Process</h4>
                <p className="text-sm text-gray">
                  Should any staff member or volunteer fail to comply with this Code of Conduct, 
                  prompt steps will be taken to resolve the matter. Any breach of these requirements 
                  may be subject to disciplinary action.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Declaration Section */}
        <section className="legal-section">
          <h2>Declaration</h2>
          
          <div className="legal-contact-card">
            <div className="text-center">
              <h3 className="!mt-0 text-2xl mb-4">
                Volunteer Agreement
              </h3>
              <p className="text-lg mb-6 max-w-2xl mx-auto">
                I have read and understand the information in this document, and I agree to follow the Code 
                of Conduct. I commit to helping safeguard the rights and dignities of all people, organisations 
                and stakeholders I encounter during my volunteer service.
              </p>
              
              <div className="bg-gradient-to-br from-purple-light/20 to-periwinkle-light/20 rounded-xl p-8 max-w-2xl mx-auto">
                <div className="grid sm:grid-cols-2 gap-6 mb-6">
                  <div className="text-left">
                    <label className="block font-semibold text-navy-dark mb-2">Volunteer's Full Name</label>
                    <div className="border-b-2 border-gray/30 pb-2 min-h-[2rem]"></div>
                  </div>
                  
                  <div className="text-left">
                    <label className="block font-semibold text-navy-dark mb-2">Date of Join</label>
                    <div className="border-b-2 border-gray/30 pb-2 min-h-[2rem]"></div>
                  </div>
                  
                  <div className="text-left">
                    <label className="block font-semibold text-navy-dark mb-2">Volunteer's Signature</label>
                    <div className="border-b-2 border-gray/30 pb-2 min-h-[2rem]"></div>
                  </div>
                  
                  <div className="text-left">
                    <label className="block font-semibold text-navy-dark mb-2">Date of Signature</label>
                    <div className="border-b-2 border-gray/30 pb-2 min-h-[2rem]"></div>
                  </div>
                </div>
                
                <div className="border-t border-gray/30 pt-6">
                  <h4 className="font-semibold text-navy-dark mb-4">If a minor volunteer:</h4>
                  <div className="grid sm:grid-cols-2 gap-6">
                    <div className="text-left">
                      <label className="block font-semibold text-navy-dark mb-2">Parent/Guardian's Full Name</label>
                      <div className="border-b-2 border-gray/30 pb-2 min-h-[2rem]"></div>
                    </div>
                    
                    <div className="text-left">
                      <label className="block font-semibold text-navy-dark mb-2">Parent/Guardian's Signature</label>
                      <div className="border-b-2 border-gray/30 pb-2 min-h-[2rem]"></div>
                    </div>
                    
                    <div className="text-left sm:col-span-2">
                      <label className="block font-semibold text-navy-dark mb-2">Date of Signature</label>
                      <div className="border-b-2 border-gray/30 pb-2 min-h-[2rem]"></div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="mt-8 p-4 bg-periwinkle-light/20 rounded-lg">
                <div className="flex items-center gap-3 justify-center">
                  <Mail className="h-5 w-5 text-periwinkle-dark" />
                  <p className="text-sm text-navy-dark mb-0">
                    <strong>Next Steps:</strong> Please scan & send the completed form to 
                    <a href="mailto:governance@shesharp.org.nz" className="text-purple-dark hover:text-purple-mid mx-1">
                      governance@shesharp.org.nz
                    </a>
                    so that we have both the paper & electronic copies of the signed form in our records 
                    for compliance with the due diligence and governance of our registered charitable trust.
                  </p>
                </div>
              </div>
              
              <div className="inline-flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-purple-dark to-periwinkle-dark text-white rounded-lg mt-8">
                <Pen className="h-5 w-5" />
                <span className="font-semibold">Thank you for joining our team</span>
              </div>
            </div>
          </div>
        </section>
      </div>
    </LegalPageLayout>
  );
}

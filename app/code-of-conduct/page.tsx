import { Heart, Users, Sparkles, HandshakeIcon, AlertCircle, Flag, CheckCircle, Ban, MessageSquare, Shield, FileText } from "lucide-react";
import { LegalPageLayout } from "@/components/legal-page-layout";
import "@/styles/components/legal-page.css";

export const metadata = {
  title: "Code of Conduct | She Sharp",
  description: "Our community guidelines and expectations for creating a welcoming, inclusive environment for all members.",
};

export default function CodeOfConductPage() {
  return (
    <LegalPageLayout 
      title="Code of Conduct" 
      icon={<Users className="h-12 w-12 text-white" />}
    >
      <div className="legal-content">
        {/* Introduction */}
        <section className="legal-section">
          <div className="legal-info-box">
            <h2 className="!mt-0">Building an Inclusive Community</h2>
            <p className="text-lg mb-4">
              She Sharp is dedicated to providing a welcoming and supportive environment for all women 
              and allies in STEM. This Code of Conduct outlines our expectations for participant behavior 
              and the consequences for unacceptable behavior.
            </p>
            <div className="flex items-center gap-3 p-4 bg-white/50 rounded-lg">
              <Heart className="h-5 w-5 text-foreground flex-shrink-0" />
              <p className="text-sm text-foreground mb-0">
                We are committed to fostering a community where everyone feels valued, respected, and 
                empowered to participate fully.
              </p>
            </div>
          </div>
        </section>

        {/* Our Values */}
        <section className="legal-section">
          <h2>Our Core Values</h2>
          
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            {[
              {
                icon: Sparkles,
                title: "Inclusion",
                desc: "We welcome people of all backgrounds, experiences, and perspectives",
                color: "purple",
              },
              {
                icon: HandshakeIcon,
                title: "Respect",
                desc: "We treat everyone with dignity and value diverse opinions",
                color: "periwinkle",
              },
              {
                icon: Heart,
                title: "Support",
                desc: "We lift each other up and celebrate collective success",
                color: "mint",
              },
            ].map((value) => (
              <div
                key={value.title}
                className={`text-center p-8 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 ${
                  value.color === "purple"
                    ? "bg-muted"
                    : value.color === "periwinkle"
                    ? "bg-muted"
                    : "bg-muted"
                }`}
              >
                <div className={`mx-auto w-16 h-16 rounded-full flex items-center justify-center mb-4 ${
                  value.color === "purple"
                    ? "bg-muted"
                    : value.color === "periwinkle"
                    ? "bg-muted"
                    : "bg-muted"
                }`}>
                  <value.icon className={`h-8 w-8 ${
                    value.color === "purple"
                      ? "text-foreground"
                      : value.color === "periwinkle"
                      ? "text-foreground"
                      : "text-foreground"
                  }`} />
                </div>
                <h3 className="!mt-0 text-lg mb-2">{value.title}</h3>
                <p className="text-sm text-gray mb-0">{value.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Expected Behavior */}
        <section className="legal-section">
          <h2>Expected Behavior</h2>
          
          <div className="space-y-6">
            <p className="mb-6">
              All community members are expected to:
            </p>
            
            <div className="grid md:grid-cols-2 gap-6">
              <div className="legal-highlight-box">
                <h3 className="!mt-0 flex items-center gap-3">
                  <CheckCircle className="h-6 w-6 text-foreground" />
                  In Our Community
                </h3>
                <ul className="space-y-3">
                  <li className="flex items-start gap-3">
                    <span className="text-foreground mt-0.5">✓</span>
                    <span className="text-sm">Be respectful of differing viewpoints and experiences</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-foreground mt-0.5">✓</span>
                    <span className="text-sm">Give and accept constructive feedback gracefully</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-foreground mt-0.5">✓</span>
                    <span className="text-sm">Focus on what is best for the community</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-foreground mt-0.5">✓</span>
                    <span className="text-sm">Show empathy towards other community members</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-foreground mt-0.5">✓</span>
                    <span className="text-sm">Use welcoming and inclusive language</span>
                  </li>
                </ul>
              </div>
              
              <div className="legal-highlight-box">
                <h3 className="!mt-0 flex items-center gap-3">
                  <CheckCircle className="h-6 w-6 text-foreground" />
                  At Events & Online
                </h3>
                <ul className="space-y-3">
                  <li className="flex items-start gap-3">
                    <span className="text-foreground mt-0.5">✓</span>
                    <span className="text-sm">Participate authentically and actively</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-foreground mt-0.5">✓</span>
                    <span className="text-sm">Exercise consideration in your speech and actions</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-foreground mt-0.5">✓</span>
                    <span className="text-sm">Respect event staff and volunteers</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-foreground mt-0.5">✓</span>
                    <span className="text-sm">Alert staff if you notice violations</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-foreground mt-0.5">✓</span>
                    <span className="text-sm">Be mindful of your surroundings</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* Unacceptable Behavior */}
        <section className="legal-section">
          <h2>Unacceptable Behavior</h2>
          
          <div className="legal-warning-box">
            <div className="flex items-start gap-4">
              <Ban className="h-6 w-6 text-foreground mt-1" />
              <div className="flex-1">
                <h3 className="!mt-0 text-lg">The following behaviors are not tolerated:</h3>
                
                <div className="grid md:grid-cols-2 gap-6 mt-6">
                  <div>
                    <h4 className="font-semibold text-foreground mb-3">Harassment & Discrimination</h4>
                    <ul className="space-y-2 text-sm">
                      <li className="flex items-start gap-2">
                        <span className="text-error">✗</span>
                        <span>Discriminatory language or actions</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-error">✗</span>
                        <span>Sexual harassment or unwanted attention</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-error">✗</span>
                        <span>Intimidation or stalking</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-error">✗</span>
                        <span>Inappropriate physical contact</span>
                      </li>
                    </ul>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold text-foreground mb-3">Disruptive Behavior</h4>
                    <ul className="space-y-2 text-sm">
                      <li className="flex items-start gap-2">
                        <span className="text-error">✗</span>
                        <span>Sustained disruption of events</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-error">✗</span>
                        <span>Advocating for harmful acts</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-error">✗</span>
                        <span>Publishing private information</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-error">✗</span>
                        <span>Other conduct deemed inappropriate</span>
                      </li>
                    </ul>
                  </div>
                </div>
                
                <div className="mt-6 p-4 bg-white/50 rounded-lg">
                  <p className="text-sm text-foreground mb-0">
                    <strong>Zero Tolerance:</strong> We maintain a zero-tolerance policy for harassment 
                    of any kind. Participants asked to stop any inappropriate behavior are expected to 
                    comply immediately.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Diversity & Inclusion */}
        <section className="legal-section">
          <h2>Commitment to Diversity</h2>
          
          <div className="bg-muted rounded-2xl p-10 shadow-lg">
            <p className="mb-6">
              We explicitly honor diversity in:
            </p>
            
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[
                "Age and generation",
                "Gender identity",
                "Sexual orientation",
                "Physical ability",
                "Neurodiversity",
                "Ethnicity and race",
                "Nationality",
                "Religion",
                "Education level",
                "Career stage",
                "Family status",
                "Socioeconomic status",
              ].map((item) => (
                <div key={item} className="flex items-center gap-3 p-3 bg-white/70 rounded-lg">
                  <Heart className="h-4 w-4 text-foreground flex-shrink-0" />
                  <span className="text-sm text-foreground">{item}</span>
                </div>
              ))}
            </div>
            
            <p className="mt-6 text-sm text-foreground">
              This list is not exhaustive. We welcome all individuals who share our values of 
              creating an inclusive and supportive community for women in STEM.
            </p>
          </div>
        </section>

        {/* Reporting & Enforcement */}
        <section className="legal-section">
          <h2>Reporting Violations</h2>
          
          <div className="space-y-6">
            <div className="legal-highlight-box">
              <h3 className="!mt-0 flex items-center gap-3">
                <Flag className="h-6 w-6 text-foreground" />
                How to Report
              </h3>
              
              <p className="mb-4">
                If you experience or witness unacceptable behavior, please report it as soon as possible:
              </p>
              
              <div className="grid md:grid-cols-2 gap-6">
                <div className="p-4 bg-white/50 rounded-lg">
                  <h4 className="font-semibold text-foreground mb-2">At Events</h4>
                  <ul className="space-y-2 text-sm">
                    <li>• Find a She Sharp staff member or volunteer</li>
                    <li>• Look for team members with She Sharp badges</li>
                    <li>• Go to the registration or info desk</li>
                    <li>• Call our event hotline (provided at events)</li>
                  </ul>
                </div>
                
                <div className="p-4 bg-white/50 rounded-lg">
                  <h4 className="font-semibold text-foreground mb-2">Online</h4>
                  <ul className="space-y-2 text-sm">
                    <li>• Email: conduct@shesharp.org.nz</li>
                    <li>• Use report features on our platforms</li>
                    <li>• Contact moderators in online spaces</li>
                    <li>• Submit anonymous feedback form</li>
                  </ul>
                </div>
              </div>
            </div>
            
            <div className="legal-warning-box">
              <h3 className="!mt-0 flex items-center gap-3">
                <Shield className="h-6 w-6 text-foreground" />
                Our Response Process
              </h3>
              
              <div className="legal-numbered-list">
                <div className="flex items-start gap-4">
                  <span className="number">1</span>
                  <div>
                    <h4 className="font-semibold text-foreground mb-2">Immediate Safety</h4>
                    <p className="text-sm text-gray">We prioritize the safety and well-being of all participants.</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-4">
                  <span className="number">2</span>
                  <div>
                    <h4 className="font-semibold text-foreground mb-2">Investigation</h4>
                    <p className="text-sm text-gray">We gather information and speak with involved parties.</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-4">
                  <span className="number">3</span>
                  <div>
                    <h4 className="font-semibold text-foreground mb-2">Action</h4>
                    <p className="text-sm text-gray">We take appropriate action based on our findings.</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-4">
                  <span className="number">4</span>
                  <div>
                    <h4 className="font-semibold text-foreground mb-2">Follow-up</h4>
                    <p className="text-sm text-gray">We check in with affected parties and monitor the situation.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Consequences */}
        <section className="legal-section">
          <h2>Consequences</h2>
          
          <div className="bg-muted rounded-xl p-6">
            <p className="mb-4">
              Unacceptable behavior will not be tolerated. Consequences may include:
            </p>
            
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold text-foreground mb-3">Immediate Actions</h4>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-start gap-2">
                    <AlertCircle className="h-4 w-4 text-foreground mt-0.5" />
                    <span>Verbal warning</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <AlertCircle className="h-4 w-4 text-foreground mt-0.5" />
                    <span>Request to leave event</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <AlertCircle className="h-4 w-4 text-foreground mt-0.5" />
                    <span>Removal from online spaces</span>
                  </li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-semibold text-foreground mb-3">Long-term Actions</h4>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-start gap-2">
                    <AlertCircle className="h-4 w-4 text-foreground mt-0.5" />
                    <span>Temporary suspension</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <AlertCircle className="h-4 w-4 text-foreground mt-0.5" />
                    <span>Permanent ban</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <AlertCircle className="h-4 w-4 text-foreground mt-0.5" />
                    <span>Legal action if warranted</span>
                  </li>
                </ul>
              </div>
            </div>
            
            <p className="text-sm text-foreground mt-4 mb-0">
              Decisions are made on a case-by-case basis by the She Sharp leadership team, 
              considering the severity and pattern of behavior.
            </p>
          </div>
        </section>

        {/* Scope */}
        <section className="legal-section">
          <h2>Scope</h2>
          
          <div className="space-y-4">
            <p>
              This Code of Conduct applies to:
            </p>
            
            <div className="grid md:grid-cols-3 gap-4">
              {[
                { icon: Users, title: "All Events", desc: "In-person and virtual gatherings" },
                { icon: MessageSquare, title: "Online Spaces", desc: "Forums, social media, chat platforms" },
                { icon: HandshakeIcon, title: "Professional Settings", desc: "When representing She Sharp" },
              ].map((scope) => (
                <div key={scope.title} className="p-4 bg-muted rounded-lg border border-border">
                  <scope.icon className="h-6 w-6 text-foreground mb-2" />
                  <h4 className="font-semibold text-foreground">{scope.title}</h4>
                  <p className="text-sm text-gray">{scope.desc}</p>
                </div>
              ))}
            </div>
            
            <p className="text-sm text-foreground mt-4">
              This code also applies when an individual is representing She Sharp in public spaces 
              or when behavior could negatively impact the community's safety and well-being.
            </p>
          </div>
        </section>

        {/* Related Documents */}
        <section className="legal-section">
          <h2>Related Documents</h2>
          
          <div className="bg-muted rounded-xl p-6">
            <div className="flex items-start gap-4">
              <FileText className="h-6 w-6 text-foreground mt-1" />
              <div className="flex-1">
                <h3 className="!mt-0 text-lg mb-2">For Volunteers & Ambassadors</h3>
                <p className="text-sm text-gray mb-4">
                  If you're volunteering with She Sharp or serving as an ambassador, please also review our 
                  formal volunteer code of conduct which outlines additional responsibilities and standards.
                </p>
                <a 
                  href="/volunteers/code-of-conduct" 
                  className="inline-flex items-center gap-2 px-4 py-2 bg-foreground text-background rounded-lg hover:bg-foreground/90 transition-colors"
                >
                  <Users className="h-4 w-4" />
                  <span className="text-sm font-semibold">Ambassador Code of Conduct</span>
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* Contact Information */}
        <section className="legal-section">
          <h2>Questions or Concerns?</h2>
          
          <div className="legal-contact-card">
            <div className="text-center">
              <h3 className="!mt-0 text-2xl mb-4">
                Creating a Safe Space Together
              </h3>
              <p className="text-lg mb-6 max-w-2xl mx-auto">
                We all share the responsibility of creating a welcoming environment. Thank you for 
                helping make She Sharp a supportive community for all women in STEM.
              </p>
              
              <div className="grid sm:grid-cols-2 gap-6 max-w-lg mx-auto">
                <div>
                  <h4 className="font-semibold text-foreground mb-2">Report Issues</h4>
                  <a href="mailto:conduct@shesharp.org.nz" className="text-foreground hover:text-foreground/80">
                    conduct@shesharp.org.nz
                  </a>
                </div>
                
                <div>
                  <h4 className="font-semibold text-foreground mb-2">General Inquiries</h4>
                  <a href="mailto:hello@shesharp.org.nz" className="text-foreground hover:text-foreground/80">
                    hello@shesharp.org.nz
                  </a>
                </div>
              </div>
              
              <div className="inline-flex items-center gap-3 px-6 py-3 bg-foreground text-white rounded-lg mt-8">
                <Heart className="h-5 w-5" />
                <span className="font-semibold">Thank you for being part of our community</span>
              </div>
            </div>
          </div>
        </section>
      </div>
    </LegalPageLayout>
  );
}
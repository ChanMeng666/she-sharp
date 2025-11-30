import { Heart, Eye, Keyboard, Monitor, Headphones, Globe, CheckCircle, AlertCircle, Mail } from "lucide-react";
import { LegalPageLayout } from "@/components/legal-page-layout";
import "@/styles/components/legal-page.css";

export const metadata = {
  title: "Accessibility Statement | She Sharp",
  description: "She Sharp's commitment to digital accessibility and making our website usable for everyone.",
};

export default function AccessibilityPage() {
  return (
    <LegalPageLayout 
      title="Accessibility Statement"
      navTitle="Accessibility"
      icon={<Heart className="h-12 w-12 text-white" />}
    >
      <div className="legal-content">
        {/* Introduction */}
        <section className="legal-section">
          <div className="legal-info-box">
            <h2 className="!mt-0">Our Commitment to Inclusion</h2>
            <p className="text-lg mb-4">
              She Sharp is committed to ensuring digital accessibility for people with disabilities. 
              We are continually improving the user experience for everyone and applying the relevant 
              accessibility standards.
            </p>
            <div className="flex items-center gap-4 p-4 bg-white/50 rounded-lg">
              <CheckCircle className="h-6 w-6 text-foreground flex-shrink-0" />
              <p className="text-sm text-foreground mb-0">
                <strong>Our Goal:</strong> Conform to WCAG 2.1 Level AA standards to ensure our content 
                is accessible to a wide range of people with disabilities.
              </p>
            </div>
          </div>
        </section>

        {/* Accessibility Features */}
        <section className="legal-section">
          <h2>Accessibility Features</h2>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {[
              {
                icon: Monitor,
                title: "Screen Reader Support",
                desc: "Semantic HTML markup for better compatibility",
                color: "purple",
              },
              {
                icon: Eye,
                title: "Visual Design",
                desc: "High contrast ratios and clear typography",
                color: "periwinkle",
              },
              {
                icon: Keyboard,
                title: "Keyboard Navigation",
                desc: "Full keyboard support throughout the site",
                color: "mint",
              },
              {
                icon: Globe,
                title: "Responsive Design",
                desc: "Works across all devices and screen sizes",
                color: "purple",
              },
              {
                icon: Headphones,
                title: "Alternative Content",
                desc: "Alt text for images and video captions",
                color: "periwinkle",
              },
              {
                icon: CheckCircle,
                title: "Clear Structure",
                desc: "Consistent navigation and page layout",
                color: "mint",
              },
            ].map((feature) => (
              <div
                key={feature.title}
                className={`p-8 rounded-2xl border transition-all hover:shadow-xl hover:scale-105 ${
                  feature.color === "purple"
                    ? "bg-muted border-border hover:border-border"
                    : feature.color === "periwinkle"
                    ? "bg-muted border-border hover:border-border"
                    : "bg-muted border-border hover:border-border"
                }`}
              >
                <feature.icon
                  className={`h-8 w-8 mb-3 ${
                    feature.color === "purple"
                      ? "text-foreground"
                      : feature.color === "periwinkle"
                      ? "text-foreground"
                      : "text-foreground"
                  }`}
                />
                <h3 className="!mt-0 text-lg mb-2">{feature.title}</h3>
                <p className="text-sm text-gray mb-0">{feature.desc}</p>
              </div>
            ))}
          </div>

          <div className="legal-highlight-box">
            <h3 className="!mt-0 mb-4">Additional Accessibility Features</h3>
            <div className="grid sm:grid-cols-2 gap-6">
              <ul className="space-y-2">
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-foreground mt-0.5 flex-shrink-0" />
                  <span className="text-sm">Form labels and error messages</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-foreground mt-0.5 flex-shrink-0" />
                  <span className="text-sm">Skip navigation links</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-foreground mt-0.5 flex-shrink-0" />
                  <span className="text-sm">Focus indicators</span>
                </li>
              </ul>
              <ul className="space-y-2">
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-foreground mt-0.5 flex-shrink-0" />
                  <span className="text-sm">Consistent heading structure</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-foreground mt-0.5 flex-shrink-0" />
                  <span className="text-sm">Descriptive link text</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-foreground mt-0.5 flex-shrink-0" />
                  <span className="text-sm">ARIA landmarks</span>
                </li>
              </ul>
            </div>
          </div>
        </section>

        {/* Assistive Technologies */}
        <section className="legal-section">
          <h2>Assistive Technology Compatibility</h2>
          
          <div className="bg-muted rounded-xl p-8">
            <p className="mb-6">
              Our website is designed to be compatible with the following assistive technologies:
            </p>
            
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <h3 className="!mt-0 text-lg mb-4">Screen Readers</h3>
                <ul className="space-y-3">
                  <li className="flex items-center gap-3 p-3 bg-white/70 rounded-lg">
                    <div className="w-2 h-2 bg-foreground rounded-full"></div>
                    <span>JAWS (Windows)</span>
                  </li>
                  <li className="flex items-center gap-3 p-3 bg-white/70 rounded-lg">
                    <div className="w-2 h-2 bg-foreground rounded-full"></div>
                    <span>NVDA (Windows)</span>
                  </li>
                  <li className="flex items-center gap-3 p-3 bg-white/70 rounded-lg">
                    <div className="w-2 h-2 bg-foreground rounded-full"></div>
                    <span>VoiceOver (macOS/iOS)</span>
                  </li>
                  <li className="flex items-center gap-3 p-3 bg-white/70 rounded-lg">
                    <div className="w-2 h-2 bg-foreground rounded-full"></div>
                    <span>TalkBack (Android)</span>
                  </li>
                </ul>
              </div>
              
              <div>
                <h3 className="!mt-0 text-lg mb-4">Other Technologies</h3>
                <ul className="space-y-3">
                  <li className="flex items-center gap-3 p-3 bg-white/70 rounded-lg">
                    <div className="w-2 h-2 bg-foreground rounded-full"></div>
                    <span>Screen magnification software</span>
                  </li>
                  <li className="flex items-center gap-3 p-3 bg-white/70 rounded-lg">
                    <div className="w-2 h-2 bg-foreground rounded-full"></div>
                    <span>Speech recognition software</span>
                  </li>
                  <li className="flex items-center gap-3 p-3 bg-white/70 rounded-lg">
                    <div className="w-2 h-2 bg-foreground rounded-full"></div>
                    <span>Keyboard-only navigation</span>
                  </li>
                  <li className="flex items-center gap-3 p-3 bg-white/70 rounded-lg">
                    <div className="w-2 h-2 bg-foreground rounded-full"></div>
                    <span>Voice control systems</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* Known Limitations */}
        <section className="legal-section">
          <h2>Known Limitations</h2>
          
          <div className="legal-warning-box">
            <h3 className="!mt-0 flex items-center gap-3">
              <AlertCircle className="h-6 w-6 text-foreground" />
              Areas We're Working On
            </h3>
            <p className="mb-4">
              While we strive for full accessibility, some areas may have limitations:
            </p>
            
            <div className="space-y-4">
              <div className="p-4 bg-white/50 rounded-lg">
                <h4 className="font-semibold text-foreground mb-2">Third-Party Content</h4>
                <p className="text-sm text-gray mb-2">
                  Embedded videos and social media content may not fully meet accessibility standards.
                </p>
                <p className="text-sm text-foreground">
                  <strong>Solution:</strong> We're working with providers to improve accessibility.
                </p>
              </div>
              
              <div className="p-4 bg-white/50 rounded-lg">
                <h4 className="font-semibold text-foreground mb-2">Legacy Documents</h4>
                <p className="text-sm text-gray mb-2">
                  Some older PDF documents may not be fully accessible.
                </p>
                <p className="text-sm text-foreground">
                  <strong>Solution:</strong> We're converting documents to accessible formats.
                </p>
              </div>
              
              <div className="p-4 bg-white/50 rounded-lg">
                <h4 className="font-semibold text-foreground mb-2">User-Generated Content</h4>
                <p className="text-sm text-gray mb-2">
                  Community-submitted content may not always meet guidelines.
                </p>
                <p className="text-sm text-foreground">
                  <strong>Solution:</strong> We provide accessibility guidelines to contributors.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Feedback */}
        <section className="legal-section">
          <h2>Accessibility Feedback</h2>
          
          <div className="grid md:grid-cols-2 gap-8">
            <div className="legal-highlight-box">
              <Mail className="h-8 w-8 text-foreground mb-4" />
              <h3 className="!mt-0">Report an Issue</h3>
              <p className="mb-4">
                Encountered an accessibility barrier? We want to hear from you.
              </p>
              <p className="text-sm mb-4">Please include:</p>
              <ul className="space-y-2 text-sm mb-4">
                <li>• Page URL</li>
                <li>• Description of the issue</li>
                <li>• Assistive technology used</li>
                <li>• Your contact information</li>
              </ul>
              <a
                href="mailto:accessibility@shesharp.org.nz"
                className="inline-flex items-center gap-2 px-4 py-2 bg-foreground text-background rounded-lg hover:bg-foreground/90 transition-colors"
              >
                <Mail className="h-4 w-4" />
                Email Us
              </a>
            </div>
            
            <div className="legal-highlight-box">
              <Heart className="h-8 w-8 text-foreground mb-4" />
              <h3 className="!mt-0">Our Promise</h3>
              <p className="mb-4">
                We are committed to making our website accessible to all members of our community.
              </p>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-foreground mt-0.5" />
                  <span className="text-sm">Response within 2 business days</span>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-foreground mt-0.5" />
                  <span className="text-sm">Regular accessibility audits</span>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-foreground mt-0.5" />
                  <span className="text-sm">Ongoing staff training</span>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-foreground mt-0.5" />
                  <span className="text-sm">User feedback implementation</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Resources */}
        <section className="legal-section">
          <h2>Accessibility Resources</h2>
          
          <div className="bg-muted rounded-xl p-8">
            <p className="mb-6">
              Learn more about web accessibility and assistive technologies:
            </p>
            
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[
                {
                  name: "W3C Web Accessibility Initiative",
                  url: "https://www.w3.org/WAI/",
                  desc: "International standards",
                },
                {
                  name: "NZ Government Web Standards",
                  url: "https://www.govt.nz/standards/web-accessibility-standard-1-1/",
                  desc: "Local guidelines",
                },
                {
                  name: "WebAIM",
                  url: "https://webaim.org/",
                  desc: "Resources and tools",
                },
              ].map((resource) => (
                <a
                  key={resource.name}
                  href={resource.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block p-4 bg-white rounded-lg border border-border hover:border-border transition-all hover:shadow-sm"
                >
                  <h4 className="font-semibold text-foreground mb-1">{resource.name}</h4>
                  <p className="text-sm text-gray">{resource.desc}</p>
                </a>
              ))}
            </div>
          </div>
        </section>

        {/* Contact Card */}
        <section>
          <div className="legal-contact-card">
            <div className="text-center">
              <h3 className="!mt-0 text-2xl mb-4">
                Together, We Make Tech Accessible
              </h3>
              <p className="text-lg mb-6 max-w-2xl mx-auto">
                Accessibility is not just about compliance—it's about ensuring everyone in our 
                community can participate fully in our mission to empower women in STEM.
              </p>
              <div className="inline-flex items-center gap-3 px-6 py-3 bg-foreground text-white rounded-lg">
                <Heart className="h-5 w-5" />
                <span className="font-semibold">Thank you for helping us improve</span>
              </div>
            </div>
          </div>
        </section>
      </div>
    </LegalPageLayout>
  );
}
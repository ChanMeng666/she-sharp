import { LegalPageLayout } from "@/components/legal-page-layout";
import "@/styles/components/legal-page.css";

export const metadata = {
  title: "Code of Conduct | She Sharp",
  description: "Our community guidelines and expectations for creating a welcoming, inclusive environment for all members.",
};

export default function CodeOfConductPage() {
  return (
    <LegalPageLayout title="Code of Conduct">
      <div className="legal-content">
        <section className="legal-section">
          <h2>Building an Inclusive Community</h2>
          <p>
            She Sharp is dedicated to providing a welcoming and supportive environment for all women
            and allies in STEM. This Code of Conduct outlines our expectations for participant behavior
            and the consequences for unacceptable behavior.
          </p>
          <p>
            We are committed to fostering a community where everyone feels valued, respected, and
            empowered to participate fully.
          </p>
        </section>

        <section className="legal-section">
          <h2>Our Core Values</h2>
          <ul>
            <li><strong>Inclusion</strong> — We welcome people of all backgrounds, experiences, and perspectives</li>
            <li><strong>Respect</strong> — We treat everyone with dignity and value diverse opinions</li>
            <li><strong>Support</strong> — We lift each other up and celebrate collective success</li>
          </ul>
        </section>

        <section className="legal-section">
          <h2>Expected Behavior</h2>
          <p>All community members are expected to:</p>

          <h3>In Our Community</h3>
          <ul>
            <li>Be respectful of differing viewpoints and experiences</li>
            <li>Give and accept constructive feedback gracefully</li>
            <li>Focus on what is best for the community</li>
            <li>Show empathy towards other community members</li>
            <li>Use welcoming and inclusive language</li>
          </ul>

          <h3>At Events & Online</h3>
          <ul>
            <li>Participate authentically and actively</li>
            <li>Exercise consideration in your speech and actions</li>
            <li>Respect event staff and volunteers</li>
            <li>Alert staff if you notice violations</li>
            <li>Be mindful of your surroundings</li>
          </ul>
        </section>

        <section className="legal-section">
          <h2>Unacceptable Behavior</h2>
          <p>The following behaviors are not tolerated:</p>

          <h3>Harassment & Discrimination</h3>
          <ul>
            <li>Discriminatory language or actions</li>
            <li>Sexual harassment or unwanted attention</li>
            <li>Intimidation or stalking</li>
            <li>Inappropriate physical contact</li>
          </ul>

          <h3>Disruptive Behavior</h3>
          <ul>
            <li>Sustained disruption of events</li>
            <li>Advocating for harmful acts</li>
            <li>Publishing private information</li>
            <li>Other conduct deemed inappropriate</li>
          </ul>

          <p>
            <strong>Zero Tolerance:</strong> We maintain a zero-tolerance policy for harassment
            of any kind. Participants asked to stop any inappropriate behavior are expected to
            comply immediately.
          </p>
        </section>

        <section className="legal-section">
          <h2>Commitment to Diversity</h2>
          <p>We explicitly honor diversity in:</p>
          <ul>
            <li>Age and generation</li>
            <li>Gender identity</li>
            <li>Sexual orientation</li>
            <li>Physical ability</li>
            <li>Neurodiversity</li>
            <li>Ethnicity and race</li>
            <li>Nationality</li>
            <li>Religion</li>
            <li>Education level</li>
            <li>Career stage</li>
            <li>Family status</li>
            <li>Socioeconomic status</li>
          </ul>
          <p>
            This list is not exhaustive. We welcome all individuals who share our values of
            creating an inclusive and supportive community for women in STEM.
          </p>
        </section>

        <section className="legal-section">
          <h2>Reporting Violations</h2>
          <p>If you experience or witness unacceptable behavior, please report it as soon as possible:</p>

          <h3>At Events</h3>
          <ul>
            <li>Find a She Sharp staff member or volunteer</li>
            <li>Look for team members with She Sharp badges</li>
            <li>Go to the registration or info desk</li>
            <li>Call our event hotline (provided at events)</li>
          </ul>

          <h3>Online</h3>
          <ul>
            <li>Email: <a href="mailto:conduct@shesharp.org.nz">conduct@shesharp.org.nz</a></li>
            <li>Use report features on our platforms</li>
            <li>Contact moderators in online spaces</li>
            <li>Submit anonymous feedback form</li>
          </ul>

          <h3>Our Response Process</h3>
          <ol>
            <li><strong>Immediate Safety</strong> — We prioritize the safety and well-being of all participants</li>
            <li><strong>Investigation</strong> — We gather information and speak with involved parties</li>
            <li><strong>Action</strong> — We take appropriate action based on our findings</li>
            <li><strong>Follow-up</strong> — We check in with affected parties and monitor the situation</li>
          </ol>
        </section>

        <section className="legal-section">
          <h2>Consequences</h2>
          <p>Unacceptable behavior will not be tolerated. Consequences may include:</p>

          <h3>Immediate Actions</h3>
          <ul>
            <li>Verbal warning</li>
            <li>Request to leave event</li>
            <li>Removal from online spaces</li>
          </ul>

          <h3>Long-term Actions</h3>
          <ul>
            <li>Temporary suspension</li>
            <li>Permanent ban</li>
            <li>Legal action if warranted</li>
          </ul>

          <p>
            Decisions are made on a case-by-case basis by the She Sharp leadership team,
            considering the severity and pattern of behavior.
          </p>
        </section>

        <section className="legal-section">
          <h2>Scope</h2>
          <p>This Code of Conduct applies to:</p>
          <ul>
            <li><strong>All Events</strong> — In-person and virtual gatherings</li>
            <li><strong>Online Spaces</strong> — Forums, social media, chat platforms</li>
            <li><strong>Professional Settings</strong> — When representing She Sharp</li>
          </ul>
          <p>
            This code also applies when an individual is representing She Sharp in public spaces
            or when behavior could negatively impact the community's safety and well-being.
          </p>
        </section>

        <section className="legal-section">
          <h2>For Volunteers & Ambassadors</h2>
          <p>
            If you're volunteering with She Sharp or serving as an ambassador, please also review our{" "}
            <a href="/volunteers/code-of-conduct">Ambassador Code of Conduct</a> which outlines
            additional responsibilities and standards.
          </p>
        </section>

        <section className="legal-section">
          <h2>Questions or Concerns?</h2>
          <p>
            We all share the responsibility of creating a welcoming environment. Thank you for
            helping make She Sharp a supportive community for all women in STEM.
          </p>
          <ul>
            <li><strong>Report Issues:</strong> <a href="mailto:conduct@shesharp.org.nz">conduct@shesharp.org.nz</a></li>
            <li><strong>General Inquiries:</strong> <a href="mailto:hello@shesharp.org.nz">hello@shesharp.org.nz</a></li>
          </ul>
        </section>
      </div>
    </LegalPageLayout>
  );
}

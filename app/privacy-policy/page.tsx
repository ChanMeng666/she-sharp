import { Metadata } from "next";
import { LegalPageLayout } from "@/components/legal-page-layout";
import "@/styles/components/legal-page.css";
import { PRIVACY_EMAIL } from "@/lib/config/contact-addresses";

export const metadata: Metadata = {
  title: "Privacy Policy",
  alternates: { canonical: "/privacy-policy" },
  description: "She Sharp's privacy policy - how we collect, use, and protect your personal information.",
};

export default function PrivacyPolicyPage() {
  return (
    <LegalPageLayout title="Privacy Policy" lastUpdated={new Date("2026-08-29")}>
      <div className="legal-content">
        <section className="legal-section">
          <h2>Your Privacy Matters</h2>
          <p>
            At She Sharp, we're committed to handling your personal information with care and transparency,
            in line with the New Zealand Privacy Act 2020.
          </p>
          <p>
            This policy outlines how we collect, use, store, and protect the personal information you share
            with us when you engage with our events, volunteer activities, or other initiatives.
          </p>
        </section>

        <section className="legal-section">
          <h2>What We Collect</h2>
          <p>
            We collect personal information when you engage with us — whether you're attending an event,
            speaking, or volunteering. This may include:
          </p>

          <h3>Event Attendees</h3>
          <p>Information collected during ticket purchase and event registration:</p>
          <ul>
            <li>Name</li>
            <li>Email address</li>
            <li>Company</li>
            <li>Dietary requirements</li>
          </ul>

          <h3>Speakers</h3>
          <p>Information used to promote your involvement and manage event logistics:</p>
          <ul>
            <li>Name</li>
            <li>Company</li>
            <li>Job title</li>
            <li>Photo</li>
          </ul>

          <h3>Volunteers/Ambassadors</h3>
          <p>Information to help us match you with suitable opportunities:</p>
          <ul>
            <li>Your CV</li>
            <li>Name</li>
            <li>Address</li>
            <li>Mobile number</li>
            <li>Work history</li>
          </ul>

          <h3>Newsletter Subscribers</h3>
          <p>
            If you subscribe to our newsletter, She Sharp keeps a record of your
            subscription in its own database:
          </p>
          <ul>
            <li>Email address</li>
            <li>First name, if you choose to give one</li>
            <li>
              When you subscribed and how you signed up — for example, through a
              form on this website — which is our record that you asked to hear
              from us
            </li>
          </ul>
          <p>
            Every newsletter we send carries an unsubscribe link. One click stops
            the newsletter; you do not need an account, a password, or to explain
            why. You can also ask us to remove you by emailing{" "}
            <a href={`mailto:${PRIVACY_EMAIL}`}>{PRIVACY_EMAIL}</a>.
          </p>
        </section>

        <section className="legal-section">
          <h2>Why We Collect Your Information</h2>
          <p>We collect your personal information in order to:</p>
          <ol>
            <li><strong>Event Management</strong> — Organise and manage events effectively</li>
            <li><strong>Communication</strong> — Communicate important event details with attendees, speakers, and volunteers</li>
            <li><strong>Promotion</strong> — Promote speaker involvement on our website, social media, and other materials</li>
            <li><strong>Volunteer Matching</strong> — Match volunteers to relevant activities based on experience and skills</li>
            <li><strong>Service Improvement</strong> — Improve our event planning and engagement strategies</li>
            <li><strong>Future Engagement</strong> — Keep you informed about future events, initiatives, and opportunities related to She Sharp</li>
          </ol>
        </section>

        <section className="legal-section">
          <h2>Who We Share Your Information With</h2>
          <p>
            In general, your information is only shared internally with our organising team. However,
            in some cases, we may share relevant details with:
          </p>
          <ul>
            <li><strong>Event Partners & Sponsors</strong> — For example, for dietary planning or speaker coordination</li>
            <li><strong>Third-Party Platforms</strong> — Used for ticketing, email delivery, or event registrations (such as Humanitix, Google Forms, or Resend)</li>
            <li><strong>Website & Social Media</strong> — When promoting event speakers or highlighting community stories</li>
            <li><strong>Regulatory Authorities</strong> — Or law enforcement agencies, if required by law</li>
          </ul>
          <p>
            New newsletter subscriptions are held by She Sharp in its own
            database rather than by a third-party marketing platform, and Resend,
            our email delivery provider, receives the address a newsletter is
            sent to in order to deliver it. We have also used Mailchimp for the
            newsletter, and it still holds the earlier subscriber records and the
            archive of past issues.
          </p>
          <p>
            <strong>Important:</strong> We do not sell or share your personal information with unauthorised third parties.
          </p>
        </section>

        <section className="legal-section">
          <h2>Optional Information</h2>
          <p>
            Providing your information is entirely optional, but if you choose not to supply essential
            details (e.g. contact details, dietary needs), we may not be able to:
          </p>
          <ul>
            <li>Confirm your event registration</li>
            <li>Tailor your event experience (e.g. catering to dietary restrictions)</li>
            <li>Connect you with appropriate volunteer opportunities</li>
          </ul>
        </section>

        <section className="legal-section">
          <h2>Photographs at Our Events</h2>
          <p>
            We photograph our events and publish a selection on this website and in
            public albums. If you would rather not be photographed, tell a member of
            the She Sharp team on the day and we will make sure you are not.
          </p>
          <p>
            Where children attend, we publish photographs of activities rather than
            portraits of individual children, we never name a child, and for events
            run with a school or youth organisation we rely on that
            organisation&apos;s media consent.
          </p>
          <p>
            If you would prefer a photograph of you or your child not to be published,
            email{" "}
            <a href={`mailto:${PRIVACY_EMAIL}`}>{PRIVACY_EMAIL}</a> and we will remove
            it. Tell us which event and, if you can, which photograph — removing an
            image means changing this site and editing the public album, so it is not
            instant, but we will confirm when it is done.
          </p>
        </section>

        <section className="legal-section">
          <h2>How We Keep Your Information Safe</h2>
          <p>
            We take your privacy seriously. Access to your personal information is limited to
            authorised She Sharp team members who have signed confidentiality agreements or
            non-disclosure agreements (NDAs).
          </p>
          <p>
            We retain your information only for as long as necessary to fulfil the purpose it
            was collected for, or to meet legal and operational requirements.
          </p>
        </section>

        <section className="legal-section">
          <h2>Accessing or Correcting Your Information</h2>
          <p>
            You have the right to access and correct any personal information we hold about you.
            To request a copy or update of your information, please contact us at{" "}
            <a href={`mailto:${PRIVACY_EMAIL}`}>{PRIVACY_EMAIL}</a>.
          </p>
          <p>
            We may take steps to verify your identity before processing your request to ensure
            your privacy is protected.
          </p>
        </section>

        <section className="legal-section">
          <h2>Updates to This Policy</h2>
          <p>
            This privacy policy may be updated from time to time. Any changes will be published
            on our website. By continuing to engage with She Sharp, you agree to the most recent
            version of this policy.
          </p>
        </section>

        <section className="legal-section">
          <h2>Contact Us</h2>
          <p>
            If you have questions about this Privacy Policy or our privacy practices, please contact us:
          </p>
          <ul>
            <li><strong>Email:</strong> <a href={`mailto:${PRIVACY_EMAIL}`}>{PRIVACY_EMAIL}</a></li>
            <li><strong>Website:</strong> <a href="https://www.shesharp.org.nz">www.shesharp.org.nz</a></li>
          </ul>
          <p>We aim to respond to all privacy inquiries within 5 business days.</p>
        </section>
      </div>
    </LegalPageLayout>
  );
}

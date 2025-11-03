import { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export const metadata: Metadata = {
  title: "Privacy Policy | Perpetual Core",
  description: "Privacy Policy for Perpetual Core",
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <div className="mb-8">
          <Button variant="ghost" asChild className="mb-4">
            <Link href="/">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Home
            </Link>
          </Button>
          <h1 className="text-4xl font-bold mb-2">Privacy Policy</h1>
          <p className="text-muted-foreground">
            Last updated: January 20, 2025
          </p>
        </div>

        <div className="prose prose-gray dark:prose-invert max-w-none">
          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">1. Introduction</h2>
            <p>
              Perpetual Core ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy
              explains how we collect, use, disclose, and safeguard your information when you use our AI-powered
              operating system service ("Service").
            </p>
            <p className="mt-4">
              By using the Service, you consent to the data practices described in this policy. If you do not
              agree with this policy, please do not use our Service.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">2. Information We Collect</h2>

            <h3 className="text-xl font-semibold mb-2">2.1 Information You Provide</h3>
            <p>We collect information that you voluntarily provide when using the Service:</p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li><strong>Account Information:</strong> Email address, name, password, organization details</li>
              <li><strong>Profile Information:</strong> Avatar, bio, preferences, notification settings</li>
              <li><strong>User Content:</strong> Messages, documents, tasks, calendar events, notes, and other content you create or upload</li>
              <li><strong>Payment Information:</strong> Billing address, payment method details (processed securely by Stripe)</li>
              <li><strong>Communication Data:</strong> Support requests, feedback, and correspondence with us</li>
            </ul>

            <h3 className="text-xl font-semibold mb-2 mt-4">2.2 Automatically Collected Information</h3>
            <p>We automatically collect certain information when you use the Service:</p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li><strong>Usage Data:</strong> Features used, actions taken, time spent, frequency of use</li>
              <li><strong>Device Information:</strong> IP address, browser type, device type, operating system</li>
              <li><strong>Log Data:</strong> Access times, pages viewed, errors encountered</li>
              <li><strong>Cookies and Tracking:</strong> Session data, preferences, analytics (see Cookie Policy)</li>
            </ul>

            <h3 className="text-xl font-semibold mb-2 mt-4">2.3 Information from Third Parties</h3>
            <p>We may receive information from third-party services you connect to the Service:</p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li><strong>OAuth Integrations:</strong> Slack, Zoom, Google Drive, calendar services</li>
              <li><strong>AI Providers:</strong> Usage data from Anthropic Claude, OpenAI GPT-4, Google Gemini</li>
              <li><strong>Payment Processor:</strong> Subscription and payment status from Stripe</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">3. How We Use Your Information</h2>
            <p>We use the collected information for the following purposes:</p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li><strong>Provide the Service:</strong> Process your requests, enable features, store your content</li>
              <li><strong>AI Processing:</strong> Send your messages and content to AI providers to generate responses</li>
              <li><strong>Account Management:</strong> Create and maintain your account, authenticate users</li>
              <li><strong>Billing:</strong> Process payments, manage subscriptions, send invoices</li>
              <li><strong>Communication:</strong> Send service updates, security alerts, support responses</li>
              <li><strong>Improvement:</strong> Analyze usage patterns, fix bugs, develop new features</li>
              <li><strong>Security:</strong> Detect fraud, prevent abuse, protect against security threats</li>
              <li><strong>Legal Compliance:</strong> Comply with legal obligations and enforce our terms</li>
              <li><strong>Analytics:</strong> Understand how users interact with the Service to improve user experience</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">4. How We Share Your Information</h2>

            <h3 className="text-xl font-semibold mb-2">4.1 AI Service Providers</h3>
            <p>
              When you use AI features, your messages and content are sent to third-party AI providers:
            </p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li><strong>Anthropic (Claude):</strong> Subject to Anthropic's privacy policy and commercial terms</li>
              <li><strong>OpenAI (GPT-4):</strong> Subject to OpenAI's privacy policy and API terms</li>
              <li><strong>Google (Gemini):</strong> Subject to Google's privacy policy and AI terms</li>
            </ul>
            <p className="mt-4">
              These providers may use your data to provide AI responses but are contractually prohibited from
              using your data to train their models (for enterprise API usage).
            </p>

            <h3 className="text-xl font-semibold mb-2 mt-4">4.2 Service Providers</h3>
            <p>We share data with trusted service providers who assist in operating the Service:</p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li><strong>Supabase:</strong> Database and authentication services</li>
              <li><strong>Stripe:</strong> Payment processing and subscription management</li>
              <li><strong>Resend:</strong> Email delivery services</li>
              <li><strong>Twilio:</strong> WhatsApp messaging services</li>
              <li><strong>Analytics Providers:</strong> Usage analytics and monitoring</li>
            </ul>

            <h3 className="text-xl font-semibold mb-2 mt-4">4.3 Legal Requirements</h3>
            <p>We may disclose your information if required by law or in response to:</p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li>Valid legal requests (subpoenas, court orders)</li>
              <li>Protection of our rights, privacy, safety, or property</li>
              <li>Investigation of fraud or security issues</li>
              <li>Enforcement of our Terms of Service</li>
            </ul>

            <h3 className="text-xl font-semibold mb-2 mt-4">4.4 Business Transfers</h3>
            <p>
              If we are involved in a merger, acquisition, or sale of assets, your information may be
              transferred to the acquiring entity. We will provide notice before your information is transferred
              and becomes subject to a different privacy policy.
            </p>

            <h3 className="text-xl font-semibold mb-2 mt-4">4.5 With Your Consent</h3>
            <p>
              We may share your information with third parties when you explicitly consent or direct us to do so
              (e.g., when connecting integrations like Slack or Google Drive).
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">5. Data Security</h2>
            <p>We implement industry-standard security measures to protect your information:</p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li><strong>Encryption:</strong> Data encrypted in transit (TLS/SSL) and at rest (AES-256)</li>
              <li><strong>Authentication:</strong> Secure password hashing, optional two-factor authentication (2FA)</li>
              <li><strong>Access Controls:</strong> Role-based access, principle of least privilege</li>
              <li><strong>Infrastructure Security:</strong> Regular security audits, vulnerability scanning</li>
              <li><strong>Monitoring:</strong> Intrusion detection, activity logging, security alerts</li>
            </ul>
            <p className="mt-4">
              However, no method of transmission over the Internet or electronic storage is 100% secure. While
              we strive to protect your information, we cannot guarantee absolute security.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">6. Data Retention</h2>
            <p>
              We retain your information for as long as your account is active or as needed to provide the
              Service. Retention periods vary by data type:
            </p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li><strong>Account Data:</strong> Retained until you delete your account</li>
              <li><strong>User Content:</strong> Retained until you delete it or close your account</li>
              <li><strong>Usage Logs:</strong> Retained for up to 90 days for security and analytics</li>
              <li><strong>Billing Records:</strong> Retained for 7 years for tax and legal compliance</li>
              <li><strong>AI Conversation History:</strong> Retained according to your settings (30-90 days default)</li>
            </ul>
            <p className="mt-4">
              After account deletion, we may retain some information as required by law or for legitimate
              business purposes (e.g., fraud prevention, dispute resolution).
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">7. Your Rights and Choices</h2>

            <h3 className="text-xl font-semibold mb-2">7.1 Access and Portability</h3>
            <p>
              You can access and export your data at any time through your account settings. We provide data
              export in standard formats (JSON, CSV).
            </p>

            <h3 className="text-xl font-semibold mb-2 mt-4">7.2 Correction and Deletion</h3>
            <p>
              You can update or correct your account information and delete your content through the Service.
              To delete your account entirely, contact us at privacy@perpetualcore.com.
            </p>

            <h3 className="text-xl font-semibold mb-2 mt-4">7.3 Marketing Communications</h3>
            <p>
              You can opt out of marketing emails by clicking "unsubscribe" in any marketing email or updating
              your notification preferences. We will still send transactional emails (e.g., password resets,
              billing notifications).
            </p>

            <h3 className="text-xl font-semibold mb-2 mt-4">7.4 Cookies</h3>
            <p>
              You can control cookies through your browser settings. See our{" "}
              <Link href="/cookies" className="text-primary hover:underline">
                Cookie Policy
              </Link>{" "}
              for more information.
            </p>

            <h3 className="text-xl font-semibold mb-2 mt-4">7.5 Do Not Track</h3>
            <p>
              We do not currently respond to "Do Not Track" browser signals, as there is no industry standard
              for compliance.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">8. Regional Privacy Rights</h2>

            <h3 className="text-xl font-semibold mb-2">8.1 GDPR (European Users)</h3>
            <p>If you are in the European Economic Area (EEA), you have additional rights under GDPR:</p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li>Right to access your personal data</li>
              <li>Right to rectification of inaccurate data</li>
              <li>Right to erasure ("right to be forgotten")</li>
              <li>Right to restrict processing</li>
              <li>Right to data portability</li>
              <li>Right to object to processing</li>
              <li>Right to withdraw consent</li>
              <li>Right to lodge a complaint with supervisory authorities</li>
            </ul>

            <h3 className="text-xl font-semibold mb-2 mt-4">8.2 CCPA (California Users)</h3>
            <p>If you are a California resident, you have rights under the California Consumer Privacy Act:</p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li>Right to know what personal information is collected</li>
              <li>Right to know if personal information is sold or disclosed</li>
              <li>Right to opt-out of the sale of personal information (we do not sell your data)</li>
              <li>Right to deletion of personal information</li>
              <li>Right to non-discrimination for exercising your rights</li>
            </ul>

            <h3 className="text-xl font-semibold mb-2 mt-4">8.3 Other Regions</h3>
            <p>
              We comply with applicable privacy laws in other jurisdictions. Contact us to exercise your rights
              under local privacy laws.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">9. Children's Privacy</h2>
            <p>
              The Service is not intended for children under 13 years of age (or 16 in the EEA). We do not
              knowingly collect personal information from children. If you believe we have collected information
              from a child, please contact us immediately, and we will delete the information.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">10. International Data Transfers</h2>
            <p>
              Your information may be transferred to and processed in countries other than your country of
              residence. These countries may have different data protection laws. We ensure appropriate
              safeguards are in place for international transfers, including:
            </p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li>Standard Contractual Clauses (SCCs) approved by the European Commission</li>
              <li>Data Processing Agreements with service providers</li>
              <li>Adherence to Privacy Shield principles (where applicable)</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">11. Third-Party Links</h2>
            <p>
              The Service may contain links to third-party websites or services. We are not responsible for the
              privacy practices of these third parties. We encourage you to review their privacy policies before
              providing any information.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">12. Changes to This Privacy Policy</h2>
            <p>
              We may update this Privacy Policy from time to time. We will notify you of material changes by:
            </p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li>Posting the updated policy on our website</li>
              <li>Updating the "Last updated" date</li>
              <li>Sending an email notification for significant changes</li>
              <li>Displaying an in-app notification</li>
            </ul>
            <p className="mt-4">
              Your continued use of the Service after changes become effective constitutes your acceptance of
              the updated Privacy Policy.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">13. Contact Us</h2>
            <p>
              If you have questions, concerns, or requests regarding this Privacy Policy or our data practices,
              please contact us:
            </p>
            <div className="mt-4 space-y-2">
              <p>
                <strong>Email:</strong> privacy@perpetualcore.com
              </p>
              <p>
                <strong>Data Protection Officer:</strong> dpo@perpetualcore.com
              </p>
              <p>
                <strong>Address:</strong> Perpetual Core, Inc.
              </p>
            </div>
            <p className="mt-4">
              We will respond to your request within 30 days (or as required by applicable law).
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">14. Data Processing Addendum</h2>
            <p>
              For enterprise customers who require a Data Processing Addendum (DPA) for GDPR compliance, please
              contact our legal team at legal@perpetualcore.com.
            </p>
          </section>
        </div>

        <div className="mt-12 p-6 bg-muted rounded-lg">
          <p className="text-sm text-muted-foreground">
            This Privacy Policy describes how Perpetual Core collects, uses, and protects your personal
            information. For questions or to exercise your privacy rights, contact us at privacy@perpetualcore.com.
          </p>
        </div>
      </div>
    </div>
  );
}

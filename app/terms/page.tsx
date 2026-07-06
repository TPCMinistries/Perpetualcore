import { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export const metadata: Metadata = {
  title: "Terms of Service | Perpetual Core",
  description: "Terms of Service for Perpetual Core",
};

export default function TermsPage() {
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
          <h1 className="text-4xl font-bold mb-2">Terms of Service</h1>
          <p className="text-muted-foreground">
            Last updated: January 20, 2025
          </p>
        </div>

        <div className="prose prose-gray dark:prose-invert max-w-none">
          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">1. Acceptance of Terms</h2>
            <p>
              By accessing and using Perpetual Core ("Service"), you accept and agree to be bound by the terms
              and provision of this agreement. If you do not agree to these Terms of Service, please do not use
              our Service.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">2. Description of Service</h2>
            <p>
              Perpetual Core provides an AI-powered operating system that includes chat capabilities, document
              management, task automation, workflow creation, calendar integration, and team collaboration tools
              ("Service"). The Service is accessible via web browser and integrates with various third-party
              services and AI providers.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">3. User Accounts</h2>
            <h3 className="text-xl font-semibold mb-2">3.1 Account Creation</h3>
            <p>
              To use certain features of the Service, you must register for an account. You agree to provide
              accurate, current, and complete information during the registration process and to update such
              information to keep it accurate, current, and complete.
            </p>
            <h3 className="text-xl font-semibold mb-2 mt-4">3.2 Account Security</h3>
            <p>
              You are responsible for safeguarding the password that you use to access the Service and for any
              activities or actions under your password. We encourage you to use "strong" passwords with your
              account. You must notify us immediately of any breach of security or unauthorized use of your account.
            </p>
            <h3 className="text-xl font-semibold mb-2 mt-4">3.3 Account Termination</h3>
            <p>
              We reserve the right to suspend or terminate your account and access to the Service at our sole
              discretion, without notice, for conduct that we believe violates these Terms of Service or is
              harmful to other users, us, or third parties, or for any other reason.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">4. Subscription Plans and Billing</h2>
            <h3 className="text-xl font-semibold mb-2">4.1 Free Trial</h3>
            <p>
              We may offer a free trial period for paid subscription plans. At the end of the trial period, your
              subscription will automatically convert to a paid subscription unless you cancel before the trial
              ends.
            </p>
            <h3 className="text-xl font-semibold mb-2 mt-4">4.2 Subscription Fees</h3>
            <p>
              Paid subscriptions are billed in advance on a monthly or annual basis, depending on your chosen
              plan. All fees are exclusive of applicable taxes unless otherwise stated. You agree to pay all
              applicable fees for your subscription.
            </p>
            <h3 className="text-xl font-semibold mb-2 mt-4">4.3 Payment Processing</h3>
            <p>
              Payment processing services are provided by Stripe. By using our paid services, you agree to
              Stripe's terms and privacy policy. We do not store your complete credit card information.
            </p>
            <h3 className="text-xl font-semibold mb-2 mt-4">4.4 Cancellation and Refunds</h3>
            <p>
              You may cancel your subscription at any time through your account settings or the Stripe Customer
              Portal. Cancellations take effect at the end of the current billing period. We do not provide
              refunds for partial billing periods, except as required by law.
            </p>
            <h3 className="text-xl font-semibold mb-2 mt-4">4.5 Price Changes</h3>
            <p>
              We reserve the right to modify our pricing. We will provide you with reasonable notice of any
              pricing changes. Your continued use of the Service after the price change constitutes your
              agreement to pay the modified price.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">5. Usage Limits and Quotas</h2>
            <p>
              Your use of the Service is subject to usage limits and quotas based on your subscription plan.
              These limits include but are not limited to:
            </p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li>Number of AI messages per month</li>
              <li>Document storage capacity</li>
              <li>Number of team members</li>
              <li>API rate limits</li>
              <li>Workflow execution limits</li>
            </ul>
            <p className="mt-4">
              Exceeding these limits may result in service degradation or suspension until you upgrade your plan
              or the limits reset at the start of your next billing period.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">6. Acceptable Use Policy</h2>
            <p>You agree not to use the Service to:</p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li>Violate any applicable laws or regulations</li>
              <li>Infringe on the intellectual property rights of others</li>
              <li>Transmit any harmful, threatening, abusive, or offensive content</li>
              <li>Attempt to gain unauthorized access to the Service or related systems</li>
              <li>Interfere with or disrupt the Service or servers</li>
              <li>Use the Service for any illegal or fraudulent purposes</li>
              <li>Scrape, spider, or crawl the Service without permission</li>
              <li>Reverse engineer or attempt to extract source code</li>
              <li>Resell or redistribute the Service without authorization</li>
              <li>Use the Service to generate spam or malicious content</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">7. Intellectual Property Rights</h2>
            <h3 className="text-xl font-semibold mb-2">7.1 Our Property</h3>
            <p>
              The Service and its original content, features, and functionality are owned by Perpetual Core and
              are protected by international copyright, trademark, patent, trade secret, and other intellectual
              property laws.
            </p>
            <h3 className="text-xl font-semibold mb-2 mt-4">7.2 Your Content</h3>
            <p>
              You retain all rights to the content you upload, create, or store in the Service ("User Content").
              By uploading User Content, you grant us a worldwide, non-exclusive, royalty-free license to use,
              store, process, and display your User Content solely for the purpose of providing the Service.
            </p>
            <h3 className="text-xl font-semibold mb-2 mt-4">7.3 AI-Generated Content</h3>
            <p>
              Content generated by AI models through the Service is provided to you for your use. However, AI
              models may occasionally generate similar content for different users. We do not claim ownership
              of AI-generated content, but we also cannot guarantee its uniqueness.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">8. Third-Party Services</h2>
            <p>
              The Service integrates with third-party services and AI providers (including Claude, GPT-4, Gemini,
              Slack, Zoom, Google Drive, and others). Your use of these integrations is subject to the respective
              third-party terms and privacy policies. We are not responsible for the practices of third-party
              services.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">9. Privacy and Data Protection</h2>
            <p>
              Your privacy is important to us. Our collection and use of personal information is described in
              our{" "}
              <Link href="/privacy" className="text-primary hover:underline">
                Privacy Policy
              </Link>
              . By using the Service, you consent to our collection and use of personal data in accordance with
              our Privacy Policy.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">10. Disclaimers and Limitation of Liability</h2>
            <h3 className="text-xl font-semibold mb-2">10.1 Service Availability</h3>
            <p>
              The Service is provided "as is" and "as available" without warranties of any kind. We do not
              guarantee that the Service will be uninterrupted, secure, or error-free. We may modify, suspend,
              or discontinue the Service at any time without notice.
            </p>
            <h3 className="text-xl font-semibold mb-2 mt-4">10.2 AI Accuracy</h3>
            <p>
              AI-generated content may contain errors, inaccuracies, or inappropriate material. You are
              responsible for reviewing and verifying all AI-generated content before use. We make no warranties
              about the accuracy, reliability, or completeness of AI-generated content.
            </p>
            <h3 className="text-xl font-semibold mb-2 mt-4">10.3 Limitation of Liability</h3>
            <p>
              To the maximum extent permitted by law, Perpetual Core shall not be liable for any indirect,
              incidental, special, consequential, or punitive damages, or any loss of profits or revenues,
              whether incurred directly or indirectly, or any loss of data, use, goodwill, or other intangible
              losses resulting from your use of the Service.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">11. Indemnification</h2>
            <p>
              You agree to indemnify, defend, and hold harmless Perpetual Core, its officers, directors,
              employees, and agents from any claims, damages, losses, liabilities, and expenses (including
              legal fees) arising out of your use of the Service, your User Content, or your violation of
              these Terms.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">12. Changes to Terms</h2>
            <p>
              We reserve the right to modify these Terms at any time. We will provide notice of material
              changes by posting the updated Terms on our website and updating the "Last updated" date. Your
              continued use of the Service after changes become effective constitutes your acceptance of the
              modified Terms.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">13. Governing Law</h2>
            <p>
              These Terms shall be governed by and construed in accordance with the laws of the United States,
              without regard to its conflict of law provisions. Any disputes arising from these Terms or your
              use of the Service shall be resolved in the courts located in the United States.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">14. Contact Information</h2>
            <p>
              If you have any questions about these Terms of Service, please contact us at:
            </p>
            <p className="mt-2">
              Email: legal@perpetualcore.com
              <br />
              Address: Perpetual Core, Inc.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">15. Severability</h2>
            <p>
              If any provision of these Terms is found to be unenforceable or invalid, that provision shall be
              limited or eliminated to the minimum extent necessary so that these Terms shall otherwise remain
              in full force and effect.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">16. Entire Agreement</h2>
            <p>
              These Terms constitute the entire agreement between you and Perpetual Core regarding the Service
              and supersede all prior agreements and understandings, whether written or oral, regarding the
              Service.
            </p>
          </section>
        </div>

        <div className="mt-12 p-6 bg-muted rounded-lg">
          <p className="text-sm text-muted-foreground">
            By using Perpetual Core, you acknowledge that you have read, understood, and agree to be bound by
            these Terms of Service.
          </p>
        </div>
      </div>
    </div>
  );
}

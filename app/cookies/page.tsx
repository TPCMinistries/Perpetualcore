import { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export const metadata: Metadata = {
  title: "Cookie Policy | Perpetual Core Platform",
  description: "Cookie Policy for Perpetual Core Platform",
};

export default function CookiesPage() {
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
          <h1 className="text-4xl font-bold mb-2">Cookie Policy</h1>
          <p className="text-muted-foreground">
            Last updated: January 20, 2025
          </p>
        </div>

        <div className="prose prose-gray dark:prose-invert max-w-none">
          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">1. What Are Cookies?</h2>
            <p>
              Cookies are small text files that are stored on your device (computer, tablet, or mobile) when you
              visit a website. They are widely used to make websites work more efficiently and provide information
              to website owners.
            </p>
            <p className="mt-4">
              This Cookie Policy explains how Perpetual Core Platform ("we," "our," or "us") uses cookies and similar
              tracking technologies on our Service. By using the Service, you consent to the use of cookies as
              described in this policy.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">2. Types of Cookies We Use</h2>

            <h3 className="text-xl font-semibold mb-2">2.1 Essential Cookies</h3>
            <p>
              These cookies are necessary for the Service to function properly. They enable core functionality
              such as security, authentication, and session management. You cannot opt out of essential cookies.
            </p>
            <div className="mt-4 overflow-x-auto">
              <table className="min-w-full border border-gray-300 dark:border-gray-700">
                <thead className="bg-gray-100 dark:bg-gray-800">
                  <tr>
                    <th className="border border-gray-300 dark:border-gray-700 px-4 py-2 text-left">Cookie Name</th>
                    <th className="border border-gray-300 dark:border-gray-700 px-4 py-2 text-left">Purpose</th>
                    <th className="border border-gray-300 dark:border-gray-700 px-4 py-2 text-left">Duration</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border border-gray-300 dark:border-gray-700 px-4 py-2">auth-token</td>
                    <td className="border border-gray-300 dark:border-gray-700 px-4 py-2">Authentication and session management</td>
                    <td className="border border-gray-300 dark:border-gray-700 px-4 py-2">30 days</td>
                  </tr>
                  <tr>
                    <td className="border border-gray-300 dark:border-gray-700 px-4 py-2">csrf-token</td>
                    <td className="border border-gray-300 dark:border-gray-700 px-4 py-2">Security protection against CSRF attacks</td>
                    <td className="border border-gray-300 dark:border-gray-700 px-4 py-2">Session</td>
                  </tr>
                  <tr>
                    <td className="border border-gray-300 dark:border-gray-700 px-4 py-2">session-id</td>
                    <td className="border border-gray-300 dark:border-gray-700 px-4 py-2">Maintain user session state</td>
                    <td className="border border-gray-300 dark:border-gray-700 px-4 py-2">Session</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <h3 className="text-xl font-semibold mb-2 mt-6">2.2 Functional Cookies</h3>
            <p>
              These cookies enable enhanced functionality and personalization, such as remembering your preferences
              and settings.
            </p>
            <div className="mt-4 overflow-x-auto">
              <table className="min-w-full border border-gray-300 dark:border-gray-700">
                <thead className="bg-gray-100 dark:bg-gray-800">
                  <tr>
                    <th className="border border-gray-300 dark:border-gray-700 px-4 py-2 text-left">Cookie Name</th>
                    <th className="border border-gray-300 dark:border-gray-700 px-4 py-2 text-left">Purpose</th>
                    <th className="border border-gray-300 dark:border-gray-700 px-4 py-2 text-left">Duration</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border border-gray-300 dark:border-gray-700 px-4 py-2">theme-preference</td>
                    <td className="border border-gray-300 dark:border-gray-700 px-4 py-2">Remember dark/light mode preference</td>
                    <td className="border border-gray-300 dark:border-gray-700 px-4 py-2">1 year</td>
                  </tr>
                  <tr>
                    <td className="border border-gray-300 dark:border-gray-700 px-4 py-2">language</td>
                    <td className="border border-gray-300 dark:border-gray-700 px-4 py-2">Store language preference</td>
                    <td className="border border-gray-300 dark:border-gray-700 px-4 py-2">1 year</td>
                  </tr>
                  <tr>
                    <td className="border border-gray-300 dark:border-gray-700 px-4 py-2">sidebar-state</td>
                    <td className="border border-gray-300 dark:border-gray-700 px-4 py-2">Remember sidebar collapsed/expanded state</td>
                    <td className="border border-gray-300 dark:border-gray-700 px-4 py-2">6 months</td>
                  </tr>
                  <tr>
                    <td className="border border-gray-300 dark:border-gray-700 px-4 py-2">notification-preferences</td>
                    <td className="border border-gray-300 dark:border-gray-700 px-4 py-2">Store notification settings</td>
                    <td className="border border-gray-300 dark:border-gray-700 px-4 py-2">1 year</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <h3 className="text-xl font-semibold mb-2 mt-6">2.3 Analytics Cookies</h3>
            <p>
              These cookies help us understand how users interact with the Service by collecting information
              anonymously. This helps us improve the Service and user experience.
            </p>
            <div className="mt-4 overflow-x-auto">
              <table className="min-w-full border border-gray-300 dark:border-gray-700">
                <thead className="bg-gray-100 dark:bg-gray-800">
                  <tr>
                    <th className="border border-gray-300 dark:border-gray-700 px-4 py-2 text-left">Cookie Name</th>
                    <th className="border border-gray-300 dark:border-gray-700 px-4 py-2 text-left">Purpose</th>
                    <th className="border border-gray-300 dark:border-gray-700 px-4 py-2 text-left">Duration</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border border-gray-300 dark:border-gray-700 px-4 py-2">_ga</td>
                    <td className="border border-gray-300 dark:border-gray-700 px-4 py-2">Google Analytics: Distinguish unique users</td>
                    <td className="border border-gray-300 dark:border-gray-700 px-4 py-2">2 years</td>
                  </tr>
                  <tr>
                    <td className="border border-gray-300 dark:border-gray-700 px-4 py-2">_ga_*</td>
                    <td className="border border-gray-300 dark:border-gray-700 px-4 py-2">Google Analytics: Persist session state</td>
                    <td className="border border-gray-300 dark:border-gray-700 px-4 py-2">2 years</td>
                  </tr>
                  <tr>
                    <td className="border border-gray-300 dark:border-gray-700 px-4 py-2">analytics-id</td>
                    <td className="border border-gray-300 dark:border-gray-700 px-4 py-2">Internal analytics tracking</td>
                    <td className="border border-gray-300 dark:border-gray-700 px-4 py-2">1 year</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <h3 className="text-xl font-semibold mb-2 mt-6">2.4 Performance Cookies</h3>
            <p>
              These cookies help us monitor and improve the performance of the Service by tracking page load
              times, errors, and other performance metrics.
            </p>
            <div className="mt-4 overflow-x-auto">
              <table className="min-w-full border border-gray-300 dark:border-gray-700">
                <thead className="bg-gray-100 dark:bg-gray-800">
                  <tr>
                    <th className="border border-gray-300 dark:border-gray-700 px-4 py-2 text-left">Cookie Name</th>
                    <th className="border border-gray-300 dark:border-gray-700 px-4 py-2 text-left">Purpose</th>
                    <th className="border border-gray-300 dark:border-gray-700 px-4 py-2 text-left">Duration</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border border-gray-300 dark:border-gray-700 px-4 py-2">performance-metrics</td>
                    <td className="border border-gray-300 dark:border-gray-700 px-4 py-2">Track page load performance</td>
                    <td className="border border-gray-300 dark:border-gray-700 px-4 py-2">24 hours</td>
                  </tr>
                  <tr>
                    <td className="border border-gray-300 dark:border-gray-700 px-4 py-2">error-tracking</td>
                    <td className="border border-gray-300 dark:border-gray-700 px-4 py-2">Monitor application errors</td>
                    <td className="border border-gray-300 dark:border-gray-700 px-4 py-2">Session</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">3. Third-Party Cookies</h2>
            <p>
              Some cookies are placed by third-party services that appear on our pages. We use the following
              third-party services that may set cookies:
            </p>

            <h3 className="text-xl font-semibold mb-2 mt-4">3.1 Payment Processing</h3>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li>
                <strong>Stripe:</strong> Payment processing and subscription management. Stripe sets cookies to
                prevent fraud and ensure secure transactions. See{" "}
                <a
                  href="https://stripe.com/privacy"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  Stripe's Privacy Policy
                </a>
                .
              </li>
            </ul>

            <h3 className="text-xl font-semibold mb-2 mt-4">3.2 Analytics and Monitoring</h3>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li>
                <strong>Google Analytics:</strong> Website analytics to understand user behavior. See{" "}
                <a
                  href="https://policies.google.com/privacy"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  Google's Privacy Policy
                </a>
                .
              </li>
            </ul>

            <h3 className="text-xl font-semibold mb-2 mt-4">3.3 AI Services</h3>
            <p>
              When you use AI features, the following providers may set cookies for authentication and session
              management:
            </p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li>
                <strong>Anthropic (Claude):</strong> See{" "}
                <a
                  href="https://www.anthropic.com/privacy"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  Anthropic's Privacy Policy
                </a>
              </li>
              <li>
                <strong>OpenAI (GPT-4):</strong> See{" "}
                <a
                  href="https://openai.com/privacy"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  OpenAI's Privacy Policy
                </a>
              </li>
              <li>
                <strong>Google (Gemini):</strong> See{" "}
                <a
                  href="https://policies.google.com/privacy"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  Google's Privacy Policy
                </a>
              </li>
            </ul>

            <h3 className="text-xl font-semibold mb-2 mt-4">3.4 Integrations</h3>
            <p>When you connect third-party integrations, those services may set cookies:</p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li><strong>Slack:</strong> Team communication integration</li>
              <li><strong>Zoom:</strong> Video conferencing integration</li>
              <li><strong>Google Drive:</strong> Cloud storage integration</li>
            </ul>
            <p className="mt-4">
              We do not control these third-party cookies. Please review the privacy policies of these services
              for information about their cookie practices.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">4. Local Storage and Similar Technologies</h2>
            <p>
              In addition to cookies, we may use other technologies to store information locally on your device:
            </p>

            <h3 className="text-xl font-semibold mb-2 mt-4">4.1 Local Storage</h3>
            <p>
              We use browser local storage to store larger amounts of data locally, such as:
            </p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li>Draft messages and documents (auto-save feature)</li>
              <li>UI state and preferences</li>
              <li>Cached data for offline functionality</li>
              <li>Recently used items for quick access</li>
            </ul>

            <h3 className="text-xl font-semibold mb-2 mt-4">4.2 IndexedDB</h3>
            <p>
              We use IndexedDB to store structured data for:
            </p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li>Offline access to documents and conversations</li>
              <li>Local caching for improved performance</li>
              <li>Queue for background sync operations</li>
            </ul>

            <h3 className="text-xl font-semibold mb-2 mt-4">4.3 Session Storage</h3>
            <p>
              We use session storage for temporary data that is cleared when you close the browser:
            </p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li>Temporary form data</li>
              <li>Navigation state</li>
              <li>One-time messages and notifications</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">5. How to Control Cookies</h2>

            <h3 className="text-xl font-semibold mb-2">5.1 Browser Settings</h3>
            <p>
              Most web browsers allow you to control cookies through their settings. You can typically:
            </p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li>View what cookies are stored and delete them individually</li>
              <li>Block third-party cookies</li>
              <li>Block all cookies from specific websites</li>
              <li>Delete all cookies when you close your browser</li>
              <li>Browse in "incognito" or "private" mode</li>
            </ul>
            <p className="mt-4">
              To learn how to manage cookies in your browser, consult your browser's help documentation:
            </p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li>
                <a
                  href="https://support.google.com/chrome/answer/95647"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  Google Chrome
                </a>
              </li>
              <li>
                <a
                  href="https://support.mozilla.org/en-US/kb/cookies-information-websites-store-on-your-computer"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  Mozilla Firefox
                </a>
              </li>
              <li>
                <a
                  href="https://support.apple.com/guide/safari/manage-cookies-sfri11471/mac"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  Apple Safari
                </a>
              </li>
              <li>
                <a
                  href="https://support.microsoft.com/en-us/microsoft-edge/delete-cookies-in-microsoft-edge-63947406-40ac-c3b8-57b9-2a946a29ae09"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  Microsoft Edge
                </a>
              </li>
            </ul>

            <h3 className="text-xl font-semibold mb-2 mt-4">5.2 Opt-Out of Analytics</h3>
            <p>
              You can opt out of Google Analytics tracking by installing the{" "}
              <a
                href="https://tools.google.com/dlpage/gaoptout"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                Google Analytics Opt-out Browser Add-on
              </a>
              .
            </p>

            <h3 className="text-xl font-semibold mb-2 mt-4">5.3 Impact of Blocking Cookies</h3>
            <p>
              Please note that blocking or deleting cookies may impact your experience with the Service:
            </p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li>You may need to log in more frequently</li>
              <li>Your preferences and settings may not be saved</li>
              <li>Some features may not work properly</li>
              <li>The Service may not remember your previous interactions</li>
            </ul>
            <p className="mt-4">
              Essential cookies cannot be disabled as they are necessary for the Service to function.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">6. Updates to This Cookie Policy</h2>
            <p>
              We may update this Cookie Policy from time to time to reflect changes in our practices or for
              legal, operational, or regulatory reasons. We will notify you of significant changes by:
            </p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li>Posting the updated policy on our website</li>
              <li>Updating the "Last updated" date at the top of this page</li>
              <li>Displaying an in-app notification for material changes</li>
            </ul>
            <p className="mt-4">
              We encourage you to review this Cookie Policy periodically to stay informed about our use of
              cookies.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">7. Contact Us</h2>
            <p>
              If you have questions about our use of cookies or this Cookie Policy, please contact us:
            </p>
            <div className="mt-4 space-y-2">
              <p>
                <strong>Email:</strong> privacy@aios-platform.com
              </p>
              <p>
                <strong>Address:</strong> Perpetual Core Platform, Inc.
              </p>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">8. More Information</h2>
            <p>
              For more information about how we handle your personal data, please read our{" "}
              <Link href="/privacy" className="text-primary hover:underline">
                Privacy Policy
              </Link>
              . For information about the terms governing your use of the Service, please see our{" "}
              <Link href="/terms" className="text-primary hover:underline">
                Terms of Service
              </Link>
              .
            </p>
          </section>
        </div>

        <div className="mt-12 p-6 bg-muted rounded-lg">
          <p className="text-sm text-muted-foreground">
            This Cookie Policy explains how Perpetual Core Platform uses cookies and similar technologies. You can
            control cookies through your browser settings, but blocking essential cookies may affect the
            functionality of the Service.
          </p>
        </div>
      </div>
    </div>
  );
}

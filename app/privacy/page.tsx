import { Card } from "@/components/ui/card"
import { AuthenticatedLayout } from "@/components/authenticated-layout"

export default function PrivacyPage() {
  return (
    <AuthenticatedLayout>
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-foreground mb-4">
              Privacy Policy
            </h1>
            <p className="text-lg text-muted-foreground">
              Your privacy is important to us. This policy explains how we collect, use, and protect your information.
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>

          <div className="space-y-8">
            <Card className="p-6">
              <h2 className="text-2xl font-semibold text-foreground mb-4">
                Information We Collect
              </h2>
              <div className="space-y-4 text-muted-foreground">
                <div>
                  <h3 className="text-lg font-medium text-foreground mb-2">Personal Information</h3>
                  <ul className="list-disc list-inside space-y-1 ml-4">
                    <li>Name and email address</li>
                    <li>Account credentials (encrypted)</li>
                    <li>Payment information (processed securely by third parties)</li>
                    <li>Basic demographic information (age, location)</li>
                  </ul>
                </div>
                
                <div>
                  <h3 className="text-lg font-medium text-foreground mb-2">Betting Data</h3>
                  <ul className="list-disc list-inside space-y-1 ml-4">
                    <li>Betting history and performance metrics</li>
                    <li>Emotional check-in responses</li>
                    <li>Survey responses and assessment results</li>
                    <li>Platform usage patterns and analytics</li>
                  </ul>
                </div>
                
                <div>
                  <h3 className="text-lg font-medium text-foreground mb-2">Technical Information</h3>
                  <ul className="list-disc list-inside space-y-1 ml-4">
                    <li>IP address and device information</li>
                    <li>Browser type and version</li>
                    <li>Operating system</li>
                    <li>Cookies and similar tracking technologies</li>
                  </ul>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <h2 className="text-2xl font-semibold text-foreground mb-4">
                How We Use Your Information
              </h2>
              <div className="space-y-3 text-muted-foreground">
                <p>We use your information to:</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Provide and maintain our services</li>
                  <li>Generate personalized betting insights and recommendations</li>
                  <li>Monitor emotional patterns and provide responsible gaming alerts</li>
                  <li>Improve our platform and develop new features</li>
                  <li>Communicate with you about your account and our services</li>
                  <li>Process payments and manage subscriptions</li>
                  <li>Ensure platform security and prevent fraud</li>
                  <li>Comply with legal obligations</li>
                </ul>
              </div>
            </Card>

            <Card className="p-6">
              <h2 className="text-2xl font-semibold text-foreground mb-4">
                Data Protection and Security
              </h2>
              <div className="space-y-3 text-muted-foreground">
                <p>
                  We implement industry-standard security measures to protect your information:
                </p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>End-to-end encryption for sensitive data</li>
                  <li>Secure socket layer (SSL) technology for all data transmissions</li>
                  <li>Regular security audits and vulnerability assessments</li>
                  <li>Access controls and authentication systems</li>
                  <li>Secure data storage with reputable cloud providers</li>
                </ul>
                <p>
                  However, no method of transmission over the internet is 100% secure. While we strive to protect your data, we cannot guarantee absolute security.
                </p>
              </div>
            </Card>

            <Card className="p-6">
              <h2 className="text-2xl font-semibold text-foreground mb-4">
                Data Sharing and Third Parties
              </h2>
              <div className="space-y-3 text-muted-foreground">
                <p>We do not sell your personal information to third parties. We may share your data only in the following circumstances:</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li><strong>Payment Processors:</strong> We share payment information with secure payment processors to handle subscriptions</li>
                  <li><strong>Service Providers:</strong> We may share data with trusted third-party service providers who assist in operating our platform</li>
                  <li><strong>Legal Requirements:</strong> We may disclose information if required by law or to protect our rights</li>
                  <li><strong>Business Transfers:</strong> In the event of a merger, acquisition, or sale of assets</li>
                </ul>
                <p>
                  All third parties we work with are contractually obligated to maintain the confidentiality and security of your information.
                </p>
              </div>
            </Card>

            <Card className="p-6">
              <h2 className="text-2xl font-semibold text-foreground mb-4">
                Your Rights and Choices
              </h2>
              <div className="space-y-3 text-muted-foreground">
                <p>You have the right to:</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Access and review your personal information</li>
                  <li>Correct inaccurate or incomplete information</li>
                  <li>Delete your account and associated data</li>
                  <li>Opt out of certain data collection and processing</li>
                  <li>Request a copy of your data in a portable format</li>
                  <li>Restrict processing of your information</li>
                </ul>
                <p>
                  To exercise these rights, please contact us at info@playmindlabs.com. We will respond to your request within 30 days.
                </p>
              </div>
            </Card>

            <Card className="p-6">
              <h2 className="text-2xl font-semibold text-foreground mb-4">
                Cookies and Tracking
              </h2>
              <div className="space-y-3 text-muted-foreground">
                <p>
                  We use cookies and similar technologies to enhance your experience and analyze platform usage. Types of cookies we use:
                </p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li><strong>Essential Cookies:</strong> Required for basic platform functionality</li>
                  <li><strong>Analytics Cookies:</strong> Help us understand how users interact with our platform</li>
                  <li><strong>Preference Cookies:</strong> Remember your settings and preferences</li>
                  <li><strong>Marketing Cookies:</strong> Used to personalize content and advertisements</li>
                </ul>
                <p>
                  You can control cookie settings through your browser preferences. Note that disabling certain cookies may affect platform functionality.
                </p>
              </div>
            </Card>

            <Card className="p-6">
              <h2 className="text-2xl font-semibold text-foreground mb-4">
                Data Retention
              </h2>
              <div className="space-y-3 text-muted-foreground">
                <p>
                  We retain your information only as long as necessary to:
                </p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Fulfill the purposes for which it was collected</li>
                  <li>Comply with legal obligations</li>
                  <li>Resolve disputes and enforce our agreements</li>
                  <li>Fulfill legitimate business interests</li>
                </ul>
                <p>
                  When you delete your account, we will remove or anonymize your personal information within 30 days, except where we are required to retain it by law.
                </p>
              </div>
            </Card>

            <Card className="p-6">
              <h2 className="text-2xl font-semibold text-foreground mb-4">
                Children's Privacy
              </h2>
              <div className="space-y-3 text-muted-foreground">
                <p>
                  Our services are not intended for individuals under the age of 18. We do not knowingly collect personal information from children under 18. If we become aware that we have collected information from a child under 18, we will take steps to delete such information immediately.
                </p>
              </div>
            </Card>

            <Card className="p-6">
              <h2 className="text-2xl font-semibold text-foreground mb-4">
                International Data Transfers
              </h2>
              <div className="space-y-3 text-muted-foreground">
                <p>
                  Your information may be transferred to and processed in countries other than your own. We ensure appropriate safeguards are in place to protect your data in accordance with applicable data protection laws.
                </p>
              </div>
            </Card>

            <Card className="p-6">
              <h2 className="text-2xl font-semibold text-foreground mb-4">
                Changes to This Policy
              </h2>
              <div className="space-y-3 text-muted-foreground">
                <p>
                  We may update this privacy policy from time to time. We will notify you of any changes by:
                </p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Posting the updated policy on our platform</li>
                  <li>Sending you an email notification for significant changes</li>
                  <li>Displaying a prominent notice on our platform</li>
                </ul>
                <p>
                  Your continued use of our services after any changes constitutes acceptance of the updated policy.
                </p>
              </div>
            </Card>

            <Card className="p-6">
              <h2 className="text-2xl font-semibold text-foreground mb-4">
                Contact Us
              </h2>
              <div className="space-y-3 text-muted-foreground">
                <p>
                  If you have any questions about this privacy policy or our data practices, please contact us:
                </p>
                <div className="bg-muted/50 p-4 rounded-lg">
                  <p><strong>Email:</strong> info@playmindlabs.com</p>
                  <p><strong>Company:</strong> PlayMind Labs LLC</p>
                  <p><strong>Platform:</strong> Serenity Pocket</p>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </AuthenticatedLayout>
  )
}

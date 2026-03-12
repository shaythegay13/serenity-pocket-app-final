import type { Metadata } from "next"
import { Card } from "@/components/ui/card"
import { FooterPageWrapper } from "@/components/footer-page-wrapper"
import { BASE_URL } from "@/lib/constants"

export const metadata: Metadata = {
  title: "Terms of Service - PlayMind Labs",
  description: "Read the terms of service for PlayMind Labs. Understand your rights and responsibilities when using our behavioral sports betting analytics platform.",
  openGraph: {
    title: "Terms of Service - PlayMind Labs",
    description: "Read the terms of service for PlayMind Labs behavioral sports betting analytics platform.",
    url: `${BASE_URL}/terms`,
    siteName: "PlayMind Labs",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "Terms of Service - PlayMind Labs",
    description: "Read the terms of service for PlayMind Labs behavioral sports betting analytics platform.",
  },
  alternates: {
    canonical: `${BASE_URL}/terms`,
  },
}

export default function TermsPage() {
  const lastUpdated = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })

  return (
    <FooterPageWrapper>
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-foreground mb-4">
              Terms of Service
            </h1>
            <p className="text-lg text-muted-foreground">
              Please read these terms carefully before using PlayMind Labs.
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              Last updated: {lastUpdated}
            </p>
          </div>

          <div className="space-y-8">
            <Card className="p-6">
              <h2 className="text-2xl font-semibold text-foreground mb-4">
                Agreement to Terms
              </h2>
              <div className="space-y-3 text-muted-foreground">
                <p>
                  By accessing and using PlayMind Labs ("the Service"), you agree to be bound by these Terms of Service ("Terms").
                  If you do not agree to these Terms, you may not access or use the Service.
                </p>
                <p>
                  PlayMind Labs ("we," "us," or "our") reserves the right to modify these Terms at any time. 
                  We will notify users of any changes by posting the updated Terms on our platform.
                </p>
              </div>
            </Card>

            <Card className="p-6">
              <h2 className="text-2xl font-semibold text-foreground mb-4">
                Description of Service
              </h2>
              <div className="space-y-3 text-muted-foreground">
                <p>
                  PlayMind Labs is an AI-powered sports betting analytics platform that provides:
                </p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Behavioral analysis and emotional tracking</li>
                  <li>Betting performance analytics and insights</li>
                  <li>AI-powered betting recommendations</li>
                  <li>Responsible gaming tools and safety features</li>
                  <li>Odds comparison and market analysis</li>
                </ul>
                <p>
                  The Service is designed for informational and educational purposes only and does not facilitate actual betting transactions.
                </p>
              </div>
            </Card>

            <Card className="p-6">
              <h2 className="text-2xl font-semibold text-foreground mb-4">
                Eligibility and Age Requirements
              </h2>
              <div className="space-y-3 text-muted-foreground">
                <p>
                  You must be at least 18 years of age to create an account and use our Service. 
                  By creating an account, you represent and warrant that you are at least 18 years old.
                </p>
                <p>
                  The Service is not available in jurisdictions where sports betting is illegal or where we are not licensed to operate.
                </p>
              </div>
            </Card>

            <Card className="p-6">
              <h2 className="text-2xl font-semibold text-foreground mb-4">
                Account Registration and Security
              </h2>
              <div className="space-y-3 text-muted-foreground">
                <p>
                  To access certain features of the Service, you must register for an account. You agree to:
                </p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Provide accurate, current, and complete information</li>
                  <li>Maintain and update your account information</li>
                  <li>Keep your password secure and confidential</li>
                  <li>Accept responsibility for all activities under your account</li>
                  <li>Notify us immediately of any unauthorized use</li>
                </ul>
                <p>
                  We reserve the right to suspend or terminate accounts that violate these Terms.
                </p>
              </div>
            </Card>

            <Card className="p-6">
              <h2 className="text-2xl font-semibold text-foreground mb-4">
                Subscription and Payment Terms
              </h2>
              <div className="space-y-3 text-muted-foreground">
                <p>
                  PlayMind Labs offers both free and paid subscription plans. Paid subscriptions are subject to the following terms:
                </p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Subscriptions are billed on a monthly basis</li>
                  <li>Payments are processed through secure third-party payment processors</li>
                  <li>Subscriptions automatically renew unless cancelled</li>
                  <li>You may cancel your subscription at any time</li>
                  <li>No refunds for partial months of service</li>
                  <li>We offer a 7-day money-back guarantee for new subscriptions</li>
                </ul>
                <p>
                  Prices are subject to change with 30 days notice to existing subscribers.
                </p>
              </div>
            </Card>

            <Card className="p-6">
              <h2 className="text-2xl font-semibold text-foreground mb-4">
                Responsible Gaming and Disclaimer
              </h2>
              <div className="space-y-3 text-muted-foreground">
                <p>
                  <strong>IMPORTANT DISCLAIMER:</strong> PlayMind Labs is an analytical and educational tool only.
                  We do not facilitate betting, accept wagers, or guarantee betting outcomes.
                </p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>All betting recommendations are for informational purposes only</li>
                  <li>Past performance does not guarantee future results</li>
                  <li>We are not responsible for any betting losses or decisions</li>
                  <li>Always bet within your means and follow local laws</li>
                  <li>If you believe you have a gambling problem, seek professional help</li>
                </ul>
                <p>
                  Our Service includes responsible gaming features, but these are not a substitute for professional advice or self-exclusion programs.
                </p>
              </div>
            </Card>

            <Card className="p-6">
              <h2 className="text-2xl font-semibold text-foreground mb-4">
                User Conduct and Prohibited Activities
              </h2>
              <div className="space-y-3 text-muted-foreground">
                <p>
                  You agree not to use the Service for any unlawful or prohibited purposes, including:
                </p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Violating any applicable laws or regulations</li>
                  <li>Using the Service for illegal betting activities</li>
                  <li>Attempting to gain unauthorized access to our systems</li>
                  <li>Interfering with or disrupting the Service</li>
                  <li>Sharing account credentials with others</li>
                  <li>Reverse engineering or copying our proprietary technology</li>
                  <li>Using automated tools to access the Service</li>
                  <li>Harassing, threatening, or abusing other users</li>
                </ul>
              </div>
            </Card>

            <Card className="p-6">
              <h2 className="text-2xl font-semibold text-foreground mb-4">
                Intellectual Property Rights
              </h2>
              <div className="space-y-3 text-muted-foreground">
                <p>
                  The Service and its original content, features, and functionality are owned by PlayMind Labs and are protected by 
                  international copyright, trademark, and other intellectual property laws.
                </p>
                <p>
                  You may not copy, modify, distribute, sell, or lease any part of the Service without our express written permission.
                </p>
                <p>
                  You retain ownership of any information you provide to us, but grant us a license to use, process, and analyze this information 
                  to provide and improve our services.
                </p>
              </div>
            </Card>

            <Card className="p-6">
              <h2 className="text-2xl font-semibold text-foreground mb-4">
                Privacy and Data Protection
              </h2>
              <div className="space-y-3 text-muted-foreground">
                <p>
                  Your privacy is important to us. Our collection and use of personal information is governed by our Privacy Policy, 
                  which forms part of these Terms.
                </p>
                <p>
                  By using our Service, you consent to the collection and use of information as described in our Privacy Policy.
                </p>
              </div>
            </Card>

            <Card className="p-6">
              <h2 className="text-2xl font-semibold text-foreground mb-4">
                Service Availability and Modifications
              </h2>
              <div className="space-y-3 text-muted-foreground">
                <p>
                  We strive to maintain the Service's availability but do not guarantee uninterrupted access. 
                  We may temporarily suspend the Service for maintenance, updates, or other technical reasons.
                </p>
                <p>
                  We reserve the right to modify, suspend, or discontinue the Service (or any part thereof) at any time with or without notice.
                </p>
              </div>
            </Card>

            <Card className="p-6">
              <h2 className="text-2xl font-semibold text-foreground mb-4">
                Limitation of Liability
              </h2>
              <div className="space-y-3 text-muted-foreground">
                <p>
                  <strong>TO THE MAXIMUM EXTENT PERMITTED BY LAW,</strong> PlayMind Labs shall not be liable for any indirect, 
                  incidental, special, or consequential damages arising out of or in connection with your use of the Service.
                </p>
                <p>
                  Our total liability for any claims related to the Service shall not exceed the amount you paid for the Service 
                  in the 12 months preceding the claim.
                </p>
                <p>
                  This limitation of liability applies even if we have been advised of the possibility of such damages.
                </p>
              </div>
            </Card>

            <Card className="p-6">
              <h2 className="text-2xl font-semibold text-foreground mb-4">
                Indemnification
              </h2>
              <div className="space-y-3 text-muted-foreground">
                <p>
                  You agree to indemnify and hold PlayMind Labs harmless from any claims, damages, or expenses 
                  arising from your use of the Service, violation of these Terms, or violation of any rights of another party.
                </p>
              </div>
            </Card>

            <Card className="p-6">
              <h2 className="text-2xl font-semibold text-foreground mb-4">
              Termination
              </h2>
              <div className="space-y-3 text-muted-foreground">
                <p>
                  We may terminate or suspend your account and bar access to the Service immediately, without prior notice or liability, 
                  for any reason, including if you breach the Terms.
                </p>
                <p>
                  Upon termination, your right to use the Service ceases immediately. All provisions of the Terms which by their nature 
                  should survive termination shall survive, including ownership provisions, warranty disclaimers, and limitations of liability.
                </p>
              </div>
            </Card>

            <Card className="p-6">
              <h2 className="text-2xl font-semibold text-foreground mb-4">
                Dispute Resolution
              </h2>
              <div className="space-y-3 text-muted-foreground">
                <p>
                  Any disputes arising from these Terms or your use of the Service shall be governed by the laws of the state 
                  in which PlayMind Labs is incorporated, without regard to conflict of law principles.
                </p>
                <p>
                  Any disputes shall be resolved through binding arbitration in accordance with the rules of the American Arbitration Association.
                </p>
              </div>
            </Card>

            <Card className="p-6">
              <h2 className="text-2xl font-semibold text-foreground mb-4">
                General Provisions
              </h2>
              <div className="space-y-3 text-muted-foreground">
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li><strong>Entire Agreement:</strong> These Terms constitute the entire agreement between you and PlayMind Labs</li>
                  <li><strong>Severability:</strong> If any provision is invalid, the remaining provisions remain in effect</li>
                  <li><strong>No Waiver:</strong> Our failure to enforce any provision does not waive our right to enforce it later</li>
                  <li><strong>Assignment:</strong> You may not assign your rights under these Terms without our consent</li>
                  <li><strong>Notices:</strong> We may provide notices via email or by posting on our platform</li>
                </ul>
              </div>
            </Card>

            <Card className="p-6">
              <h2 className="text-2xl font-semibold text-foreground mb-4">
                Contact Information
              </h2>
              <div className="space-y-3 text-muted-foreground">
                <p>
                  If you have any questions about these Terms of Service, please contact us:
                </p>
                <div className="bg-muted/50 p-4 rounded-lg">
                  <p><strong>Email:</strong> info@playmindlabs.com</p>
                  <p><strong>Company:</strong> PlayMind Labs</p>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </FooterPageWrapper>
  )
}

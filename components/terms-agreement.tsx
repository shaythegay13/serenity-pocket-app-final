"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { ScrollArea } from "@/components/ui/scroll-area"
import Image from "next/image"

interface TermsAgreementProps {
  onAccept: () => void
  onDecline: () => void
}

export function TermsAgreement({ onAccept, onDecline }: TermsAgreementProps) {
  const [agreedToTerms, setAgreedToTerms] = useState(false)
  const [agreedToPrivacy, setAgreedToPrivacy] = useState(false)

  const canProceed = agreedToTerms && agreedToPrivacy

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-linear-to-br from-background via-background to-primary/5">
      <Card className="w-full max-w-3xl p-8 space-y-6 shadow-lg">
        {/* Header */}
        <div className="text-center space-y-3">
          <div className="flex justify-center mb-4">
            <Image src="/logo.png" alt="PlayMind Labs" width={60} height={60} className="logo-dark-mode" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">Terms & Agreements</h1>
          <p className="text-muted-foreground">
            Please review and accept our terms to continue
          </p>
        </div>

        {/* Terms of Service */}
        <div className="space-y-3">
          <h2 className="text-lg font-semibold">Terms of Service</h2>
          <ScrollArea className="h-48 rounded-md border border-border p-4">
            <div className="space-y-3 text-sm text-muted-foreground">
              <p className="font-semibold text-foreground">Welcome to PlayMind Labs</p>
              
              <p>
                By accessing and using PlayMind Labs, you agree to be bound by these Terms of Service. 
                Please read them carefully.
              </p>

              <p className="font-semibold text-foreground">1. Service Description</p>
              <p>
                PlayMind Labs is a psychological support and decision-making tool designed to help sports 
                bettors and day traders manage emotions, identify cognitive biases, and develop disciplined 
                trading and betting habits.
              </p>

              <p className="font-semibold text-foreground">2. Not Financial Advice</p>
              <p>
                PlayMind Labs does NOT provide financial, investment, or betting advice. All insights and 
                tools are for educational and self-awareness purposes only. You are solely responsible for 
                your financial decisions. Past performance does not guarantee future results.
              </p>

              <p className="font-semibold text-foreground">3. Risk Acknowledgment</p>
              <p>
                Trading and betting involve substantial risk of loss. You acknowledge that you may lose some 
                or all of your invested capital. Never invest or bet more than you can afford to lose.
              </p>

              <p className="font-semibold text-foreground">4. User Responsibilities</p>
              <p>
                You agree to: (a) provide accurate information, (b) maintain the confidentiality of your 
                account, (c) use the service for lawful purposes only, and (d) comply with all applicable 
                laws and regulations regarding trading and betting in your jurisdiction.
              </p>

              <p className="font-semibold text-foreground">5. Subscription and Billing</p>
              <p>
                PlayMind Labs offers a free tier and paid subscription tiers. Paid subscriptions will be 
                billed on a recurring basis until cancelled. All fees are non-refundable except as required 
                by law.
              </p>

              <p className="font-semibold text-foreground">6. Intellectual Property</p>
              <p>
                All content, features, and functionality of PlayMind Labs are owned by us and protected 
                by copyright, trademark, and other intellectual property laws.
              </p>

              <p className="font-semibold text-foreground">7. Limitation of Liability</p>
              <p>
                To the maximum extent permitted by law, PlayMind Labs and its operators shall not be 
                liable for any financial losses, trading losses, betting losses, or any indirect, 
                incidental, or consequential damages arising from your use of the service.
              </p>

              <p className="font-semibold text-foreground">8. Service Modifications</p>
              <p>
                We reserve the right to modify, suspend, or discontinue any part of the service at any 
                time without notice.
              </p>

              <p className="font-semibold text-foreground">9. Termination</p>
              <p>
                We may terminate or suspend your access to the service immediately, without prior notice, 
                for conduct that we believe violates these Terms or is harmful to other users.
              </p>

              <p className="font-semibold text-foreground">10. Changes to Terms</p>
              <p>
                We may update these Terms from time to time. Continued use of the service after changes 
                constitutes acceptance of the new Terms.
              </p>
            </div>
          </ScrollArea>
        </div>

        {/* Privacy Policy */}
        <div className="space-y-3">
          <h2 className="text-lg font-semibold">Privacy Policy</h2>
          <ScrollArea className="h-48 rounded-md border border-border p-4">
            <div className="space-y-3 text-sm text-muted-foreground">
              <p className="font-semibold text-foreground">Your Privacy Matters</p>
              
              <p>
                This Privacy Policy explains how we collect, use, and protect your personal information.
              </p>

              <p className="font-semibold text-foreground">1. Information We Collect</p>
              <p>
                We collect: (a) Account information (name, email, username), (b) Survey responses about 
                your trading/betting habits, (c) Usage data (emotions logged, biases identified, journal 
                entries), (d) Technical data (IP address, browser type, device information).
              </p>

              <p className="font-semibold text-foreground">2. How We Use Your Information</p>
              <p>
                We use your information to: (a) Provide and improve our service, (b) Personalize your 
                experience, (c) Send important updates and notifications, (d) Analyze usage patterns and 
                trends, (e) Ensure security and prevent fraud.
              </p>

              <p className="font-semibold text-foreground">3. Data Storage and Security</p>
              <p>
                Your data is stored securely using industry-standard encryption. We use Supabase for 
                authentication and data storage. While we implement robust security measures, no system 
                is completely secure.
              </p>

              <p className="font-semibold text-foreground">4. Data Sharing</p>
              <p>
                We do NOT sell your personal information. We may share data with: (a) Service providers 
                who assist in operating our platform, (b) Law enforcement when required by law, 
                (c) Aggregate, anonymized data for research purposes.
              </p>

              <p className="font-semibold text-foreground">5. Cookies and Tracking</p>
              <p>
                We use cookies and similar technologies to maintain your session, remember preferences, 
                and analyze usage. You can control cookies through your browser settings.
              </p>

              <p className="font-semibold text-foreground">6. Your Rights</p>
              <p>
                You have the right to: (a) Access your personal data, (b) Correct inaccurate data, 
                (c) Request deletion of your data, (d) Export your data, (e) Opt out of marketing 
                communications.
              </p>

              <p className="font-semibold text-foreground">7. Data Retention</p>
              <p>
                We retain your data for as long as your account is active or as needed to provide services. 
                If you delete your account, we will delete your personal data within 30 days, except where 
                retention is required by law.
              </p>

              <p className="font-semibold text-foreground">8. Children's Privacy</p>
              <p>
                PlayMind Labs is not intended for users under 18. We do not knowingly collect information 
                from children.
              </p>

              <p className="font-semibold text-foreground">9. International Users</p>
              <p>
                Your information may be transferred to and processed in countries other than your own. 
                By using our service, you consent to such transfers.
              </p>

              <p className="font-semibold text-foreground">10. Contact Us</p>
              <p>
                For privacy concerns or data requests, contact us at info@playmindlabs.com
              </p>
            </div>
          </ScrollArea>
        </div>

        {/* Checkboxes */}
        <div className="space-y-3">
          <div className="flex items-start space-x-3 p-4 rounded-lg border border-border bg-muted/30">
            <Checkbox
              id="terms"
              checked={agreedToTerms}
              onCheckedChange={(checked) => setAgreedToTerms(checked as boolean)}
              className="size-5 border-2 border-muted-foreground/50 data-[state=checked]:border-primary mt-0.5"
            />
            <label htmlFor="terms" className="text-sm cursor-pointer leading-relaxed">
              I have read and agree to the <span className="font-semibold">Terms of Service</span>.
              I understand that trading and betting involve substantial risk of loss and that Serenity
              Pocket does not provide financial advice.
            </label>
          </div>

          <div className="flex items-start space-x-3 p-4 rounded-lg border border-border bg-muted/30">
            <Checkbox
              id="privacy"
              checked={agreedToPrivacy}
              onCheckedChange={(checked) => setAgreedToPrivacy(checked as boolean)}
              className="size-5 border-2 border-muted-foreground/50 data-[state=checked]:border-primary mt-0.5"
            />
            <label htmlFor="privacy" className="text-sm cursor-pointer leading-relaxed">
              I have read and agree to the <span className="font-semibold">Privacy Policy</span>.
              I consent to the collection and use of my information as described.
            </label>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 pt-4">
          <Button variant="outline" onClick={onDecline} className="flex-1">
            Decline
          </Button>
          <Button 
            onClick={onAccept} 
            disabled={!canProceed}
            className="flex-1"
          >
            Accept & Continue
          </Button>
        </div>

        <p className="text-xs text-center text-muted-foreground">
          By continuing, you acknowledge that you have read, understood, and agree to be bound by 
          these terms and policies
        </p>
      </Card>
    </div>
  )
}

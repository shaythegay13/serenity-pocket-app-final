import { Metadata } from "next"
import { BASE_URL } from "@/lib/constants"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { FooterPageWrapper } from "@/components/footer-page-wrapper"
import { ContactForm } from "@/components/contact-form"

export const metadata: Metadata = {
  title: "Contact Us | PlayMind Labs",
  description: "Get in touch with PlayMind Labs for support, feedback, or partnership inquiries.",
  openGraph: {
    title: "Contact Us | PlayMind Labs",
    description: "Get in touch with PlayMind Labs.",
    url: `${BASE_URL}/contact`,
  },
}

export default function ContactPage() {
  return (
    <FooterPageWrapper>
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-foreground mb-4">
              Get In Touch With PlayMind Labs
            </h1>
            <p className="text-lg text-muted-foreground">
              We'd love to hear from you. Send us a message and we'll respond as soon as possible.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Contact Information */}
            <div className="lg:col-span-1 space-y-6">
              <Card className="p-6">
                <h2 className="text-xl font-semibold text-foreground mb-4">
                  Get in Touch
                </h2>
                <div className="space-y-4">
                  <div>
                    <h3 className="font-medium text-foreground mb-1">Email</h3>
                    <p className="text-muted-foreground">
                      info@playmindlabs.com
                    </p>
                  </div>
                  <div>
                    <h3 className="font-medium text-foreground mb-1">Company</h3>
                    <p className="text-muted-foreground">
                      PlayMind Labs
                    </p>
                  </div>
                  <div>
                    <h3 className="font-medium text-foreground mb-1">Platform</h3>
                    <p className="text-muted-foreground">
                      PlayMind Labs
                    </p>
                  </div>
                </div>
              </Card>

              <Card className="p-6">
                <h2 className="text-xl font-semibold text-foreground mb-4">
                  Response Times
                </h2>
                <div className="space-y-3 text-sm text-muted-foreground">
                  <div className="flex justify-between">
                    <span>General Inquiries:</span>
                    <span>24-48 hours</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Technical Support:</span>
                    <span>12-24 hours</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Account Issues:</span>
                    <span>4-8 hours</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Partnership Inquiries:</span>
                    <span>2-3 business days</span>
                  </div>
                </div>
              </Card>

              <Card className="p-6">
                <h2 className="text-xl font-semibold text-foreground mb-4">
                  Other Resources
                </h2>
                <div className="space-y-2">
                  <a
                    href="/faq"
                    className="block text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    → Frequently Asked Questions
                  </a>
                  <a
                    href="/features"
                    className="block text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    → Platform Features
                  </a>
                  <a
                    href="/pricing"
                    className="block text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    → Pricing Information
                  </a>
                </div>
              </Card>
            </div>

            {/* Contact Form */}
            <div className="lg:col-span-2">
              <ContactForm />
            </div>
          </div>

          {/* FAQ Preview */}
          <div className="mt-16">
            <Card className="p-8">
              <h2 className="text-2xl font-semibold text-foreground mb-6 text-center">
                Before You Contact Us
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="font-medium text-foreground">Common Questions</h3>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li>• How do I reset my password?</li>
                    <li>• Can I change my subscription plan?</li>
                    <li>• How accurate are the AI predictions?</li>
                    <li>• What sports do you cover?</li>
                  </ul>
                </div>
                <div className="space-y-4">
                  <h3 className="font-medium text-foreground">Quick Solutions</h3>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li>• Check our FAQ section for instant answers</li>
                    <li>• Review our Features page for capability questions</li>
                    <li>• Visit Pricing for subscription inquiries</li>
                    <li>• Try refreshing the page for technical issues</li>
                  </ul>
                </div>
              </div>
              <div className="text-center mt-6">
                <Button variant="outline" asChild>
                  <a href="/faq">Browse FAQ</a>
                </Button>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </FooterPageWrapper>
  )
}

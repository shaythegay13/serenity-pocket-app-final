"use client"

import { useState } from "react"
import dynamic from "next/dynamic"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { FooterPageWrapper } from "@/components/footer-page-wrapper"

// Dynamically import Select component to avoid hydration issues
const Select = dynamic(() => import("@/components/ui/select").then(mod => ({ default: mod.Select })), {
  ssr: false,
  loading: () => (
    <div className="w-full h-10 border border-input bg-background rounded-md flex items-center px-3">
      <span className="text-muted-foreground text-sm">Loading...</span>
    </div>
  )
})

const SelectContent = dynamic(() => import("@/components/ui/select").then(mod => ({ default: mod.SelectContent })), { ssr: false })
const SelectItem = dynamic(() => import("@/components/ui/select").then(mod => ({ default: mod.SelectItem })), { ssr: false })
const SelectTrigger = dynamic(() => import("@/components/ui/select").then(mod => ({ default: mod.SelectTrigger })), { ssr: false })
const SelectValue = dynamic(() => import("@/components/ui/select").then(mod => ({ default: mod.SelectValue })), { ssr: false })
export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    category: "",
    message: ""
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.name || !formData.email || !formData.message) {
      toast.error("Please fill in all required fields")
      return
    }

    setIsSubmitting(true)

    try {
      // Create mailto link
      const subject = encodeURIComponent(formData.subject || `Contact Form: ${formData.category}`)
      const body = encodeURIComponent(
        `Name: ${formData.name}\nEmail: ${formData.email}\nCategory: ${formData.category}\n\nMessage:\n${formData.message}`
      )
      
      const mailtoLink = `mailto:info@playmindlabs.com?subject=${subject}&body=${body}`
      
      // Open email client
      window.location.href = mailtoLink
      
      toast.success("Opening your email client...")
      
      // Reset form after a short delay
      setTimeout(() => {
        setFormData({
          name: "",
          email: "",
          subject: "",
          category: "",
          message: ""
        })
      }, 1000)
      
    } catch (error) {
      toast.error("Failed to open email client. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <FooterPageWrapper>
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-foreground mb-4">
              Contact Us
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
              <Card className="p-6">
                <h2 className="text-2xl font-semibold text-foreground mb-6">
                  Send us a Message
                </h2>
                
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Name *</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => handleInputChange("name", e.target.value)}
                        placeholder="Your full name"
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="email">Email *</Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => handleInputChange("email", e.target.value)}
                        placeholder="your@email.com"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="category">Category</Label>
                    <Select value={formData.category} onValueChange={(value) => handleInputChange("category", value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="general">General Inquiry</SelectItem>
                        <SelectItem value="technical">Technical Support</SelectItem>
                        <SelectItem value="account">Account Issue</SelectItem>
                        <SelectItem value="billing">Billing Question</SelectItem>
                        <SelectItem value="feedback">Feedback</SelectItem>
                        <SelectItem value="partnership">Partnership</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="subject">Subject</Label>
                    <Input
                      id="subject"
                      value={formData.subject}
                      onChange={(e) => handleInputChange("subject", e.target.value)}
                      placeholder="Brief description of your inquiry"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="message">Message *</Label>
                    <Textarea
                      id="message"
                      value={formData.message}
                      onChange={(e) => handleInputChange("message", e.target.value)}
                      placeholder="Tell us more about your inquiry..."
                      rows={6}
                      required
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">
                      * Required fields
                    </p>
                    <Button 
                      type="submit" 
                      disabled={isSubmitting}
                      className="min-w-[120px]"
                    >
                      {isSubmitting ? "Sending..." : "Send Message"}
                    </Button>
                  </div>
                </form>

                <div className="mt-6 p-4 bg-muted/50 rounded-lg">
                  <p className="text-sm text-muted-foreground">
                    <strong>Note:</strong> This form will open your default email client with the message pre-filled. 
                    If you prefer, you can also email us directly at <a href="mailto:info@playmindlabs.com" className="text-primary hover:underline">info@playmindlabs.com</a>
                  </p>
                </div>
              </Card>
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

/**
 * Email Alert System for API Thresholds and Revenue Triggers
 * 
 * Sends critical notifications to info@playmindlabs.com
 */

import nodemailer from 'nodemailer';

export interface AlertEmail {
  subject: string;
  body: string;
  priority?: 'low' | 'medium' | 'high' | 'critical';
}

interface EmailConfig {
  user: string;
  pass: string;
  to: string;
}

class EmailAlertService {
  private transporter: nodemailer.Transporter;
  private config: EmailConfig;

  constructor() {
    this.config = {
      user: process.env.EMAIL_USER || '',
      pass: process.env.EMAIL_PASS || '',
      to: process.env.ALERT_EMAIL || 'info@playmindlabs.com'
    };

    // Validate configuration
    if (!this.config.user || !this.config.pass) {
      console.warn('⚠️ Email credentials not configured. Alerts will be logged only.');
    }

    this.transporter = nodemailer.createTransport({
      service: 'gmail', // Can be switched to SendGrid/Resend
      auth: {
        user: this.config.user,
        pass: this.config.pass
      }
    });
  }

  /**
   * Send alert email with fallback to console logging
   */
  async sendAlert(alert: AlertEmail): Promise<boolean> {
    const { subject, body, priority = 'medium' } = alert;
    
    // Always log the alert
    console.log(`🚨 [${priority.toUpperCase()}] ${subject}`);
    console.log(`📧 ${body}`);
    
    // Try to send email if configured
    if (!this.config.user || !this.config.pass) {
      console.log('📧 Email not sent - credentials not configured');
      return false;
    }

    try {
      await this.transporter.sendMail({
        to: this.config.to,
        subject,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 8px 8px 0 0;">
              <h1 style="margin: 0; font-size: 24px;">PlayMind Labs Alert</h1>
              <p style="margin: 5px 0 0 0; opacity: 0.9;">Automated Monitoring System</p>
            </div>
            
            <div style="background: #f8f9fa; padding: 20px; border-radius: 0 0 8px 8px;">
              <h2 style="color: #333; margin-top: 0;">${subject}</h2>
              <p style="color: #666; line-height: 1.6;">${body}</p>
              
              <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #dee2e6;">
                <p style="margin: 0; color: #6c757d; font-size: 12px;">
                  Priority: <strong>${priority.toUpperCase()}</strong><br>
                  Time: ${new Date().toISOString()}<br>
                  Auto-sent by PlayMind monitoring system
                </p>
              </div>
            </div>
          </div>
        `
      });
      
      console.log('✅ Alert email sent successfully');
      return true;
    } catch (error) {
      console.error('❌ Failed to send alert email:', error);
      return false;
    }
  }

  /**
   * Send API threshold warning
   */
  async sendAPIWarning(apiName: string, used: number, total: number, upgradeCost?: number): Promise<boolean> {
    const percentage = Math.round((used / total) * 100);
    const remaining = total - used;
    
    return this.sendAlert({
      subject: `🚨 ${apiName} ${percentage}% Used - ${remaining} remaining`,
      body: `
        <strong>API Usage Alert</strong><br><br>
        <strong>${apiName}</strong> usage has reached ${percentage}% of quota.<br><br>
        <table style="border-collapse: collapse; width: 100%;">
          <tr>
            <td style="padding: 8px; border: 1px solid #ddd;"><strong>Used:</strong></td>
            <td style="padding: 8px; border: 1px solid #ddd;">${used.toLocaleString()}</td>
          </tr>
          <tr>
            <td style="padding: 8px; border: 1px solid #ddd;"><strong>Remaining:</strong></td>
            <td style="padding: 8px; border: 1px solid #ddd;">${remaining.toLocaleString()}</td>
          </tr>
          <tr>
            <td style="padding: 8px; border: 1px solid #ddd;"><strong>Total:</strong></td>
            <td style="padding: 8px; border: 1px solid #ddd;">${total.toLocaleString()}</td>
          </tr>
        </table>
        ${upgradeCost ? `<br><strong>Recommended Upgrade:</strong> $${upgradeCost}/month` : ''}
        <br><br>
        <strong>Action Required:</strong> Consider upgrading to avoid service interruption.
      `,
      priority: percentage >= 90 ? 'critical' : percentage >= 75 ? 'high' : 'medium'
    });
  }

  /**
   * Send revenue upgrade trigger
   */
  async sendRevenueTrigger(apiName: string, mrr: number, upgradeCost: number, customersNeeded: number): Promise<boolean> {
    return this.sendAlert({
      subject: `💰 UPGRADE ${apiName}: $${mrr.toFixed(0)} MRR supports Pro tier`,
      body: `
        <strong>Revenue Upgrade Opportunity</strong><br><br>
        Your current MRR of <strong>$${mrr.toFixed(2)}</strong> supports upgrading ${apiName} to Pro tier.<br><br>
        <table style="border-collapse: collapse; width: 100%;">
          <tr>
            <td style="padding: 8px; border: 1px solid #ddd;"><strong>Current MRR:</strong></td>
            <td style="padding: 8px; border: 1px solid #ddd;">$${mrr.toFixed(2)}</td>
          </tr>
          <tr>
            <td style="padding: 8px; border: 1px solid #ddd;"><strong>Upgrade Cost:</strong></td>
            <td style="padding: 8px; border: 1px solid #ddd;">$${upgradeCost}/month</td>
          </tr>
          <tr>
            <td style="padding: 8px; border: 1px solid #ddd;"><strong>Customers Needed:</strong></td>
            <td style="padding: 8px; border: 1px solid #ddd;">${customersNeeded} paying users</td>
          </tr>
        </table>
        <br><br>
        <strong>ROI:</strong> Upgrade now to support growth and improve service quality.
      `,
      priority: 'medium'
    });
  }

  /**
   * Send critical system alert
   */
  async sendCriticalAlert(subject: string, body: string): Promise<boolean> {
    return this.sendAlert({
      subject: `🚨 CRITICAL: ${subject}`,
      body: `<strong>Immediate Attention Required</strong><br><br>${body}`,
      priority: 'critical'
    });
  }
}

// Singleton instance
export const emailAlerts = new EmailAlertService();

// Convenience functions
export const sendAPIWarning = (api: string, used: number, total: number, cost?: number) => 
  emailAlerts.sendAPIWarning(api, used, total, cost);

export const sendRevenueTrigger = (api: string, mrr: number, cost: number, customers: number) => 
  emailAlerts.sendRevenueTrigger(api, mrr, cost, customers);

export const sendCriticalAlert = (subject: string, body: string) => 
  emailAlerts.sendCriticalAlert(subject, body);

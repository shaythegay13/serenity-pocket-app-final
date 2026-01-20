/**
 * Simple Test Suite for API Threshold Alerts and Revenue Triggers
 * 
 * Run with: npm test -- threshold-alerts-simple.test.ts
 */

// Mock modules before any imports
const mockNodemailer = {
  createTransport: jest.fn(() => ({
    sendMail: jest.fn().mockResolvedValue({ messageId: 'test-id' })
  }))
};

const mockSupabase = {
  from: jest.fn(() => ({
    select: jest.fn(() => ({
      eq: jest.fn(() => ({
        then: jest.fn((resolve: any) => resolve({
          data: [],
          error: null
        }))
      }))
    }))
  }))
};

// Set up mocks
jest.mock('nodemailer', () => mockNodemailer);
jest.mock('../lib/supabase', () => ({
  supabase: mockSupabase
}));

// Now import the modules
import { emailAlerts } from '../lib/email-alerts';
import { apiMonitoring } from '../lib/api-monitoring';
import { revenueTriggers } from '../lib/revenue-triggers';

describe('API Threshold Monitoring - Simple Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Set test environment variables
    process.env.EMAIL_USER = 'test@example.com';
    process.env.EMAIL_PASS = 'test-password';
    process.env.ALERT_EMAIL = 'alerts@example.com';
    process.env.THEODDS_WARNING_PCT = '25';
    process.env.RAPIDAPI_WARNING_PCT = '75';
    process.env.THEODDS_TOTAL = '20000';
    process.env.RAPIDAPI_TOTAL = '150';
    process.env.THEODDS_UPGRADE_MRR = '250';
    process.env.RAPIDAPI_UPGRADE_MRR = '75';
    process.env.PLATFORM_MARGIN = '0.8';
  });

  describe('Email Alert System', () => {
    it('should send API warning email successfully', async () => {
      // Clear any existing mocks
      jest.clearAllMocks();
      
      const mockTransporter = {
        sendMail: jest.fn().mockResolvedValue({ messageId: 'test-id' })
      };
      
      mockNodemailer.createTransport.mockReturnValue(mockTransporter);

      await emailAlerts.sendAPIWarning('TestAPI', 100, 200, 50);

      expect(mockTransporter.sendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'alerts@example.com',
          subject: expect.stringContaining('TestAPI 50% Used')
        })
      );
    });

    it('should handle missing email credentials gracefully', async () => {
      // Clear mocks and remove credentials
      jest.clearAllMocks();
      delete process.env.EMAIL_USER;
      delete process.env.EMAIL_PASS;

      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      await emailAlerts.sendAPIWarning('TestAPI', 100, 200, 50);

      expect(consoleSpy).toHaveBeenCalledWith('📧 Email not sent - credentials not configured');

      consoleSpy.mockRestore();
    });
  });

  describe('API Monitoring', () => {
    it('should calculate TheOddsAPI usage correctly', async () => {
      // Mock response with 25% remaining (75% used)
      const mockResponse = {
        headers: {
          get: jest.fn((header: string) => {
            if (header === 'x-requests-remaining') return '5000';
            return null;
          })
        }
      } as any;

      const sendAlertSpy = jest.spyOn(emailAlerts, 'sendAPIWarning').mockResolvedValue(true);

      await apiMonitoring.monitorTheOddsAPI(mockResponse);

      expect(sendAlertSpy).toHaveBeenCalledWith(
        'TheOddsAPI',
        15000, // used
        20000, // total
        99 // upgrade cost
      );
    });

    it('should not trigger alert below threshold', async () => {
      // Mock response with 50% remaining (50% used)
      const mockResponse = {
        headers: {
          get: jest.fn((header: string) => {
            if (header === 'x-requests-remaining') return '10000';
            return null;
          })
        }
      } as any;

      const sendAlertSpy = jest.spyOn(emailAlerts, 'sendAPIWarning').mockResolvedValue(true);

      await apiMonitoring.monitorTheOddsAPI(mockResponse);

      expect(sendAlertSpy).not.toHaveBeenCalled();
    });
  });

  describe('Revenue Triggers', () => {
    it('should calculate MRR correctly', async () => {
      const mockSubscriptions = [
        { plan_amount: 39.99, status: 'active' },
        { plan_amount: 39.99, status: 'active' },
        { plan_amount: 19.99, status: 'active' }
      ];

      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            then: jest.fn((resolve: any) => resolve({
              data: mockSubscriptions,
              error: null
            }))
          })
        })
      } as any);

      const metrics = await revenueTriggers.calculateRevenueMetrics();

      // Total: $99.97, Net (80% margin): $79.98
      expect(metrics.mrr).toBeCloseTo(79.98, 1);
      expect(metrics.activeSubscriptions).toBe(3);
      expect(metrics.margin).toBe(0.8);
    });

    it('should trigger TheOddsAPI upgrade at threshold', async () => {
      const mockMetrics = {
        mrr: 260, // Above $250 threshold
        activeSubscriptions: 8,
        averageRevenuePerUser: 32.5,
        margin: 0.8
      };

      jest.spyOn(revenueTriggers, 'calculateRevenueMetrics').mockResolvedValue(mockMetrics);
      const sendAlertSpy = jest.spyOn(emailAlerts, 'sendRevenueTrigger').mockResolvedValue(true);

      await revenueTriggers.checkUpgradeTriggers();

      expect(sendAlertSpy).toHaveBeenCalledWith(
        'TheOddsAPI',
        260, // MRR
        99, // upgrade cost
        8 // customers needed
      );
    });
  });

  describe('Integration Test', () => {
    it('should handle complete monitoring workflow', async () => {
      // Mock API response at warning threshold
      const mockResponse = {
        headers: {
          get: jest.fn((header: string) => {
            if (header === 'x-requests-remaining') return '4000'; // 80% used
            return null;
          })
        }
      } as any;

      const mockMetrics = {
        mrr: 280,
        activeSubscriptions: 8,
        averageRevenuePerUser: 35,
        margin: 0.8
      };

      jest.spyOn(apiMonitoring as any, 'getRapidAPIUsage').mockResolvedValue(120); // 80% used
      jest.spyOn(revenueTriggers, 'calculateRevenueMetrics').mockResolvedValue(mockMetrics);
      
      const sendAlertSpy = jest.spyOn(emailAlerts, 'sendAPIWarning').mockResolvedValue(true);
      const sendRevenueSpy = jest.spyOn(emailAlerts, 'sendRevenueTrigger').mockResolvedValue(true);

      // Run monitoring
      await apiMonitoring.monitorTheOddsAPI(mockResponse);
      await apiMonitoring.monitorRapidAPI();
      await revenueTriggers.checkUpgradeTriggers();

      // Verify alerts were sent
      expect(sendAlertSpy).toHaveBeenCalled();
      expect(sendRevenueSpy).toHaveBeenCalled();
    });
  });
});

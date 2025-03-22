
import React, { createContext, useContext, useState, useEffect } from 'react';
import { checkAndGradeFinishedEvents, setupScheduledGrading } from '@/services/eventGradingService';

interface NotificationSettings {
  emailNotificationsEnabled: boolean;
  riskThreshold: number;
  recipientEmails: string[];
  autoGradingEnabled: boolean;
  gradingIntervalMinutes: number;
}

interface NotificationContextType {
  settings: NotificationSettings;
  updateSettings: (newSettings: Partial<NotificationSettings>) => void;
  notifyAdminOfHighExposure: (marketName: string, exposureAmount: number) => Promise<boolean>;
  startScheduledGrading: () => void;
  stopScheduledGrading: () => void;
  isGradingActive: boolean;
  manuallyGradeEvents: () => Promise<string[]>;
}

const defaultSettings: NotificationSettings = {
  emailNotificationsEnabled: true,
  riskThreshold: 50000,
  recipientEmails: ['admin@yourbettingapp.com'],
  autoGradingEnabled: true,
  gradingIntervalMinutes: 15
};

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

// Helper to detect API base URL based on environment
const getApiBaseUrl = () => {
  // If in production, use the same domain
  if (window.location.hostname !== 'localhost' && !window.location.hostname.includes('127.0.0.1')) {
    return '';  // Empty string means same domain
  }
  
  // In development, use localhost:3001
  return 'http://localhost:3001';
};

// Base API URL for all requests
const API_BASE_URL = getApiBaseUrl();

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<NotificationSettings>(() => {
    // Try to load settings from localStorage
    try {
      const savedSettings = localStorage.getItem('notificationSettings');
      return savedSettings ? JSON.parse(savedSettings) : defaultSettings;
    } catch (error) {
      console.error('Failed to load notification settings:', error);
      return defaultSettings;
    }
  });
  
  const [gradingIntervalId, setGradingIntervalId] = useState<number | null>(null);
  const [isGradingActive, setIsGradingActive] = useState<boolean>(false);

  // Start scheduled grading on initial load if autoGradingEnabled is true
  useEffect(() => {
    if (settings.autoGradingEnabled) {
      startScheduledGrading();
    }
    
    // Cleanup on unmount
    return () => {
      if (gradingIntervalId !== null) {
        window.clearInterval(gradingIntervalId);
      }
    };
  }, []);

  // Function to send notification to the backend API for email delivery
  const notifyAdminOfHighExposure = async (marketName: string, exposureAmount: number): Promise<boolean> => {
    if (!settings.emailNotificationsEnabled || exposureAmount < settings.riskThreshold) {
      console.log(`Notification skipped: ${!settings.emailNotificationsEnabled ? 'emails disabled' : 'below threshold'}`);
      return false; // Don't send notification if disabled or below threshold
    }

    try {
      console.log(`🚨 Sending high exposure alert for ${marketName} with exposure $${exposureAmount}`);
      
      const response = await fetch(`${API_BASE_URL}/api/send-alert`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          marketName,
          totalExposure: exposureAmount,
          recipients: settings.recipientEmails,
          subject: `🚨 High Exposure Alert: ${marketName}`,
          message: `The market "${marketName}" has reached a high exposure level of $${exposureAmount.toLocaleString()}, exceeding the threshold of $${settings.riskThreshold.toLocaleString()}.`
        }),
      });

      if (!response.ok) {
        throw new Error(`API returned status: ${response.status}`);
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to send alert');
      }

      console.log(`✅ Email alert sent for high exposure on ${marketName}`);
      return true;
    } catch (error) {
      console.error('❌ Failed to send email alert:', error);
      return false;
    }
  };

  // Start scheduled grading process
  const startScheduledGrading = () => {
    if (gradingIntervalId !== null) {
      window.clearInterval(gradingIntervalId);
    }
    
    const intervalId = setupScheduledGrading(settings.gradingIntervalMinutes);
    setGradingIntervalId(intervalId);
    setIsGradingActive(true);
    
    console.log(`✅ Scheduled grading started with interval of ${settings.gradingIntervalMinutes} minutes`);
  };
  
  // Stop scheduled grading process
  const stopScheduledGrading = () => {
    if (gradingIntervalId !== null) {
      window.clearInterval(gradingIntervalId);
      setGradingIntervalId(null);
      setIsGradingActive(false);
      
      console.log('❌ Scheduled grading stopped');
    }
  };
  
  // Manually trigger event grading
  const manuallyGradeEvents = async (): Promise<string[]> => {
    console.log('🔄 Manually triggering event grading...');
    return await checkAndGradeFinishedEvents();
  };

  const updateSettings = (newSettings: Partial<NotificationSettings>) => {
    const updatedSettings = { ...settings, ...newSettings };
    setSettings(updatedSettings);
    
    try {
      localStorage.setItem('notificationSettings', JSON.stringify(updatedSettings));
      
      // If grading interval changed and grading is active, restart with new interval
      if (
        newSettings.gradingIntervalMinutes !== undefined && 
        newSettings.gradingIntervalMinutes !== settings.gradingIntervalMinutes &&
        isGradingActive
      ) {
        stopScheduledGrading();
        startScheduledGrading();
      }
      
      // If auto grading setting changed, start or stop accordingly
      if (newSettings.autoGradingEnabled !== undefined) {
        if (newSettings.autoGradingEnabled && !isGradingActive) {
          startScheduledGrading();
        } else if (!newSettings.autoGradingEnabled && isGradingActive) {
          stopScheduledGrading();
        }
      }
    } catch (error) {
      console.error('Failed to save notification settings:', error);
    }
  };

  return (
    <NotificationContext.Provider 
      value={{ 
        settings, 
        updateSettings, 
        notifyAdminOfHighExposure,
        startScheduledGrading,
        stopScheduledGrading,
        isGradingActive,
        manuallyGradeEvents
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

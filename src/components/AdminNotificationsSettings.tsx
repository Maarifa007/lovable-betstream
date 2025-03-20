
import React, { useState } from 'react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useNotifications } from '@/contexts/NotificationContext';
import { Bell, Mail, Save, Trash } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

const AdminNotificationsSettings: React.FC = () => {
  const { settings, updateSettings } = useNotifications();
  const [emails, setEmails] = useState<string[]>(settings.recipientEmails);
  const [newEmail, setNewEmail] = useState('');
  const [threshold, setThreshold] = useState(settings.riskThreshold);

  const handleAddEmail = () => {
    if (!newEmail || !newEmail.includes('@')) {
      toast({
        title: "Invalid Email",
        description: "Please enter a valid email address",
        variant: "destructive",
      });
      return;
    }

    if (emails.includes(newEmail)) {
      toast({
        title: "Duplicate Email",
        description: "This email is already in the list",
        variant: "destructive",
      });
      return;
    }

    setEmails([...emails, newEmail]);
    setNewEmail('');
  };

  const handleRemoveEmail = (email: string) => {
    setEmails(emails.filter(e => e !== email));
  };

  const handleSaveSettings = () => {
    updateSettings({
      emailNotificationsEnabled: settings.emailNotificationsEnabled,
      riskThreshold: threshold,
      recipientEmails: emails,
    });

    toast({
      title: "Settings Saved",
      description: "Notification settings have been updated",
    });
  };

  return (
    <div className="p-6 rounded-lg glass">
      <div className="flex items-center mb-6">
        <Bell className="h-5 w-5 mr-2" />
        <h2 className="text-xl font-bold">Email Notification Settings</h2>
      </div>

      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="email-notifications">Email Notifications</Label>
            <p className="text-sm text-muted-foreground">
              Receive email alerts for high exposure markets
            </p>
          </div>
          <Switch
            id="email-notifications"
            checked={settings.emailNotificationsEnabled}
            onCheckedChange={(checked) => updateSettings({ emailNotificationsEnabled: checked })}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="risk-threshold">Risk Threshold ($)</Label>
          <Input
            id="risk-threshold"
            type="number"
            min="10000"
            step="5000"
            value={threshold}
            onChange={(e) => setThreshold(parseInt(e.target.value) || 50000)}
            disabled={!settings.emailNotificationsEnabled}
          />
          <p className="text-xs text-muted-foreground">
            Notification will be sent when market exposure exceeds this amount
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="recipient-emails">Recipient Emails</Label>
          <div className="flex space-x-2">
            <Input
              id="recipient-emails"
              type="email"
              placeholder="admin@example.com"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              disabled={!settings.emailNotificationsEnabled}
            />
            <Button
              type="button"
              onClick={handleAddEmail}
              disabled={!settings.emailNotificationsEnabled || !newEmail}
            >
              <Mail className="h-4 w-4 mr-2" />
              Add
            </Button>
          </div>
        </div>

        {emails.length > 0 && (
          <div className="space-y-2 max-h-32 overflow-y-auto">
            <Label>Notification Recipients</Label>
            <div className="space-y-2">
              {emails.map((email, index) => (
                <div key={index} className="flex items-center justify-between p-2 bg-white/5 rounded">
                  <span>{email}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveEmail(email)}
                    disabled={!settings.emailNotificationsEnabled}
                  >
                    <Trash className="h-4 w-4 text-red-500" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        <Button
          className="w-full"
          onClick={handleSaveSettings}
          disabled={!settings.emailNotificationsEnabled}
        >
          <Save className="h-4 w-4 mr-2" />
          Save Notification Settings
        </Button>
      </div>
    </div>
  );
};

export default AdminNotificationsSettings;

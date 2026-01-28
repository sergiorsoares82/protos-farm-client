import { Layout } from '@/components/Layout';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Settings as SettingsIcon } from 'lucide-react';

export const Settings = () => {
  return (
    <Layout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold">Settings</h1>
          <p className="text-muted-foreground">Configure your application preferences</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <SettingsIcon className="h-5 w-5" />
              Application Settings
            </CardTitle>
            <CardDescription>
              Customize your experience and manage system preferences
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Settings features will be implemented here. You'll be able to configure:
            </p>
            <ul className="list-disc list-inside mt-4 space-y-2 text-muted-foreground">
              <li>Profile and account settings</li>
              <li>Notification preferences</li>
              <li>Theme and appearance</li>
              <li>Security and privacy options</li>
              <li>System integrations</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

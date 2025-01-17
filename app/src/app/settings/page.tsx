'use client';

import { ProtectedLayout } from '@/components/layouts/protected-layout';
import { AccountSettings } from '@/components/settings/account-settings';
import { PersonaSettings } from '@/components/settings/persona-settings';

export default function SettingsPage() {
  return (
    <ProtectedLayout>
      <div className="space-y-4">
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground">Manage your account settings and preferences.</p>

        <div className="max-w-2xl mt-6 space-y-6">
          <AccountSettings />
          <PersonaSettings />
        </div>
      </div>
    </ProtectedLayout>
  );
}

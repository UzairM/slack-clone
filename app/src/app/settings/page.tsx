'use client';

import { ProtectedLayout } from '@/components/layouts/protected-layout';
import { ChangePasswordForm } from '@/components/settings/change-password-form';

export default function SettingsPage() {
  return (
    <ProtectedLayout>
      <div className="space-y-4">
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground">Manage your account settings and preferences.</p>

        <div className="max-w-lg mt-6">
          <ChangePasswordForm />
        </div>
      </div>
    </ProtectedLayout>
  );
}

'use client';

import { ProtectedLayout } from '@/components/layouts/protected-layout';
import { ProfileForm } from '@/components/profile/profile-form';
import { useSessionValidation } from '@/hooks/use-session-validation';

export default function ProfilePage() {
  // Validate session and redirect if not authenticated
  useSessionValidation();

  return (
    <ProtectedLayout>
      <div className="space-y-4">
        <h1 className="text-3xl font-bold">Profile</h1>
        <p className="text-muted-foreground">Manage your profile information and preferences</p>
        <ProfileForm />
      </div>
    </ProtectedLayout>
  );
}

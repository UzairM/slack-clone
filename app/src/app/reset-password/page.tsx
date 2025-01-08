import { PasswordResetForm } from '@/components/auth/password-reset-form';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Reset Password - ChatGenius',
  description: 'Reset your ChatGenius account password',
};

export default function ResetPasswordPage() {
  return (
    <main className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800">
      <div className="w-full">
        <PasswordResetForm />
      </div>
    </main>
  );
}

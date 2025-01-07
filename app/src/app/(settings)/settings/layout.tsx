import Link from 'next/link';

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="container py-10">
      <div className="flex flex-col md:flex-row gap-8">
        {/* Sidebar Navigation */}
        <aside className="w-full md:w-64 space-y-4">
          <Link
            href="/route-test"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            ← Back to route test
          </Link>
          <nav className="space-y-2">
            <Link
              href="/settings/profile"
              className="block p-2 rounded-lg hover:bg-muted transition-colors"
            >
              Profile Settings
            </Link>
            <Link
              href="/settings/account"
              className="block p-2 rounded-lg hover:bg-muted transition-colors"
            >
              Account Settings
            </Link>
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1">{children}</main>
      </div>
    </div>
  );
}

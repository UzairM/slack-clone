import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'ChatGenius - Home',
  description: 'Welcome to ChatGenius',
};

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col">
      <div className="flex flex-1">
        {/* Sidebar will go here */}
        <div className="hidden md:flex w-60 flex-col fixed inset-y-0">
          <div className="flex flex-1 flex-col bg-gray-900 dark:bg-gray-950">
            <div className="flex-1">Sidebar content</div>
          </div>
        </div>

        {/* Main content */}
        <div className="flex-1 md:pl-60">
          <div className="h-full">Main content</div>
        </div>
      </div>
    </main>
  );
}

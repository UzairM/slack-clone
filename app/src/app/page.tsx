import { ThemeTest } from '@/components/ui/theme-test';

export default function Home() {
  return (
    <div className="container py-10">
      <h1 className="text-2xl font-bold mb-6">Theme Variables Test</h1>
      <ThemeTest />
    </div>
  );
}

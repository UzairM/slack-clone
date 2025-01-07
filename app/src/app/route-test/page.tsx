import Link from 'next/link';

export default function RouteTestPage() {
  return (
    <div className="container py-10">
      <h1 className="text-2xl font-bold mb-6">Route Testing Page</h1>

      {/* Navigation Links */}
      <div className="space-y-8">
        <section className="space-y-4">
          <h2 className="text-lg font-semibold">Available Routes</h2>
          <div className="grid gap-4">
            <Link
              href="/"
              className="p-4 bg-card hover:bg-muted rounded-lg border transition-colors"
            >
              <h3 className="font-medium">Home Page</h3>
              <p className="text-sm text-muted-foreground">Root route (/)</p>
            </Link>

            <Link
              href="/theme-test"
              className="p-4 bg-card hover:bg-muted rounded-lg border transition-colors"
            >
              <h3 className="font-medium">Theme Test</h3>
              <p className="text-sm text-muted-foreground">Test theme variables (/theme-test)</p>
            </Link>

            <Link
              href="/animation-test"
              className="p-4 bg-card hover:bg-muted rounded-lg border transition-colors"
            >
              <h3 className="font-medium">Animation Test</h3>
              <p className="text-sm text-muted-foreground">Test animations (/animation-test)</p>
            </Link>

            <Link
              href="/route-test"
              className="p-4 bg-card hover:bg-muted rounded-lg border transition-colors"
            >
              <h3 className="font-medium">Route Test</h3>
              <p className="text-sm text-muted-foreground">Current page (/route-test)</p>
            </Link>
          </div>
        </section>

        {/* Dynamic Routes Test */}
        <section className="space-y-4">
          <h2 className="text-lg font-semibold">Dynamic Routes</h2>
          <div className="grid gap-4">
            <Link
              href="/channels/general"
              className="p-4 bg-card hover:bg-muted rounded-lg border transition-colors"
            >
              <h3 className="font-medium">#general Channel</h3>
              <p className="text-sm text-muted-foreground">
                Dynamic channel route (/channels/[channel])
              </p>
            </Link>

            <Link
              href="/messages/123"
              className="p-4 bg-card hover:bg-muted rounded-lg border transition-colors"
            >
              <h3 className="font-medium">Message Thread</h3>
              <p className="text-sm text-muted-foreground">
                Dynamic message route (/messages/[id])
              </p>
            </Link>
          </div>
        </section>

        {/* Route Groups Test */}
        <section className="space-y-4">
          <h2 className="text-lg font-semibold">Route Groups</h2>
          <div className="grid gap-4">
            <Link
              href="/settings/profile"
              className="p-4 bg-card hover:bg-muted rounded-lg border transition-colors"
            >
              <h3 className="font-medium">Profile Settings</h3>
              <p className="text-sm text-muted-foreground">
                Settings group route (/settings/profile)
              </p>
            </Link>

            <Link
              href="/settings/account"
              className="p-4 bg-card hover:bg-muted rounded-lg border transition-colors"
            >
              <h3 className="font-medium">Account Settings</h3>
              <p className="text-sm text-muted-foreground">
                Settings group route (/settings/account)
              </p>
            </Link>
          </div>
        </section>
      </div>

      {/* Route Information */}
      <div className="mt-8 p-4 bg-muted rounded-lg">
        <h2 className="font-medium mb-2">Route Structure Information</h2>
        <ul className="space-y-2 text-sm text-muted-foreground">
          <li>• Using Next.js 14 App Router</li>
          <li>• All routes are server components by default</li>
          <li>• Dynamic routes use [...] syntax</li>
          <li>• Route groups use (group) syntax</li>
          <li>• Parallel routes use @folder syntax</li>
        </ul>
      </div>
    </div>
  );
}

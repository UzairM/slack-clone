export default function ProfileSettingsPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Profile Settings</h1>

      <div className="p-4 bg-muted rounded-lg">
        <h2 className="font-medium mb-2">Route Group Information</h2>
        <ul className="space-y-2 text-sm text-muted-foreground">
          <li>• Current route: /settings/profile</li>
          <li>• Part of (settings) route group</li>
          <li>• Shares layout with other settings pages</li>
          <li>• Uses settings/layout.tsx</li>
        </ul>
      </div>
    </div>
  );
}

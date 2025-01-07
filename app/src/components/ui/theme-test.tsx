'use client';

import { useTheme } from 'next-themes';

interface ColorBlockProps {
  label: string;
  variable: string;
  className?: string;
  hexValue?: string;
}

function ColorBlock({ label, variable, className, hexValue }: ColorBlockProps) {
  return (
    <div className="flex flex-col gap-2">
      <div
        className={`h-16 w-16 rounded-md border ${className}`}
        style={{ backgroundColor: `hsl(var(${variable}))` }}
      />
      <div className="text-sm">
        <p className="font-medium">{label}</p>
        <p className="text-xs text-muted-foreground">var({variable})</p>
        {hexValue && <p className="text-xs text-muted-foreground mt-0.5">{hexValue}</p>}
      </div>
    </div>
  );
}

export function ThemeTest() {
  const { theme, setTheme } = useTheme();

  return (
    <div className="space-y-8">
      {/* Theme Switcher */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => setTheme('light')}
          className={`px-4 py-2 rounded-md transition-colors ${
            theme === 'light'
              ? 'bg-primary text-primary-foreground'
              : 'bg-muted text-muted-foreground'
          }`}
        >
          Light
        </button>
        <button
          onClick={() => setTheme('dark')}
          className={`px-4 py-2 rounded-md transition-colors ${
            theme === 'dark'
              ? 'bg-primary text-primary-foreground'
              : 'bg-muted text-muted-foreground'
          }`}
        >
          Dark
        </button>
      </div>

      {/* Color Blocks */}
      <div className="space-y-8">
        <div>
          <h2 className="text-lg font-semibold mb-4">Slack Brand Colors</h2>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4 lg:grid-cols-6">
            <ColorBlock label="Primary (Purple)" variable="--primary" hexValue="#4A154B" />
            <ColorBlock label="Secondary (Blue)" variable="--secondary" hexValue="#36C5F0" />
            <ColorBlock label="Success (Green)" variable="--success" hexValue="#2EB67D" />
            <ColorBlock label="Warning (Yellow)" variable="--warning" hexValue="#ECB22E" />
            <ColorBlock label="Destructive (Red)" variable="--destructive" hexValue="#E01E5A" />
          </div>
        </div>

        <div>
          <h2 className="text-lg font-semibold mb-4">Background Colors</h2>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4 lg:grid-cols-6">
            <ColorBlock
              label="Background"
              variable="--background"
              hexValue={theme === 'dark' ? '#1A1D21' : '#FFFFFF'}
            />
            <ColorBlock
              label="Foreground"
              variable="--foreground"
              hexValue={theme === 'dark' ? '#D1D2D3' : '#1D1C1D'}
            />
            <ColorBlock
              label="Card"
              variable="--card"
              hexValue={theme === 'dark' ? '#222529' : '#FFFFFF'}
            />
            <ColorBlock
              label="Card Foreground"
              variable="--card-foreground"
              hexValue={theme === 'dark' ? '#D1D2D3' : '#1D1C1D'}
            />
          </div>
        </div>

        <div>
          <h2 className="text-lg font-semibold mb-4">UI Colors</h2>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4 lg:grid-cols-6">
            <ColorBlock
              label="Muted"
              variable="--muted"
              hexValue={theme === 'dark' ? '#222529' : '#F8F8F8'}
            />
            <ColorBlock
              label="Muted Foreground"
              variable="--muted-foreground"
              hexValue={theme === 'dark' ? '#ABABAD' : '#616061'}
            />
            <ColorBlock
              label="Border"
              variable="--border"
              hexValue={theme === 'dark' ? '#424242' : '#DDDDDD'}
            />
            <ColorBlock label="Ring" variable="--ring" hexValue="#36C5F0" />
          </div>
        </div>
      </div>

      {/* CSS Variable Values */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Current CSS Variable Values</h2>
        <pre className="p-4 rounded-lg bg-muted font-mono text-sm whitespace-pre-wrap">
          {`{
  /* Base Colors */
  --background: ${getComputedStyle(document.documentElement).getPropertyValue('--background')};
  --foreground: ${getComputedStyle(document.documentElement).getPropertyValue('--foreground')};

  /* Slack Brand Colors */
  --primary: ${getComputedStyle(document.documentElement).getPropertyValue('--primary')};
  --secondary: ${getComputedStyle(document.documentElement).getPropertyValue('--secondary')};
  --success: ${getComputedStyle(document.documentElement).getPropertyValue('--success')};
  --warning: ${getComputedStyle(document.documentElement).getPropertyValue('--warning')};
  --destructive: ${getComputedStyle(document.documentElement).getPropertyValue('--destructive')};

  /* UI Colors */
  --muted: ${getComputedStyle(document.documentElement).getPropertyValue('--muted')};
  --border: ${getComputedStyle(document.documentElement).getPropertyValue('--border')};
  --ring: ${getComputedStyle(document.documentElement).getPropertyValue('--ring')};
}`}
        </pre>
      </div>
    </div>
  );
}

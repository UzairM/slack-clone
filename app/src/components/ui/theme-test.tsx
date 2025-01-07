'use client';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

export function ThemeTest() {
  return (
    <div className="space-y-8 p-8">
      <div className="grid gap-6">
        {/* Background and Text Colors */}
        <Card>
          <CardHeader>
            <CardTitle>Background & Text Colors</CardTitle>
            <CardDescription>
              Testing different background and text color combinations
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-2">
            <div className="bg-background text-foreground p-4 rounded-md border">
              Background & Foreground
            </div>
            <div className="bg-primary text-primary-foreground p-4 rounded-md">Primary</div>
            <div className="bg-secondary text-secondary-foreground p-4 rounded-md">Secondary</div>
            <div className="bg-muted text-muted-foreground p-4 rounded-md">Muted</div>
            <div className="bg-accent text-accent-foreground p-4 rounded-md">Accent</div>
          </CardContent>
        </Card>

        {/* Cards */}
        <Card>
          <CardHeader>
            <CardTitle>Card Variations</CardTitle>
            <CardDescription>Different card styles and backgrounds</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            {/* Default Card */}
            <Card>
              <CardHeader>
                <CardTitle>Default Card</CardTitle>
                <CardDescription>Uses default card styling</CardDescription>
              </CardHeader>
              <CardContent>
                <p>This card shows the default background and border styles.</p>
              </CardContent>
            </Card>

            {/* Interactive Card */}
            <Card className="border-primary">
              <CardHeader className="border-b-primary">
                <CardTitle>Interactive Card</CardTitle>
                <CardDescription>With primary border accent</CardDescription>
              </CardHeader>
              <CardContent>
                <p>This card has primary-colored borders.</p>
              </CardContent>
              <CardFooter className="border-t-primary">
                <Button variant="outline" className="mr-2">
                  Cancel
                </Button>
                <Button>Submit</Button>
              </CardFooter>
            </Card>

            {/* Muted Card */}
            <Card className="bg-muted">
              <CardHeader>
                <CardTitle>Muted Card</CardTitle>
                <CardDescription>Using muted background</CardDescription>
              </CardHeader>
              <CardContent>
                <p>This card demonstrates the muted background color.</p>
              </CardContent>
            </Card>

            {/* Accent Card */}
            <Card className="bg-accent">
              <CardHeader>
                <CardTitle>Accent Card</CardTitle>
                <CardDescription>Using accent background</CardDescription>
              </CardHeader>
              <CardContent>
                <p>This card demonstrates the accent background color.</p>
              </CardContent>
            </Card>
          </CardContent>
        </Card>

        {/* Destructive */}
        <Card className="border-destructive">
          <CardHeader className="border-b-destructive">
            <CardTitle className="text-destructive">Destructive Styles</CardTitle>
            <CardDescription>Testing destructive color variants</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-destructive text-destructive-foreground p-4 rounded-md">
              Destructive Background
            </div>
            <Button variant="destructive" className="w-full">
              Destructive Button
            </Button>
          </CardContent>
        </Card>

        {/* Inputs & Buttons */}
        <Card>
          <CardHeader>
            <CardTitle>Interactive Elements</CardTitle>
            <CardDescription>Testing inputs, buttons, and focus states</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4">
              <input
                type="text"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                placeholder="Input with focus ring"
              />
              <div className="flex flex-wrap gap-2">
                <Button variant="default">Default</Button>
                <Button variant="destructive">Destructive</Button>
                <Button variant="outline">Outline</Button>
                <Button variant="secondary">Secondary</Button>
                <Button variant="ghost">Ghost</Button>
                <Button variant="link">Link</Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

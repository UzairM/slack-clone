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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { useMatrix } from '@/hooks/use-matrix';
import { personaManager } from '@/lib/ai/persona-manager';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

interface PersonaSettings {
  enabled: boolean;
  personality: string;
  tone: string;
  interests: string[];
  responseStyle: string;
  activeHours: {
    start: number;
    end: number;
  };
}

export function PersonaSettings() {
  const { client } = useMatrix();
  const [settings, setSettings] = useState<PersonaSettings>({
    enabled: false,
    personality: '',
    tone: '',
    interests: [],
    responseStyle: '',
    activeHours: {
      start: 0,
      end: 24,
    },
  });

  // Load settings from local storage on mount
  useEffect(() => {
    if (!client) return;
    const userId = client.getUserId();
    if (!userId) return;

    const savedSettings = localStorage.getItem(`persona_settings_${userId}`);
    if (savedSettings) {
      const parsed = JSON.parse(savedSettings);
      setSettings(parsed);

      // Register persona if enabled
      if (parsed.enabled) {
        personaManager.registerPersona({
          userId,
          displayName: client.getUser(userId)?.displayName || userId.split(':')[0].substring(1),
          personality: parsed.personality,
          tone: parsed.tone,
          interests: parsed.interests,
          responseStyle: parsed.responseStyle,
          activeHours: parsed.activeHours,
        });
      }
    }
  }, [client]);

  // Save settings and update persona manager
  const saveSettings = () => {
    if (!client) return;
    const userId = client.getUserId();
    if (!userId) return;

    // Save to local storage
    localStorage.setItem(`persona_settings_${userId}`, JSON.stringify(settings));

    // Update persona manager
    if (settings.enabled) {
      personaManager.registerPersona({
        userId,
        displayName: client.getUser(userId)?.displayName || userId.split(':')[0].substring(1),
        personality: settings.personality,
        tone: settings.tone,
        interests: settings.interests,
        responseStyle: settings.responseStyle,
        activeHours: settings.activeHours,
      });
      toast.success('AI Persona enabled');
    } else {
      personaManager.unregisterPersona(userId);
      toast.success('AI Persona disabled');
    }
  };

  if (!client) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>AI Persona Settings</CardTitle>
        <CardDescription>
          Configure how your AI persona behaves when responding to messages while you&apos;re away
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label>Enable AI Persona</Label>
            <div className="text-sm text-muted-foreground">
              Let an AI respond on your behalf when you&apos;re offline
            </div>
          </div>
          <Switch
            checked={settings.enabled}
            onCheckedChange={checked => setSettings({ ...settings, enabled: checked })}
          />
        </div>

        <div className="space-y-2">
          <Label>Personality</Label>
          <Textarea
            placeholder="Describe your AI persona's personality (e.g., friendly and professional)"
            value={settings.personality}
            onChange={e => setSettings({ ...settings, personality: e.target.value })}
          />
        </div>

        <div className="space-y-2">
          <Label>Tone</Label>
          <Input
            placeholder="Communication tone (e.g., casual, formal)"
            value={settings.tone}
            onChange={e => setSettings({ ...settings, tone: e.target.value })}
          />
        </div>

        <div className="space-y-2">
          <Label>Interests</Label>
          <Input
            placeholder="Comma-separated interests"
            value={settings.interests.join(', ')}
            onChange={e =>
              setSettings({ ...settings, interests: e.target.value.split(',').map(s => s.trim()) })
            }
          />
        </div>

        <div className="space-y-2">
          <Label>Response Style</Label>
          <Input
            placeholder="How responses should be formatted (e.g., concise, detailed)"
            value={settings.responseStyle}
            onChange={e => setSettings({ ...settings, responseStyle: e.target.value })}
          />
        </div>

        <div className="space-y-2">
          <Label>Active Hours (when AI should respond)</Label>
          <div className="flex items-center gap-2">
            <Input
              type="number"
              min={0}
              max={23}
              value={settings.activeHours.start}
              onChange={e =>
                setSettings({
                  ...settings,
                  activeHours: { ...settings.activeHours, start: parseInt(e.target.value) },
                })
              }
            />
            <span>to</span>
            <Input
              type="number"
              min={0}
              max={24}
              value={settings.activeHours.end}
              onChange={e =>
                setSettings({
                  ...settings,
                  activeHours: { ...settings.activeHours, end: parseInt(e.target.value) },
                })
              }
            />
          </div>
          <div className="text-sm text-muted-foreground">24-hour format (e.g., 9 to 17)</div>
        </div>
      </CardContent>
      <CardFooter>
        <Button onClick={saveSettings}>Save Settings</Button>
      </CardFooter>
    </Card>
  );
}

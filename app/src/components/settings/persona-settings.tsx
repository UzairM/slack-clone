'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useMatrix } from '@/hooks/use-matrix';
import { messageIngestion } from '@/lib/ai/message-ingestion';
import { personaManager } from '@/lib/ai/persona-manager';
import { OpenAI } from 'openai';
import { useEffect, useState } from 'react';

export function PersonaSettings() {
  const { client } = useMatrix();
  const [userId, setUserId] = useState<string>('');
  const [displayName, setDisplayName] = useState('');
  const [personality, setPersonality] = useState('');
  const [tone, setTone] = useState('');
  const [interests, setInterests] = useState('');
  const [responseStyle, setResponseStyle] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    async function loadPersona() {
      if (!client) return;
      setIsLoading(true);
      try {
        const userId = client.getUserId();
        if (!userId) return;
        setUserId(userId);

        const persona = await personaManager.getPersona(userId);
        if (persona) {
          setDisplayName(persona.displayName || '');
          setPersonality(persona.personality || '');
          setTone(persona.tone || '');
          setInterests(persona.interests?.join(', ') || '');
          setResponseStyle(persona.responseStyle || '');
        }
      } catch (error) {
        console.error('Error loading persona:', error);
      } finally {
        setIsLoading(false);
      }
    }

    loadPersona();
  }, [client]);

  const handleSave = async () => {
    if (!userId) return;
    setIsLoading(true);
    try {
      await personaManager.registerPersona({
        userId,
        displayName,
        personality,
        tone,
        interests: interests
          .split(',')
          .map(i => i.trim())
          .filter(i => i),
        responseStyle,
      });
    } catch (error) {
      console.error('Error saving persona:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const generateFromChatHistory = async () => {
    if (!userId || !process.env.NEXT_PUBLIC_OPENAI_API_KEY) return;
    setIsGenerating(true);

    try {
      console.log('\n[PersonaSettings] Starting chat history analysis...');
      console.log('[PersonaSettings] Fetching chat history from Pinecone...');
      const messages = await messageIngestion.queryRelevantUserMessages(userId, '', 100);
      console.log(`[PersonaSettings] Found ${messages.length} messages`);

      if (messages.length === 0) {
        console.log('[PersonaSettings] No chat history found');
        return;
      }

      // Format messages for analysis
      const chatHistory = messages
        .map(msg => `${new Date(msg.timestamp).toLocaleString()}: ${msg.content}`)
        .join('\n');

      console.log('[PersonaSettings] Analyzing chat history with OpenAI...');
      const openai = new OpenAI({
        apiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY,
      });

      const prompt = `Based on the following chat history, analyze the user's communication style and personality. Format the response as JSON with the following fields:
      - personality: A description of their personality traits
      - tone: Their typical communication tone
      - interests: An array of their main interests and topics they discuss
      - responseStyle: Their typical style of responding

      Chat History:
      ${chatHistory}

      Provide only the JSON response, no other text.`;

      const completion = await openai.chat.completions.create({
        model: process.env.NEXT_PUBLIC_OPENAI_MODEL || 'gpt-4-turbo-preview',
        messages: [{ role: 'user', content: prompt }],
      });

      const response = completion.choices[0]?.message?.content;
      if (!response) throw new Error('No response from OpenAI');

      console.log('[PersonaSettings] Parsing analysis results...');
      const analysis = JSON.parse(response);
      console.log('[PersonaSettings] Generated analysis:', analysis);

      // Update the form fields
      console.log('[PersonaSettings] Updating form fields with generated values...');
      setPersonality(analysis.personality || '');
      setTone(analysis.tone || '');
      setInterests(Array.isArray(analysis.interests) ? analysis.interests.join(', ') : '');
      setResponseStyle(analysis.responseStyle || '');

      // Save to database
      console.log('[PersonaSettings] Saving generated persona to database...');
      await personaManager.registerPersona({
        userId,
        displayName,
        personality: analysis.personality || '',
        tone: analysis.tone || '',
        interests: Array.isArray(analysis.interests) ? analysis.interests : [],
        responseStyle: analysis.responseStyle || '',
      });

      console.log('[PersonaSettings] Successfully generated and saved persona');
    } catch (error) {
      console.error('[PersonaSettings] Error generating persona from chat history:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  if (!client) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>AI Persona Settings</CardTitle>
          <CardDescription>Configure how your AI persona behaves in conversations</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4 text-muted-foreground">
            Please log in to configure your AI persona settings.
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>AI Persona Settings</CardTitle>
        <CardDescription>Configure how your AI persona behaves in conversations</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="displayName">Display Name</Label>
          <Input
            id="displayName"
            value={displayName}
            onChange={e => setDisplayName(e.target.value)}
            placeholder="Your display name"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="personality">Personality</Label>
          <Textarea
            id="personality"
            value={personality}
            onChange={e => setPersonality(e.target.value)}
            placeholder="Describe the personality (e.g., friendly, analytical, humorous)"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="tone">Tone</Label>
          <Textarea
            id="tone"
            value={tone}
            onChange={e => setTone(e.target.value)}
            placeholder="Describe the tone (e.g., casual, professional, empathetic)"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="interests">Interests</Label>
          <Textarea
            id="interests"
            value={interests}
            onChange={e => setInterests(e.target.value)}
            placeholder="List interests, separated by commas"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="responseStyle">Response Style</Label>
          <Textarea
            id="responseStyle"
            value={responseStyle}
            onChange={e => setResponseStyle(e.target.value)}
            placeholder="Describe the response style (e.g., concise, detailed, uses emojis)"
          />
        </div>
        <div className="flex space-x-4">
          <Button onClick={handleSave} disabled={isLoading}>
            {isLoading ? 'Saving...' : 'Save Changes'}
          </Button>
          <Button onClick={generateFromChatHistory} disabled={isGenerating} variant="secondary">
            {isGenerating ? 'Analyzing Chat History...' : 'Generate from Chat History'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

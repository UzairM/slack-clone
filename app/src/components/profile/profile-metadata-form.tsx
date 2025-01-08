'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useMatrix } from '@/hooks/use-matrix';
import { useToast } from '@/hooks/use-toast';
import { zodResolver } from '@hookform/resolvers/zod';
import { useCallback, useState } from 'react';
import { useForm } from 'react-hook-form';
import * as z from 'zod';

const formSchema = z.object({
  bio: z.string().max(500, 'Bio must be less than 500 characters'),
  pronouns: z.string().max(30, 'Pronouns must be less than 30 characters'),
  timezone: z.string(),
  language: z.string(),
});

type FormValues = z.infer<typeof formSchema>;

const timezones = Intl.supportedValuesOf('timeZone');
const languages = [
  { code: 'en', name: 'English' },
  { code: 'es', name: 'Spanish' },
  { code: 'fr', name: 'French' },
  { code: 'de', name: 'German' },
  { code: 'it', name: 'Italian' },
  { code: 'pt', name: 'Portuguese' },
  { code: 'ru', name: 'Russian' },
  { code: 'zh', name: 'Chinese' },
  { code: 'ja', name: 'Japanese' },
  { code: 'ko', name: 'Korean' },
];

export default function ProfileMetadataForm() {
  const { client } = useMatrix();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      bio: '',
      pronouns: '',
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      language: 'en',
    },
  });

  const onSubmit = useCallback(
    async (data: FormValues) => {
      if (!client) return;

      setIsLoading(true);
      try {
        // Store metadata in account data
        await client.setAccountData('im.vector.profile_metadata', {
          bio: data.bio,
          pronouns: data.pronouns,
          timezone: data.timezone,
          language: data.language,
        });

        toast({
          title: 'Profile Metadata Updated',
          description: 'Your profile metadata has been updated successfully.',
        });
      } catch (error) {
        toast({
          title: 'Error',
          description: 'Failed to update profile metadata. Please try again.',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    },
    [client, toast]
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Profile Metadata</CardTitle>
        <CardDescription>Additional information about you</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="bio"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Bio</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Tell us about yourself"
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>A brief description about yourself</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="pronouns"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Pronouns</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., they/them" {...field} />
                  </FormControl>
                  <FormDescription>Your preferred pronouns</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="timezone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Time Zone</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select your timezone" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {timezones.map(timezone => (
                        <SelectItem key={timezone} value={timezone}>
                          {timezone}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>Your current time zone</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="language"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Preferred Language</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select your language" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {languages.map(lang => (
                        <SelectItem key={lang.code} value={lang.code}>
                          {lang.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>Your preferred language for communications</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Saving...' : 'Save Changes'}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}

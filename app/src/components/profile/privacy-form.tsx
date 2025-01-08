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
} from '@/components/ui/form';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Switch } from '@/components/ui/switch';
import { useMatrix } from '@/hooks/use-matrix';
import { useToast } from '@/hooks/use-toast';
import { zodResolver } from '@hookform/resolvers/zod';
import { useCallback, useState } from 'react';
import { useForm } from 'react-hook-form';
import * as z from 'zod';

const formSchema = z.object({
  profileVisibility: z.enum(['public', 'contacts', 'private']),
  searchDiscovery: z.boolean(),
  readReceipts: z.boolean(),
  typingIndicators: z.boolean(),
});

type FormValues = z.infer<typeof formSchema>;

export default function PrivacyForm() {
  const { client } = useMatrix();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      profileVisibility: 'public',
      searchDiscovery: true,
      readReceipts: true,
      typingIndicators: true,
    },
  });

  const onSubmit = useCallback(
    async (data: FormValues) => {
      if (!client) return;

      setIsLoading(true);
      try {
        // Set profile visibility through account data
        await client.setAccountData('im.vector.profile_visibility', {
          visibility: data.profileVisibility,
        });

        // Set other privacy settings through account data
        await client.setAccountData('im.vector.hide_profile', {
          searchDiscovery: data.searchDiscovery,
          readReceipts: data.readReceipts,
          typingIndicators: data.typingIndicators,
        });

        toast({
          title: 'Privacy Settings Updated',
          description: 'Your privacy settings have been updated successfully.',
        });
      } catch (error) {
        toast({
          title: 'Error',
          description: 'Failed to update privacy settings. Please try again.',
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
        <CardTitle>Profile Privacy</CardTitle>
        <CardDescription>
          Control who can see your profile and how you appear to others
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="profileVisibility"
              render={({ field }) => (
                <FormItem className="space-y-3">
                  <FormLabel>Profile Visibility</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      className="flex flex-col space-y-1"
                    >
                      <FormItem className="flex items-center space-x-3 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="public" />
                        </FormControl>
                        <FormLabel className="font-normal">
                          Public - Anyone can view your profile
                        </FormLabel>
                      </FormItem>
                      <FormItem className="flex items-center space-x-3 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="contacts" />
                        </FormControl>
                        <FormLabel className="font-normal">
                          Contacts Only - Only your contacts can view your profile
                        </FormLabel>
                      </FormItem>
                      <FormItem className="flex items-center space-x-3 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="private" />
                        </FormControl>
                        <FormLabel className="font-normal">
                          Private - Your profile is hidden from everyone
                        </FormLabel>
                      </FormItem>
                    </RadioGroup>
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="searchDiscovery"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Search Discovery</FormLabel>
                    <FormDescription>
                      Allow others to find you by searching your username
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="readReceipts"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Read Receipts</FormLabel>
                    <FormDescription>Show others when you've read their messages</FormDescription>
                  </div>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="typingIndicators"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Typing Indicators</FormLabel>
                    <FormDescription>Show when you're typing a message</FormDescription>
                  </div>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
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

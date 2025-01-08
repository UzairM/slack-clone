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
import { Switch } from '@/components/ui/switch';
import { useMatrix } from '@/hooks/use-matrix';
import { useToast } from '@/hooks/use-toast';
import { zodResolver } from '@hookform/resolvers/zod';
import { useCallback, useState } from 'react';
import { useForm } from 'react-hook-form';
import * as z from 'zod';

const formSchema = z.object({
  presenceState: z.enum(['online', 'unavailable', 'offline']),
  statusMessage: z.string().max(100, 'Status message must be less than 100 characters').optional(),
  visibility: z.boolean(),
});

type FormValues = z.infer<typeof formSchema>;

export default function PresenceForm() {
  const { client } = useMatrix();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      presenceState: 'online',
      statusMessage: '',
      visibility: true,
    },
  });

  const onSubmit = useCallback(
    async (data: FormValues) => {
      if (!client) return;

      setIsLoading(true);
      try {
        await client.setPresence({
          presence: data.presenceState,
          status_msg: data.statusMessage,
        });

        // Set visibility (this would need to be implemented based on your Matrix server configuration)

        toast({
          title: 'Presence Updated',
          description: 'Your presence settings have been updated.',
        });
      } catch (error) {
        toast({
          title: 'Error',
          description: 'Failed to update presence settings. Please try again.',
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
        <CardTitle>Presence Information</CardTitle>
        <CardDescription>Manage your online presence and status message</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="presenceState"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Presence State</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select your presence state" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="online">Online</SelectItem>
                      <SelectItem value="unavailable">Away</SelectItem>
                      <SelectItem value="offline">Offline</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>Your current presence state visible to others</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="statusMessage"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Status Message</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="What's on your mind?"
                      {...field}
                      value={field.value || ''}
                    />
                  </FormControl>
                  <FormDescription>
                    A short message to let others know what you're up to
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="visibility"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Presence Visibility</FormLabel>
                    <FormDescription>Allow others to see your online status</FormDescription>
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

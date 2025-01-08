'use client';

import { Badge } from '@/components/ui/badge';
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
import { useMatrix } from '@/hooks/use-matrix';
import { useToast } from '@/hooks/use-toast';
import { zodResolver } from '@hookform/resolvers/zod';
import { Trash2 } from 'lucide-react';
import { Method } from 'matrix-js-sdk';
import { useCallback, useState } from 'react';
import { useForm } from 'react-hook-form';
import * as z from 'zod';

const formSchema = z.object({
  email: z.string().email('Invalid email address').optional(),
  phoneNumber: z
    .string()
    .regex(/^\+?[1-9]\d{1,14}$/, 'Invalid phone number')
    .optional(),
});

type FormValues = z.infer<typeof formSchema>;

type ThreePid = {
  medium: string;
  address: string;
  validated_at: number;
};

export default function ContactForm() {
  const { client } = useMatrix();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [threePids, setThreePids] = useState<ThreePid[]>([]);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
      phoneNumber: '',
    },
  });

  const onSubmit = useCallback(
    async (data: FormValues) => {
      if (!client) return;

      setIsLoading(true);
      try {
        if (data.email) {
          await client.http.authedRequest(
            Method.Post,
            '/account/3pid/email/requestToken',
            undefined,
            {
              email: data.email,
              client_secret: Math.random().toString(36).substring(2),
              send_attempt: '1',
            }
          );
        }
        if (data.phoneNumber) {
          await client.http.authedRequest(
            Method.Post,
            '/account/3pid/msisdn/requestToken',
            undefined,
            {
              phone_number: data.phoneNumber,
              client_secret: Math.random().toString(36).substring(2),
              send_attempt: '1',
            }
          );
        }

        // Refresh threePids
        const response = await client.getThreePids();
        setThreePids(response.threepids);

        form.reset();
        toast({
          title: 'Contact Added',
          description: 'Your contact information has been updated.',
        });
      } catch (error) {
        toast({
          title: 'Error',
          description: 'Failed to update contact information. Please try again.',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    },
    [client, form, toast]
  );

  const handleDelete = useCallback(
    async (medium: string, address: string) => {
      if (!client) return;

      try {
        await client.deleteThreePid(medium, address);
        setThreePids(prev =>
          prev.filter(pid => !(pid.medium === medium && pid.address === address))
        );
        toast({
          title: 'Contact Removed',
          description: 'Contact information has been removed.',
        });
      } catch (error) {
        toast({
          title: 'Error',
          description: 'Failed to remove contact information. Please try again.',
          variant: 'destructive',
        });
      }
    },
    [client, toast]
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Contact Information</CardTitle>
        <CardDescription>Manage your email addresses and phone numbers</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <h4 className="text-sm font-medium">Current Contacts</h4>
          {threePids.length === 0 ? (
            <p className="text-sm text-muted-foreground">No contact information added yet.</p>
          ) : (
            <div className="space-y-2">
              {threePids.map(pid => (
                <div
                  key={`${pid.medium}-${pid.address}`}
                  className="flex items-center justify-between rounded-lg border p-3"
                >
                  <div className="space-y-1">
                    <p className="text-sm font-medium">{pid.address}</p>
                    <Badge variant="secondary">{pid.medium === 'email' ? 'Email' : 'Phone'}</Badge>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(pid.medium, pid.address)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email Address</FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      placeholder="Enter your email address"
                      {...field}
                      value={field.value || ''}
                    />
                  </FormControl>
                  <FormDescription>Add a new email address to your account</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="phoneNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Phone Number</FormLabel>
                  <FormControl>
                    <Input
                      type="tel"
                      placeholder="Enter your phone number"
                      {...field}
                      value={field.value || ''}
                    />
                  </FormControl>
                  <FormDescription>Add a new phone number to your account</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Adding...' : 'Add Contact'}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}

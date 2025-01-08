'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
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
import { useCallback, useState } from 'react';
import { useForm } from 'react-hook-form';
import * as z from 'zod';

const formSchema = z.object({
  displayName: z.string().min(1, 'Display name is required'),
  avatarUrl: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

export default function BasicProfileForm() {
  const { client } = useMatrix();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      displayName: client?.getUserId() || '',
      avatarUrl: client?.getUser(client.getUserId() || '')?.avatarUrl || '',
    },
  });

  const onSubmit = useCallback(
    async (data: FormValues) => {
      if (!client) return;

      setIsLoading(true);
      try {
        await client.setDisplayName(data.displayName);
        if (data.avatarUrl !== form.getValues().avatarUrl) {
          // Handle avatar upload and update
          // This would need to be implemented based on your file upload solution
        }

        toast({
          title: 'Profile Updated',
          description: 'Your profile has been successfully updated.',
        });
      } catch (error) {
        toast({
          title: 'Error',
          description: 'Failed to update profile. Please try again.',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    },
    [client, form, toast]
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Basic Profile</CardTitle>
        <CardDescription>Update your display name and profile picture</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="flex items-center space-x-4">
              <Avatar className="h-24 w-24">
                <AvatarImage src={form.watch('avatarUrl')} />
                <AvatarFallback>
                  {form.watch('displayName')?.charAt(0)?.toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <Button variant="outline" disabled={isLoading}>
                Change Avatar
              </Button>
            </div>

            <FormField
              control={form.control}
              name="displayName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Display Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter your display name" {...field} />
                  </FormControl>
                  <FormDescription>
                    This is your public display name visible to others
                  </FormDescription>
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

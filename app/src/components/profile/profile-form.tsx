import { Alert, AlertDescription } from '@/components/ui/alert';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import {
  getUserProfile,
  ProfileData,
  profileSchema,
  updateUserProfile,
  uploadAvatar,
} from '@/lib/matrix/profile';
import { useAuthStore } from '@/lib/store/auth-store';
import { zodResolver } from '@hookform/resolvers/zod';
import { CheckCircle2, Loader2, Upload } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';

export function ProfileForm() {
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const { userId, accessToken } = useAuthStore();

  const form = useForm<ProfileData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      displayName: '',
      bio: '',
      email: '',
      status: 'online',
      customStatus: '',
    },
  });

  // Load initial profile data
  useEffect(() => {
    const loadProfile = async () => {
      if (!userId || !accessToken) return;

      setIsLoading(true);
      try {
        const result = await getUserProfile(accessToken, userId);
        if (result.success && result.data) {
          const profileData: ProfileData = {
            displayName: result.data.displayName || '',
            avatarUrl: result.data.avatarUrl,
            bio: result.data.bio || '',
            email: result.data.email || '',
            status: result.data.status || 'online',
            customStatus: result.data.customStatus || '',
          };
          form.reset(profileData);
        } else {
          setError(result.error || 'Failed to load profile data');
          toast.error('Failed to load profile data');
        }
      } catch (err) {
        console.error('Failed to load profile:', err);
        setError('Failed to load profile data');
        toast.error('Failed to load profile data');
      } finally {
        setIsLoading(false);
      }
    };

    loadProfile();
  }, [userId, accessToken, form]);

  const onSubmit = async (data: ProfileData) => {
    if (!userId || !accessToken) return;

    setIsSaving(true);
    setError(null);

    try {
      const result = await updateUserProfile(accessToken, userId, data);
      if (!result.success) {
        setError(result.error || 'Failed to update profile');
        toast.error('Failed to update profile');
      } else {
        toast.success('Profile updated successfully');
      }
    } catch (err) {
      console.error('Failed to update profile:', err);
      setError('Failed to update profile');
      toast.error('Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!userId || !accessToken) return;
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size must be less than 5MB');
      return;
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('File must be an image');
      return;
    }

    setIsUploading(true);
    setError(null);

    try {
      // Upload avatar
      const uploadResult = await uploadAvatar(accessToken, userId, file);
      if (!uploadResult.success || !uploadResult.data) {
        throw new Error(uploadResult.error || 'Failed to upload avatar');
      }

      // Update profile with new avatar URL
      const updateResult = await updateUserProfile(accessToken, userId, {
        avatarUrl: uploadResult.data.url,
      });

      if (!updateResult.success) {
        throw new Error(updateResult.error || 'Failed to update profile');
      }

      // Update form
      form.setValue('avatarUrl', uploadResult.data.url);
      toast.success('Avatar updated successfully');
    } catch (err: any) {
      console.error('Failed to upload avatar:', err);
      setError(err.message || 'Failed to upload avatar');
      toast.error(err.message || 'Failed to upload avatar');
    } finally {
      setIsUploading(false);
    }
  };

  if (isLoading && !form.formState.isDirty) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle>Profile Information</CardTitle>
          <CardDescription>Update your profile information and preferences</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              {/* Avatar Section */}
              <FormField
                control={form.control}
                name="avatarUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Profile Picture</FormLabel>
                    <FormControl>
                      <div className="flex items-center gap-4">
                        <Avatar className="h-24 w-24">
                          <AvatarImage src={field.value || undefined} />
                          <AvatarFallback>
                            {form.watch('displayName')?.charAt(0) || 'U'}
                          </AvatarFallback>
                        </Avatar>
                        <div className="space-y-2">
                          <Button
                            type="button"
                            variant="outline"
                            className="gap-2"
                            disabled={isUploading}
                            onClick={() => document.getElementById('avatar-upload')?.click()}
                          >
                            {isUploading ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Upload className="h-4 w-4" />
                            )}
                            {isUploading ? 'Uploading...' : 'Change Picture'}
                          </Button>
                          <input
                            id="avatar-upload"
                            type="file"
                            className="hidden"
                            accept="image/*"
                            onChange={handleAvatarUpload}
                            disabled={isUploading}
                          />
                          <p className="text-sm text-muted-foreground">
                            Recommended: Square image, max 5MB
                          </p>
                        </div>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Separator />

              {/* Display Name */}
              <FormField
                control={form.control}
                name="displayName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Display Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Your display name" {...field} />
                    </FormControl>
                    <FormDescription>
                      This is your public display name visible to other users
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Bio */}
              <FormField
                control={form.control}
                name="bio"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Bio</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Tell others about yourself"
                        className="resize-none"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>Brief description about yourself</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Email */}
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="your@email.com" {...field} />
                    </FormControl>
                    <FormDescription>Your email for notifications and recovery</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Separator />

              {/* Status */}
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select your status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="online">Online</SelectItem>
                        <SelectItem value="unavailable">Away</SelectItem>
                        <SelectItem value="offline">Appear Offline</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>Set your current availability</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Custom Status */}
              <FormField
                control={form.control}
                name="customStatus"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Custom Status</FormLabel>
                    <FormControl>
                      <Input placeholder="What's on your mind?" {...field} />
                    </FormControl>
                    <FormDescription>Set a custom status message</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600"
                disabled={isSaving || !form.formState.isDirty}
              >
                {isSaving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving Changes...
                  </>
                ) : form.formState.isDirty ? (
                  'Save Changes'
                ) : (
                  <>
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                    Up to Date
                  </>
                )}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}

'use client';

import { useParams, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeft, Upload, X } from 'lucide-react';
import Image from 'next/image';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { updateUserSchema, type UpdateUserFormData } from '@/lib/validations/user';
import { UserRole, type User } from '@/types/user.types';

export default function EditUserPage() {
  const params = useParams();
  const router = useRouter();
  const userId = params.userId as string;

  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [changePassword, setChangePassword] = useState(false);

  // TODO: Replace with actual query hook
  const user: User = {
    id: userId,
    email: 'john.doe@example.com',
    username: 'johndoe',
    firstName: 'John',
    lastName: 'Doe',
    profileImageUrl: undefined,
    preferredLanguage: 'en-US',
    themePreference: 'dark',
    emailVerified: true,
    createdAt: '2024-01-15T00:00:00.000Z',
    updatedAt: '2024-03-20T00:00:00.000Z',
    lastLogin: '2024-03-20T10:30:00.000Z',
    cognitoUserId: 'cognito-user-123',
    roles: [
      {
        id: 'role-1',
        name: UserRole.ADMIN,
        description: 'Full system access',
        permissions: [],
        createdAt: '2024-01-15T00:00:00.000Z',
        updatedAt: '2024-03-20T00:00:00.000Z',
      },
    ],
  };

  const form = useForm<UpdateUserFormData>({
    resolver: zodResolver(updateUserSchema),
    defaultValues: {
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      username: user.username,
      roles: user.roles.map((role) => role.name),
      preferredLanguage: (user.preferredLanguage as 'en-US' | 'en-AU' | 'en-GB') || 'en-US',
      themePreference: (user.themePreference as 'light' | 'dark' | 'deloitte' | 'futuristic') || 'light',
      profileImage: null,
      password: undefined,
      confirmPassword: undefined,
    },
  });

  useEffect(() => {
    if (user.profileImageUrl) {
      setImagePreview(user.profileImageUrl);
    }
  }, [user.profileImageUrl]);

  const handleProfileImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      form.setValue('profileImage', file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    form.setValue('profileImage', null);
    setImagePreview(user.profileImageUrl || null);
  };

  const onSubmit = async (data: UpdateUserFormData) => {
    try {
      console.log('Update user:', data);
      // TODO: Implement update user mutation
      router.push(`/users/${userId}`);
    } catch (error) {
      console.error('Error updating user:', error);
    }
  };

  const availableRoles = [
    { value: UserRole.ADMIN, label: 'Admin', description: 'Full system access and control' },
    { value: UserRole.BIDDER, label: 'Bidder', description: 'Full bidding workflow access' },
    { value: UserRole.DRAFTER, label: 'Drafter', description: 'Access up to QA process' },
    { value: UserRole.KB_ADMIN, label: 'KB Admin', description: 'Full knowledge base management' },
    { value: UserRole.KB_VIEW, label: 'KB Viewer', description: 'Read-only knowledge base access' },
  ];

  const languages = [
    { value: 'en-US', label: 'English (US)' },
    { value: 'en-AU', label: 'English (AU)' },
    { value: 'en-GB', label: 'English (UK)' },
  ];

  const themes = [
    { value: 'light', label: 'Light' },
    { value: 'dark', label: 'Dark' },
    { value: 'deloitte', label: 'Deloitte' },
    { value: 'futuristic', label: 'Futuristic' },
  ];

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <div className="mb-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push(`/users/${userId}`)}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to User
        </Button>
        <h1 className="text-3xl font-bold">Edit User</h1>
        <p className="text-muted-foreground mt-2">
          Update user information and settings
        </p>
      </div>

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Profile Image */}
        <Card>
          <CardHeader>
            <CardTitle>Profile Image</CardTitle>
            <CardDescription>
              Upload a profile picture (max 5MB, JPEG/PNG/WebP)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-6">
              <div className="relative">
                {imagePreview ? (
                  <div className="relative w-24 h-24 rounded-full overflow-hidden">
                    <Image
                      src={imagePreview}
                      alt="Profile preview"
                      fill
                      className="object-cover"
                    />
                    <button
                      type="button"
                      onClick={removeImage}
                      className="absolute top-0 right-0 bg-destructive text-destructive-foreground rounded-full p-1 hover:bg-destructive/90"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ) : (
                  <div className="w-24 h-24 rounded-full bg-muted flex items-center justify-center">
                    <span className="text-2xl font-semibold text-muted-foreground">
                      {user.firstName[0]}
                      {user.lastName[0]}
                    </span>
                  </div>
                )}
              </div>
              <div className="flex-1">
                <Label
                  htmlFor="profileImage"
                  className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 border border-input bg-background hover:bg-accent hover:text-accent-foreground rounded-md text-sm font-medium"
                >
                  <Upload className="h-4 w-4" />
                  Change Picture
                </Label>
                <Input
                  id="profileImage"
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleProfileImageChange}
                  className="hidden"
                />
                {form.formState.errors.profileImage && (
                  <p className="text-sm text-destructive mt-2">
                    {form.formState.errors.profileImage.message}
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
            <CardDescription>
              User&apos;s personal and account details
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name *</Label>
                <Input
                  id="firstName"
                  {...form.register('firstName')}
                  placeholder="John"
                />
                {form.formState.errors.firstName && (
                  <p className="text-sm text-destructive">
                    {form.formState.errors.firstName.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name *</Label>
                <Input
                  id="lastName"
                  {...form.register('lastName')}
                  placeholder="Doe"
                />
                {form.formState.errors.lastName && (
                  <p className="text-sm text-destructive">
                    {form.formState.errors.lastName.message}
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email Address *</Label>
              <Input
                id="email"
                type="email"
                {...form.register('email')}
                placeholder="john.doe@example.com"
              />
              {form.formState.errors.email && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.email.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="username">Username *</Label>
              <Input
                id="username"
                {...form.register('username')}
                placeholder="johndoe"
              />
              {form.formState.errors.username && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.username.message}
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Password Change */}
        <Card>
          <CardHeader>
            <CardTitle>Password</CardTitle>
            <CardDescription>
              Leave blank to keep the current password
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="changePassword"
                checked={changePassword}
                onCheckedChange={(checked) => setChangePassword(checked as boolean)}
              />
              <Label htmlFor="changePassword" className="cursor-pointer">
                Change password
              </Label>
            </div>

            {changePassword && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="password">New Password</Label>
                  <Input
                    id="password"
                    type="password"
                    {...form.register('password')}
                    placeholder="Enter new password"
                  />
                  {form.formState.errors.password && (
                    <p className="text-sm text-destructive">
                      {form.formState.errors.password.message}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Must be at least 8 characters with uppercase, lowercase, number, and
                    special character
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm New Password</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    {...form.register('confirmPassword')}
                    placeholder="Re-enter new password"
                  />
                  {form.formState.errors.confirmPassword && (
                    <p className="text-sm text-destructive">
                      {form.formState.errors.confirmPassword.message}
                    </p>
                  )}
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Roles */}
        <Card>
          <CardHeader>
            <CardTitle>User Roles *</CardTitle>
            <CardDescription>
              Assign roles to control user permissions (select at least one)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {availableRoles.map((role) => (
                <div key={role.value} className="flex items-start space-x-3">
                  <Checkbox
                    id={`role-${role.value}`}
                    checked={form.watch('roles')?.includes(role.value)}
                    onCheckedChange={(checked) => {
                      const currentRoles = form.getValues('roles') || [];
                      if (checked) {
                        form.setValue('roles', [...currentRoles, role.value]);
                      } else {
                        form.setValue(
                          'roles',
                          currentRoles.filter((r) => r !== role.value)
                        );
                      }
                    }}
                  />
                  <div className="grid gap-1.5 leading-none">
                    <Label
                      htmlFor={`role-${role.value}`}
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                    >
                      {role.label}
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      {role.description}
                    </p>
                  </div>
                </div>
              ))}
              {form.formState.errors.roles && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.roles.message}
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Preferences */}
        <Card>
          <CardHeader>
            <CardTitle>Preferences</CardTitle>
            <CardDescription>
              User interface and language preferences
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="preferredLanguage">Language</Label>
              <select
                id="preferredLanguage"
                {...form.register('preferredLanguage')}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {languages.map((lang) => (
                  <option key={lang.value} value={lang.value}>
                    {lang.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="themePreference">Theme</Label>
              <select
                id="themePreference"
                {...form.register('themePreference')}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {themes.map((theme) => (
                  <option key={theme.value} value={theme.value}>
                    {theme.label}
                  </option>
                ))}
              </select>
            </div>
          </CardContent>
        </Card>

        {/* Form Actions */}
        <div className="flex justify-end gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push(`/users/${userId}`)}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </form>
    </div>
  );
}
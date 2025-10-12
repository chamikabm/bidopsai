'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeft, Upload, X } from 'lucide-react';
import Link from 'next/link';
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
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { UserRole } from '@/types/user.types';
import {
  createUserSchema,
  type CreateUserFormData,
  getRoleDisplayName,
  getRoleDescription,
} from '@/lib/validations/user';
import { toast } from 'sonner';

export default function NewUserPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [profileImagePreview, setProfileImagePreview] = useState<string | null>(null);

  const form = useForm<CreateUserFormData>({
    resolver: zodResolver(createUserSchema),
    defaultValues: {
      email: '',
      username: '',
      firstName: '',
      lastName: '',
      password: '',
      confirmPassword: '',
      roles: [],
      profileImage: null,
    },
  });

  const handleProfileImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Set the file in the form
      form.setValue('profileImage', file);
      
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfileImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeProfileImage = () => {
    form.setValue('profileImage', null);
    setProfileImagePreview(null);
  };

  const onSubmit = async (data: CreateUserFormData) => {
    try {
      setIsSubmitting(true);

      // TODO: Implement user creation via GraphQL mutation
      // This will:
      // 1. Create user in Cognito user pool
      // 2. Create user record in database via GraphQL
      // 3. Upload profile image to S3 if provided
      // 4. Assign roles to the user

      console.log('Creating user:', data);

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 2000));

      toast.success('User created successfully');
      router.push('/users/all');
    } catch (error) {
      console.error('Failed to create user:', error);
      toast.error('Failed to create user. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const availableRoles = [
    {
      role: UserRole.ADMIN,
      label: getRoleDisplayName(UserRole.ADMIN),
      description: getRoleDescription(UserRole.ADMIN),
    },
    {
      role: UserRole.BIDDER,
      label: getRoleDisplayName(UserRole.BIDDER),
      description: getRoleDescription(UserRole.BIDDER),
    },
    {
      role: UserRole.DRAFTER,
      label: getRoleDisplayName(UserRole.DRAFTER),
      description: getRoleDescription(UserRole.DRAFTER),
    },
    {
      role: UserRole.KB_ADMIN,
      label: getRoleDisplayName(UserRole.KB_ADMIN),
      description: getRoleDescription(UserRole.KB_ADMIN),
    },
    {
      role: UserRole.KB_VIEW,
      label: getRoleDisplayName(UserRole.KB_VIEW),
      description: getRoleDescription(UserRole.KB_VIEW),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/users/all">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Add New User</h1>
          <p className="text-muted-foreground mt-1">
            Create a new user account with Cognito authentication
          </p>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
              <CardDescription>
                Enter the user&apos;s personal details
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Profile Image */}
              <div className="flex items-start gap-6">
                <Avatar className="h-24 w-24">
                  <AvatarImage src={profileImagePreview || undefined} />
                  <AvatarFallback className="text-2xl">
                    {form.watch('firstName')?.charAt(0) || '?'}
                    {form.watch('lastName')?.charAt(0) || '?'}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 space-y-2">
                  <FormLabel>Profile Image (Optional)</FormLabel>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => document.getElementById('profileImage')?.click()}
                    >
                      <Upload className="mr-2 h-4 w-4" />
                      {profileImagePreview ? 'Change Image' : 'Upload Image'}
                    </Button>
                    {profileImagePreview && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={removeProfileImage}
                      >
                        <X className="mr-2 h-4 w-4" />
                        Remove
                      </Button>
                    )}
                  </div>
                  <input
                    id="profileImage"
                    type="file"
                    accept="image/jpeg,image/jpg,image/png,image/webp"
                    className="hidden"
                    onChange={handleProfileImageChange}
                  />
                  <p className="text-sm text-muted-foreground">
                    JPG, PNG or WebP. Max size 5MB.
                  </p>
                  {form.formState.errors.profileImage && (
                    <p className="text-sm text-destructive">
                      {form.formState.errors.profileImage.message}
                    </p>
                  )}
                </div>
              </div>

              <Separator />

              {/* Name Fields */}
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="firstName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>First Name</FormLabel>
                      <FormControl>
                        <Input placeholder="John" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="lastName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Last Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Doe" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Email and Username */}
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input
                          type="email"
                          placeholder="john.doe@company.com"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Used for login and notifications
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="username"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Username</FormLabel>
                      <FormControl>
                        <Input placeholder="johndoe" {...field} />
                      </FormControl>
                      <FormDescription>
                        Unique identifier for login
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          {/* Password */}
          <Card>
            <CardHeader>
              <CardTitle>Password</CardTitle>
              <CardDescription>
                Set a secure password for the user account
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="••••••••" {...field} />
                    </FormControl>
                    <FormDescription>
                      Must be at least 8 characters with uppercase, lowercase, number, and special character
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Confirm Password</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="••••••••" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Roles */}
          <Card>
            <CardHeader>
              <CardTitle>Roles & Permissions</CardTitle>
              <CardDescription>
                Assign one or more roles to define user permissions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <FormField
                control={form.control}
                name="roles"
                render={() => (
                  <FormItem>
                    <div className="space-y-4">
                      {availableRoles.map((item) => (
                        <FormField
                          key={item.role}
                          control={form.control}
                          name="roles"
                          render={({ field }) => {
                            return (
                              <FormItem
                                key={item.role}
                                className="flex flex-row items-start space-x-3 space-y-0 rounded-lg border p-4 transition-colors hover:bg-accent"
                              >
                                <FormControl>
                                  <Checkbox
                                    checked={field.value?.includes(item.role)}
                                    onCheckedChange={(checked) => {
                                      return checked
                                        ? field.onChange([...field.value, item.role])
                                        : field.onChange(
                                            field.value?.filter(
                                              (value) => value !== item.role
                                            )
                                          );
                                    }}
                                  />
                                </FormControl>
                                <div className="space-y-1 leading-none">
                                  <FormLabel className="font-semibold cursor-pointer">
                                    {item.label}
                                  </FormLabel>
                                  <FormDescription className="text-sm">
                                    {item.description}
                                  </FormDescription>
                                </div>
                              </FormItem>
                            );
                          }}
                        />
                      ))}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex justify-end gap-4">
            <Link href="/users/all">
              <Button type="button" variant="outline">
                Cancel
              </Button>
            </Link>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Creating...' : 'Create User'}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
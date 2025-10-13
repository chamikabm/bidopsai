'use client';

import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { format } from 'date-fns';
import { CalendarIcon, Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar } from '@/components/ui/calendar';
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
import { Textarea } from '@/components/ui/textarea';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { FileDropzone } from '@/components/common/FileUpload/FileDropzone';
import { KnowledgeBaseSelector } from '@/components/projects/KnowledgeBaseSelector';
import { UserSelector } from '@/components/projects/UserSelector';

import { useCreateProject } from '@/hooks/mutations/useCreateProject';
import { usePresignedUrl } from '@/hooks/mutations/usePresignedUrl';
import { useFileUpload } from '@/hooks/useFileUpload';
import { createProjectSchema, type CreateProjectFormData } from '@/lib/validations/project';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

export default function NewProjectPage() {
  const router = useRouter();

  // Form setup
  const form = useForm<CreateProjectFormData>({
    resolver: zodResolver(createProjectSchema),
    defaultValues: {
      name: '',
      description: '',
      deadline: undefined,
      documents: [],
      knowledgeBaseIds: [],
      userIds: [],
    },
  });

  // Mutations
  const { mutateAsync: createProject, isPending: isCreatingProject } = useCreateProject();
  const { mutateAsync: getPresignedUrls, isPending: isGettingUrls } = usePresignedUrl();

  // File upload hook
  const { uploadFiles, isUploading, progress } = useFileUpload({
    onProgress: (fileProgress) => {
      // Update UI with upload progress if needed
      console.log('Upload progress:', fileProgress);
    },
  });

  // Handle file changes
  const handleFilesSelected = (selectedFiles: File[]) => {
    form.setValue('documents', selectedFiles);
  };

  // Form submission handler
  const onSubmit = async (data: CreateProjectFormData) => {
    try {
      // Step 1: Create project record
      toast.loading('Creating project...', { id: 'create-project' });
      
      const project = await createProject({
        name: data.name,
        description: data.description,
        deadline: data.deadline?.toISOString(),
        knowledgeBaseIds: data.knowledgeBaseIds,
        memberUserIds: data.userIds,
      });

      toast.success('Project created successfully', { id: 'create-project' });

      // Step 2: Get presigned URLs for file uploads
      if (data.documents.length > 0) {
        toast.loading('Preparing file uploads...', { id: 'upload-files' });

        const presignedUrls = await getPresignedUrls({
          projectId: project.id,
          files: data.documents.map((file) => ({
            fileName: file.name,
            fileType: file.type,
            fileSize: file.size,
          })),
        });

        // Step 3: Upload files to S3
        toast.loading('Uploading files...', { id: 'upload-files' });
        
        await uploadFiles(data.documents, presignedUrls);

        toast.success('Files uploaded successfully', { id: 'upload-files' });
      }

      // Step 4: Navigate to project detail page
      toast.success('Project setup complete!');
      router.push(`/projects/${project.id}`);
    } catch (error) {
      console.error('Error creating project:', error);
      toast.error(
        error instanceof Error ? error.message : 'Failed to create project',
        { id: 'create-project' }
      );
    }
  };

  const isSubmitting = isCreatingProject || isGettingUrls || isUploading;

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Create New Project</h1>
        <p className="text-muted-foreground mt-2">
          Set up a new bid automation project with all required information
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          {/* Basic Information Section */}
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
              <CardDescription>
                Provide the essential details about your project
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Project Name */}
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Project Name *</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Enter project name"
                        {...field}
                        disabled={isSubmitting}
                      />
                    </FormControl>
                    <FormDescription>
                      A descriptive name for your bid project
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Description */}
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Enter project description (optional)"
                        className="min-h-[100px] resize-none"
                        {...field}
                        disabled={isSubmitting}
                      />
                    </FormControl>
                    <FormDescription>
                      Optional details about the project scope and objectives
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Deadline */}
              <FormField
                control={form.control}
                name="deadline"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Deadline</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={cn(
                              'w-full pl-3 text-left font-normal',
                              !field.value && 'text-muted-foreground'
                            )}
                            disabled={isSubmitting}
                          >
                            {field.value ? (
                              format(field.value, 'PPP')
                            ) : (
                              <span>Pick a deadline date</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0 bg-popover" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value || undefined}
                          onSelect={field.onChange}
                          disabled={(date: Date) =>
                            date < new Date() || date < new Date('1900-01-01')
                          }
                          initialFocus
                          className="bg-popover"
                        />
                      </PopoverContent>
                    </Popover>
                    <FormDescription>
                      Optional deadline for bid submission
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Documents Upload Section */}
          <Card>
            <CardHeader>
              <CardTitle>Project Documents *</CardTitle>
              <CardDescription>
                Upload bid documents (Word, Excel, PDF, Audio, Video - Max 100MB each)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <FormField
                control={form.control}
                name="documents"
                render={() => (
                  <FormItem>
                    <FormControl>
                      <FileDropzone
                        onFilesSelected={handleFilesSelected}
                        maxFiles={20}
                        maxSize={100 * 1024 * 1024}
                        multiple={true}
                        disabled={isSubmitting}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Upload Progress */}
              {isUploading && progress.length > 0 && (
                <div className="mt-4 space-y-2">
                  <p className="text-sm font-medium">Uploading files...</p>
                  {progress.map((fileProgress) => (
                    <div key={fileProgress.fileName} className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <span className="truncate max-w-[200px]">
                          {fileProgress.fileName}
                        </span>
                        <span className="text-muted-foreground">
                          {fileProgress.progress}%
                        </span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary transition-all duration-300"
                          style={{ width: `${fileProgress.progress}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Knowledge Bases Section */}
          <Card>
            <CardHeader>
              <CardTitle>Knowledge Bases</CardTitle>
              <CardDescription>
                Select knowledge bases to use for this project (optional)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <FormField
                control={form.control}
                name="knowledgeBaseIds"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <KnowledgeBaseSelector
                        selectedIds={field.value}
                        onChange={field.onChange}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Team Members Section */}
          <Card>
            <CardHeader>
              <CardTitle>Team Members</CardTitle>
              <CardDescription>
                Add users to this project (optional)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <FormField
                control={form.control}
                name="userIds"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <UserSelector
                        selectedIds={field.value}
                        onChange={field.onChange}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Submit Button */}
          <div className="flex items-center justify-end gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isCreatingProject
                ? 'Creating Project...'
                : isGettingUrls
                ? 'Preparing Upload...'
                : isUploading
                ? 'Uploading Files...'
                : 'Start Project'}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}

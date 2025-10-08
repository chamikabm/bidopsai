'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { FileDropzone } from '@/components/common/FileUpload/FileDropzone';
import { KnowledgeBaseScope } from '@/types/knowledgeBase.types';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

// Form validation schema
const formSchema = z.object({
  name: z.string().min(3, 'Name must be at least 3 characters'),
  description: z.string().optional(),
  scope: z.nativeEnum(KnowledgeBaseScope),
  projectId: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

/**
 * New Knowledge Base Page
 * 
 * Form to create a new knowledge base with:
 * - Name and description
 * - Scope (Global or Local)
 * - Project selection (if Local)
 * - Document upload
 */
export default function NewKnowledgeBasePage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      description: '',
      scope: KnowledgeBaseScope.GLOBAL,
      projectId: '',
    },
  });

  const selectedScope = form.watch('scope');

  const handleFilesSelected = (files: File[]) => {
    setUploadedFiles(files);
  };

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true);
    
    // TODO: Implement actual knowledge base creation
    // 1. Create KB via GraphQL mutation
    // 2. Get presigned URLs for file uploads
    // 3. Upload files to S3
    // 4. Create document records
    console.log('Creating knowledge base:', data);
    console.log('Uploaded files:', uploadedFiles);

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 2000));
    
    setIsSubmitting(false);
    router.push('/knowledge-bases/all');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.back()}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <h1 className="text-3xl font-bold">Create Knowledge Base</h1>
        <p className="text-muted-foreground mt-1">
          Set up a new knowledge base to store and organize documents
        </p>
      </div>

      {/* Form */}
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Name */}
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Company Policies" {...field} />
                    </FormControl>
                    <FormDescription>
                      A descriptive name for your knowledge base
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
                    <FormLabel>Description (Optional)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Describe what this knowledge base contains..."
                        className="min-h-[100px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Scope */}
              <FormField
                control={form.control}
                name="scope"
                render={({ field }) => (
                  <FormItem className="space-y-3">
                    <FormLabel>Scope</FormLabel>
                    <FormControl>
                      <RadioGroup
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        className="flex flex-col space-y-1"
                      >
                        <FormItem className="flex items-center space-x-3 space-y-0">
                          <FormControl>
                            <RadioGroupItem value={KnowledgeBaseScope.GLOBAL} />
                          </FormControl>
                          <FormLabel className="font-normal">
                            <span className="font-medium">Global</span> - Accessible across all projects
                          </FormLabel>
                        </FormItem>
                        <FormItem className="flex items-center space-x-3 space-y-0">
                          <FormControl>
                            <RadioGroupItem value={KnowledgeBaseScope.LOCAL} />
                          </FormControl>
                          <FormLabel className="font-normal">
                            <span className="font-medium">Local</span> - Specific to a single project
                          </FormLabel>
                        </FormItem>
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Project Selection (only for Local scope) */}
              {selectedScope === KnowledgeBaseScope.LOCAL && (
                <FormField
                  control={form.control}
                  name="projectId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Project</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a project" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="proj-1">Project Alpha</SelectItem>
                          <SelectItem value="proj-2">Project Beta</SelectItem>
                          <SelectItem value="proj-3">Project Gamma</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        Select which project this knowledge base belongs to
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </CardContent>
          </Card>

          {/* Document Upload */}
          <Card>
            <CardHeader>
              <CardTitle>Upload Documents</CardTitle>
            </CardHeader>
            <CardContent>
              <FileDropzone
                onFilesSelected={handleFilesSelected}
                accept=".pdf,.doc,.docx,.xls,.xlsx,.mp3,.wav,.m4a,.mp4,.mov,.avi"
                maxSize={100 * 1024 * 1024} // 100MB
                multiple
              />
              {uploadedFiles.length > 0 && (
                <div className="mt-4">
                  <p className="text-sm font-medium mb-2">
                    {uploadedFiles.length} file(s) selected
                  </p>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    {uploadedFiles.map((file, index) => (
                      <li key={index}>
                        {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex justify-end gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Create Knowledge Base
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
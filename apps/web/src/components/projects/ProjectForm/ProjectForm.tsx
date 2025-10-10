/**
 * ProjectForm Component
 * Main form for creating new projects
 */

'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { ProjectBasicInfo } from './ProjectBasicInfo';
import { DocumentUpload } from './DocumentUpload';
import { KnowledgeBaseSelector } from './KnowledgeBaseSelector';
import { ProjectMemberSelector } from './ProjectMemberSelector';
import { ProjectFormData, PresignedUrlResponse } from './types';

const projectFormSchema = z.object({
  name: z.string().min(1, 'Project name is required').max(200, 'Project name is too long'),
  description: z.string().max(1000, 'Description is too long').optional(),
  deadline: z.string().min(1, 'Deadline is required'),
  files: z.array(z.any()).min(1, 'At least one document is required'),
  knowledgeBaseIds: z.array(z.string()),
  memberIds: z.array(z.string()),
});

export function ProjectForm() {
  const router = useRouter();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [knowledgeBaseIds, setKnowledgeBaseIds] = useState<string[]>([]);
  const [memberIds, setMemberIds] = useState<string[]>([]);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
  } = useForm<ProjectFormData>({
    resolver: zodResolver(projectFormSchema),
    defaultValues: {
      files: [],
      knowledgeBaseIds: [],
      memberIds: [],
    },
  });

  const uploadToS3 = async (file: File, presignedUrl: string): Promise<void> => {
    const response = await fetch(presignedUrl, {
      method: 'PUT',
      body: file,
      headers: {
        'Content-Type': file.type,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to upload ${file.name}`);
    }
  };

  const onSubmit = async (data: ProjectFormData) => {
    setIsSubmitting(true);

    try {
      // Step 1: Create project
      const createProjectResponse = await fetch('/api/graphql', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: `
            mutation CreateProject($input: CreateProjectInput!) {
              createProject(input: $input) {
                id
                name
              }
            }
          `,
          variables: {
            input: {
              name: data.name,
              description: data.description,
              deadline: new Date(data.deadline).toISOString(),
              knowledgeBaseIds: data.knowledgeBaseIds,
              memberIds: data.memberIds,
            },
          },
        }),
      });

      const createProjectResult = await createProjectResponse.json();

      if (createProjectResult.errors) {
        throw new Error(createProjectResult.errors[0].message);
      }

      const projectId = createProjectResult.data.createProject.id;

      // Step 2: Generate presigned URLs
      const fileInputs = files.map((file) => ({
        fileName: file.name,
        fileType: file.type,
      }));

      const presignedUrlsResponse = await fetch('/api/graphql', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: `
            mutation GeneratePresignedUrls($projectId: ID!, $files: [FileInput!]!) {
              generatePresignedUrls(projectId: $projectId, files: $files) {
                fileName
                fileType
                presignedUrl
                s3Key
              }
            }
          `,
          variables: {
            projectId,
            files: fileInputs,
          },
        }),
      });

      const presignedUrlsResult = await presignedUrlsResponse.json();

      if (presignedUrlsResult.errors) {
        throw new Error(presignedUrlsResult.errors[0].message);
      }

      const presignedUrls: PresignedUrlResponse[] =
        presignedUrlsResult.data.generatePresignedUrls;

      // Step 3: Upload files to S3
      await Promise.all(
        presignedUrls.map((urlData, index) => uploadToS3(files[index], urlData.presignedUrl))
      );

      // Step 4: Update project documents
      const documentInputs = presignedUrls.map((urlData) => ({
        fileName: urlData.fileName,
        fileType: urlData.fileType,
        rawFileLocation: urlData.s3Key,
      }));

      const updateDocsResponse = await fetch('/api/graphql', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: `
            mutation UpdateProjectDocuments($projectId: ID!, $documents: [DocumentInput!]!) {
              updateProjectDocuments(projectId: $projectId, documents: $documents) {
                id
                fileName
              }
            }
          `,
          variables: {
            projectId,
            documents: documentInputs,
          },
        }),
      });

      const updateDocsResult = await updateDocsResponse.json();

      if (updateDocsResult.errors) {
        throw new Error(updateDocsResult.errors[0].message);
      }

      toast({
        title: 'Project created successfully',
        description: 'Redirecting to project workflow...',
      });

      // Redirect to project workflow page
      router.push(`/projects/${projectId}`);
    } catch (error) {
      console.error('Error creating project:', error);
      toast({
        title: 'Error creating project',
        description: error instanceof Error ? error.message : 'An unexpected error occurred',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Create New Project</CardTitle>
          <CardDescription>
            Start a new bid preparation project by providing basic information and uploading
            documents
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <ProjectBasicInfo register={register} errors={errors} />

          <div className="space-y-2">
            <Label>Documents *</Label>
            <DocumentUpload
              files={files}
              onFilesChange={(newFiles) => {
                setFiles(newFiles);
                setValue('files', newFiles);
              }}
            />
            {errors.files && (
              <p className="text-sm text-red-500">{errors.files.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Knowledge Bases</Label>
            <KnowledgeBaseSelector
              selectedIds={knowledgeBaseIds}
              onSelectionChange={(ids) => {
                setKnowledgeBaseIds(ids);
                setValue('knowledgeBaseIds', ids);
              }}
            />
          </div>

          <div className="space-y-2">
            <Label>Team Members</Label>
            <ProjectMemberSelector
              selectedIds={memberIds}
              onSelectionChange={(ids) => {
                setMemberIds(ids);
                setValue('memberIds', ids);
              }}
            />
          </div>
        </CardContent>
      </Card>

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
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isSubmitting ? 'Creating...' : 'Start Project'}
        </Button>
      </div>
    </form>
  );
}

/**
 * usePresignedUrl Hook
 * 
 * Mutation hook for generating S3 presigned URLs
 */

import { useMutation } from '@tanstack/react-query';
import graphqlClient from '@/lib/graphql/client';
import { GENERATE_PRESIGNED_URLS } from '@/lib/graphql/mutations/projects';
import { toast } from 'sonner';

interface PresignedUrlRequest {
  fileName: string;
  fileType: string;
}

interface PresignedUrlInput {
  projectId: string;
  files: PresignedUrlRequest[];
}

interface PresignedUrl {
  url: string;
  fileName: string;
  expiresAt: string;
}

interface PresignedUrlResponse {
  generatePresignedUrls: PresignedUrl[];
}

export function usePresignedUrl() {
  return useMutation({
    mutationFn: async (input: PresignedUrlInput) => {
      const response = await graphqlClient.request<PresignedUrlResponse>(
        GENERATE_PRESIGNED_URLS,
        { projectId: input.projectId, files: input.files }
      );
      return response.generatePresignedUrls;
    },
    onError: (error: Error) => {
      toast.error(`Failed to generate upload URLs: ${error.message}`);
    },
  });
}
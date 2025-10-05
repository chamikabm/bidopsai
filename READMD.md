# Bedrock Data Automation Examples:
- https://github.com/aws-samples/sample-document-processing-with-amazon-bedrock-data-automation/blob/main/10-Understanding-BDA/11_getting_started_with_bda.ipynb

## Example Usage:

```
import boto3
import json
from typing import Dict, List
from datetime import datetime

class BedrockDataAutomationParser:
    def __init__(self):
        self.bedrock_agent = boto3.client('bedrock-data-automation')
        self.s3_client = boto3.client('s3')
        
    async def parse_documents(
        self, 
        raw_file_locations: List[str],
        project_id: str,
        bucket_name: str
    ) -> Dict:
        """
        Parse documents using Bedrock Data Automation and save as markdown.
        
        Args:
            raw_file_locations: List of S3 URIs (s3://bucket/key)
            project_id: Project identifier for organizing outputs
            bucket_name: S3 bucket for processed outputs
            
        Returns:
            Dict with processed file locations and metadata
        """
        
        # 1. Create a Data Automation Blueprint
        blueprint_arn = await self._create_or_get_blueprint()
        
        # 2. Process each document
        processed_files = []
        
        for raw_location in raw_file_locations:
            try:
                # Parse S3 URI
                bucket, key = self._parse_s3_uri(raw_location)
                
                # 3. Invoke Data Automation
                response = self.bedrock_agent.invoke_data_automation_async(
                    dataAutomationProjectArn=blueprint_arn,
                    inputConfiguration={
                        'S3Uri': raw_location
                    },
                    outputConfiguration={
                        'S3Uri': f's3://{bucket_name}/processed/{project_id}/'
                    },
                    dataAutomationConfiguration={
                        'dataAutomationStage': 'DEVELOPMENT',
                        'overrideConfiguration': {
                            'document': {
                                'extraction': {
                                    'granularity': {
                                        'types': ['ELEMENT', 'LINE', 'PAGE']
                                    },
                                    'boundingBox': {
                                        'state': 'ENABLED'
                                    }
                                },
                                'outputFormat': {
                                    'types': ['MARKDOWN', 'JSON']
                                },
                                'structureExtraction': {
                                    'tables': {
                                        'state': 'ENABLED'
                                    },
                                    'forms': {
                                        'state': 'ENABLED'
                                    }
                                }
                            }
                        }
                    }
                )
                
                invocation_arn = response['invocationArn']
                
                # 4. Poll for completion (async pattern)
                result = await self._wait_for_completion(invocation_arn)
                
                # 5. Get markdown output location
                markdown_location = result['outputConfiguration']['S3Uri'] + 'output.md'
                
                processed_files.append({
                    'raw_file_location': raw_location,
                    'processed_file_location': markdown_location,
                    'metadata': result.get('metadata', {})
                })
                
            except Exception as e:
                processed_files.append({
                    'raw_file_location': raw_location,
                    'error': str(e)
                })
        
        return {
            'status': 'completed',
            'processed_files': processed_files,
            'timestamp': datetime.utcnow().isoformat()
        }
    
    async def _create_or_get_blueprint(self) -> str:
        """Create or retrieve existing Data Automation Blueprint"""
        
        blueprint_name = "bidopsai-document-parser"
        
        try:
            # Try to get existing blueprint
            response = self.bedrock_agent.get_data_automation_project(
                projectArn=f'arn:aws:bedrock:region:account:data-automation-project/{blueprint_name}'
            )
            return response['project']['projectArn']
            
        except self.bedrock_agent.exceptions.ResourceNotFoundException:
            # Create new blueprint
            response = self.bedrock_agent.create_data_automation_project(
                projectName=blueprint_name,
                projectStage='DEVELOPMENT',
                projectDescription='Parse bid documents and extract structured data',
                standardOutputConfiguration={
                    'document': {
                        'extraction': {
                            'granularity': {
                                'types': ['ELEMENT', 'LINE', 'PAGE', 'DOCUMENT']
                            }
                        },
                        'generativeField': {
                            'state': 'ENABLED'
                        },
                        'outputFormat': {
                            'textFormat': {
                                'types': ['MARKDOWN', 'PLAINTEXT']
                            },
                            'additionalFileFormat': {
                                'state': 'ENABLED'
                            }
                        }
                    }
                }
            )
            return response['projectArn']
    
    async def _wait_for_completion(self, invocation_arn: str, max_wait: int = 300) -> Dict:
        """Poll for job completion"""
        import asyncio
        
        elapsed = 0
        while elapsed < max_wait:
            response = self.bedrock_agent.get_data_automation_status(
                invocationArn=invocation_arn
            )
            
            status = response['status']
            
            if status == 'SUCCESS':
                return response
            elif status in ['FAILED', 'STOPPED']:
                raise Exception(f"Data Automation failed: {response.get('error')}")
            
            await asyncio.sleep(5)
            elapsed += 5
        
        raise TimeoutError(f"Job did not complete within {max_wait} seconds")
    
    def _parse_s3_uri(self, s3_uri: str) -> tuple:
        """Parse S3 URI into bucket and key"""
        parts = s3_uri.replace('s3://', '').split('/', 1)
        return parts[0], parts[1] if len(parts) > 1 else ''
```
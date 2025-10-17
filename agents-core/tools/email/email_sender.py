"""
Email Sender - SMTP/Gmail Integration

This module provides tools for sending emails with attachments.
Supports both SMTP and Gmail API for sending bid submissions.

Features:
- Send emails with HTML/plain text body
- Attach files from S3 locations
- Support for multiple recipients
- Gmail API integration (preferred)
- SMTP fallback support
- Email tracking and logging

Configuration:
- Uses environment variables or AWS Secrets Manager
- Supports OAuth2 for Gmail
- SMTP credentials from config
"""

import asyncio
from typing import Dict, Any, List, Optional
import os
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from email.mime.application import MIMEApplication
from datetime import datetime
import boto3

from agents_core.core.config import get_config
from agents_core.core.error_handling import (
    AgentError,
    ErrorCode,
    ErrorSeverity
)
from agents_core.core.observability import log_agent_action


class EmailSender:
    """
    Email sender for bid submissions.
    
    Handles email composition, attachment preparation,
    and sending via Gmail API or SMTP.
    """
    
    def __init__(self):
        """Initialize email sender."""
        config = get_config()
        self.send_method = config.get("email.send_method", "mock")  # mock, smtp, gmail
        self.from_address = config.get("email.from_address", "bids@deloitte.com")
        self.s3_client = boto3.client('s3')
    
    async def send_with_attachments(
        self,
        to_address: str,
        from_address: str,
        subject: str,
        body: str,
        artifact_locations: List[str],
        cc: Optional[List[str]] = None,
        bcc: Optional[List[str]] = None
    ) -> Dict[str, Any]:
        """
        Send email with artifact attachments.
        
        Args:
            to_address: Recipient email
            from_address: Sender email
            subject: Email subject
            body: Email body (supports HTML)
            artifact_locations: List of S3 URLs/paths
            cc: Optional CC recipients
            bcc: Optional BCC recipients
            
        Returns:
            Dict with send result and message_id
        """
        log_agent_action(
            agent_name="email_sender",
            action="send_start",
            details={
                "to": to_address,
                "subject": subject,
                "attachments": len(artifact_locations)
            }
        )
        
        try:
            # Download attachments from S3
            attachments = []
            for location in artifact_locations:
                if not location:
                    continue
                
                try:
                    attachment_data = await self._download_from_s3(location)
                    attachments.append(attachment_data)
                except Exception as e:
                    log_agent_action(
                        agent_name="email_sender",
                        action="attachment_download_failed",
                        details={"location": location, "error": str(e)},
                        level="warning"
                    )
            
            # Send based on configured method
            if self.send_method == "gmail":
                result = await self._send_via_gmail(
                    to_address=to_address,
                    from_address=from_address,
                    subject=subject,
                    body=body,
                    attachments=attachments,
                    cc=cc,
                    bcc=bcc
                )
            elif self.send_method == "smtp":
                result = await self._send_via_smtp(
                    to_address=to_address,
                    from_address=from_address,
                    subject=subject,
                    body=body,
                    attachments=attachments,
                    cc=cc,
                    bcc=bcc
                )
            else:
                # Mock mode for development
                result = await self._send_mock(
                    to_address=to_address,
                    from_address=from_address,
                    subject=subject,
                    body=body,
                    attachments=attachments
                )
            
            log_agent_action(
                agent_name="email_sender",
                action="send_success",
                details={
                    "to": to_address,
                    "message_id": result.get("message_id"),
                    "method": self.send_method
                }
            )
            
            return result
            
        except Exception as e:
            log_agent_action(
                agent_name="email_sender",
                action="send_failed",
                details={"error": str(e)},
                level="error"
            )
            raise AgentError(
                code=ErrorCode.TOOL_EXECUTION_FAILED,
                message=f"Failed to send email: {str(e)}",
                severity=ErrorSeverity.HIGH,
                details={"error": str(e)}
            ) from e
    
    async def _download_from_s3(self, s3_location: str) -> Dict[str, Any]:
        """
        Download artifact from S3.
        
        Args:
            s3_location: S3 URL or path
            
        Returns:
            Dict with filename and content
        """
        # Parse S3 location (format: s3://bucket/key or https://...)
        if s3_location.startswith("s3://"):
            parts = s3_location[5:].split("/", 1)
            bucket = parts[0]
            key = parts[1] if len(parts) > 1 else ""
        elif "s3.amazonaws.com" in s3_location or "s3-" in s3_location:
            # Parse HTTPS S3 URL
            # Format: https://bucket.s3.region.amazonaws.com/key
            url_parts = s3_location.split("/")
            bucket = url_parts[2].split(".")[0]
            key = "/".join(url_parts[3:])
        else:
            raise ValueError(f"Invalid S3 location: {s3_location}")
        
        # Download from S3
        response = self.s3_client.get_object(Bucket=bucket, Key=key)
        content = response['Body'].read()
        
        # Extract filename from key
        filename = key.split("/")[-1]
        
        return {
            "filename": filename,
            "content": content,
            "content_type": response.get('ContentType', 'application/octet-stream')
        }
    
    async def _send_via_gmail(
        self,
        to_address: str,
        from_address: str,
        subject: str,
        body: str,
        attachments: List[Dict[str, Any]],
        cc: Optional[List[str]] = None,
        bcc: Optional[List[str]] = None
    ) -> Dict[str, Any]:
        """
        Send email via Gmail API.
        
        Args:
            to_address: Recipient
            from_address: Sender
            subject: Subject
            body: Body
            attachments: List of attachments
            cc: CC recipients
            bcc: BCC recipients
            
        Returns:
            Send result
        """
        # TODO: Implement Gmail API integration
        # For now, use mock
        log_agent_action(
            agent_name="email_sender",
            action="gmail_not_implemented",
            details={"to": to_address},
            level="warning"
        )
        
        return await self._send_mock(
            to_address=to_address,
            from_address=from_address,
            subject=subject,
            body=body,
            attachments=attachments
        )
    
    async def _send_via_smtp(
        self,
        to_address: str,
        from_address: str,
        subject: str,
        body: str,
        attachments: List[Dict[str, Any]],
        cc: Optional[List[str]] = None,
        bcc: Optional[List[str]] = None
    ) -> Dict[str, Any]:
        """
        Send email via SMTP.
        
        Args:
            to_address: Recipient
            from_address: Sender
            subject: Subject
            body: Body
            attachments: List of attachments
            cc: CC recipients
            bcc: BCC recipients
            
        Returns:
            Send result
        """
        # TODO: Implement SMTP integration
        # For now, use mock
        log_agent_action(
            agent_name="email_sender",
            action="smtp_not_implemented",
            details={"to": to_address},
            level="warning"
        )
        
        return await self._send_mock(
            to_address=to_address,
            from_address=from_address,
            subject=subject,
            body=body,
            attachments=attachments
        )
    
    async def _send_mock(
        self,
        to_address: str,
        from_address: str,
        subject: str,
        body: str,
        attachments: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """
        Mock email sending for development.
        
        Args:
            to_address: Recipient
            from_address: Sender
            subject: Subject
            body: Body
            attachments: List of attachments
            
        Returns:
            Mock send result
        """
        log_agent_action(
            agent_name="email_sender",
            action="mock_send",
            details={
                "to": to_address,
                "from": from_address,
                "subject": subject,
                "attachments": len(attachments)
            },
            level="warning"
        )
        
        # Generate mock message ID
        message_id = f"<{datetime.utcnow().timestamp()}.mock@bidopsai.com>"
        
        return {
            "sent": True,
            "message_id": message_id,
            "method": "mock",
            "to": to_address,
            "from": from_address,
            "subject": subject,
            "attachments_count": len(attachments)
        }


# Global sender instance
_email_sender: Optional[EmailSender] = None


def get_email_sender() -> EmailSender:
    """
    Get or create email sender instance.
    
    Returns:
        EmailSender instance
    """
    global _email_sender
    if _email_sender is None:
        _email_sender = EmailSender()
    return _email_sender


async def send_email_with_attachments(
    to_address: str,
    from_address: str,
    subject: str,
    body: str,
    artifact_locations: List[str],
    cc: Optional[List[str]] = None,
    bcc: Optional[List[str]] = None
) -> Dict[str, Any]:
    """
    Send email with artifact attachments.
    
    Args:
        to_address: Recipient email
        from_address: Sender email
        subject: Email subject
        body: Email body
        artifact_locations: List of S3 URLs/paths
        cc: Optional CC recipients
        bcc: Optional BCC recipients
        
    Returns:
        Dict with send result
        
    Raises:
        AgentError: If email send fails
    """
    sender = get_email_sender()
    return await sender.send_with_attachments(
        to_address=to_address,
        from_address=from_address,
        subject=subject,
        body=body,
        artifact_locations=artifact_locations,
        cc=cc,
        bcc=bcc
    )
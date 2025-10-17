"""
Email tool for sending proposal submissions.

Provides Gmail API integration for Submission Agent to send emails
with attachments to clients for RFP/bid submissions.
"""

import base64
import logging
from email.mime.application import MIMEApplication
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from typing import Any, Dict, List, Optional

from agents_core.core.config import get_config
from agents_core.core.error_handling import handle_errors
from agents_core.core.observability import trace_operation
from agents_core.tools.storage.s3_tools import get_s3_manager

logger = logging.getLogger(__name__)


class EmailClient:
    """
    Email client for sending emails via Gmail API.
    
    Used by Submission Agent to send proposal/bid submissions to clients.
    """
    
    _instance: Optional["EmailClient"] = None
    
    def __new__(cls):
        """Singleton pattern."""
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance
    
    def __init__(self):
        """Initialize email client."""
        if not hasattr(self, "_initialized"):
            config = get_config()
            
            # Gmail API configuration
            self.sender_email = config.get("GMAIL_SENDER_EMAIL")
            self.gmail_credentials = config.get("GMAIL_CREDENTIALS_PATH")
            
            # TODO: Initialize Gmail API client
            # This will use the Google API Python client
            self.gmail_service = None
            
            self._initialized = True
            logger.info(f"EmailClient initialized (sender: {self.sender_email})")
    
    def _create_message_with_attachments(
        self,
        to: List[str],
        subject: str,
        body: str,
        attachments: List[Dict[str, Any]],
        cc: Optional[List[str]] = None,
        bcc: Optional[List[str]] = None,
        body_html: bool = False,
    ) -> Dict[str, Any]:
        """
        Create email message with attachments.
        
        Args:
            to: Recipient email addresses
            subject: Email subject
            body: Email body
            attachments: List of attachments with name and content
            cc: CC recipients
            bcc: BCC recipients
            body_html: Whether body is HTML
            
        Returns:
            Email message dict for Gmail API
        """
        message = MIMEMultipart()
        message["to"] = ", ".join(to)
        message["subject"] = subject
        
        if cc:
            message["cc"] = ", ".join(cc)
        if bcc:
            message["bcc"] = ", ".join(bcc)
        
        # Add body
        if body_html:
            message.attach(MIMEText(body, "html"))
        else:
            message.attach(MIMEText(body, "plain"))
        
        # Add attachments
        for attachment in attachments:
            part = MIMEApplication(attachment["content"], Name=attachment["name"])
            part["Content-Disposition"] = f'attachment; filename="{attachment["name"]}"'
            message.attach(part)
        
        # Encode message
        raw_message = base64.urlsafe_b64encode(message.as_bytes()).decode()
        
        return {"raw": raw_message}
    
    @trace_operation("email_send")
    @handle_errors
    async def send_email(
        self,
        to: List[str],
        subject: str,
        body: str,
        attachments: Optional[List[Dict[str, Any]]] = None,
        cc: Optional[List[str]] = None,
        bcc: Optional[List[str]] = None,
        body_html: bool = False,
    ) -> Dict[str, Any]:
        """
        Send email via Gmail API.
        
        Args:
            to: Recipient email addresses
            subject: Email subject
            body: Email body
            attachments: List of attachments (name, content)
            cc: CC recipients
            bcc: BCC recipients
            body_html: Whether body is HTML
            
        Returns:
            Send result with message ID
        """
        # TODO: Implement using Gmail API
        # This is a placeholder showing the expected interface
        
        logger.info(f"Sending email to {', '.join(to)}: {subject}")
        
        # Create message
        message = self._create_message_with_attachments(
            to, subject, body, attachments or [], cc, bcc, body_html
        )
        
        # Placeholder response
        return {
            "success": True,
            "message_id": f"msg_{hash(subject) % 1000000:06d}",
            "to": to,
            "subject": subject,
            "attachments_count": len(attachments) if attachments else 0,
            "sent_at": "2025-01-01T00:00:00Z",
        }
    
    @trace_operation("email_send_with_s3_attachments")
    @handle_errors
    async def send_email_with_s3_attachments(
        self,
        to: List[str],
        subject: str,
        body: str,
        s3_attachment_uris: List[str],
        cc: Optional[List[str]] = None,
        body_html: bool = False,
    ) -> Dict[str, Any]:
        """
        Send email with attachments from S3.
        
        Args:
            to: Recipient email addresses
            subject: Email subject
            body: Email body
            s3_attachment_uris: List of S3 URIs to attach
            cc: CC recipients
            body_html: Whether body is HTML
            
        Returns:
            Send result
        """
        # Download attachments from S3
        s3 = get_s3_manager()
        attachments = []
        
        for s3_uri in s3_attachment_uris:
            # Extract filename from S3 key
            filename = s3_uri.split("/")[-1]
            
            # Download file content
            content = await s3.download_file(s3_uri)
            
            attachments.append({
                "name": filename,
                "content": content,
            })
            
            logger.info(f"Downloaded attachment: {filename} ({len(content)} bytes)")
        
        # Send email with attachments
        return await self.send_email(
            to=to,
            subject=subject,
            body=body,
            attachments=attachments,
            cc=cc,
            body_html=body_html,
        )
    
    @trace_operation("email_create_draft")
    @handle_errors
    async def create_draft(
        self,
        to: List[str],
        subject: str,
        body: str,
        attachments: Optional[List[Dict[str, Any]]] = None,
    ) -> Dict[str, Any]:
        """
        Create email draft (for user review before sending).
        
        Args:
            to: Recipient email addresses
            subject: Email subject
            body: Email body
            attachments: List of attachments
            
        Returns:
            Draft info
        """
        # TODO: Implement Gmail draft creation
        
        logger.info(f"Creating email draft: {subject}")
        
        return {
            "success": True,
            "draft_id": f"draft_{hash(subject) % 1000000:06d}",
            "to": to,
            "subject": subject,
            "preview": body[:100],
        }


def get_email_client() -> EmailClient:
    """Get singleton email client."""
    return EmailClient()


# ==============================================================================
# TOOL FUNCTIONS
# ==============================================================================

@handle_errors
async def send_email_tool(
    to: List[str],
    subject: str,
    body: str,
    attachments: Optional[List[Dict[str, Any]]] = None,
    cc: Optional[List[str]] = None,
    body_html: bool = False,
) -> Dict[str, Any]:
    """Send email (tool function)."""
    client = get_email_client()
    return await client.send_email(to, subject, body, attachments, cc, None, body_html)


@handle_errors
async def send_email_with_s3_attachments_tool(
    to: List[str],
    subject: str,
    body: str,
    s3_attachment_uris: List[str],
    cc: Optional[List[str]] = None,
    body_html: bool = False,
) -> Dict[str, Any]:
    """Send email with S3 attachments (tool function)."""
    client = get_email_client()
    return await client.send_email_with_s3_attachments(
        to, subject, body, s3_attachment_uris, cc, body_html
    )


@handle_errors
async def create_email_draft_tool(
    to: List[str],
    subject: str,
    body: str,
    attachments: Optional[List[Dict[str, Any]]] = None,
) -> Dict[str, Any]:
    """Create email draft (tool function)."""
    client = get_email_client()
    return await client.create_draft(to, subject, body, attachments)
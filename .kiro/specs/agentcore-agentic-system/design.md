# Design Document

## Overview

The AgentCore Agentic System is a sophisticated multi-agent workflow orchestration platform built using the Strands Agents framework with AWS Bedrock AgentCore runtime. The system implements a graph-based execution pattern with a supervisor agent coordinating 8 specialized sub-agents to automate the complete bid/RFP response process.

The architecture follows a microservices pattern with FastAPI as the web framework, PostgreSQL for data persistence, AWS S3 for file storage, and comprehensive observability through Strands' built-in telemetry. The system supports both local development and containerized deployment to AWS AgentCore runtime.

## Architecture

### High-Level Architecture

```mermaid
graph TB
    subgraph "Frontend"
        FE[Next.js Frontend]
    end
    
    subgraph "Core API"
        GQL[GraphQL API]
        DB[(PostgreSQL)]
    end
    
    subgraph "AgentCore System"
        API[FastAPI Server]
        SUP[Supervisor Agent]
        
        subgraph "Specialized Agents"
            PAR[Parser Agent]
            ANA[Analysis Agent]
            CON[Content Agent]
            KNO[Knowledge Agent]
            COM[Compliance Agent]
            QA[QA Agent]
            COMMS[Comms Agent]
            SUB[Submission Agent]
        end
    end
    
    subgraph "External Services"
        S3[AWS S3]
        BDA[Bedrock Data Automation]
        BKB[Bedrock Knowledge Base]
        SLACK[Slack API]
        GMAIL[Gmail API]
    end
    
    subgraph "AgentCore Runtime"
        MEMORY[AgentCore Memory]
        OBSERVABILITY[AgentCore Observability]
        MCP_GATEWAY[AgentCore MCP Gateway]
    end
    
    subgraph "MCP Tools & Integrations"
        PSQL_MCP[PostgreSQL MCP Tool]
        S3_MCP[S3 MCP Tool]
        BEDROCK_MCP[Bedrock MCP Tool]
        GMAIL_TOOL[Gmail Tool]
    end
    
    FE -->|GraphQL| GQL
    FE -->|SSE Stream| API
    GQL --> DB
    API --> SUP
    
    %% All agent communication goes through supervisor
    SUP -.->|Handoff| PAR
    PAR -.->|Result| SUP
    SUP -.->|Handoff| ANA
    ANA -.->|Result| SUP
    SUP -.->|Handoff| CON
    CON -.->|Result| SUP
    SUP -.->|Handoff| COM
    COM -.->|Result| SUP
    SUP -.->|Handoff| QA
    QA -.->|Result| SUP
    SUP -.->|Handoff| COMMS
    COMMS -.->|Result| SUP
    SUP -.->|Handoff| SUB
    SUB -.->|Result| SUP
    
    %% Content agent uses Knowledge agent as tool
    CON -.->|Tool Call| KNO
    KNO -.->|Response| CON
    
    %% All agents connect to AgentCore runtime services
    SUP --> MEMORY
    SUP --> OBSERVABILITY
    PAR --> MEMORY
    PAR --> OBSERVABILITY
    ANA --> MEMORY
    ANA --> OBSERVABILITY
    CON --> MEMORY
    CON --> OBSERVABILITY
    KNO --> MEMORY
    KNO --> OBSERVABILITY
    COM --> MEMORY
    COM --> OBSERVABILITY
    QA --> MEMORY
    QA --> OBSERVABILITY
    COMMS --> MEMORY
    COMMS --> OBSERVABILITY
    SUB --> MEMORY
    SUB --> OBSERVABILITY
    
    %% All MCP tool access goes through AgentCore MCP Gateway
    SUP --> MCP_GATEWAY
    PAR --> MCP_GATEWAY
    ANA --> MCP_GATEWAY
    CON --> MCP_GATEWAY
    COM --> MCP_GATEWAY
    QA --> MCP_GATEWAY
    COMMS --> MCP_GATEWAY
    SUB --> MCP_GATEWAY
    
    %% AgentCore MCP Gateway manages all MCP tools
    MCP_GATEWAY --> PSQL_MCP
    MCP_GATEWAY --> S3_MCP
    MCP_GATEWAY --> BEDROCK_MCP
    MCP_GATEWAY --> GMAIL_TOOL
    
    %% MCP tools connect to actual services
    PSQL_MCP --> DB
    S3_MCP --> S3
    BEDROCK_MCP --> BDA
    BEDROCK_MCP --> BKB
    GMAIL_TOOL --> GMAIL
    
    %% Slack integration through AgentCore MCP Gateway
    MCP_GATEWAY --> SLACK
    
    %% AgentCore services integration
    MEMORY --> DB
    OBSERVABILITY --> DB
```

### Workflow Execution Flow

The system follows the exact sequence from your provided sequence diagram:

**Phase 1: Project Creation & Document Upload**
1. User creates project via GraphQL API
2. Frontend gets S3 presigned URLs and uploads documents directly
3. Frontend updates ProjectDocument records with raw_file_location
4. User clicks "Start" → Frontend calls AgentCore `/invocations` endpoint

**Phase 2: Agent Execution (Following Your Sequence Diagram)**
1. **Supervisor** creates WorkflowExecution and AgentTask records (via MCP tools)
2. **Supervisor** queries next incomplete AgentTask → finds Parser task
3. **Supervisor** hands off to **Parser Agent**
4. **Parser Agent** processes documents using Bedrock Data Automation (via MCP tools)
5. **Parser Agent** updates ProjectDocument with processed_file_location (via MCP tools)
6. **Parser Agent** completes and hands back to **Supervisor**
7. **Supervisor** hands off to **Analysis Agent**
8. **Analysis Agent** analyzes documents and generates markdown (via MCP tools)
9. **Analysis Agent** completes and hands back to **Supervisor**
10. **Supervisor** sends analysis to user for feedback
11. **User provides feedback** → **Supervisor** decides next action:
    - If parsing issues → reset Parser task, go to step 3
    - If analysis issues → reset Analysis task, go to step 7
    - If satisfied → continue to Content Agent
12. **Supervisor** hands off to **Content Agent**
13. **Content Agent** uses **Knowledge Agent** to query Bedrock Knowledge Bases
14. **Content Agent** creates artifacts in TipTap JSON format (via MCP tools)
15. **Content Agent** completes and hands back to **Supervisor**
16. **Supervisor** hands off to **Compliance Agent**
17. **Compliance Agent** reviews artifacts against standards (via MCP tools)
18. **Compliance Agent** completes and hands back to **Supervisor**
19. If compliance fails → **Supervisor** resets Content and Compliance tasks, go to step 12
20. **Supervisor** hands off to **QA Agent**
21. **QA Agent** performs quality assurance (via MCP tools)
22. **QA Agent** completes and hands back to **Supervisor**
23. If QA fails → **Supervisor** resets Content, Compliance, QA tasks, go to step 12
24. **Supervisor** presents artifacts to user for review
25. **User reviews artifacts**:
    - If changes needed → **Supervisor** resets Content tasks, go to step 12
    - If approved → **Supervisor** exports artifacts to S3
26. **Supervisor** asks user for communications permission
27. If approved → **Supervisor** hands off to **Comms Agent**
28. **Comms Agent** creates Slack channels and sends notifications (via MCP tools)
29. **Comms Agent** completes and hands back to **Supervisor**
30. **Supervisor** asks user for submission permission
31. If approved → **Supervisor** hands off to **Submission Agent**
32. **Submission Agent** generates email draft and sends to **Supervisor**
33. **Supervisor** shows email draft to user for approval
34. If approved → **Submission Agent** sends email with attachments (via Gmail tool)
35. **Submission Agent** completes and hands back to **Supervisor**
36. **Supervisor** marks WorkflowExecution as completed

### Agent Interaction Pattern

```mermaid
sequenceDiagram
    participant User
    participant Frontend
    participant CoreAPI as core-api (GraphQL)
    participant S3 as S3 Storage
    participant AgentCore as agent-core (FastAPI)
    participant Supervisor as Supervisor Agent
    participant Parser as Parser Agent
    participant Analysis as Analysis Agent
    participant Content as Content Agent
    participant Knowledge as Knowledge Agent
    participant Compliance as Compliance Agent
    participant QA as QA Agent
    participant Comms as Comms Agent
    participant Submission as Submission Agent
    participant DB as PostgreSQL
    participant BedrockDA as Bedrock Data Automation
    participant BedrockKB as Bedrock Knowledge Base
    participant ComplianceTool as compliance_check Tool
    participant QATool as qa_check Tool
    participant SlackMCP as Slack MCP Server
    participant EmailTool as send_email Tool

    Note over User,EmailTool: Project Creation Phase
    User->>Frontend: Fill form and click Start
    Frontend->>CoreAPI: createProject mutation
    CoreAPI->>DB: Insert Project record
    DB-->>CoreAPI: project_id
    CoreAPI-->>Frontend: project_id
    
    Frontend->>CoreAPI: generatePresignedUrls mutation
    CoreAPI->>S3: Generate presigned URLs
    S3-->>CoreAPI: Presigned URLs
    CoreAPI-->>Frontend: URLs array
    
    Note over Frontend,S3: Direct S3 Upload
    Frontend->>S3: Upload documents directly
    S3-->>Frontend: Upload complete
    
    Frontend->>CoreAPI: updateProjectDocuments mutation
    CoreAPI->>DB: Insert ProjectDocument records with raw_file_location
    DB-->>CoreAPI: Success
    CoreAPI-->>Frontend: ProjectDocuments created successfully
    
    Note over Frontend: Wait for confirmation before agent invocation
    Frontend->>Frontend: Update UI - documents uploaded
    
    Note over User,EmailTool: Agent Execution Phase
    Frontend->>AgentCore: POST /invocations with payload
    AgentCore->>Supervisor: Initialize workflow
    
    rect rgb(240, 248, 255)
        Note over Supervisor,DB: Workflow Initialization
        Supervisor->>DB: Create WorkflowExecution (status: Open)
        Supervisor->>DB: Create all AgentTasks (status: Open)
        DB-->>Supervisor: Tasks created
        Supervisor-->>AgentCore: Event workflow_created
        AgentCore-->>Frontend: SSE workflow_created
        Frontend->>Frontend: Show progress bar
        
        Supervisor->>DB: Query next incomplete AgentTask
        DB-->>Supervisor: Parser AgentTask
        Supervisor-->>AgentCore: Event parser_started
        AgentCore-->>Frontend: SSE parser_started
        Frontend->>Frontend: Animate parsing step
    end
    
    rect rgb(255, 250, 240)
        Note over Supervisor,BedrockDA: Parser Agent Execution
        Supervisor->>Parser: Handoff to execute Parser task
        Parser->>DB: Update Parser AgentTask (status: InProgress)
        Parser->>DB: Fetch ProjectDocuments with raw_file_location
        DB-->>Parser: Raw document locations
        Parser->>BedrockDA: Process documents from raw_file_location
        BedrockDA->>S3: Read documents from raw_file_location
        S3-->>BedrockDA: Document content
        BedrockDA->>BedrockDA: Parse and extract data
        BedrockDA->>S3: Save processed documents
        S3-->>BedrockDA: Processed file locations
        BedrockDA-->>Parser: Processed file locations
        Parser->>DB: Update ProjectDocument with processed_file_location
        Parser->>DB: Update Parser AgentTask (output_data, status: Completed)
        Parser-->>Supervisor: Parser task complete
        
        Supervisor->>Supervisor: Analyze Parser output for errors
        
        alt Parser task failed
            Supervisor->>DB: Update WorkflowExecution (status: Failed, error_message, error_log)
            Supervisor-->>AgentCore: Event parser_failed with error details
            AgentCore-->>Frontend: SSE parser_failed
            Frontend->>Frontend: Display error message to user
        else Parser task succeeded
            Supervisor->>DB: Update WorkflowExecution (last_updated_at)
            Supervisor->>DB: Update Project (progress_percentage)
            Supervisor-->>AgentCore: Event parser_completed
            AgentCore-->>Frontend: SSE parser_completed
            Frontend->>Frontend: Mark parsing complete
            
            Supervisor->>DB: Query next incomplete AgentTask
            DB-->>Supervisor: Analysis AgentTask
            Supervisor-->>AgentCore: Event analysis_started
            AgentCore-->>Frontend: SSE analysis_started
            Frontend->>Frontend: Animate analysis step
        end
    end
    
    rect rgb(240, 255, 240)
        Note over Supervisor,BedrockKB: Analysis Agent Execution
        Supervisor->>Analysis: Handoff to execute Analysis task
        Analysis->>DB: Update Analysis AgentTask (status: InProgress)
        Analysis->>DB: Fetch Parser output_data
        DB-->>Analysis: Parsed document data
        Analysis->>DB: Fetch ProjectDocuments with processed_file_location
        DB-->>Analysis: Processed file locations
        Analysis->>S3: Retrieve processed documents
        S3-->>Analysis: Document content
        Analysis->>BedrockKB: Query for context and insights
        BedrockKB-->>Analysis: Contextual information
        Analysis->>Analysis: Generate analysis markdown
        Analysis->>DB: Update Analysis AgentTask (output_data, status: Completed)
        Analysis-->>Supervisor: Analysis task complete
        
        Supervisor->>Supervisor: Analyze Analysis output for errors
        
        alt Analysis task failed
            Supervisor->>DB: Update WorkflowExecution (status: Failed, error_message, error_log)
            Supervisor-->>AgentCore: Event analysis_failed with error details
            AgentCore-->>Frontend: SSE analysis_failed
            Frontend->>Frontend: Display error message to user
        else Analysis task succeeded
            Supervisor->>DB: Update WorkflowExecution (last_updated_at)
            Supervisor->>DB: Update Project (progress_percentage)
            Supervisor-->>AgentCore: Event analysis_completed
            AgentCore-->>Frontend: SSE analysis_completed with markdown
            Frontend->>Frontend: Display analysis in chat
            Frontend->>Frontend: Mark analysis complete
        end
    end
    
    Note over User,Frontend: User Feedback Loop
    Supervisor->>DB: Update WorkflowExecution (status: Waiting)
    Supervisor-->>AgentCore: Event awaiting_feedback
    AgentCore-->>Frontend: SSE awaiting_feedback
    
    User->>Frontend: Review and provide feedback
    Frontend->>AgentCore: POST /invocations with user_input
    AgentCore->>Supervisor: Process user feedback
    
    Supervisor->>Supervisor: Analyze user feedback and understand intent
    
    alt Feedback requires re-analysis
        Supervisor->>DB: Update Analysis AgentTask (status: Open)
        Supervisor->>DB: Update WorkflowExecution (status: InProgress)
        Supervisor->>DB: Query next incomplete task
        DB-->>Supervisor: Analysis AgentTask
        Supervisor-->>AgentCore: Event analysis_restarted
        AgentCore-->>Frontend: SSE analysis_restarted
        Frontend->>Frontend: Reset progress bar to Analysis step
        Note over Supervisor,Analysis: Loop back to Analysis
    else User satisfied continue
        Supervisor->>DB: Update WorkflowExecution (status: InProgress)
        Supervisor->>DB: Query next incomplete task
        DB-->>Supervisor: Content AgentTask
        Supervisor-->>AgentCore: Event content_started
        AgentCore-->>Frontend: SSE content_started
        Frontend->>Frontend: Animate content step
    end
    
    rect rgb(255, 240, 245)
        Note over Supervisor,BedrockKB: Content Agent Execution
        Supervisor->>Content: Handoff to execute Content task
        Content->>DB: Update Content AgentTask (status: InProgress)
        Content->>DB: Fetch Analysis output_data
        DB-->>Content: Analysis results
        Content->>Knowledge: Request KB data
        Knowledge->>BedrockKB: Query historical bids and Q&A
        BedrockKB-->>Knowledge: Historical bid data
        Knowledge-->>Content: KB data
        Content->>Content: Generate artifacts with TipTap JSON
        Content->>DB: Insert Artifact records
        Content->>DB: Insert ArtifactVersion records
        Content->>DB: Update Content AgentTask (output_data, status: Completed)
        Content-->>Supervisor: Content task complete
        
        Supervisor->>Supervisor: Analyze Content output for errors
        
        alt Content task failed
            Supervisor->>DB: Update WorkflowExecution (status: Failed, error_message, error_log)
            Supervisor-->>AgentCore: Event content_failed with error details
            AgentCore-->>Frontend: SSE content_failed
            Frontend->>Frontend: Display error message to user
        else Content task succeeded
            Supervisor->>DB: Update WorkflowExecution (last_updated_at)
            Supervisor->>DB: Update Project (progress_percentage)
            Supervisor-->>AgentCore: Event content_completed
            AgentCore-->>Frontend: SSE content_completed
            Frontend->>Frontend: Mark content complete
            
            Supervisor->>DB: Query next incomplete task
            DB-->>Supervisor: Compliance AgentTask
            Supervisor-->>AgentCore: Event compliance_started
            AgentCore-->>Frontend: SSE compliance_started
            Frontend->>Frontend: Animate compliance step
        end
    end
    
    rect rgb(255, 255, 240)
        Note over Supervisor,ComplianceTool: Compliance Agent Execution
        Supervisor->>Compliance: Handoff to execute Compliance task
        Compliance->>DB: Update Compliance AgentTask (status: InProgress)
        Compliance->>DB: Fetch Artifacts and ArtifactVersions
        DB-->>Compliance: Artifact content
        Compliance->>ComplianceTool: Check compliance standards
        ComplianceTool->>ComplianceTool: Verify against Deloitte standards
        ComplianceTool-->>Compliance: Compliance feedback
        Compliance->>DB: Update Compliance AgentTask (output_data, status: Completed)
        Compliance-->>Supervisor: Compliance task complete with status
        
        Supervisor->>Supervisor: Analyze Compliance output for errors
        
        alt Compliance task failed with error
            Supervisor->>DB: Update WorkflowExecution (status: Failed, error_message, error_log)
            Supervisor-->>AgentCore: Event compliance_failed with error details
            AgentCore-->>Frontend: SSE compliance_failed
            Frontend->>Frontend: Display error message to user
        else Compliance check completed
            Supervisor->>DB: Update WorkflowExecution (last_updated_at)
            Supervisor->>DB: Update Project (progress_percentage)
            Supervisor-->>AgentCore: Event compliance_completed
            AgentCore-->>Frontend: SSE compliance_completed
            Frontend->>Frontend: Mark compliance complete
            
            alt Compliance standards not met
                Supervisor->>DB: Update Content AgentTask (status: Open)
                Supervisor->>DB: Update Compliance AgentTask (status: Open)
                Supervisor->>DB: Update WorkflowExecution (status: InProgress)
                Supervisor->>DB: Query next incomplete task
                DB-->>Supervisor: Content AgentTask
                Supervisor-->>AgentCore: Event returning_to_content
                AgentCore-->>Frontend: SSE returning_to_content
                Frontend->>Frontend: Reset progress bar to Content step
                Note over Supervisor,Content: Loop back to Content
            else Compliance standards met
                Supervisor->>DB: Query next incomplete task
                DB-->>Supervisor: QA AgentTask
                Supervisor-->>AgentCore: Event qa_started
                AgentCore-->>Frontend: SSE qa_started
                Frontend->>Frontend: Animate QA step
            end
        end
    end
    
    rect rgb(245, 245, 255)
        Note over Supervisor,QATool: QA Agent Execution
        Supervisor->>QA: Handoff to execute QA task
        QA->>DB: Update QA AgentTask (status: InProgress)
        QA->>DB: Fetch Artifacts and Analysis output
        DB-->>QA: All required data
        QA->>QATool: Perform quality assurance check
        QATool->>QATool: Verify completeness and standards
        QATool-->>QA: QA feedback and gaps
        QA->>DB: Update QA AgentTask (output_data, status: Completed)
        QA-->>Supervisor: QA task complete with status
        
        Supervisor->>Supervisor: Analyze QA output for errors
        
        alt QA task failed with error
            Supervisor->>DB: Update WorkflowExecution (status: Failed, error_message, error_log)
            Supervisor-->>AgentCore: Event qa_failed with error details
            AgentCore-->>Frontend: SSE qa_failed
            Frontend->>Frontend: Display error message to user
        else QA check completed
            Supervisor->>DB: Update WorkflowExecution (last_updated_at)
            Supervisor->>DB: Update Project (progress_percentage)
            Supervisor-->>AgentCore: Event qa_completed
            AgentCore-->>Frontend: SSE qa_completed
            Frontend->>Frontend: Mark QA complete
            
            alt QA standards not met
                Supervisor->>DB: Update Content AgentTask (status: Open)
                Supervisor->>DB: Update Compliance AgentTask (status: Open)
                Supervisor->>DB: Update QA AgentTask (status: Open)
                Supervisor->>DB: Update WorkflowExecution (status: InProgress)
                Supervisor->>DB: Query next incomplete task
                DB-->>Supervisor: Content AgentTask
                Supervisor-->>AgentCore: Event returning_to_content
                AgentCore-->>Frontend: SSE returning_to_content
                Frontend->>Frontend: Reset progress bar to Content step
                Note over Supervisor,Content: Loop back to Content
            else QA standards met
                Supervisor->>DB: Fetch finalized Artifacts
                DB-->>Supervisor: Artifact array
                Supervisor-->>AgentCore: Event artifacts_ready
                AgentCore-->>Frontend: SSE artifacts_ready
                Frontend->>Frontend: Render artifact tiles
            end
        end
    end
    
    Note over User,Frontend: Artifact Review and Edit
    Supervisor->>DB: Update WorkflowExecution (status: Waiting)
    Supervisor-->>AgentCore: Event awaiting_review
    AgentCore-->>Frontend: SSE awaiting_review
    
    User->>Frontend: Click artifacts and edit content
    Frontend->>Frontend: Open popup editors
    User->>Frontend: Make edits and save to Zustand
    User->>Frontend: Send message via chat
    Frontend->>AgentCore: POST /invocations with content_edits
    AgentCore->>Supervisor: Process user edits
    
    Supervisor->>Supervisor: Analyze user edits and intent
    Supervisor-->>AgentCore: Event review_prompt
    AgentCore-->>Frontend: SSE review_prompt asking re-review question
    Frontend->>Frontend: Display prompt to user
    
    Note over User,Frontend: Wait for User Decision
    User->>Frontend: Respond yes for re-review or no to proceed
    Frontend->>AgentCore: POST /invocations with user decision
    AgentCore->>Supervisor: User decision received
    
    Supervisor->>Supervisor: Analyze user intent from response
    
    alt User wants re-review with edited content
        Supervisor->>DB: Update Content AgentTask (status: Open)
        Supervisor->>DB: Update Compliance AgentTask (status: Open)
        Supervisor->>DB: Update QA AgentTask (status: Open)
        Supervisor->>DB: Update WorkflowExecution (status: InProgress)
        Supervisor->>DB: Query next incomplete task
        DB-->>Supervisor: Content AgentTask
        Supervisor-->>AgentCore: Event returning_to_content
        AgentCore-->>Frontend: SSE returning_to_content
        Frontend->>Frontend: Reset progress bar to Content step
        Note over Supervisor,Content: Loop to Content with user edits
    else User approves artifacts and proceeds
        Supervisor->>S3: Export artifacts to S3
        S3-->>Supervisor: File locations
        Supervisor->>DB: Update ArtifactVersion with locations
        Supervisor->>DB: Update WorkflowExecution (status: InProgress)
        Supervisor-->>AgentCore: Event artifacts_exported
        AgentCore-->>Frontend: SSE artifacts_exported
        
        Supervisor->>DB: Query next incomplete task
        DB-->>Supervisor: Comms AgentTask
        Supervisor-->>AgentCore: Event comms_permission
        AgentCore-->>Frontend: SSE comms_permission
    end
    
    Note over User,Frontend: Comms Permission Decision
    User->>Frontend: Approve or decline notifications
    Frontend->>AgentCore: POST /invocations with decision
    AgentCore->>Supervisor: User comms decision received
    
    Supervisor->>Supervisor: Analyze user comms decision
    
    alt User declines comms
        Supervisor->>DB: Update Comms AgentTask (status: Completed)
        Supervisor->>DB: Update Submission AgentTask (status: Completed)
        Supervisor->>DB: Update WorkflowExecution (status: Completed)
        Supervisor->>DB: Update Project (status: Completed, progress: 100)
        Supervisor-->>AgentCore: Event workflow_completed_without_comms
        AgentCore-->>Frontend: SSE workflow_completed
        Frontend->>Frontend: Mark progress bar as 100 percent complete
        Frontend->>Frontend: Display completion message
    else User approves comms
        rect rgb(250, 240, 255)
            Note over Supervisor,SlackMCP: Comms Agent Execution
            Supervisor-->>AgentCore: Event comms_started
            AgentCore-->>Frontend: SSE comms_started
            Frontend->>Frontend: Animate comms step
            
            Supervisor->>Comms: Handoff to execute Comms task
            Comms->>DB: Update Comms AgentTask (status: InProgress)
            Comms->>DB: Fetch ProjectMembers and artifact locations
            DB-->>Comms: Member emails and locations
            Comms->>SlackMCP: Create channel and send notifications
            SlackMCP->>SlackMCP: Create Slack channel
            SlackMCP->>SlackMCP: Send notifications to members
            SlackMCP-->>Comms: Notifications sent
            Comms->>DB: Insert Notification records
            Comms->>DB: Update Comms AgentTask (status: Completed)
            Comms-->>Supervisor: Comms task complete
            
            Supervisor->>Supervisor: Analyze Comms output for errors
            
            alt Comms task failed
                Supervisor->>DB: Update WorkflowExecution (status: Failed, error_message, error_log)
                Supervisor-->>AgentCore: Event comms_failed with error details
                AgentCore-->>Frontend: SSE comms_failed
                Frontend->>Frontend: Display error message to user
            else Comms task succeeded
                Supervisor->>DB: Update WorkflowExecution (last_updated_at)
                Supervisor->>DB: Update Project (progress_percentage)
                Supervisor-->>AgentCore: Event comms_completed
                AgentCore-->>Frontend: SSE comms_completed
                Frontend->>Frontend: Mark comms complete
                
                Frontend->>CoreAPI: GraphQL subscription
                CoreAPI-->>Frontend: Push notification
                
                Supervisor->>DB: Query next incomplete task
                DB-->>Supervisor: Submission AgentTask
                Supervisor-->>AgentCore: Event submission_permission
                AgentCore-->>Frontend: SSE submission_permission
            end
        end
    end
    
    Note over User,Frontend: Submission Permission Decision
    User->>Frontend: Approve or decline submission
    Frontend->>AgentCore: POST /invocations with decision
    AgentCore->>Supervisor: User submission decision received
    
    Supervisor->>Supervisor: Analyze user submission decision
    
    alt User declines submission
        Supervisor->>DB: Update Submission AgentTask (status: Completed)
        Supervisor->>DB: Update WorkflowExecution (status: Completed)
        Supervisor->>DB: Update Project (status: Completed, progress: 100)
        Supervisor-->>AgentCore: Event workflow_completed_without_submission
        AgentCore-->>Frontend: SSE workflow_completed
        Frontend->>Frontend: Mark progress bar as 100 percent complete
        Frontend->>Frontend: Display completion message
    else User approves submission
        rect rgb(255, 245, 240)
            Note over Supervisor,EmailTool: Submission Agent Execution
            Supervisor-->>AgentCore: Event submission_started
            AgentCore-->>Frontend: SSE submission_started
            Frontend->>Frontend: Animate bidding step
            
            Supervisor->>Submission: Handoff to execute Submission task
            Submission->>DB: Update Submission AgentTask (status: InProgress)
            Submission->>DB: Fetch Analysis output and locations
            DB-->>Submission: Client contact and file locations
            Submission->>Submission: Generate email draft
            Submission-->>Supervisor: Email draft ready
            
            Supervisor-->>AgentCore: Event email_draft
            AgentCore-->>Frontend: SSE email_draft
            Frontend->>Frontend: Display email preview
            
            User->>Frontend: Approve email
            Frontend->>AgentCore: POST /invocations approval
            AgentCore->>Supervisor: Email approved
            Supervisor->>Submission: Send email command
            
            Submission->>EmailTool: Send email with attachments
            EmailTool->>S3: Fetch artifact files
            S3-->>EmailTool: Artifact files
            EmailTool->>EmailTool: Compose and send email
            EmailTool-->>Submission: Email sent confirmation
            Submission->>DB: Update Submission AgentTask (status: Completed)
            Submission-->>Supervisor: Submission task complete
            
            Supervisor->>Supervisor: Analyze Submission output for errors
            
            alt Submission task failed
                Supervisor->>DB: Update WorkflowExecution (status: Failed, error_message, error_log)
                Supervisor-->>AgentCore: Event submission_failed with error details
                AgentCore-->>Frontend: SSE submission_failed
                Frontend->>Frontend: Display error message to user
            else Submission task succeeded
                Supervisor->>DB: Update WorkflowExecution (status: Completed)
                Supervisor->>DB: Update Project (status: Completed, progress: 100)
                Supervisor-->>AgentCore: Event submission_completed
                AgentCore-->>Frontend: SSE submission_completed
                Supervisor-->>AgentCore: Event workflow_completed
                AgentCore-->>Frontend: SSE workflow_completed
                
                Frontend->>Frontend: Mark progress bar as 100 percent complete
                Frontend->>Frontend: Display success message
            end
        end
    end
    
    Note over User,EmailTool: Workflow Complete
```

## AgentCore Runtime Integration

### AgentCore Memory System

The AgentCore Memory system provides persistent memory capabilities across agent executions, enabling agents to maintain context, learn from previous interactions, and access shared knowledge.

```python
from agentcore.memory import MemoryManager, MemoryType, MemoryScope

class AgentCoreMemoryIntegration:
    def __init__(self):
        self.memory_manager = MemoryManager()
    
    async def store_workflow_context(self, workflow_id: str, context: Dict[str, Any]):
        """Store workflow context in AgentCore Memory"""
        await self.memory_manager.store(
            key=f"workflow:{workflow_id}:context",
            value=context,
            memory_type=MemoryType.WORKFLOW,
            scope=MemoryScope.PROJECT,
            ttl=86400  # 24 hours
        )
    
    async def store_agent_learning(self, agent_name: str, learning_data: Dict[str, Any]):
        """Store agent learning data for future reference"""
        await self.memory_manager.store(
            key=f"agent:{agent_name}:learning",
            value=learning_data,
            memory_type=MemoryType.AGENT_LEARNING,
            scope=MemoryScope.GLOBAL,
            ttl=None  # Persistent
        )
    
    async def retrieve_similar_projects(self, project_context: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Retrieve similar project contexts from memory"""
        return await self.memory_manager.semantic_search(
            query=project_context,
            memory_type=MemoryType.WORKFLOW,
            limit=5,
            similarity_threshold=0.8
        )
    
    async def store_user_preferences(self, user_id: str, preferences: Dict[str, Any]):
        """Store user preferences for personalized agent behavior"""
        await self.memory_manager.store(
            key=f"user:{user_id}:preferences",
            value=preferences,
            memory_type=MemoryType.USER_PREFERENCES,
            scope=MemoryScope.USER,
            ttl=None  # Persistent
        )
```

### AgentCore Observability System

The AgentCore Observability system provides comprehensive monitoring, logging, and analytics for agent workflows, enabling real-time insights and performance optimization.

```python
from agentcore.observability import ObservabilityManager, MetricType, LogLevel

class AgentCoreObservabilityIntegration:
    def __init__(self):
        self.observability = ObservabilityManager()
    
    async def track_workflow_start(self, workflow_id: str, project_id: str, user_id: str):
        """Track workflow initiation"""
        await self.observability.emit_metric(
            name="workflow.started",
            value=1,
            metric_type=MetricType.COUNTER,
            tags={
                "workflow_id": workflow_id,
                "project_id": project_id,
                "user_id": user_id
            }
        )
        
        await self.observability.log(
            level=LogLevel.INFO,
            message=f"Workflow {workflow_id} started for project {project_id}",
            context={
                "workflow_id": workflow_id,
                "project_id": project_id,
                "user_id": user_id,
                "timestamp": datetime.utcnow().isoformat()
            }
        )
    
    async def track_agent_execution(self, agent_name: str, execution_time: float, 
                                   status: str, workflow_id: str):
        """Track individual agent execution metrics"""
        await self.observability.emit_metric(
            name=f"agent.{agent_name}.execution_time",
            value=execution_time,
            metric_type=MetricType.HISTOGRAM,
            tags={
                "agent": agent_name,
                "status": status,
                "workflow_id": workflow_id
            }
        )
        
        await self.observability.emit_metric(
            name=f"agent.{agent_name}.executions",
            value=1,
            metric_type=MetricType.COUNTER,
            tags={
                "agent": agent_name,
                "status": status
            }
        )
    
    async def track_user_feedback(self, workflow_id: str, feedback_type: str, 
                                 satisfaction_score: float):
        """Track user feedback and satisfaction"""
        await self.observability.emit_metric(
            name="user.feedback.satisfaction",
            value=satisfaction_score,
            metric_type=MetricType.GAUGE,
            tags={
                "workflow_id": workflow_id,
                "feedback_type": feedback_type
            }
        )
    
    async def create_workflow_trace(self, workflow_id: str) -> str:
        """Create distributed trace for workflow execution"""
        trace_id = await self.observability.start_trace(
            operation_name="bid_workflow_execution",
            tags={
                "workflow_id": workflow_id,
                "service": "agentcore-agentic-system"
            }
        )
        return trace_id
    
    async def add_trace_span(self, trace_id: str, agent_name: str, 
                           operation: str, duration: float):
        """Add span to workflow trace"""
        await self.observability.add_span(
            trace_id=trace_id,
            span_name=f"{agent_name}.{operation}",
            duration=duration,
            tags={
                "agent": agent_name,
                "operation": operation
            }
        )
```

### AgentCore MCP Gateway Integration

All MCP tool access goes through the AgentCore MCP Gateway, which provides centralized management, security, and monitoring of MCP connections.

```python
from agentcore.mcp import MCPGateway, MCPToolRequest, MCPToolResponse

class AgentCoreMCPIntegration:
    def __init__(self):
        self.mcp_gateway = MCPGateway()
    
    async def execute_mcp_tool(self, tool_name: str, arguments: Dict[str, Any], 
                              agent_context: Dict[str, Any]) -> MCPToolResponse:
        """Execute MCP tool through AgentCore Gateway"""
        request = MCPToolRequest(
            tool_name=tool_name,
            arguments=arguments,
            agent_id=agent_context.get("agent_id"),
            workflow_id=agent_context.get("workflow_id"),
            user_id=agent_context.get("user_id")
        )
        
        # Gateway handles authentication, authorization, rate limiting, and monitoring
        response = await self.mcp_gateway.execute_tool(request)
        
        # Automatic observability tracking
        await self.track_mcp_tool_usage(tool_name, response.execution_time, response.status)
        
        return response
    
    async def get_available_tools(self, agent_context: Dict[str, Any]) -> List[str]:
        """Get available MCP tools for agent based on permissions"""
        return await self.mcp_gateway.get_available_tools(
            agent_id=agent_context.get("agent_id"),
            workflow_id=agent_context.get("workflow_id")
        )
    
    async def track_mcp_tool_usage(self, tool_name: str, execution_time: float, status: str):
        """Track MCP tool usage metrics"""
        await self.observability.emit_metric(
            name="mcp.tool.execution_time",
            value=execution_time,
            metric_type=MetricType.HISTOGRAM,
            tags={
                "tool": tool_name,
                "status": status
            }
        )
```

## Components and Interfaces

### 1. FastAPI Server (`main.py`)

The main entry point that exposes the `/invocations` endpoint required by AWS AgentCore runtime.

```python
from fastapi import FastAPI, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
import asyncio
import json
from datetime import datetime

class UserInputPayload(BaseModel):
    chat: Optional[str] = None
    content_edits: Optional[List[Dict[str, Any]]] = None

class AgentInvocationRequest(BaseModel):
    project_id: str
    user_id: str
    session_id: str
    start: bool = False
    user_input: Optional[UserInputPayload] = None

class AgentInvocationResponse(BaseModel):
    status: str
    message: str
    data: Optional[Dict[str, Any]] = None

app = FastAPI(title="AgentCore Agentic System")

@app.post("/invocations")
async def invoke_agents(request: AgentInvocationRequest):
    """Main endpoint for agent workflow invocation - AgentCore compatible"""
    try:
        # Initialize supervisor agent (no direct DB access)
        supervisor = SupervisorAgent()
        
        # Stream responses back to frontend via SSE
        return StreamingResponse(
            supervisor.execute_workflow(request),
            media_type="text/event-stream"
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/health")
async def health_check():
    return {"status": "healthy", "timestamp": datetime.utcnow()}
```

### 2. Supervisor Agent

The orchestrator that manages workflow execution and agent handoffs using Strands Agents Graph pattern.

```python
from strands import Agent
from strands.multiagent import GraphBuilder
from strands.tools.mcp import MCPClient
from mcp import stdio_client, StdioServerParameters
import asyncio
import json
from typing import AsyncGenerator, Dict, Any

class SupervisorAgent:
    def __init__(self):
        self.graph = None
        self.memory_manager = AgentCoreMemoryIntegration()
        self.observability = AgentCoreObservabilityIntegration()
        self.mcp_gateway = AgentCoreMCPIntegration()
        self.setup_agent_graph()
    
    async def setup_agentcore_context(self, workflow_id: str, project_id: str, user_id: str):
        """Setup AgentCore context for workflow execution"""
        # Store workflow context in AgentCore Memory
        workflow_context = {
            "workflow_id": workflow_id,
            "project_id": project_id,
            "user_id": user_id,
            "started_at": datetime.utcnow().isoformat(),
            "agents": ["parser", "analysis", "content", "compliance", "qa", "comms", "submission"]
        }
        
        await self.memory_manager.store_workflow_context(workflow_id, workflow_context)
        
        # Retrieve similar projects for context
        similar_projects = await self.memory_manager.retrieve_similar_projects(workflow_context)
        
        # Retrieve user preferences
        user_preferences = await self.memory_manager.retrieve_user_preferences(user_id)
        
        # Start observability tracking
        await self.observability.track_workflow_start(workflow_id, project_id, user_id)
        trace_id = await self.observability.create_workflow_trace(workflow_id)
        
        return {
            "workflow_context": workflow_context,
            "similar_projects": similar_projects,
            "user_preferences": user_preferences,
            "trace_id": trace_id
        }
    
    def setup_agent_graph(self):
        """Create the agent workflow graph"""
        builder = GraphBuilder()
        
        # Create specialized agents
        parser_agent = ParserAgent()
        analysis_agent = AnalysisAgent()
        content_agent = ContentAgent()
        compliance_agent = ComplianceAgent()
        qa_agent = QAAgent()
        comms_agent = CommsAgent()
        submission_agent = SubmissionAgent()
        
        # Add nodes to graph
        builder.add_node(parser_agent, "parser")
        builder.add_node(analysis_agent, "analysis")
        builder.add_node(content_agent, "content")
        builder.add_node(compliance_agent, "compliance")
        builder.add_node(qa_agent, "qa")
        builder.add_node(comms_agent, "comms")
        builder.add_node(submission_agent, "submission")
        
        # Define workflow edges with conditions
        builder.add_edge("parser", "analysis", condition=self.parser_success)
        builder.add_edge("analysis", "content", condition=self.analysis_approved)
        builder.add_edge("content", "compliance", condition=self.content_success)
        builder.add_edge("compliance", "qa", condition=self.compliance_passed)
        builder.add_edge("qa", "comms", condition=self.qa_passed_and_comms_approved)
        builder.add_edge("comms", "submission", condition=self.comms_success_and_submission_approved)
        
        # Feedback loops
        builder.add_edge("analysis", "parser", condition=self.needs_reparse)
        builder.add_edge("analysis", "analysis", condition=self.needs_reanalysis)
        builder.add_edge("compliance", "content", condition=self.compliance_failed)
        builder.add_edge("qa", "content", condition=self.qa_failed)
        
        # Set execution limits
        builder.set_max_node_executions(50)
        builder.set_execution_timeout(3600)  # 1 hour
        builder.reset_on_revisit(True)
        
        self.graph = builder.build()
    
    async def execute_workflow(self, request: AgentInvocationRequest) -> AsyncGenerator[str, None]:
        """Execute the agent workflow and stream updates"""
        try:
            # All database operations happen through agent MCP tools, not directly
            with self.mcp_clients['postgres'], self.mcp_clients['slack']:
                # Initialize workflow in database via supervisor agent tools
                if request.start:
                    # Supervisor uses its own MCP tools to create workflow records
                    workflow_result = await self.create_workflow_via_tools(request)
                    yield self.create_sse_event("workflow_created", {"project_id": request.project_id})
                
                # Execute graph workflow - each agent uses its own MCP tools
                async for event in self.run_graph_workflow(request):
                    yield event
                    
        except Exception as e:
            yield self.create_sse_event("workflow_failed", {"error": str(e)})
    
    async def create_workflow_via_agentcore(self, request: AgentInvocationRequest) -> Dict[str, Any]:
        """Create workflow using AgentCore MCP Gateway and services"""
        # Setup AgentCore context
        workflow_id = f"workflow_{uuid.uuid4()}"
        agentcore_context = await self.setup_agentcore_context(
            workflow_id, request.project_id, request.user_id
        )
        
        # Create workflow execution record via AgentCore MCP Gateway
        agent_context = {
            "agent_id": "supervisor",
            "workflow_id": workflow_id,
            "user_id": request.user_id
        }
        
        workflow_result = await self.mcp_gateway.execute_mcp_tool(
            tool_name="postgres_insert",
            arguments={
                "table": "WorkflowExecution",
                "data": {
                    "id": workflow_id,
                    "project_id": request.project_id,
                    "status": "Open",
                    "initiated_by": request.user_id,
                    "handled_by": request.user_id,
                    "started_at": "NOW()",
                    "last_updated_at": "NOW()"
                }
            },
            agent_context=agent_context
        )
        
        # Create agent task records
        agent_types = ["PARSER", "ANALYSIS", "CONTENT", "COMPLIANCE", "QA", "COMMS", "SUBMISSION"]
        task_ids = []
        
        for i, agent_type in enumerate(agent_types):
            task_result = await self.mcp_gateway.execute_mcp_tool(
                tool_name="postgres_insert",
                arguments={
                    "table": "AgentTask",
                    "data": {
                        "workflow_execution_id": workflow_id,
                        "agent": agent_type,
                        "status": "Open",
                        "sequence_order": i + 1,
                        "initiated_by": request.user_id,
                        "handled_by": request.user_id
                    }
                },
                agent_context=agent_context
            )
            task_ids.append(task_result.data.get("id"))
        
        # Store workflow initialization in AgentCore Memory
        await self.memory_manager.store_workflow_context(workflow_id, {
            **agentcore_context["workflow_context"],
            "task_ids": task_ids,
            "initialization_complete": True
        })
        
        return {
            "workflow_id": workflow_id,
            "task_ids": task_ids,
            "trace_id": agentcore_context["trace_id"]
        }
    
    def create_sse_event(self, event_type: str, data: Dict[str, Any]) -> str:
        """Create Server-Sent Event formatted string"""
        return f"event: {event_type}\ndata: {json.dumps(data)}\n\n"
```

### 3. Specialized Agents

Each agent inherits from a base class and implements specific functionality:

```python
from strands import Agent
from strands.tools.mcp import MCPClient
from abc import ABC, abstractmethod
import json
from typing import Dict, Any, Optional

class BaseSpecializedAgent(ABC):
    def __init__(self, agent_type: str):
        self.agent_type = agent_type
        self.agent = None
        self.mcp_tools = []
        self.setup_agent()
    
    @abstractmethod
    def get_system_prompt(self) -> str:
        """Return the system prompt for this agent"""
        pass
    
    @abstractmethod
    def get_required_tools(self) -> List[str]:
        """Return list of required MCP tools"""
        pass
    
    def setup_agent(self):
        """Initialize the Strands agent with tools"""
        system_prompt = self.get_system_prompt()
        tools = self.get_mcp_tools()
        
        self.agent = Agent(
            name=self.agent_type,
            system_prompt=system_prompt,
            tools=tools
        )
    
    async def execute(self, task_input: Dict[str, Any]) -> Dict[str, Any]:
        """Execute the agent task - all DB operations via MCP tools"""
        try:
            # Agent uses its own MCP tools to update database status to InProgress
            # The agent itself will call the postgres MCP tools, not the FastAPI server
            
            # Execute agent - the agent will use MCP tools internally
            result = await self.agent.invoke_async(task_input["task_description"])
            
            # Process result - agent handles its own database updates via MCP tools
            output_data = await self.process_result(result, task_input)
            
            return {
                "status": "success", 
                "output_data": output_data
            }
            
        except Exception as e:
            # Agent handles its own error logging via MCP tools
            return {
                "status": "error",
                "error": str(e)
            }
    
    async def update_agent_task_via_mcp(self, status: str, task_input: Dict[str, Any], 
                                       output_data: Optional[Dict] = None,
                                       error_message: Optional[str] = None):
        """Agent updates its own task status using MCP tools"""
        # This method shows how agents use MCP tools for database operations
        # Each agent will have access to postgres MCP tools in their system prompt
        pass

class ParserAgent(BaseSpecializedAgent):
    def __init__(self):
        super().__init__("parser")
    
    def get_system_prompt(self) -> str:
        return """You are a document parsing specialist. Your role is to:
        1. Use postgres MCP tools to retrieve project documents from ProjectDocument table using raw_file_location
        2. Use bedrock MCP tools to process documents with AWS Bedrock Data Automation
        3. Use s3 MCP tools to save processed documents to S3
        4. Use postgres MCP tools to update ProjectDocument table with processed_file_location
        5. Use postgres MCP tools to update your AgentTask status (InProgress -> Completed/Failed)
        6. Extract structured data and save to AgentTask output_data using postgres MCP tools
        
        CRITICAL: You must ONLY use the provided MCP tools for ALL database and AWS operations. 
        Never attempt direct database connections or AWS SDK calls.
        
        Available MCP Tools:
        - postgres_query: Query database tables
        - postgres_insert: Insert new records
        - postgres_update: Update existing records
        - bedrock_data_automation: Process documents
        - s3_upload: Upload files to S3
        - s3_download: Download files from S3
        
        Always update your AgentTask record with progress and results."""
    
    def get_required_tools(self) -> List[str]:
        return ["postgres_query", "postgres_update", "bedrock_data_automation", "s3_upload"]
    
    def get_mcp_tools(self) -> List[Any]:
        """Get MCP tools for this agent"""
        # Each agent gets its own MCP client connections
        postgres_client = MCPClient(
            lambda: stdio_client(StdioServerParameters(
                command="uvx",
                args=["postgres-mcp-server@latest"]
            ))
        )
        
        bedrock_client = MCPClient(
            lambda: stdio_client(StdioServerParameters(
                command="uvx", 
                args=["bedrock-mcp-server@latest"]
            ))
        )
        
        s3_client = MCPClient(
            lambda: stdio_client(StdioServerParameters(
                command="uvx",
                args=["s3-mcp-server@latest"] 
            ))
        )
        
        # Return combined tools from all MCP clients
        with postgres_client, bedrock_client, s3_client:
            tools = []
            tools.extend(postgres_client.list_tools_sync())
            tools.extend(bedrock_client.list_tools_sync())
            tools.extend(s3_client.list_tools_sync())
            return tools
    
    async def process_result(self, result, task_input) -> Dict[str, Any]:
        """Process parser agent result"""
        return {
            "processed_documents": result.message.content[0].text,
            "document_count": task_input.get("document_count", 0),
            "processing_time": result.metrics.total_time
        }

class AnalysisAgent(BaseSpecializedAgent):
    def __init__(self):
        super().__init__("analysis")
    
    def get_system_prompt(self) -> str:
        return """You are an RFP analysis specialist. Your role is to:
        1. Use postgres MCP tools to retrieve Parser agent output_data from AgentTask table
        2. Use postgres MCP tools to get ProjectDocument records with processed_file_location
        3. Use s3 MCP tools to download processed documents for analysis
        4. Use bedrock MCP tools to query knowledge bases for context
        5. Extract key information: client details, stakeholders, requirements
        6. Generate structured markdown output with all required sections
        7. Use postgres MCP tools to update your AgentTask status and save output_data
        
        Output must include: Client info, Key stakeholders, Understanding the ask,
        Opportunity assessment, Process requirements, Document requirements, Deadlines,
        and Submission instructions.
        
        CRITICAL: Use ONLY MCP tools for all operations. Update your AgentTask record with results.
        
        Available MCP Tools:
        - postgres_query: Query database tables
        - postgres_update: Update AgentTask with results
        - s3_download: Download processed documents
        - bedrock_knowledge_base: Query knowledge bases"""
    
    def get_required_tools(self) -> List[str]:
        return ["postgres_query", "bedrock_knowledge_base", "s3_download"]
```

### 4. MCP Tool Integration Pattern

Each agent gets its own MCP tools - no centralized database layer:

```python
# Example of how each agent gets MCP tools in their system prompt
# The agents themselves use MCP tools, not a separate database layer

class AgentMCPToolsExample:
    """
    This shows how agents use MCP tools directly in their execution.
    There is NO centralized database service - each agent uses MCP tools.
    """
    
    def parser_agent_example_system_prompt(self):
        return """
        You are a Parser Agent with access to these MCP tools:
        
        1. postgres_query - Query database tables
        2. postgres_update - Update database records  
        3. bedrock_data_automation - Process documents
        4. s3_upload - Upload files to S3
        
        Your workflow:
        1. Query ProjectDocument table to get raw_file_location
        2. Use bedrock_data_automation to process documents
        3. Upload processed files to S3 using s3_upload
        4. Update ProjectDocument with processed_file_location using postgres_update
        5. Update your AgentTask status to Completed using postgres_update
        
        Example MCP tool usage:
        - To query: Use postgres_query with table="ProjectDocument", where={"project_id": "123"}
        - To update: Use postgres_update with table="AgentTask", where={"id": "task_id"}, data={"status": "Completed"}
        """
    
    def analysis_agent_example_system_prompt(self):
        return """
        You are an Analysis Agent with access to these MCP tools:
        
        1. postgres_query - Query database tables
        2. postgres_update - Update database records
        3. s3_download - Download files from S3
        4. bedrock_knowledge_base - Query knowledge bases
        
        Your workflow:
        1. Query AgentTask table to get Parser agent output_data
        2. Query ProjectDocument table to get processed_file_location
        3. Download processed documents using s3_download
        4. Query knowledge bases using bedrock_knowledge_base for context
        5. Generate analysis markdown
        6. Update your AgentTask with results using postgres_update
        
        All database operations must use MCP tools - never direct connections.
        """

# Supervisor Agent MCP Tool Usage
class SupervisorMCPPattern:
    """
    Supervisor agent also uses MCP tools for workflow management
    """
    
    def supervisor_system_prompt(self):
        return """
        You are the Supervisor Agent orchestrating the workflow.
        
        Available MCP tools:
        1. postgres_query - Query workflow and task status
        2. postgres_update - Update workflow execution status
        3. postgres_insert - Create workflow and task records
        
        Your responsibilities:
        1. Create WorkflowExecution record when workflow starts
        2. Create AgentTask records for all agents
        3. Query next incomplete AgentTask to determine workflow progress
        4. Update WorkflowExecution status based on agent results
        5. Handle user feedback and reset agent tasks as needed
        
        Example workflow initialization:
        1. Use postgres_insert to create WorkflowExecution record
        2. Use postgres_insert to create AgentTask records for all 8 agents
        3. Use postgres_query to find next Open AgentTask
        4. Hand off to appropriate specialized agent
        
        Never use direct database connections - only MCP tools.
        """
```

### 5. External Service Integrations

#### AWS Bedrock Integration

```python
import boto3
from typing import Dict, Any, List

class BedrockIntegration:
    def __init__(self):
        self.bedrock_client = boto3.client('bedrock-runtime')
        self.data_automation_client = boto3.client('bedrock-data-automation')
        self.knowledge_base_client = boto3.client('bedrock-agent-runtime')
    
    async def process_documents(self, document_locations: List[str]) -> Dict[str, Any]:
        """Process documents using Bedrock Data Automation"""
        try:
            response = self.data_automation_client.start_data_automation_job(
                jobName=f"rfp-parsing-{datetime.utcnow().isoformat()}",
                inputConfiguration={
                    'dataSource': {
                        's3Location': {
                            'uri': document_locations[0]  # Primary document
                        }
                    }
                },
                outputConfiguration={
                    'dataSource': {
                        's3Location': {
                            'uri': 's3://bidops-processed-documents/'
                        }
                    }
                }
            )
            
            return {
                "job_id": response["jobArn"],
                "status": "processing",
                "processed_locations": []
            }
            
        except Exception as e:
            raise Exception(f"Bedrock Data Automation failed: {str(e)}")
    
    async def query_knowledge_base(self, query: str, kb_id: str) -> Dict[str, Any]:
        """Query Bedrock Knowledge Base"""
        try:
            response = self.knowledge_base_client.retrieve_and_generate(
                input={
                    'text': query
                },
                retrieveAndGenerateConfiguration={
                    'type': 'KNOWLEDGE_BASE',
                    'knowledgeBaseConfiguration': {
                        'knowledgeBaseId': kb_id,
                        'modelArn': 'arn:aws:bedrock:us-east-1::foundation-model/anthropic.claude-3-sonnet-20240229-v1:0'
                    }
                }
            )
            
            return {
                "answer": response["output"]["text"],
                "citations": response.get("citations", []),
                "source_documents": response.get("retrievalResults", [])
            }
            
        except Exception as e:
            raise Exception(f"Knowledge Base query failed: {str(e)}")
```

#### Slack Integration via AgentCore MCP Gateway

```python
class SlackIntegrationViaAgentCore:
    def __init__(self, mcp_gateway: AgentCoreMCPIntegration, 
                 observability: AgentCoreObservabilityIntegration):
        self.mcp_gateway = mcp_gateway
        self.observability = observability
    
    async def create_channel_and_notify(self, project_id: str, 
                                       member_emails: List[str],
                                       artifact_locations: List[str],
                                       agent_context: Dict[str, Any]) -> Dict[str, Any]:
        """Create Slack channel and send notifications via AgentCore MCP Gateway"""
        try:
            # Track Slack operation start
            await self.observability.track_agent_execution(
                "comms", 0, "started", agent_context["workflow_id"]
            )
            
            # Create channel via AgentCore MCP Gateway
            channel_result = await self.mcp_gateway.execute_mcp_tool(
                tool_name="slack_create_channel",
                arguments={
                    "name": f"bidops-project-{project_id}",
                    "description": f"Collaboration channel for BidOps project {project_id}"
                },
                agent_context=agent_context
            )
            
            channel_id = channel_result.data.get("channel_id")
            
            # Send notification via AgentCore MCP Gateway
            notification_result = await self.mcp_gateway.execute_mcp_tool(
                tool_name="slack_send_message",
                arguments={
                    "channel": channel_id,
                    "message": f"🎉 Project {project_id} artifacts are ready for review!",
                    "attachments": [
                        {
                            "title": "Artifact Files",
                            "text": "\n".join([f"• {loc}" for loc in artifact_locations])
                        }
                    ]
                },
                agent_context=agent_context
            )
            
            # Track successful completion
            await self.observability.track_agent_execution(
                "comms", notification_result.execution_time, "completed", 
                agent_context["workflow_id"]
            )
            
            return {
                "channel_id": channel_id,
                "notification_sent": True,
                "member_count": len(member_emails),
                "execution_time": notification_result.execution_time
            }
                
        except Exception as e:
            # Track error
            await self.observability.track_agent_execution(
                "comms", 0, "failed", agent_context["workflow_id"]
            )
            raise Exception(f"Slack integration failed: {str(e)}")
```

## Data Models

### Workflow State Management

```python
from enum import Enum
from dataclasses import dataclass
from typing import Dict, Any, Optional, List
from datetime import datetime

class WorkflowStatus(Enum):
    OPEN = "Open"
    IN_PROGRESS = "InProgress"
    WAITING = "Waiting"
    COMPLETED = "Completed"
    FAILED = "Failed"

class AgentTaskStatus(Enum):
    OPEN = "Open"
    IN_PROGRESS = "InProgress"
    WAITING = "Waiting"
    COMPLETED = "Completed"
    FAILED = "Failed"

@dataclass
class WorkflowExecution:
    id: str
    project_id: str
    status: WorkflowStatus
    initiated_by: str
    handled_by: Optional[str]
    completed_by: Optional[str]
    started_at: datetime
    completed_at: Optional[datetime]
    last_updated_at: datetime
    workflow_config: Optional[Dict[str, Any]]
    error_log: Optional[Dict[str, Any]]
    error_message: Optional[str]
    results: Optional[Dict[str, Any]]

@dataclass
class AgentTask:
    id: str
    workflow_execution_id: str
    agent: str
    status: AgentTaskStatus
    sequence_order: int
    initiated_by: str
    handled_by: Optional[str]
    completed_by: Optional[str]
    input_data: Optional[Dict[str, Any]]
    output_data: Optional[Dict[str, Any]]
    task_config: Optional[Dict[str, Any]]
    error_log: Optional[Dict[str, Any]]
    error_message: Optional[str]
    started_at: Optional[datetime]
    completed_at: Optional[datetime]
    execution_time_seconds: Optional[float]
```

### Artifact Management

```python
@dataclass
class ArtifactContent:
    type: str  # worddoc, pdf, ppt, excel
    category: str  # document, q_and_a, excel
    title: str
    meta_data: Dict[str, Any]
    content: Dict[str, Any]  # TipTap JSON or structured data
    tags: List[str]

@dataclass
class ComplianceFeedback:
    name: str
    type: str
    content: Dict[str, Any]
    feedback: List[Dict[str, Any]]

@dataclass
class QAFeedback:
    project_id: str
    artifacts_reviewed: List[Dict[str, Any]]
    missing_artifacts: List[Dict[str, Any]]
    summary: Dict[str, Any]
```

## Error Handling

### Comprehensive Error Recovery

```python
class WorkflowErrorHandler:
    def __init__(self, supervisor_agent):
        self.supervisor = supervisor_agent
        self.error_recovery_strategies = {
            "parser": self.handle_parser_error,
            "analysis": self.handle_analysis_error,
            "content": self.handle_content_error,
            "compliance": self.handle_compliance_error,
            "qa": self.handle_qa_error,
            "comms": self.handle_comms_error,
            "submission": self.handle_submission_error
        }
    
    async def handle_agent_error(self, agent_type: str, error: Exception, 
                                context: Dict[str, Any]) -> Dict[str, Any]:
        """Handle agent-specific errors with recovery strategies"""
        try:
            if agent_type in self.error_recovery_strategies:
                return await self.error_recovery_strategies[agent_type](error, context)
            else:
                return await self.handle_generic_error(error, context)
        except Exception as recovery_error:
            return await self.handle_fatal_error(recovery_error, context)
    
    async def handle_parser_error(self, error: Exception, context: Dict[str, Any]) -> Dict[str, Any]:
        """Handle parser agent errors"""
        # Update workflow status
        await self.supervisor.update_workflow_status("Failed", str(error))
        
        # Send error event to frontend
        await self.supervisor.send_sse_event("parser_failed", {
            "error": str(error),
            "context": context,
            "recovery_options": ["retry_parsing", "manual_intervention"]
        })
        
        return {
            "status": "error",
            "agent": "parser",
            "error": str(error),
            "recoverable": True
        }
    
    async def handle_fatal_error(self, error: Exception, context: Dict[str, Any]) -> Dict[str, Any]:
        """Handle non-recoverable errors"""
        await self.supervisor.update_workflow_status("Failed", f"Fatal error: {str(error)}")
        
        await self.supervisor.send_sse_event("workflow_failed", {
            "error": f"Fatal error: {str(error)}",
            "context": context,
            "requires_manual_intervention": True
        })
        
        return {
            "status": "fatal_error",
            "error": str(error),
            "recoverable": False
        }
```

## Testing Strategy

### Unit Testing Framework

```python
import pytest
import asyncio
from unittest.mock import Mock, AsyncMock, patch
from strands_agents_test_utils import AgentTestHarness

class TestSupervisorAgent:
    @pytest.fixture
    def supervisor_agent(self):
        return SupervisorAgent()
    
    @pytest.fixture
    def mock_mcp_clients(self):
        return {
            'postgres': Mock(),
            'slack': Mock()
        }
    
    @pytest.mark.asyncio
    async def test_workflow_initialization(self, supervisor_agent, mock_mcp_clients):
        """Test workflow initialization creates proper database records"""
        with patch.object(supervisor_agent, 'mcp_clients', mock_mcp_clients):
            request = AgentInvocationRequest(
                project_id="test-project",
                user_id="test-user",
                session_id="test-session",
                start=True
            )
            
            # Mock database responses
            mock_mcp_clients['postgres'].call_tool_async = AsyncMock(
                return_value={"content": [{"text": "workflow-id-123"}]}
            )
            
            result = await supervisor_agent.initialize_workflow(request)
            
            assert result["workflow_id"] == "workflow-id-123"
            assert mock_mcp_clients['postgres'].call_tool_async.called
    
    @pytest.mark.asyncio
    async def test_parser_agent_execution(self):
        """Test parser agent document processing"""
        parser = ParserAgent()
        
        test_input = {
            "project_id": "test-project",
            "task_description": "Parse uploaded RFP documents",
            "document_locations": ["s3://bucket/doc1.pdf", "s3://bucket/doc2.docx"]
        }
        
        with patch.object(parser, 'agent') as mock_agent:
            mock_agent.invoke_async = AsyncMock(
                return_value=Mock(
                    message=Mock(content=[Mock(text="Documents processed successfully")]),
                    metrics=Mock(total_time=1500)
                )
            )
            
            result = await parser.execute(test_input)
            
            assert result["status"] == "success"
            assert "processed_documents" in result["output_data"]

class TestAgentIntegrations:
    @pytest.mark.asyncio
    async def test_bedrock_data_automation_integration(self):
        """Test Bedrock Data Automation integration"""
        bedrock = BedrockIntegration()
        
        with patch.object(bedrock, 'data_automation_client') as mock_client:
            mock_client.start_data_automation_job.return_value = {
                "jobArn": "arn:aws:bedrock:us-east-1:123456789012:job/test-job"
            }
            
            result = await bedrock.process_documents(["s3://bucket/test.pdf"])
            
            assert result["status"] == "processing"
            assert "job_id" in result
    
    @pytest.mark.asyncio
    async def test_slack_mcp_integration(self):
        """Test Slack MCP integration"""
        slack = SlackMCPIntegration()
        
        with patch.object(slack, 'mcp_client') as mock_client:
            mock_client.call_tool_async = AsyncMock(
                return_value={"content": [{"text": "channel-123"}]}
            )
            
            result = await slack.create_channel_and_notify(
                "test-project",
                ["user@example.com"],
                ["s3://bucket/artifact1.pdf"]
            )
            
            assert result["channel_id"] == "channel-123"
            assert result["notification_sent"] is True

class TestErrorHandling:
    @pytest.mark.asyncio
    async def test_parser_error_recovery(self):
        """Test parser error handling and recovery"""
        supervisor = SupervisorAgent()
        error_handler = WorkflowErrorHandler(supervisor)
        
        test_error = Exception("Document parsing failed")
        context = {"project_id": "test-project", "agent": "parser"}
        
        with patch.object(supervisor, 'update_workflow_status') as mock_update:
            with patch.object(supervisor, 'send_sse_event') as mock_sse:
                result = await error_handler.handle_agent_error("parser", test_error, context)
                
                assert result["status"] == "error"
                assert result["agent"] == "parser"
                assert result["recoverable"] is True
                mock_update.assert_called_once()
                mock_sse.assert_called_once()

# Integration Tests
class TestWorkflowIntegration:
    @pytest.mark.asyncio
    async def test_complete_workflow_execution(self):
        """Test complete workflow from start to finish"""
        # This would be a comprehensive integration test
        # that runs through the entire workflow with mocked external services
        pass
    
    @pytest.mark.asyncio
    async def test_feedback_loop_handling(self):
        """Test user feedback loops and workflow restarts"""
        # Test various feedback scenarios and workflow state management
        pass
```

### Performance Testing

```python
import pytest
import asyncio
import time
from concurrent.futures import ThreadPoolExecutor

class TestPerformance:
    @pytest.mark.asyncio
    async def test_concurrent_workflow_execution(self):
        """Test system performance under concurrent workflow load"""
        supervisor = SupervisorAgent()
        
        async def run_workflow(project_id: str):
            request = AgentInvocationRequest(
                project_id=project_id,
                user_id="test-user",
                session_id=f"session-{project_id}",
                start=True
            )
            
            start_time = time.time()
            async for event in supervisor.execute_workflow(request):
                pass  # Consume all events
            end_time = time.time()
            
            return end_time - start_time
        
        # Run 10 concurrent workflows
        tasks = [run_workflow(f"project-{i}") for i in range(10)]
        execution_times = await asyncio.gather(*tasks)
        
        # Assert performance criteria
        avg_time = sum(execution_times) / len(execution_times)
        assert avg_time < 300  # Average execution under 5 minutes
        assert max(execution_times) < 600  # No workflow over 10 minutes
    
    @pytest.mark.asyncio
    async def test_memory_usage_under_load(self):
        """Test memory usage during extended operation"""
        import psutil
        import os
        
        process = psutil.Process(os.getpid())
        initial_memory = process.memory_info().rss
        
        # Run multiple workflows
        supervisor = SupervisorAgent()
        for i in range(20):
            request = AgentInvocationRequest(
                project_id=f"memory-test-{i}",
                user_id="test-user",
                session_id=f"session-{i}",
                start=True
            )
            
            async for event in supervisor.execute_workflow(request):
                pass
        
        final_memory = process.memory_info().rss
        memory_increase = final_memory - initial_memory
        
        # Assert memory usage stays reasonable (less than 500MB increase)
        assert memory_increase < 500 * 1024 * 1024
```

## Deployment Configuration

### Local Development Setup

```python
# docker-compose.yml
version: '3.8'
services:
  agentcore-system:
    build: .
    ports:
      - "8000:8000"
    environment:
      - DATABASE_URL=postgresql://user:password@postgres:5432/bidops
      - AWS_REGION=us-east-1
      - BEDROCK_REGION=us-east-1
      - S3_BUCKET=bidops-local-dev
      - SLACK_BOT_TOKEN=${SLACK_BOT_TOKEN}
      - GMAIL_CREDENTIALS=${GMAIL_CREDENTIALS}
    depends_on:
      - postgres
      - redis
    volumes:
      - ./logs:/app/logs
  
  postgres:
    image: postgres:15
    environment:
      - POSTGRES_DB=bidops
      - POSTGRES_USER=user
      - POSTGRES_PASSWORD=password
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
  
  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"

volumes:
  postgres_data:
```

### Dockerfile

```dockerfile
FROM python:3.11-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    g++ \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install uv for Python package management
RUN pip install uv

# Copy requirements
COPY requirements.txt .
RUN uv pip install --system -r requirements.txt

# Copy application code
COPY . .

# Create non-root user
RUN useradd -m -u 1000 agentcore && chown -R agentcore:agentcore /app
USER agentcore

# Expose port
EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=30s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8000/health || exit 1

# Start application
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

### AWS AgentCore Deployment

```python
# deploy/agentcore_config.py
from typing import Dict, Any

AGENTCORE_CONFIG = {
    "runtime": {
        "type": "agentcore",
        "version": "1.0",
        "memory": "2048Mi",
        "cpu": "1000m",
        "timeout": "3600s"
    },
    "environment": {
        "DATABASE_URL": "${DATABASE_URL}",
        "AWS_REGION": "${AWS_REGION}",
        "BEDROCK_REGION": "${BEDROCK_REGION}",
        "S3_BUCKET": "${S3_BUCKET}",
        "SLACK_BOT_TOKEN": "${SLACK_BOT_TOKEN}",
        "GMAIL_CREDENTIALS": "${GMAIL_CREDENTIALS}"
    },
    "networking": {
        "vpc_config": {
            "subnet_ids": ["${SUBNET_ID_1}", "${SUBNET_ID_2}"],
            "security_group_ids": ["${SECURITY_GROUP_ID}"]
        }
    },
    "observability": {
        "logging": {
            "level": "INFO",
            "format": "json",
            "destination": "cloudwatch"
        },
        "metrics": {
            "enabled": True,
            "namespace": "BidOps/AgentCore"
        },
        "tracing": {
            "enabled": True,
            "service_name": "agentcore-agentic-system"
        }
    }
}
```

This comprehensive design covers all aspects of the AgentCore Agentic System, from the high-level architecture down to specific implementation details, error handling, testing strategies, and deployment configurations. The system is built to handle the complex workflow requirements while maintaining scalability, observability, and reliability.
##
 Strands Agents Graph Implementation

Based on your sequence diagram and Strands examples, here's the proper Graph implementation that follows your exact workflow:

### SupervisorAgent with Strands Graph

```python
from strands import Agent
from strands.multiagent import GraphBuilder
from strands.tools.mcp import MCPClient
from mcp import stdio_client, StdioServerParameters
import asyncio
import json
from typing import Dict, Any, AsyncGenerator

class SupervisorAgent:
    def __init__(self):
        self.graph = None
        self.mcp_clients = {}
        self.setup_mcp_connections()
        self.setup_specialized_agents()
        self.setup_agent_graph()
    
    def setup_mcp_connections(self):
        """Initialize MCP connections for all agents"""
        # PostgreSQL MCP client for database operations
        self.mcp_clients['postgres'] = MCPClient(
            lambda: stdio_client(StdioServerParameters(
                command="uvx",
                args=["postgres-mcp-server@latest"]
            ))
        )
        
        # Bedrock MCP client for document processing and knowledge bases
        self.mcp_clients['bedrock'] = MCPClient(
            lambda: stdio_client(StdioServerParameters(
                command="uvx",
                args=["bedrock-mcp-server@latest"]
            ))
        )
        
        # S3 MCP client for file operations
        self.mcp_clients['s3'] = MCPClient(
            lambda: stdio_client(StdioServerParameters(
                command="uvx",
                args=["s3-mcp-server@latest"]
            ))
        )
        
        # Slack MCP client for notifications
        self.mcp_clients['slack'] = MCPClient(
            lambda: stdio_client(StdioServerParameters(
                command="uvx",
                args=["slack-mcp-server@latest"]
            ))
        )
    
    def setup_specialized_agents(self):
        """Create all specialized agents with MCP tools"""
        with self.mcp_clients['postgres'], self.mcp_clients['bedrock'], \
             self.mcp_clients['s3'], self.mcp_clients['slack']:
            
            # Get MCP tools for each agent
            postgres_tools = self.mcp_clients['postgres'].list_tools_sync()
            bedrock_tools = self.mcp_clients['bedrock'].list_tools_sync()
            s3_tools = self.mcp_clients['s3'].list_tools_sync()
            slack_tools = self.mcp_clients['slack'].list_tools_sync()
            
            # Parser Agent
            self.parser_agent = Agent(
                name="parser",
                system_prompt="""You are a Parser Agent. Your role is to:
                1. Use postgres MCP tools to fetch ProjectDocuments with raw_file_location
                2. Use bedrock MCP tools to process documents with Bedrock Data Automation
                3. Use s3 MCP tools to save processed documents
                4. Use postgres MCP tools to update ProjectDocument with processed_file_location
                5. Use postgres MCP tools to update your AgentTask status and output_data
                
                Always update your task status: InProgress -> Completed/Failed""",
                tools=postgres_tools + bedrock_tools + s3_tools
            )
            
            # Analysis Agent
            self.analysis_agent = Agent(
                name="analysis",
                system_prompt="""You are an Analysis Agent. Your role is to:
                1. Use postgres MCP tools to fetch Parser output_data and processed documents
                2. Use s3 MCP tools to download processed documents
                3. Use bedrock MCP tools to query knowledge bases for context
                4. Generate structured analysis markdown with client info, stakeholders, requirements
                5. Use postgres MCP tools to update your AgentTask with results
                
                Output must include: Client details, Key stakeholders, Understanding the ask,
                Opportunity assessment, Process requirements, Document requirements, Deadlines""",
                tools=postgres_tools + bedrock_tools + s3_tools
            )
            
            # Knowledge Agent (used as tool by Content Agent)
            self.knowledge_agent = Agent(
                name="knowledge",
                system_prompt="""You are a Knowledge Agent tool. Your role is to:
                1. Use bedrock MCP tools to query Bedrock Knowledge Bases
                2. Retrieve historical bids, Q&A answers, and relevant content
                3. Return structured knowledge data for content generation""",
                tools=bedrock_tools
            )
            
            # Content Agent
            self.content_agent = Agent(
                name="content",
                system_prompt="""You are a Content Agent. Your role is to:
                1. Use postgres MCP tools to fetch Analysis output_data
                2. Use the Knowledge Agent tool to get historical data from knowledge bases
                3. Generate artifacts in TipTap JSON format (documents, Q&A, presentations)
                4. Use postgres MCP tools to insert Artifact and ArtifactVersion records
                5. Use postgres MCP tools to update your AgentTask with results
                
                Create artifacts with proper structure: type, category, title, content, tags""",
                tools=postgres_tools + [self.knowledge_agent]
            )
            
            # Compliance Agent
            self.compliance_agent = Agent(
                name="compliance",
                system_prompt="""You are a Compliance Agent. Your role is to:
                1. Use postgres MCP tools to fetch Artifacts and ArtifactVersions
                2. Review each artifact against Deloitte compliance standards
                3. Generate structured feedback with section-specific issues and suggestions
                4. Use postgres MCP tools to update your AgentTask with compliance results
                
                Provide detailed feedback with references and remediation suggestions""",
                tools=postgres_tools
            )
            
            # QA Agent
            self.qa_agent = Agent(
                name="qa",
                system_prompt="""You are a QA Agent. Your role is to:
                1. Use postgres MCP tools to fetch Artifacts and Analysis output
                2. Compare artifacts against client requirements from Analysis
                3. Identify missing artifacts and content gaps
                4. Generate structured QA feedback with overall status
                5. Use postgres MCP tools to update your AgentTask with QA results
                
                Provide comprehensive gap analysis and completion status""",
                tools=postgres_tools
            )
            
            # Comms Agent
            self.comms_agent = Agent(
                name="comms",
                system_prompt="""You are a Comms Agent. Your role is to:
                1. Use postgres MCP tools to fetch ProjectMembers and artifact locations
                2. Use slack MCP tools to create channels and send notifications
                3. Use postgres MCP tools to insert Notification records
                4. Use postgres MCP tools to update your AgentTask with results
                
                Create Slack channels and notify team members about project completion""",
                tools=postgres_tools + slack_tools
            )
            
            # Submission Agent
            self.submission_agent = Agent(
                name="submission",
                system_prompt="""You are a Submission Agent. Your role is to:
                1. Use postgres MCP tools to fetch Analysis output for client contact details
                2. Use postgres MCP tools to fetch artifact file locations
                3. Generate email draft with proper attachments
                4. Use gmail tool to send email with artifacts
                5. Use postgres MCP tools to update your AgentTask with results
                
                Generate professional email drafts and send final submissions""",
                tools=postgres_tools + [self.gmail_tool]  # Gmail tool separate from MCP
            )
    
    def setup_agent_graph(self):
        """Create the Strands Agents Graph with conditional edges and feedback loops"""
        builder = GraphBuilder()
        
        # Add all agents as nodes
        builder.add_node(self.parser_agent, "parser")
        builder.add_node(self.analysis_agent, "analysis")
        builder.add_node(self.content_agent, "content")
        builder.add_node(self.compliance_agent, "compliance")
        builder.add_node(self.qa_agent, "qa")
        builder.add_node(self.comms_agent, "comms")
        builder.add_node(self.submission_agent, "submission")
        
        # Define conditional edge functions based on your sequence diagram
        def parser_success(state):
            """Check if parser completed successfully"""
            parser_result = state.results.get("parser")
            if not parser_result or parser_result.status != "COMPLETED":
                return False
            return "error" not in str(parser_result.result).lower()
        
        def analysis_success(state):
            """Check if analysis completed successfully"""
            analysis_result = state.results.get("analysis")
            if not analysis_result or analysis_result.status != "COMPLETED":
                return False
            return "error" not in str(analysis_result.result).lower()
        
        def user_feedback_satisfied(state):
            """Check if user is satisfied with analysis"""
            # In real implementation, this would check user feedback from database
            # This is where supervisor would query database for user feedback
            return self.check_user_feedback_from_db(state)
        
        def compliance_passed(state):
            """Check if compliance standards are met"""
            compliance_result = state.results.get("compliance")
            if not compliance_result or compliance_result.status != "COMPLETED":
                return False
            result_text = str(compliance_result.result).lower()
            return "passed" in result_text or "compliant" in result_text
        
        def qa_passed(state):
            """Check if QA standards are met"""
            qa_result = state.results.get("qa")
            if not qa_result or qa_result.status != "COMPLETED":
                return False
            result_text = str(qa_result.result).lower()
            return "complete" in result_text or "passed" in result_text
        
        def user_approved_artifacts(state):
            """Check if user approved artifacts"""
            # In real implementation, this would check user approval from database
            return self.check_artifact_approval_from_db(state)
        
        def comms_permission_granted(state):
            """Check if user granted communications permission"""
            # In real implementation, this would check user permission from database
            return self.check_comms_permission_from_db(state)
        
        def submission_permission_granted(state):
            """Check if user granted submission permission"""
            # In real implementation, this would check user permission from database
            return self.check_submission_permission_from_db(state)
        
        # Define the workflow edges following your sequence diagram
        
        # Main workflow path
        builder.add_edge("parser", "analysis", condition=parser_success)
        builder.add_edge("analysis", "content", condition=user_feedback_satisfied)
        builder.add_edge("content", "compliance")
        builder.add_edge("compliance", "qa", condition=compliance_passed)
        builder.add_edge("qa", "comms", condition=lambda state: qa_passed(state) and user_approved_artifacts(state) and comms_permission_granted(state))
        builder.add_edge("comms", "submission", condition=submission_permission_granted)
        
        # Feedback loops for failures (following your sequence diagram)
        builder.add_edge("compliance", "content", condition=lambda state: not compliance_passed(state))
        builder.add_edge("qa", "content", condition=lambda state: not qa_passed(state))
        
        # User feedback loops (triggered by supervisor based on user input)
        builder.add_edge("analysis", "parser", condition=self.user_requests_reparse)
        builder.add_edge("analysis", "analysis", condition=self.user_requests_reanalysis)
        
        # Set entry point and safety limits
        builder.set_entry_point("parser")
        builder.set_max_node_executions(50)  # Prevent infinite loops
        builder.set_execution_timeout(3600)  # 1 hour timeout
        builder.reset_on_revisit(True)  # Reset state when revisiting nodes
        
        # Build the graph
        self.graph = builder.build()
    
    async def execute_workflow(self, request: AgentInvocationRequest) -> AsyncGenerator[str, None]:
        """Execute the workflow using Strands Agents Graph"""
        try:
            with self.mcp_clients['postgres'], self.mcp_clients['bedrock'], \
                 self.mcp_clients['s3'], self.mcp_clients['slack']:
                
                # Initialize workflow if starting
                if request.start:
                    await self.initialize_workflow_via_mcp(request)
                    yield self.create_sse_event("workflow_created", {"project_id": request.project_id})
                
                # Handle user input and feedback
                if request.user_input:
                    await self.process_user_feedback(request)
                
                # Execute the Strands Agents Graph
                task_description = f"Process project {request.project_id} for user {request.user_id}"
                
                # Run the graph asynchronously
                result = await self.graph.invoke_async(task_description)
                
                # Stream results based on execution order (following your sequence diagram events)
                for node in result.execution_order:
                    event_type = f"{node.node_id}_completed"
                    if node.status == "FAILED":
                        event_type = f"{node.node_id}_failed"
                    
                    yield self.create_sse_event(event_type, {
                        "node_id": node.node_id,
                        "status": node.status,
                        "execution_time": node.execution_time,
                        "result": str(node.result) if node.result else None
                    })
                    
                    # Handle special events from your sequence diagram
                    if node.node_id == "analysis" and node.status == "COMPLETED":
                        yield self.create_sse_event("awaiting_feedback", {
                            "project_id": request.project_id,
                            "analysis_result": str(node.result)
                        })
                    
                    if node.node_id == "qa" and node.status == "COMPLETED":
                        yield self.create_sse_event("artifacts_ready", {
                            "project_id": request.project_id
                        })
                        yield self.create_sse_event("awaiting_review", {
                            "project_id": request.project_id
                        })
                
                # Final workflow completion
                if result.status == "COMPLETED":
                    yield self.create_sse_event("workflow_completed", {
                        "project_id": request.project_id,
                        "total_nodes": result.total_nodes,
                        "execution_time": result.execution_time
                    })
                else:
                    yield self.create_sse_event("workflow_failed", {
                        "project_id": request.project_id,
                        "error": str(result.error) if hasattr(result, 'error') else "Unknown error"
                    })
                    
        except Exception as e:
            yield self.create_sse_event("workflow_failed", {"error": str(e)})
    
    async def initialize_workflow_via_mcp(self, request: AgentInvocationRequest):
        """Initialize workflow using MCP tools (following your sequence diagram)"""
        # Create WorkflowExecution record
        workflow_result = await self.mcp_clients['postgres'].call_tool_async(
            tool_use_id="create_workflow",
            name="postgres_insert",
            arguments={
                "table": "WorkflowExecution",
                "data": {
                    "project_id": request.project_id,
                    "status": "Open",
                    "initiated_by": request.user_id,
                    "handled_by": request.user_id,
                    "started_at": "NOW()",
                    "last_updated_at": "NOW()"
                }
            }
        )
        
        workflow_id = workflow_result["content"][0]["text"]
        
        # Create AgentTask records for all agents (following your sequence diagram)
        agent_types = ["PARSER", "ANALYSIS", "CONTENT", "COMPLIANCE", "QA", "COMMS", "SUBMISSION"]
        for i, agent_type in enumerate(agent_types):
            await self.mcp_clients['postgres'].call_tool_async(
                tool_use_id=f"create_task_{i}",
                name="postgres_insert",
                arguments={
                    "table": "AgentTask",
                    "data": {
                        "workflow_execution_id": workflow_id,
                        "agent": agent_type,
                        "status": "Open",
                        "sequence_order": i + 1,
                        "initiated_by": request.user_id,
                        "handled_by": request.user_id
                    }
                }
            )
    
    async def process_user_feedback(self, request: AgentInvocationRequest):
        """Process user feedback and update database accordingly"""
        if request.user_input.chat:
            # Analyze user feedback and determine if workflow needs to restart
            # Update database with user feedback and reset appropriate tasks
            pass
        
        if request.user_input.content_edits:
            # Handle user content edits and update artifacts
            # Reset content, compliance, and QA tasks if needed
            pass
    
    def check_user_feedback_from_db(self, state) -> bool:
        """Check user feedback from database"""
        # Query database for user feedback on analysis
        # Return True if user is satisfied, False if needs changes
        return True  # Placeholder
    
    def check_artifact_approval_from_db(self, state) -> bool:
        """Check if user approved artifacts"""
        # Query database for user artifact approval
        return True  # Placeholder
    
    def check_comms_permission_from_db(self, state) -> bool:
        """Check if user granted communications permission"""
        # Query database for user communications permission
        return True  # Placeholder
    
    def check_submission_permission_from_db(self, state) -> bool:
        """Check if user granted submission permission"""
        # Query database for user submission permission
        return True  # Placeholder
    
    def user_requests_reparse(self, state) -> bool:
        """Check if user feedback indicates parsing issues"""
        # This would be set by supervisor based on user feedback analysis
        return False  # Placeholder
    
    def user_requests_reanalysis(self, state) -> bool:
        """Check if user feedback indicates analysis issues"""
        # This would be set by supervisor based on user feedback analysis
        return False  # Placeholder
    
    def create_sse_event(self, event_type: str, data: Dict[str, Any]) -> str:
        """Create Server-Sent Event formatted string"""
        return f"event: {event_type}\ndata: {json.dumps(data)}\n\n"
```

### Key Features of This Strands Implementation

**1. Follows Your Sequence Diagram Exactly:**
- Supervisor creates WorkflowExecution and AgentTask records via MCP tools
- Each agent uses MCP tools for database and service operations
- Proper feedback loops and user interaction points
- All SSE events match your sequence diagram

**2. Strands Agents Graph Pattern:**
- Uses `GraphBuilder` with conditional edges for workflow control
- Implements feedback loops with `reset_on_revisit(True)`
- Safety limits prevent infinite loops
- Entry point starts with parser agent

**3. MCP Tool Integration:**
- Each agent gets appropriate MCP tools (PostgreSQL, Bedrock, S3, Slack)
- No direct database connections from FastAPI server
- Knowledge Agent used as tool by Content Agent
- Gmail tool for email sending

**4. Conditional Logic:**
- Success/failure conditions for each agent
- User feedback handling for analysis phase
- Compliance and QA feedback cycles
- Permission checks for communications and submission

**5. Real-time Updates:**
- SSE events stream to frontend following your sequence diagram
- Progress tracking and error handling
- User interaction points for feedback and approvals

This implementation leverages Strands Agents Graph capabilities while maintaining the exact workflow from your sequence diagram, ensuring proper agent orchestration with robust error handling and user feedback loops.

## Project Structure

### AgentCore System Folder Structure

```
agents-core/
├── src/
│   ├── main.py                          # FastAPI entry point
│   ├── config/
│   │   ├── __init__.py
│   │   ├── settings.py                  # Environment configuration
│   │   ├── mcp_config.py               # MCP client configurations
│   │   └── agent_config.py             # Agent configurations and prompts
│   ├── agents/
│   │   ├── __init__.py
│   │   ├── base/
│   │   │   ├── __init__.py
│   │   │   ├── base_agent.py           # Abstract base agent class
│   │   │   └── agent_factory.py        # Agent factory for creating configured agents
│   │   ├── specialized/
│   │   │   ├── __init__.py
│   │   │   ├── parser_agent.py         # Parser agent implementation
│   │   │   ├── analysis_agent.py       # Analysis agent implementation
│   │   │   ├── content_agent.py        # Content agent implementation
│   │   │   ├── knowledge_agent.py      # Knowledge agent implementation
│   │   │   ├── compliance_agent.py     # Compliance agent implementation
│   │   │   ├── qa_agent.py            # QA agent implementation
│   │   │   ├── comms_agent.py         # Communications agent implementation
│   │   │   └── submission_agent.py    # Submission agent implementation
│   │   └── supervisor/
│   │       ├── __init__.py
│   │       ├── supervisor_agent.py     # Main supervisor orchestrator
│   │       └── workflow_manager.py     # Workflow state management
│   ├── tools/
│   │   ├── __init__.py
│   │   ├── mcp/
│   │   │   ├── __init__.py
│   │   │   ├── mcp_manager.py          # MCP client manager
│   │   │   ├── postgres_tools.py       # PostgreSQL MCP tools
│   │   │   ├── bedrock_tools.py        # Bedrock MCP tools
│   │   │   ├── s3_tools.py             # S3 MCP tools
│   │   │   └── slack_tools.py          # Slack MCP tools
│   │   └── external/
│   │       ├── __init__.py
│   │       └── gmail_tool.py           # Gmail integration tool
│   ├── models/
│   │   ├── __init__.py
│   │   ├── workflow.py                 # Workflow data models
│   │   ├── agent_task.py              # Agent task models
│   │   └── artifacts.py               # Artifact models
│   ├── utils/
│   │   ├── __init__.py
│   │   ├── sse_events.py              # SSE event utilities
│   │   ├── database.py                # Database utilities
│   │   └── logging.py                 # Logging configuration
│   └── prompts/
│       ├── __init__.py
│       ├── bidops/                    # BidOps specific prompts
│       │   ├── parser_prompt.py
│       │   ├── analysis_prompt.py
│       │   ├── content_prompt.py
│       │   ├── knowledge_prompt.py
│       │   ├── compliance_prompt.py
│       │   ├── qa_prompt.py
│       │   ├── comms_prompt.py
│       │   └── submission_prompt.py
│       └── templates/                 # Reusable prompt templates
│           ├── base_prompts.py
│           └── common_instructions.py
├── tests/
│   ├── __init__.py
│   ├── unit/
│   │   ├── test_agents/
│   │   ├── test_tools/
│   │   └── test_models/
│   ├── integration/
│   │   ├── test_workflow/
│   │   └── test_mcp/
│   └── fixtures/
│       ├── sample_data.py
│       └── mock_responses.py
├── docker/
│   ├── Dockerfile
│   ├── docker-compose.yml
│   └── docker-compose.dev.yml
├── scripts/
│   ├── setup.sh
│   ├── deploy.sh
│   └── test.sh
├── requirements.txt
├── pyproject.toml
├── README.md
└── .env.example
```

## Refactored Reusable Agent Architecture

### Base Agent Framework

```python
# src/agents/base/base_agent.py
from abc import ABC, abstractmethod
from typing import List, Dict, Any, Optional
from strands import Agent
from strands.tools.mcp import MCPClient

class BaseSpecializedAgent(ABC):
    """Abstract base class for all specialized agents"""
    
    def __init__(self, agent_name: str, config: Dict[str, Any]):
        self.agent_name = agent_name
        self.config = config
        self.agent = None
        self.mcp_tools = []
        self.setup_agent()
    
    @abstractmethod
    def get_required_mcp_clients(self) -> List[str]:
        """Return list of required MCP client names"""
        pass
    
    @abstractmethod
    def get_additional_tools(self) -> List[Any]:
        """Return list of additional non-MCP tools"""
        pass
    
    def setup_agent(self):
        """Initialize the Strands agent with configuration"""
        system_prompt = self.config.get('system_prompt', '')
        tools = self.get_all_tools()
        
        self.agent = Agent(
            name=self.agent_name,
            system_prompt=system_prompt,
            tools=tools,
            **self.config.get('agent_params', {})
        )
    
    def get_all_tools(self) -> List[Any]:
        """Combine MCP tools and additional tools"""
        tools = []
        
        # Add MCP tools
        for client_name in self.get_required_mcp_clients():
            mcp_client = self.config['mcp_clients'].get(client_name)
            if mcp_client:
                with mcp_client:
                    tools.extend(mcp_client.list_tools_sync())
        
        # Add additional tools
        tools.extend(self.get_additional_tools())
        
        return tools
    
    async def execute(self, task_input: Dict[str, Any]) -> Dict[str, Any]:
        """Execute the agent task"""
        try:
            result = await self.agent.invoke_async(task_input["task_description"])
            
            return {
                "status": "success",
                "result": result,
                "agent_name": self.agent_name
            }
            
        except Exception as e:
            return {
                "status": "error",
                "error": str(e),
                "agent_name": self.agent_name
            }
```

### Agent Factory

```python
# src/agents/base/agent_factory.py
from typing import Dict, Any, Type
from .base_agent import BaseSpecializedAgent
from ..specialized.parser_agent import ParserAgent
from ..specialized.analysis_agent import AnalysisAgent
from ..specialized.content_agent import ContentAgent
from ..specialized.knowledge_agent import KnowledgeAgent
from ..specialized.compliance_agent import ComplianceAgent
from ..specialized.qa_agent import QAAgent
from ..specialized.comms_agent import CommsAgent
from ..specialized.submission_agent import SubmissionAgent

class AgentFactory:
    """Factory for creating configured agents"""
    
    AGENT_REGISTRY: Dict[str, Type[BaseSpecializedAgent]] = {
        'parser': ParserAgent,
        'analysis': AnalysisAgent,
        'content': ContentAgent,
        'knowledge': KnowledgeAgent,
        'compliance': ComplianceAgent,
        'qa': QAAgent,
        'comms': CommsAgent,
        'submission': SubmissionAgent
    }
    
    @classmethod
    def create_agent(cls, agent_type: str, config: Dict[str, Any]) -> BaseSpecializedAgent:
        """Create an agent with the specified configuration"""
        if agent_type not in cls.AGENT_REGISTRY:
            raise ValueError(f"Unknown agent type: {agent_type}")
        
        agent_class = cls.AGENT_REGISTRY[agent_type]
        return agent_class(agent_type, config)
    
    @classmethod
    def create_agents_from_config(cls, agents_config: Dict[str, Dict[str, Any]]) -> Dict[str, BaseSpecializedAgent]:
        """Create multiple agents from configuration"""
        agents = {}
        
        for agent_type, config in agents_config.items():
            agents[agent_type] = cls.create_agent(agent_type, config)
        
        return agents
```

### Configuration Management

```python
# src/config/agent_config.py
from typing import Dict, Any
from ..prompts.bidops import (
    parser_prompt, analysis_prompt, content_prompt, knowledge_prompt,
    compliance_prompt, qa_prompt, comms_prompt, submission_prompt
)

class AgentConfigManager:
    """Manages agent configurations for different use cases"""
    
    @staticmethod
    def get_bidops_config(mcp_clients: Dict[str, Any]) -> Dict[str, Dict[str, Any]]:
        """Get configuration for BidOps workflow agents"""
        return {
            'parser': {
                'system_prompt': parser_prompt.get_system_prompt(),
                'mcp_clients': mcp_clients,
                'agent_params': {
                    'temperature': 0.1,
                    'max_tokens': 4000
                }
            },
            'analysis': {
                'system_prompt': analysis_prompt.get_system_prompt(),
                'mcp_clients': mcp_clients,
                'agent_params': {
                    'temperature': 0.3,
                    'max_tokens': 6000
                }
            },
            'content': {
                'system_prompt': content_prompt.get_system_prompt(),
                'mcp_clients': mcp_clients,
                'agent_params': {
                    'temperature': 0.5,
                    'max_tokens': 8000
                }
            },
            'knowledge': {
                'system_prompt': knowledge_prompt.get_system_prompt(),
                'mcp_clients': mcp_clients,
                'agent_params': {
                    'temperature': 0.2,
                    'max_tokens': 4000
                }
            },
            'compliance': {
                'system_prompt': compliance_prompt.get_system_prompt(),
                'mcp_clients': mcp_clients,
                'agent_params': {
                    'temperature': 0.1,
                    'max_tokens': 6000
                }
            },
            'qa': {
                'system_prompt': qa_prompt.get_system_prompt(),
                'mcp_clients': mcp_clients,
                'agent_params': {
                    'temperature': 0.2,
                    'max_tokens': 6000
                }
            },
            'comms': {
                'system_prompt': comms_prompt.get_system_prompt(),
                'mcp_clients': mcp_clients,
                'agent_params': {
                    'temperature': 0.3,
                    'max_tokens': 3000
                }
            },
            'submission': {
                'system_prompt': submission_prompt.get_system_prompt(),
                'mcp_clients': mcp_clients,
                'agent_params': {
                    'temperature': 0.2,
                    'max_tokens': 4000
                }
            }
        }
    
    @staticmethod
    def get_custom_config(use_case: str, mcp_clients: Dict[str, Any]) -> Dict[str, Dict[str, Any]]:
        """Get configuration for custom use cases"""
        # This allows for future use cases with different configurations
        if use_case == "bidops":
            return AgentConfigManager.get_bidops_config(mcp_clients)
        elif use_case == "hr_automation":
            return AgentConfigManager.get_hr_config(mcp_clients)
        elif use_case == "legal_review":
            return AgentConfigManager.get_legal_config(mcp_clients)
        else:
            raise ValueError(f"Unknown use case: {use_case}")
```

### MCP Manager

```python
# src/tools/mcp/mcp_manager.py
from typing import Dict, List
from strands.tools.mcp import MCPClient
from mcp import stdio_client, StdioServerParameters

class MCPManager:
    """Manages MCP client connections"""
    
    def __init__(self, config: Dict[str, Dict[str, Any]]):
        self.config = config
        self.clients: Dict[str, MCPClient] = {}
        self.setup_clients()
    
    def setup_clients(self):
        """Initialize all MCP clients from configuration"""
        for client_name, client_config in self.config.items():
            self.clients[client_name] = MCPClient(
                lambda cfg=client_config: stdio_client(
                    StdioServerParameters(
                        command=cfg['command'],
                        args=cfg['args']
                    )
                )
            )
    
    def get_client(self, client_name: str) -> MCPClient:
        """Get a specific MCP client"""
        if client_name not in self.clients:
            raise ValueError(f"MCP client '{client_name}' not found")
        return self.clients[client_name]
    
    def get_clients(self, client_names: List[str]) -> Dict[str, MCPClient]:
        """Get multiple MCP clients"""
        return {name: self.get_client(name) for name in client_names}
    
    def get_all_clients(self) -> Dict[str, MCPClient]:
        """Get all MCP clients"""
        return self.clients.copy()
```

### Specialized Agent Implementation Example

```python
# src/agents/specialized/parser_agent.py
from typing import List, Dict, Any
from ..base.base_agent import BaseSpecializedAgent

class ParserAgent(BaseSpecializedAgent):
    """Parser agent for document processing"""
    
    def get_required_mcp_clients(self) -> List[str]:
        """Parser needs PostgreSQL, Bedrock, and S3 MCP clients"""
        return ['postgres', 'bedrock', 's3']
    
    def get_additional_tools(self) -> List[Any]:
        """Parser doesn't need additional non-MCP tools"""
        return []

# src/agents/specialized/content_agent.py
from typing import List, Dict, Any
from ..base.base_agent import BaseSpecializedAgent

class ContentAgent(BaseSpecializedAgent):
    """Content agent for artifact generation"""
    
    def get_required_mcp_clients(self) -> List[str]:
        """Content needs PostgreSQL and S3 MCP clients"""
        return ['postgres', 's3']
    
    def get_additional_tools(self) -> List[Any]:
        """Content agent uses Knowledge agent as a tool"""
        knowledge_agent = self.config.get('knowledge_agent')
        return [knowledge_agent] if knowledge_agent else []
```

### Prompt Management

```python
# src/prompts/bidops/parser_prompt.py
def get_system_prompt() -> str:
    return """You are a Parser Agent specialized in document processing for bid automation.

Your role is to:
1. Use postgres MCP tools to fetch ProjectDocuments with raw_file_location
2. Use bedrock MCP tools to process documents with Bedrock Data Automation
3. Use s3 MCP tools to save processed documents
4. Use postgres MCP tools to update ProjectDocument with processed_file_location
5. Use postgres MCP tools to update your AgentTask status and output_data

Always update your task status: InProgress -> Completed/Failed

Available MCP Tools:
- postgres_query: Query database tables
- postgres_insert: Insert new records
- postgres_update: Update existing records
- bedrock_data_automation: Process documents
- s3_upload: Upload files to S3
- s3_download: Download files from S3"""

# src/prompts/templates/base_prompts.py
def get_base_agent_instructions() -> str:
    return """
CRITICAL INSTRUCTIONS:
1. You must ONLY use the provided MCP tools for ALL database and AWS operations
2. Never attempt direct database connections or AWS SDK calls
3. Always update your AgentTask record with progress and results
4. Handle errors gracefully and update task status accordingly
5. Provide structured output in the specified format
"""

def get_mcp_usage_guidelines() -> str:
    return """
MCP TOOL USAGE GUIDELINES:
- Use postgres_query to retrieve data from database tables
- Use postgres_update to update records with results and status
- Use postgres_insert to create new records when needed
- Always include proper error handling in your tool calls
- Update task status before starting (InProgress) and after completion (Completed/Failed)
"""
```

### Refactored Supervisor Agent

```python
# src/agents/supervisor/supervisor_agent.py
from strands.multiagent import GraphBuilder
from ..base.agent_factory import AgentFactory
from ...config.agent_config import AgentConfigManager
from ...tools.mcp.mcp_manager import MCPManager

class SupervisorAgent:
    """Reusable supervisor agent for workflow orchestration"""
    
    def __init__(self, use_case: str = "bidops", mcp_config: Dict[str, Any] = None):
        self.use_case = use_case
        self.mcp_manager = MCPManager(mcp_config or self.get_default_mcp_config())
        self.agents = {}
        self.graph = None
        self.setup_workflow()
    
    def setup_workflow(self):
        """Setup the workflow for the specified use case"""
        # Get agent configurations for the use case
        mcp_clients = self.mcp_manager.get_all_clients()
        agent_configs = AgentConfigManager.get_custom_config(self.use_case, mcp_clients)
        
        # Create agents using factory
        self.agents = AgentFactory.create_agents_from_config(agent_configs)
        
        # Setup graph based on use case
        if self.use_case == "bidops":
            self.setup_bidops_graph()
        else:
            self.setup_custom_graph()
    
    def setup_bidops_graph(self):
        """Setup the BidOps specific workflow graph"""
        builder = GraphBuilder()
        
        # Add agents as nodes
        for agent_name, agent in self.agents.items():
            builder.add_node(agent, agent_name)
        
        # Define BidOps specific workflow edges
        self.add_bidops_workflow_edges(builder)
        
        # Set safety limits
        builder.set_max_node_executions(50)
        builder.set_execution_timeout(3600)
        builder.reset_on_revisit(True)
        builder.set_entry_point("parser")
        
        self.graph = builder.build()
    
    def add_bidops_workflow_edges(self, builder: GraphBuilder):
        """Add BidOps specific workflow edges"""
        # Main workflow path
        builder.add_edge("parser", "analysis", condition=self.parser_success)
        builder.add_edge("analysis", "content", condition=self.user_feedback_satisfied)
        builder.add_edge("content", "compliance")
        builder.add_edge("compliance", "qa", condition=self.compliance_passed)
        builder.add_edge("qa", "comms", condition=self.qa_and_artifacts_approved)
        builder.add_edge("comms", "submission", condition=self.submission_permission_granted)
        
        # Feedback loops
        builder.add_edge("compliance", "content", condition=lambda state: not self.compliance_passed(state))
        builder.add_edge("qa", "content", condition=lambda state: not self.qa_passed(state))
        
        # User feedback loops
        builder.add_edge("analysis", "parser", condition=self.user_requests_reparse)
        builder.add_edge("analysis", "analysis", condition=self.user_requests_reanalysis)
    
    def get_default_mcp_config(self) -> Dict[str, Dict[str, Any]]:
        """Get default MCP configuration"""
        return {
            'postgres': {
                'command': 'uvx',
                'args': ['postgres-mcp-server@latest']
            },
            'bedrock': {
                'command': 'uvx',
                'args': ['bedrock-mcp-server@latest']
            },
            's3': {
                'command': 'uvx',
                'args': ['s3-mcp-server@latest']
            },
            'slack': {
                'command': 'uvx',
                'args': ['slack-mcp-server@latest']
            }
        }
    
    # Conditional functions remain the same...
```

### Benefits of This Refactored Architecture

**1. Reusability:**
- Agents can be used for different use cases (BidOps, HR automation, legal review)
- System prompts are externalized and configurable
- MCP tools are managed centrally and reusable

**2. Maintainability:**
- Clear separation of concerns
- Configuration-driven approach
- Easy to add new agents or modify existing ones

**3. Flexibility:**
- Support for multiple use cases
- Easy to swap MCP clients or add new tools
- Configurable agent parameters (temperature, max_tokens)

**4. Testability:**
- Each component can be tested independently
- Mock configurations for testing
- Clear interfaces between components

This architecture allows the same agent framework to be used for BidOps, HR automation, legal document review, or any other multi-agent workflow by simply changing the configuration and prompts.
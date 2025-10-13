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
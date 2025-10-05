---
inclusion: fileMatch
fileMatchPattern: 'agents-core/**/*'
---

# Agent Core Development Standards

## Strands Agents Framework Standards

### Agent Implementation
- Use `strands.Agent` as the base for all agent implementations
- Implement agents with clear, focused system prompts
- Use MCP tools for all external service integrations
- Follow the BaseSpecializedAgent pattern for consistency

### Multi-Agent Patterns
- Use `strands.multiagent.GraphBuilder` for workflow orchestration
- Implement conditional edges for dynamic workflow control
- Use `reset_on_revisit(True)` for feedback loops
- Set proper safety limits (`set_max_node_executions`, `set_execution_timeout`)

### MCP Integration
- Use `strands.tools.mcp.MCPClient` for all MCP connections
- Always use context managers (`with` statements) for MCP clients
- Implement proper error handling for MCP tool calls
- Use `stdio_client` with `uvx` commands for MCP server connections

### System Prompt Guidelines
- Keep prompts focused and specific to agent responsibilities
- Include clear MCP tool usage instructions
- Specify expected input/output formats
- Add error handling instructions

## BidOps Specific Standards

### Agent Responsibilities
- **Parser Agent**: Document processing via Bedrock Data Automation
- **Analysis Agent**: RFP analysis and requirement extraction
- **Content Agent**: Artifact generation using Knowledge Agent
- **Knowledge Agent**: Bedrock Knowledge Base queries (used as tool)
- **Compliance Agent**: Standards checking against Deloitte requirements
- **QA Agent**: Quality assurance and gap analysis
- **Comms Agent**: Slack notifications and team communication
- **Submission Agent**: Email generation and client submission

### Database Operations
- All database operations must use PostgreSQL MCP tools
- Update AgentTask status: Open → InProgress → Completed/Failed
- Track user assignments: initiated_by, handled_by, completed_by
- Store structured output in output_data JSON field

### Workflow State Management
- Supervisor agent manages all workflow state transitions
- Use WorkflowExecution table for overall workflow status
- Use AgentTask table for individual agent progress
- Implement proper error logging in error_message and error_log fields

### Artifact Generation
- Generate artifacts in TipTap JSON format for frontend compatibility
- Support artifact types: worddoc, pdf, ppt, excel
- Support categories: document, q_and_a, excel
- Include proper metadata: created_at, created_by, tags

### Error Handling
- Implement comprehensive error recovery for all agents
- Update database with error details when failures occur
- Send appropriate SSE error events to frontend
- Support workflow restart from appropriate points

### SSE Event Standards
- Follow the 34 event types from the sequence diagram
- Use proper event formatting: `event: {type}\ndata: {json}\n\n`
- Include relevant context data in each event
- Handle error events with detailed information

## Code Organization

### Module Structure
```
src/
├── agents/          # Agent implementations
├── tools/           # MCP tools and external integrations
├── config/          # Configuration management
├── models/          # Data models and validation
├── utils/           # Utility functions
└── prompts/         # System prompts and templates
```

### Import Standards
```python
# External libraries first
from strands import Agent
from strands.multiagent import GraphBuilder
from strands.tools.mcp import MCPClient

# Internal imports
from ..base.base_agent import BaseSpecializedAgent
from ...config.agent_config import AgentConfigManager
from ...tools.mcp.mcp_manager import MCPManager
```

### Configuration Pattern
- Use configuration-driven agent creation
- Support multiple use cases through config
- Externalize all system prompts
- Make MCP client connections configurable

## Testing Standards

### Unit Testing
- Test each agent independently with mocked MCP clients
- Validate system prompt generation and tool assignment
- Test error handling and result formatting
- Use pytest with async support

### Integration Testing
- Test complete workflow execution with mocked services
- Validate agent handoffs and state transitions
- Test feedback loops and error recovery
- Use real MCP servers where possible

### Performance Testing
- Test concurrent workflow execution
- Validate memory usage under load
- Test execution time limits and safety mechanisms
- Monitor resource usage during extended operation

## Deployment Standards

### Local Development
- Use Docker Compose for local development environment
- Include PostgreSQL, Redis, and mock services
- Support hot reloading for development
- Provide clear setup instructions

### Production Deployment
- Use multi-stage Dockerfile for optimized images
- Support AWS AgentCore runtime deployment
- Include proper health checks and monitoring
- Use environment-specific configurations

### Security
- Use non-root user in containers
- Implement proper secret management
- Validate all inputs and sanitize outputs
- Follow AWS security best practices
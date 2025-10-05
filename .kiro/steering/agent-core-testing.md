---
inclusion: fileMatch
fileMatchPattern: 'agents-core/tests/**/*'
---

# Agent Core Testing Standards

## Testing Framework

### Primary Testing Tools
- **pytest**: Main testing framework with async support
- **pytest-asyncio**: For testing async agent operations
- **unittest.mock**: For mocking MCP clients and external services
- **strands-agents-test-utils**: Strands-specific testing utilities (if available)

### Test Structure
```
tests/
├── unit/                    # Unit tests for individual components
│   ├── test_agents/         # Agent-specific tests
│   ├── test_tools/          # MCP tool tests
│   ├── test_config/         # Configuration tests
│   └── test_models/         # Data model tests
├── integration/             # Integration tests
│   ├── test_workflow/       # Complete workflow tests
│   ├── test_mcp/           # MCP integration tests
│   └── test_api/           # FastAPI endpoint tests
├── performance/             # Performance and load tests
│   ├── test_concurrent/     # Concurrent execution tests
│   └── test_memory/        # Memory usage tests
└── fixtures/               # Test data and mocks
    ├── sample_data.py      # Sample workflow data
    ├── mock_responses.py   # Mock MCP responses
    └── test_configs.py     # Test configurations
```

## Agent Testing Standards

### Unit Testing Agents
```python
import pytest
from unittest.mock import Mock, AsyncMock, patch
from src.agents.specialized.parser_agent import ParserAgent
from src.config.agent_config import AgentConfigManager

class TestParserAgent:
    @pytest.fixture
    def mock_mcp_clients(self):
        return {
            'postgres': Mock(),
            'bedrock': Mock(),
            's3': Mock()
        }
    
    @pytest.fixture
    def parser_config(self, mock_mcp_clients):
        return AgentConfigManager.get_bidops_config(mock_mcp_clients)['parser']
    
    @pytest.fixture
    def parser_agent(self, parser_config):
        return ParserAgent('parser', parser_config)
    
    @pytest.mark.asyncio
    async def test_parser_execution_success(self, parser_agent, mock_mcp_clients):
        """Test successful parser agent execution"""
        # Mock MCP tool responses
        mock_mcp_clients['postgres'].call_tool_async = AsyncMock(
            return_value={"content": [{"text": "project_documents_data"}]}
        )
        mock_mcp_clients['bedrock'].call_tool_async = AsyncMock(
            return_value={"content": [{"text": "processed_successfully"}]}
        )
        
        task_input = {
            "task_description": "Parse documents for project test-123",
            "project_id": "test-123"
        }
        
        result = await parser_agent.execute(task_input)
        
        assert result["status"] == "success"
        assert result["agent_name"] == "parser"
        assert mock_mcp_clients['postgres'].call_tool_async.called
        assert mock_mcp_clients['bedrock'].call_tool_async.called
    
    @pytest.mark.asyncio
    async def test_parser_execution_failure(self, parser_agent, mock_mcp_clients):
        """Test parser agent error handling"""
        # Mock MCP tool failure
        mock_mcp_clients['postgres'].call_tool_async = AsyncMock(
            side_effect=Exception("Database connection failed")
        )
        
        task_input = {
            "task_description": "Parse documents for project test-123",
            "project_id": "test-123"
        }
        
        result = await parser_agent.execute(task_input)
        
        assert result["status"] == "error"
        assert "Database connection failed" in result["error"]
```

### Integration Testing Workflows
```python
import pytest
from unittest.mock import Mock, AsyncMock, patch
from src.agents.supervisor.supervisor_agent import SupervisorAgent
from src.models.workflow import AgentInvocationRequest

class TestWorkflowIntegration:
    @pytest.fixture
    def supervisor_agent(self):
        return SupervisorAgent(use_case="bidops")
    
    @pytest.fixture
    def sample_request(self):
        return AgentInvocationRequest(
            project_id="test-project-123",
            user_id="test-user-456",
            session_id="test-session-789",
            start=True
        )
    
    @pytest.mark.asyncio
    async def test_complete_workflow_execution(self, supervisor_agent, sample_request):
        """Test complete workflow from parser to submission"""
        with patch.object(supervisor_agent, 'mcp_manager') as mock_mcp:
            # Mock all MCP client responses
            mock_mcp.get_client.return_value.call_tool_async = AsyncMock(
                return_value={"content": [{"text": "success"}]}
            )
            
            events = []
            async for event in supervisor_agent.execute_workflow(sample_request):
                events.append(event)
            
            # Validate workflow events
            assert any("workflow_created" in event for event in events)
            assert any("parser_completed" in event for event in events)
            assert any("analysis_completed" in event for event in events)
            assert any("workflow_completed" in event for event in events)
    
    @pytest.mark.asyncio
    async def test_feedback_loop_handling(self, supervisor_agent):
        """Test user feedback loops and workflow restarts"""
        # Test analysis feedback requiring parser restart
        request_with_feedback = AgentInvocationRequest(
            project_id="test-project",
            user_id="test-user",
            session_id="test-session",
            start=False,
            user_input={
                "chat": "The parsing seems incorrect, please reparse the documents"
            }
        )
        
        with patch.object(supervisor_agent, 'process_user_feedback') as mock_feedback:
            mock_feedback.return_value = {"restart_from": "parser"}
            
            events = []
            async for event in supervisor_agent.execute_workflow(request_with_feedback):
                events.append(event)
            
            # Validate feedback handling
            mock_feedback.assert_called_once()
            assert any("parser_started" in event for event in events)
```

### MCP Tool Testing
```python
import pytest
from unittest.mock import Mock, AsyncMock
from src.tools.mcp.mcp_manager import MCPManager
from src.tools.mcp.postgres_tools import PostgreSQLMCPTools

class TestMCPIntegration:
    @pytest.fixture
    def mcp_config(self):
        return {
            'postgres': {
                'command': 'uvx',
                'args': ['postgres-mcp-server@latest']
            }
        }
    
    @pytest.fixture
    def mcp_manager(self, mcp_config):
        return MCPManager(mcp_config)
    
    def test_mcp_client_creation(self, mcp_manager):
        """Test MCP client initialization"""
        postgres_client = mcp_manager.get_client('postgres')
        assert postgres_client is not None
        
        all_clients = mcp_manager.get_all_clients()
        assert 'postgres' in all_clients
    
    @pytest.mark.asyncio
    async def test_postgres_mcp_operations(self, mcp_manager):
        """Test PostgreSQL MCP tool operations"""
        postgres_client = mcp_manager.get_client('postgres')
        
        with patch.object(postgres_client, 'call_tool_async') as mock_call:
            mock_call.return_value = {"content": [{"text": "workflow-id-123"}]}
            
            # Test workflow creation
            result = await postgres_client.call_tool_async(
                tool_use_id="test_create",
                name="postgres_insert",
                arguments={
                    "table": "WorkflowExecution",
                    "data": {"project_id": "test-123", "status": "Open"}
                }
            )
            
            assert result["content"][0]["text"] == "workflow-id-123"
            mock_call.assert_called_once()
```

### Performance Testing
```python
import pytest
import asyncio
import time
import psutil
import os
from src.agents.supervisor.supervisor_agent import SupervisorAgent

class TestPerformance:
    @pytest.mark.asyncio
    async def test_concurrent_workflow_execution(self):
        """Test system performance under concurrent load"""
        supervisor = SupervisorAgent(use_case="bidops")
        
        async def run_single_workflow(project_id: str):
            request = AgentInvocationRequest(
                project_id=project_id,
                user_id="test-user",
                session_id=f"session-{project_id}",
                start=True
            )
            
            start_time = time.time()
            events = []
            async for event in supervisor.execute_workflow(request):
                events.append(event)
            end_time = time.time()
            
            return {
                "execution_time": end_time - start_time,
                "event_count": len(events),
                "project_id": project_id
            }
        
        # Run 10 concurrent workflows
        tasks = [run_single_workflow(f"project-{i}") for i in range(10)]
        results = await asyncio.gather(*tasks)
        
        # Performance assertions
        execution_times = [r["execution_time"] for r in results]
        avg_time = sum(execution_times) / len(execution_times)
        
        assert avg_time < 300, f"Average execution time {avg_time}s exceeds 5 minutes"
        assert max(execution_times) < 600, f"Max execution time exceeds 10 minutes"
        assert all(r["event_count"] > 0 for r in results), "All workflows should generate events"
    
    @pytest.mark.asyncio
    async def test_memory_usage_stability(self):
        """Test memory usage during extended operation"""
        process = psutil.Process(os.getpid())
        initial_memory = process.memory_info().rss
        
        supervisor = SupervisorAgent(use_case="bidops")
        
        # Run multiple workflows sequentially
        for i in range(20):
            request = AgentInvocationRequest(
                project_id=f"memory-test-{i}",
                user_id="test-user",
                session_id=f"session-{i}",
                start=True
            )
            
            async for event in supervisor.execute_workflow(request):
                pass  # Consume all events
        
        final_memory = process.memory_info().rss
        memory_increase = final_memory - initial_memory
        
        # Memory usage should not increase by more than 500MB
        assert memory_increase < 500 * 1024 * 1024, f"Memory increased by {memory_increase / 1024 / 1024:.2f}MB"
```

## Testing Best Practices

### Mock Strategy
- Mock MCP clients at the MCPManager level
- Use AsyncMock for async MCP tool calls
- Create realistic mock responses based on actual MCP server behavior
- Mock external services (Bedrock, S3, Slack, Gmail) consistently

### Test Data Management
- Use fixtures for common test data
- Create sample RFP documents and expected outputs
- Mock database records with realistic UUIDs and timestamps
- Provide sample artifact content in TipTap JSON format

### Error Testing
- Test all error scenarios for each agent
- Validate error propagation through the workflow
- Test recovery mechanisms and workflow restarts
- Ensure proper error logging and SSE event generation

### Async Testing
- Use `pytest.mark.asyncio` for all async tests
- Test concurrent operations and race conditions
- Validate proper cleanup of async resources
- Test timeout handling and cancellation

## Continuous Integration

### Test Execution
- Run unit tests on every commit
- Run integration tests on pull requests
- Run performance tests on release candidates
- Generate test coverage reports

### Quality Gates
- Minimum 80% test coverage for core components
- All tests must pass before merging
- Performance tests must meet defined thresholds
- No critical security vulnerabilities

### Test Environment
- Use containerized test environment
- Mock external AWS services for CI/CD
- Use test databases with proper isolation
- Clean up test data after each test run
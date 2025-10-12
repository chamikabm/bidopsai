# Design Document

## Overview

This document outlines the technical design for bidops.ai, a cutting-edge AI-powered bid automation platform built with Next.js 15, React 19, and TypeScript. The application features a futuristic interface that combines modern web technologies with AWS services to create an end-to-end bid preparation workflow orchestrated by AI agents.

The system architecture follows a Backend-for-Frontend (BFF) pattern using Next.js API routes to securely handle sensitive operations, while the frontend provides a responsive, real-time interface for users to interact with AI agents through a chat-based workflow.


# High-Level Architecture

```mermaid
graph TB
    subgraph "Frontend Layer"
        UI[Next.js 15 App Router]
        Auth[Custom Cognito Auth Forms]
        Chat[Real-time Chat Interface]
        Artifacts[Artifact Editors]
    end
    
    subgraph "BFF Layer"
        AuthAPI[API Auth Routes]
        GraphQLAPI[API GraphQL Routes]
        AgentAPI[API Agent Routes]
    end
    
    subgraph "AWS Services"
        Cognito[AWS Cognito]
        S3[S3 Storage]
        AgentCore[AWS AgentCore]
    end
    
    subgraph "Backend Services"
        CoreAPI[GraphQL API]
        DB[(PostgreSQL)]
    end
    
    UI --> AuthAPI
    UI --> GraphQLAPI
    UI --> AgentAPI
    
    AuthAPI --> Cognito
    GraphQLAPI --> CoreAPI
    AgentAPI --> AgentCore
    
    CoreAPI --> DB
    AgentCore --> DB
    
    UI -.->|Direct Upload| S3
    AgentCore --> S3
```

# State Management Architecture

```mermaid
graph LR
    subgraph "Client State (Zustand)"
        UI[UI Preferences]
        Drafts[Artifact Drafts]
        Theme[Theme Settings]
    end
    
    subgraph "Server State (TanStack Query)"
        Projects[Projects Data]
        Users[Users Data]
        Artifacts[Artifacts Data]
        Workflow[Workflow State]
    end
    
    subgraph "Form State (React Hook Form)"
        Forms[Form Inputs]
        Validation[Zod Validation]
    end
    
    subgraph "Component State (useState)"
        Modals[Modal States]
        Loading[Loading States]
    end
```

# SSE Architecture Overview

The application implements a sophisticated Server-Sent Events (SSE) system to handle real-time communication between the AI agents and the frontend interface. This design ensures users receive immediate feedback during the complex multi-agent workflow.

```mermaid
sequenceDiagram
    participant UI as Frontend UI
    participant API as Next.js API Route
    participant AC as AgentCore
    participant SA as Supervisor Agent
    participant TQ as TanStack Query
    participant ZS as Zustand Store

    UI->>API: POST /api/workflow-agents/invocations
    API->>AC: POST /invocations (with auth)
    AC->>SA: Initialize workflow
    
    loop Agent Processing
        SA->>AC: Send SSE event
        AC->>API: Stream SSE event
        API->>UI: Forward SSE event
        UI->>TQ: Update server state cache
        UI->>ZS: Update UI-specific state (progress, drafts)
        UI->>UI: Update progress bar & chat
    end
    
    Note over UI,ZS: Real-time UI updates without polling
```

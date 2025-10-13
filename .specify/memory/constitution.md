# BidOps.AI Constitution
<!-- Example: Spec Constitution, TaskFlow Constitution, etc. -->

## Core Principles

### Code Quality
<!-- Example: I. Library-First -->
All code must be self‑contained, test‑first, and documented. Libraries should be independent modules that expose a clear API.
<!-- Example: Every feature starts as a standalone library; Libraries must be self-contained, independently testable, documented; Clear purpose required - no organizational-only libraries -->

### CLI Interface
<!-- Example: II. CLI Interface -->
All functionality must be exposed through a CLI using stdin/stdout/stderr patterns. Binary or JSON output should be supported for automation.
<!-- Example: Every library exposes functionality via CLI; Text in/out protocol: stdin/args → stdout, errors → stderr; Support JSON + human-readable formats -->

### Test‑First
<!-- Example: III. Test-First (NON-NEGOTIABLE) -->
All new features require tests before implementation: write failing tests, then implement until tests pass, following a Red‑Green‑Refactor cycle.
<!-- Example: TDD mandatory: Tests written → User approved → Tests fail → Then implement; Red-Green-Refactor cycle strictly enforced -->

### Integration Testing
<!-- Example: IV. Integration Testing -->
Whenever a new service or contract changes, integration tests must validate end‑to‑end flows and contract compliance. Shared schemas must have accompanying tests.
<!-- Example: Focus areas requiring integration tests: New library contract tests, Contract changes, Inter-service communication, Shared schemas -->

### Observability & Versioning
<!-- Example: V. Observability, VI. Versioning & Breaking Changes, VII. Simplicity -->
All code must emit structured logs and expose health checks. Deployments use semantic versioning MAJOR.MINOR.PATCH and track breaking changes in changelogs.
<!-- Example: Text I/O ensures debuggability; Structured logging required; Or: MAJOR.MINOR.BUILD format; Or: Start simple, YAGNI principles -->

## Security & Compliance
<!-- Example: Additional Constraints, Security Requirements, Performance Standards, etc. -->

All code must adhere to OWASP Top 10, use TLS for all network traffic, and follow the project's security best practices.

The stack uses AWS Cognito for authentication; access controls are RBAC.

Deployments require infrastructure as code and must pass security scans before merge.
<!-- Example: Technology stack requirements, compliance standards, deployment policies, etc. -->

## Development Workflow
<!-- Example: Development Workflow, Review Process, Quality Gates, etc. -->

All code commits must be reviewed, tested, and built. Continuous integration enforces linting, type‑checking, unit tests, and integration tests. Code must pass all checks before merging. No merge without a passing PR build and automated tests.
<!-- Example: Code review requirements, testing gates, deployment approval process, etc. -->

## Governance
<!-- Example: Constitution supersedes all other practices; Amendments require documentation, approval, migration plan -->

All PRs must include a compliance check to ensure the constitution text is not violated. Any violation must be addressed before merge. If a contribution conflicts with the constitution, the PR is rejected and the contributor is asked to update their work accordingly.
<!-- Example: All PRs/reviews must verify compliance; Complexity must be justified; Use [GUIDANCE_FILE] for runtime development guidance -->

**Version**: 1.0.0 | **Ratified**: 2025-10-12 | **Last Amended**: 2025-10-12
<!-- Example: Version: 2.1.1 | Ratified: 2025-06-13 | Last Amended: 2025-07-16 -->
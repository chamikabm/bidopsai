// App constants
export const APP_NAME = "BidOps.AI";
export const APP_VERSION = "1.0.0";

// User roles
export const USER_ROLES = {
  ADMIN: "ADMIN",
  DRAFTER: "DRAFTER",
  BIDDER: "BIDDER",
  KB_ADMIN: "KB_ADMIN",
  KB_VIEW: "KB_VIEW",
} as const;

// Agent names
export const AGENT_NAMES = {
  SUPERVISOR: "Supervisor Agent",
  PARSER: "Parser Agent",
  ANALYSIS: "Analysis Agent",
  CONTENT: "Content Agent",
  KNOWLEDGE: "Knowledge Agent",
  COMPLIANCE: "Compliance Agent",
  QA: "QA Agent",
  COMMS: "Communications Agent",
  SUBMISSION: "Submission Agent",
} as const;

// Workflow steps (8 steps in order)
export const WORKFLOW_STEPS = [
  { id: "upload", label: "Document Upload", agent: "SUPERVISOR" },
  { id: "parse", label: "Document Parsing", agent: "PARSER" },
  { id: "analysis", label: "Analysis", agent: "ANALYSIS" },
  { id: "content", label: "Content Generation", agent: "CONTENT" },
  { id: "compliance", label: "Compliance Check", agent: "COMPLIANCE" },
  { id: "qa", label: "Quality Assurance", agent: "QA" },
  { id: "comms", label: "Communications", agent: "COMMS" },
  { id: "bidding", label: "Bidding", agent: "SUBMISSION" },
] as const;

// Supported file types
export const SUPPORTED_FILE_TYPES = {
  DOCUMENTS: [".pdf", ".doc", ".docx"],
  SPREADSHEETS: [".xls", ".xlsx", ".csv"],
  AUDIO: [".mp3", ".wav", ".m4a"],
  VIDEO: [".mp4", ".mov", ".avi"],
} as const;

// Max file sizes (in bytes)
export const MAX_FILE_SIZES = {
  DOCUMENT: 50 * 1024 * 1024, // 50MB
  SPREADSHEET: 25 * 1024 * 1024, // 25MB
  AUDIO: 100 * 1024 * 1024, // 100MB
  VIDEO: 500 * 1024 * 1024, // 500MB
} as const;

// Themes
export const THEMES = {
  LIGHT: "light",
  DARK: "dark",
  DELOITTE: "deloitte",
  FUTURISTIC: "futuristic",
} as const;

// Languages
export const LANGUAGES = {
  EN_US: "en-US",
  EN_AU: "en-AU",
} as const;

// Data retention periods (in days)
export const DATA_RETENTION_PERIODS = [
  { value: 30, label: "30 days" },
  { value: 60, label: "60 days" },
  { value: 90, label: "90 days" },
  { value: 180, label: "6 months" },
  { value: 365, label: "1 year" },
] as const;

// Pagination defaults
export const PAGINATION_DEFAULTS = {
  PAGE_SIZE: 10,
  MAX_PAGE_SIZE: 100,
} as const;
// Query configuration
export const QUERY_STALE_TIME = 5 * 60 * 1000; // 5 minutes
export const QUERY_CACHE_TIME = 10 * 60 * 1000; // 10 minutes


// SSE reconnection settings
export const SSE_CONFIG = {
  MAX_RECONNECT_ATTEMPTS: 5,
  RECONNECT_DELAY: 2000, // 2 seconds
  RECONNECT_BACKOFF_MULTIPLIER: 1.5,
} as const;

// Query keys for TanStack Query
export const QUERY_KEYS = {
  USERS: "users",
  USER: "user",
  PROJECTS: "projects",
  PROJECT: "project",
  KNOWLEDGE_BASES: "knowledgeBases",
  KNOWLEDGE_BASE: "knowledgeBase",
  ARTIFACTS: "artifacts",
  ARTIFACT: "artifact",
  WORKFLOW_EXECUTION: "workflowExecution",
  AGENT_TASK: "agentTask",
  NOTIFICATIONS: "notifications",
  AGENT_CONFIGURATIONS: "agentConfigurations",
} as const;

// Routes
export const ROUTES = {
  HOME: "/",
  SIGNIN: "/signin",
  SIGNUP: "/signup",
  DASHBOARD: "/dashboard",
  PROJECTS: {
    ALL: "/projects/all",
    NEW: "/projects/new",
    DETAIL: (id: string) => `/projects/${id}`,
  },
  KNOWLEDGE_BASES: {
    ALL: "/knowledge-bases/all",
    NEW: "/knowledge-bases/new",
    DETAIL: (id: string) => `/knowledge-bases/${id}`,
  },
  USERS: {
    ALL: "/users/all",
    NEW: "/users/new",
    DETAIL: (id: string) => `/users/${id}`,
  },
  SETTINGS: {
    AGENTS: "/settings/agents",
    INTEGRATIONS: "/settings/integrations",
    SYSTEM: "/settings/system",
  },
} as const;
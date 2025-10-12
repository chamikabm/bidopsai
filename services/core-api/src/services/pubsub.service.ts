/**
 * PubSub Service
 * 
 * Provides publish/subscribe functionality for GraphQL subscriptions.
 * Supports both in-memory (development) and Redis (production) backends.
 */

import { PubSub } from 'graphql-subscriptions';
import { RedisPubSub } from 'graphql-redis-subscriptions';
import Redis from 'ioredis';
import { Logger } from 'winston';
import { env } from '../config/env';

/**
 * Subscription event topics
 */
export enum SubscriptionTopic {
  // Project events
  PROJECT_UPDATED = 'PROJECT_UPDATED',
  PROJECT_CREATED = 'PROJECT_CREATED',
  PROJECT_DELETED = 'PROJECT_DELETED',
  
  // Workflow events
  WORKFLOW_EXECUTION_UPDATED = 'WORKFLOW_EXECUTION_UPDATED',
  AGENT_TASK_UPDATED = 'AGENT_TASK_UPDATED',
  
  // Artifact events
  ARTIFACT_CREATED = 'ARTIFACT_CREATED',
  ARTIFACT_UPDATED = 'ARTIFACT_UPDATED',
  
  // Notification events
  NOTIFICATION_RECEIVED = 'NOTIFICATION_RECEIVED',
  
  // Real-time progress events
  WORKFLOW_PROGRESS = 'WORKFLOW_PROGRESS',
  AGENT_STATUS_CHANGE = 'AGENT_STATUS_CHANGE',
}

/**
 * Event payload types
 */
export interface ProjectUpdatedPayload {
  projectId: string;
  userId?: string;
  changes: Record<string, any>;
}

export interface WorkflowExecutionUpdatedPayload {
  workflowExecutionId: string;
  projectId: string;
  status: string;
  userId?: string;
}

export interface AgentTaskUpdatedPayload {
  agentTaskId: string;
  workflowExecutionId: string;
  agent: string;
  status: string;
  userId?: string;
}

export interface ArtifactCreatedPayload {
  artifactId: string;
  projectId: string;
  userId?: string;
}

export interface ArtifactUpdatedPayload {
  artifactId: string;
  projectId: string;
  userId?: string;
}

export interface NotificationReceivedPayload {
  notificationId: string;
  userId: string;
  type: string;
}

/**
 * PubSub Service
 * 
 * Manages publish/subscribe for GraphQL subscriptions.
 * Automatically switches between in-memory and Redis based on environment.
 */
export class PubSubService {
  private pubsub: PubSub | RedisPubSub;
  private redisClient?: Redis;
  private isRedis: boolean = false;

  constructor(private readonly logger: Logger) {
    // Use Redis in production if REDIS_URL is provided
    if (env.REDIS_URL && env.NODE_ENV === 'production') {
      this.initializeRedisPubSub();
    } else {
      this.initializeInMemoryPubSub();
    }
  }

  /**
   * Initialize in-memory PubSub (for development)
   */
  private initializeInMemoryPubSub(): void {
    this.pubsub = new PubSub();
    this.isRedis = false;
    this.logger.info('PubSub initialized with in-memory backend');
  }

  /**
   * Initialize Redis PubSub (for production)
   */
  private initializeRedisPubSub(): void {
    try {
      const options = {
        host: this.parseRedisUrl(env.REDIS_URL!).host,
        port: this.parseRedisUrl(env.REDIS_URL!).port,
        retryStrategy: (times: number) => {
          // Exponential backoff
          const delay = Math.min(times * 50, 2000);
          return delay;
        },
      };

      this.redisClient = new Redis(options);
      
      this.pubsub = new RedisPubSub({
        publisher: new Redis(options),
        subscriber: new Redis(options),
      });

      this.isRedis = true;
      this.logger.info('PubSub initialized with Redis backend', { 
        host: options.host, 
        port: options.port 
      });
    } catch (error) {
      this.logger.error('Failed to initialize Redis PubSub, falling back to in-memory', { error });
      this.initializeInMemoryPubSub();
    }
  }

  /**
   * Parse Redis URL into host and port
   */
  private parseRedisUrl(url: string): { host: string; port: number } {
    try {
      const parsed = new URL(url);
      return {
        host: parsed.hostname,
        port: parseInt(parsed.port || '6379', 10),
      };
    } catch (error) {
      return { host: 'localhost', port: 6379 };
    }
  }

  /**
   * Publish an event
   */
  async publish<T = any>(topic: SubscriptionTopic, payload: T): Promise<void> {
    try {
      await this.pubsub.publish(topic, payload);
      this.logger.debug('Event published', { topic, payload });
    } catch (error) {
      this.logger.error('Failed to publish event', { topic, error });
      throw error;
    }
  }

  /**
   * Subscribe to a topic
   */
  asyncIterator<T = any>(topics: SubscriptionTopic | SubscriptionTopic[]): AsyncIterator<T> {
    return this.pubsub.asyncIterator(topics) as AsyncIterator<T>;
  }

  /**
   * Publish project updated event
   */
  async publishProjectUpdated(payload: ProjectUpdatedPayload): Promise<void> {
    await this.publish(SubscriptionTopic.PROJECT_UPDATED, {
      projectUpdated: payload,
    });
  }

  /**
   * Publish workflow execution updated event
   */
  async publishWorkflowExecutionUpdated(payload: WorkflowExecutionUpdatedPayload): Promise<void> {
    await this.publish(SubscriptionTopic.WORKFLOW_EXECUTION_UPDATED, {
      workflowExecutionUpdated: payload,
    });
  }

  /**
   * Publish agent task updated event
   */
  async publishAgentTaskUpdated(payload: AgentTaskUpdatedPayload): Promise<void> {
    await this.publish(SubscriptionTopic.AGENT_TASK_UPDATED, {
      agentTaskUpdated: payload,
    });
  }

  /**
   * Publish artifact created event
   */
  async publishArtifactCreated(payload: ArtifactCreatedPayload): Promise<void> {
    await this.publish(SubscriptionTopic.ARTIFACT_CREATED, {
      artifactCreated: payload,
    });
  }

  /**
   * Publish artifact updated event
   */
  async publishArtifactUpdated(payload: ArtifactUpdatedPayload): Promise<void> {
    await this.publish(SubscriptionTopic.ARTIFACT_UPDATED, {
      artifactUpdated: payload,
    });
  }

  /**
   * Publish notification received event
   */
  async publishNotificationReceived(payload: NotificationReceivedPayload): Promise<void> {
    await this.publish(SubscriptionTopic.NOTIFICATION_RECEIVED, {
      notificationReceived: payload,
    });
  }

  /**
   * Close PubSub connections
   */
  async close(): Promise<void> {
    try {
      if (this.isRedis && this.redisClient) {
        await this.redisClient.quit();
        this.logger.info('Redis PubSub connections closed');
      }
    } catch (error) {
      this.logger.error('Error closing PubSub connections', { error });
    }
  }

  /**
   * Check if using Redis backend
   */
  isUsingRedis(): boolean {
    return this.isRedis;
  }
}
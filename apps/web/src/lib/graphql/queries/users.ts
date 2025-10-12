/**
 * GraphQL Queries for Users
 * 
 * @module lib/graphql/queries/users
 */

import { gql } from 'graphql-request';

/**
 * Fragment for user basic fields
 */
export const USER_BASIC_FIELDS = gql`
  fragment UserBasicFields on User {
    id
    email
    username
    firstName
    lastName
    profileImageUrl
    preferredLanguage
    themePreference
    emailVerified
    cognitoUserId
    createdAt
    updatedAt
    lastLogin
  }
`;

/**
 * Fragment for user with roles
 */
export const USER_WITH_ROLES = gql`
  ${USER_BASIC_FIELDS}
  fragment UserWithRoles on User {
    ...UserBasicFields
    roles {
      id
      name
      description
      createdAt
      permissions {
        id
        resource
        action
      }
    }
  }
`;

/**
 * Fragment for user full details
 */
export const USER_FULL_DETAILS = gql`
  ${USER_WITH_ROLES}
  fragment UserFullDetails on User {
    ...UserWithRoles
    projects {
      id
      name
      status
      deadline
      progressPercentage
    }
    notifications {
      id
      type
      title
      message
      read
      createdAt
    }
  }
`;

/**
 * Query to get current user (me)
 */
export const GET_ME = gql`
  ${USER_WITH_ROLES}
  query GetMe {
    me {
      ...UserWithRoles
    }
  }
`;

/**
 * Query to get a single user by ID
 */
export const GET_USER = gql`
  ${USER_FULL_DETAILS}
  query GetUser($id: UUID!) {
    user(id: $id) {
      ...UserFullDetails
    }
  }
`;

/**
 * Query to get all users with pagination and filters
 */
export const GET_USERS = gql`
  ${USER_WITH_ROLES}
  query GetUsers(
    $first: Int
    $after: String
    $filter: UserFilterInput
  ) {
    users(first: $first, after: $after, filter: $filter) {
      edges {
        node {
          ...UserWithRoles
        }
        cursor
      }
      pageInfo {
        hasNextPage
        hasPreviousPage
        startCursor
        endCursor
      }
      totalCount
    }
  }
`;

/**
 * Query to get user projects
 */
export const GET_USER_PROJECTS = gql`
  query GetUserProjects($userId: UUID!) {
    user(id: $userId) {
      id
      firstName
      lastName
      projects {
        id
        name
        description
        status
        deadline
        progressPercentage
        createdAt
        createdBy {
          id
          firstName
          lastName
        }
        members {
          id
          user {
            id
            firstName
            lastName
            profileImageUrl
          }
        }
      }
    }
  }
`;

/**
 * Query to get user notifications
 */
export const GET_MY_NOTIFICATIONS = gql`
  query GetMyNotifications(
    $first: Int
    $after: String
    $unreadOnly: Boolean
  ) {
    myNotifications(
      first: $first
      after: $after
      unreadOnly: $unreadOnly
    ) {
      id
      type
      title
      message
      read
      metadata
      createdAt
      readAt
    }
  }
`;

/**
 * Query to get unread notification count
 */
export const GET_UNREAD_NOTIFICATION_COUNT = gql`
  query GetUnreadNotificationCount {
    unreadNotificationCount
  }
`;

/**
 * Query to get all roles
 */
export const GET_ROLES = gql`
  query GetRoles {
    roles {
      id
      name
      description
      createdAt
      updatedAt
    }
  }
`;

/**
 * Query to get a single role
 */
export const GET_ROLE = gql`
  query GetRole($id: UUID!) {
    role(id: $id) {
      id
      name
      description
      createdAt
      updatedAt
    }
  }
`;

/**
 * Query to get permissions for a role
 */
export const GET_PERMISSIONS = gql`
  query GetPermissions($roleId: UUID!) {
    permissions(roleId: $roleId) {
      id
      roleId
      resource
      action
      createdAt
    }
  }
`;
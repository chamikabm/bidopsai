/**
 * Dashboard GraphQL Queries
 */

export const GET_DASHBOARD_STATS = `
  query GetDashboardStats($userId: ID!) {
    dashboardStats(userId: $userId) {
      submittedBids
      wonBids
      totalValue
      activeProjects
    }
  }
`;

export const GET_USER_ACTIVE_PROJECTS = `
  query GetUserActiveProjects($userId: ID!, $limit: Int) {
    userActiveProjects(userId: $userId, limit: $limit) {
      id
      name
      description
      status
      deadline
      progressPercentage
      createdAt
      members {
        id
        user {
          id
          firstName
          lastName
          email
        }
        role
      }
    }
  }
`;
